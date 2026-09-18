import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMallOrder } from "@/lib/mall/cart-service";
import { generateMallOrderNo } from "@/lib/mall/mall-order-machine";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const where: any = { userId: session.id };
    if (status && status !== "ALL") {
      if (status === "UNPAID") where.status = "WAITING_PAYMENT";
      else if (status === "DELIVERING") where.status = { in: ["PAID", "PICKING", "READY", "DELIVERING"] };
      else if (status === "PICKUP") where.status = "READY_FOR_PICKUP";
      else if (status === "COMPLETED") where.status = { in: ["DELIVERED", "PICKED_UP", "COMPLETED"] };
      else if (status === "REFUND") where.status = { in: ["REFUNDING", "REFUNDED"] };
      else where.status = status;
    }

    const orders = await prisma.mallOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        courier: { select: { name: true, phone: true } },
        afterSale: true,
      },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (err: any) {
    console.error("GET /api/mall/orders error:", err);
    return NextResponse.json({ error: "获取订单列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录后再提交订单" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      items,
      deliveryMethod,
      zoneId,
      contactName,
      contactPhone,
      addressDetail,
      expectedDeliveryTime,
      userRemark,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "订单商品不能为空" }, { status: 400 });
    }

    if (!contactName || !contactPhone) {
      return NextResponse.json({ error: "请填写联系人与手机号码" }, { status: 400 });
    }

    if (deliveryMethod === "DELIVERY" && !addressDetail) {
      return NextResponse.json({ error: "配送订单请填写详细收货地址" }, { status: 400 });
    }

    // 1. 服务端重新计算并验证库存
    const calc = await calculateMallOrder({
      items,
      deliveryMethod: deliveryMethod === "PICKUP" ? "PICKUP" : "DELIVERY",
      zoneId,
    });

    if (!calc.isValid) {
      return NextResponse.json(
        { error: calc.errorMessage || "部分商品库存不足或已下架，请调整后再试" },
        { status: 400 }
      );
    }

    const orderNo = generateMallOrderNo();

    // 2. 事务创建商城订单与明细，并联动统一 BillingOrder
    const order = await prisma.$transaction(async (tx) => {
      const ord = await tx.mallOrder.create({
        data: {
          orderNo,
          userId: session.id,
          deliveryMethod: calc.deliveryMethod,
          status: "WAITING_PAYMENT",
          contactName: String(contactName).trim(),
          contactPhone: String(contactPhone).trim(),
          deliveryZoneId: calc.zone?.id,
          deliveryZoneName: calc.zone?.name,
          addressDetail: deliveryMethod === "PICKUP" ? "杨林生活网自营便利店（门店自提）" : String(addressDetail).trim(),
          expectedDeliveryTime: expectedDeliveryTime ? String(expectedDeliveryTime).trim() : "尽快配送",
          userRemark: userRemark ? String(userRemark).trim() : null,
          goodsTotalCents: calc.goodsTotalCents,
          deliveryFeeCents: calc.deliveryFeeCents,
          discountCents: calc.discountCents,
          payAmountCents: calc.payAmountCents,
          items: {
            create: calc.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productCover: item.productCover,
              specification: item.specification,
              unit: item.unit,
              priceCents: item.priceCents,
              quantity: item.quantity,
              totalCents: item.totalCents,
            })),
          },
          logs: {
            create: {
              operator: "USER",
              operatorName: session.username,
              action: "CREATE",
              notes: `用户提交订单，实付金额 ¥${(calc.payAmountCents / 100).toFixed(2)}，配送方式: ${
                calc.deliveryMethod === "PICKUP" ? "到店自提" : "本地配送"
              }`,
            },
          },
        },
        include: { items: true },
      });

      // 创建对应 BillingOrder 方便复用已有微信支付体系
      await tx.billingOrder.create({
        data: {
          orderNo,
          userId: session.id,
          amountCents: calc.payAmountCents,
          status: "PENDING_PAYMENT",
          planName: `自营便利店订单-${orderNo}`,
          targetKind: "mall_order",
          targetId: ord.id,
          targetTitle: `便利店商品共${calc.items.length}件`,
        },
      });

      return ord;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        orderNo: order.orderNo,
        payAmountCents: order.payAmountCents,
      },
    });
  } catch (err: any) {
    console.error("POST /api/mall/orders error:", err);
    return NextResponse.json({ error: err.message || "提交订单失败" }, { status: 500 });
  }
}
