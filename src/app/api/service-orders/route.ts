import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateCommission } from "@/lib/service-order-machine";

/**
 * POST /api/service-orders — 创建服务交易订单
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const {
      productId,
      quantity = 1,
      addressId,
      appointmentAt,
      userRemark,
      couponId,
      userCouponId,
      reorderFromId,
      source: rawSource,
    } = body;

    if (!productId || !addressId || !appointmentAt) {
      return NextResponse.json({ error: "请完整提供服务商品、预约地址与预约时间" }, { status: 400 });
    }

    // 1. 读取标准服务商品 (禁止前端传金额，必须以服务端数据库为准)
    const product = await prisma.serviceProduct.findUnique({
      where: { id: productId },
      include: { provider: true },
    });

    if (!product || product.status !== "ONLINE") {
      return NextResponse.json({ error: "该服务已下架或不存在" }, { status: 400 });
    }

    if (product.provider.operatingStatus === "PAUSED") {
      return NextResponse.json({ error: "该师傅当前已暂停接单，暂无法下单" }, { status: 400 });
    }

    // 不能下单自己发布的服务
    if (product.provider.userId === session.id) {
      return NextResponse.json({ error: "不能购买自己发布的服务商品" }, { status: 400 });
    }

    // 2. 读取用户服务地址
    const address = await prisma.userAddress.findFirst({
      where: { id: addressId, userId: session.id },
    });

    if (!address) {
      return NextResponse.json({ error: "服务地址不存在或无权使用" }, { status: 400 });
    }

    // 3. 计算金额
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const totalAmountCents = product.priceCents * qty;
    let discountCents = 0;
    let validUserCoupon: any = null;
    let couponIssuerType = "PROVIDER";

    // 优先使用企业级 UserCoupon 核销
    const effectiveCouponId = userCouponId || couponId;
    if (effectiveCouponId) {
      // 先尝试找 UserCoupon
      let targetUserCoupon = await prisma.userCoupon.findFirst({
        where: {
          OR: [
            { id: effectiveCouponId, userId: session.id },
            { couponId: effectiveCouponId, userId: session.id, status: "AVAILABLE" },
          ],
        },
        include: { coupon: true },
      });

      if (targetUserCoupon) {
        const { validateAndCalculateCoupon } = await import("@/lib/coupon-engine");
        const calcRes = await validateAndCalculateCoupon({
          userCouponId: targetUserCoupon.id,
          userId: session.id,
          providerId: product.providerId,
          productId: product.id,
          category: product.category,
          totalAmountCents,
        });

        if (calcRes.isValid && calcRes.coupon && calcRes.userCoupon) {
          discountCents = calcRes.discountCents;
          validUserCoupon = calcRes.userCoupon;
          couponIssuerType = calcRes.coupon.issuerType;
        }
      } else {
        // 兼容老版直接传 ServiceCoupon id 的情况
        const rawCoupon = await prisma.serviceCoupon.findUnique({
          where: { id: effectiveCouponId },
        });
        if (
          rawCoupon &&
          rawCoupon.enabled &&
          (rawCoupon.providerId === null || rawCoupon.providerId === product.providerId) &&
          totalAmountCents >= rawCoupon.minSpendCents
        ) {
          discountCents = Math.min(totalAmountCents - 1, rawCoupon.discountCents || rawCoupon.valueCents);
          couponIssuerType = rawCoupon.issuerType;
        }
      }
    }

    const payAmountCents = Math.max(1, totalAmountCents - discountCents);

    // 4. 计算抽佣比例与平台服务费 (支持平台补贴 vs 商家自担)
    const { platformFeeCents: rawPlatformFee, providerIncomeCents: rawProviderIncome, rate: commissionRate } =
      await calculateCommission(product.providerId, product.category, payAmountCents);

    let platformFeeCents = rawPlatformFee;
    let providerIncomeCents = rawProviderIncome;

    // 若为平台券，平台全额补贴优惠金额，商家净收入按原价提佣计算！
    if (couponIssuerType === "PLATFORM" && discountCents > 0) {
      const standardGrossPlatformFee = Math.round(totalAmountCents * commissionRate);
      providerIncomeCents = totalAmountCents - standardGrossPlatformFee;
      platformFeeCents = Math.max(0, standardGrossPlatformFee - discountCents);
    }

    // 来源追踪
    let source = rawSource || "DIRECT";
    if (reorderFromId) {
      source = "REPURCHASE";
    } else if (validUserCoupon) {
      source = "COUPON";
    }

    const orderNo = "SO" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

    // 5. 事务创建 ServiceOrder 及 BillingOrder (并锁定核销 UserCoupon)
    const serviceOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.serviceOrder.create({
        data: {
          orderNo,
          userId: session.id,
          providerId: product.providerId,
          productId: product.id,
          productTitle: product.title,
          productPrice: product.priceCents,
          pricingType: product.pricingType,
          quantity: qty,
          totalAmountCents,
          discountCents,
          payAmountCents,
          platformFeeCents,
          providerIncomeCents,
          commissionRate,
          source,
          reorderFromId: reorderFromId || null,
          userCouponId: validUserCoupon ? validUserCoupon.id : null,
          status: "PENDING_PAYMENT",
          paymentStatus: "UNPAID",
          refundStatus: "NONE",
          addressId: address.id,
          contactName: address.contactName,
          contactPhone: address.phone,
          serviceArea: address.area,
          addressDetail: address.addressDetail,
          appointmentAt: new Date(appointmentAt),
          userRemark: userRemark ? String(userRemark).trim() : null,
        },
      });

      // 核销用户优惠券
      if (validUserCoupon) {
        await tx.userCoupon.update({
          where: { id: validUserCoupon.id },
          data: {
            status: "USED",
            usedAt: new Date(),
            usedOrderId: order.id,
          },
        });
        await tx.serviceCoupon.update({
          where: { id: validUserCoupon.couponId },
          data: {
            usedQuantity: { increment: 1 },
          },
        });
      }

      // 创建对应 BillingOrder
      await tx.billingOrder.create({
        data: {
          orderNo,
          planName: product.title,
          targetKind: "service_order",
          targetId: order.id,
          targetTitle: product.title,
          amountCents: payAmountCents,
          status: "PENDING_PAYMENT",
          userId: session.id,
        },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: serviceOrder.id,
        orderNo: serviceOrder.orderNo,
        payAmountCents: serviceOrder.payAmountCents,
        payAmountYuan: (serviceOrder.payAmountCents / 100).toFixed(2),
        discountYuan: (serviceOrder.discountCents / 100).toFixed(2),
      },
    });
  } catch (err: any) {
    console.error("POST /api/service-orders error:", err);
    return NextResponse.json({ error: err.message || "创建订单失败" }, { status: 500 });
  }
}

/**
 * GET /api/service-orders — 获取当前客户的订单列表
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "ALL";

    const where: any = { userId: session.id };

    if (tab === "PENDING_PAYMENT") {
      where.status = "PENDING_PAYMENT";
    } else if (tab === "PAID") {
      where.status = "PAID";
    } else if (tab === "IN_SERVICE") {
      where.status = { in: ["ACCEPTED", "IN_SERVICE"] };
    } else if (tab === "WAITING_CONFIRM") {
      where.status = "WAITING_CONFIRM";
    } else if (tab === "COMPLETED") {
      where.status = "COMPLETED";
    } else if (tab === "REFUND") {
      where.status = { in: ["REFUNDING", "REFUNDED", "DISPUTED"] };
    }

    const orders = await prisma.serviceOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true,
            ratingAvg: true,
            verificationType: true,
          },
        },
        review: true,
      },
      take: 50,
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (err: any) {
    console.error("GET /api/service-orders error:", err);
    return NextResponse.json({ error: "获取订单失败" }, { status: 500 });
  }
}
