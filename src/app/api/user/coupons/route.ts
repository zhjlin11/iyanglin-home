import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");
    const productId = searchParams.get("productId");
    const category = searchParams.get("category");
    const amountStr = searchParams.get("amount");
    const amountCents = amountStr ? parseInt(amountStr, 10) : 0;

    const userCoupons = await prisma.userCoupon.findMany({
      where: { userId: session.id },
      include: {
        coupon: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                avatar: true,
                serviceCategory: true,
              },
            },
          },
        },
        usedOrder: {
          select: {
            id: true,
            orderNo: true,
            productTitle: true,
            payAmountCents: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { expiresAt: "asc" }],
    });

    const now = new Date();

    // 自动判断并更新过期券
    const list = userCoupons.map((uc) => {
      let isExpired = false;
      if (uc.status === "AVAILABLE" && uc.expiresAt < now) {
        isExpired = true;
      }

      const effectiveStatus = isExpired ? "EXPIRED" : uc.status;
      const c = uc.coupon;

      // 评估在当前收银场景下是否可用
      let isUsable = effectiveStatus === "AVAILABLE" && c.enabled;
      let unusableReason = "";

      if (isUsable) {
        if (c.issuerType === "PROVIDER" && providerId && c.providerId && c.providerId !== providerId) {
          isUsable = false;
          unusableReason = `仅限【${c.provider?.name || "特定师傅"}】店铺使用`;
        } else if (c.applicableScope === "CATEGORY" && category && c.applicableCategory && c.applicableCategory !== category) {
          isUsable = false;
          unusableReason = `仅限【${c.applicableCategory}】分类服务`;
        } else if (c.applicableScope === "PRODUCT" && productId && c.applicableProductId && c.applicableProductId !== productId) {
          isUsable = false;
          unusableReason = "仅限指定服务商品使用";
        } else if (amountCents > 0 && amountCents < c.minSpendCents) {
          isUsable = false;
          unusableReason = `满 ¥${(c.minSpendCents / 100).toFixed(2)} 可用 (还差 ¥${((c.minSpendCents - amountCents) / 100).toFixed(2)})`;
        }
      }

      // 计算抵扣金额
      let calculatedDiscountCents = 0;
      if (isUsable && amountCents > 0) {
        if (c.couponType === "DISCOUNT") {
          const discountRate = c.valueCents > 0 ? c.valueCents : 90;
          const raw = Math.round((amountCents * (100 - discountRate)) / 100);
          calculatedDiscountCents = c.maxDiscountCents ? Math.min(raw, c.maxDiscountCents) : raw;
        } else {
          const face = c.discountCents > 0 ? c.discountCents : c.valueCents;
          calculatedDiscountCents = Math.min(amountCents, face);
        }
      }

      return {
        id: uc.id,
        couponId: uc.couponId,
        title: c.title,
        issuerType: c.issuerType,
        couponType: c.couponType,
        discountCents: c.discountCents,
        valueCents: c.valueCents,
        minSpendCents: c.minSpendCents,
        maxDiscountCents: c.maxDiscountCents,
        description: c.description,
        providerId: c.providerId,
        providerName: c.provider?.name || (c.issuerType === "PLATFORM" ? "杨林生活网·官方补贴" : "全场通用"),
        providerAvatar: c.provider?.avatar || null,
        status: effectiveStatus,
        receivedAt: uc.receivedAt,
        expiresAt: uc.expiresAt,
        usedAt: uc.usedAt,
        usedOrderId: uc.usedOrderId,
        usedOrder: uc.usedOrder,
        isUsable,
        unusableReason,
        calculatedDiscountCents,
        calculatedDiscountYuan: (calculatedDiscountCents / 100).toFixed(2),
      };
    });

    const available = list.filter((i) => i.status === "AVAILABLE");
    const used = list.filter((i) => i.status === "USED");
    const expired = list.filter((i) => i.status === "EXPIRED");

    return NextResponse.json({
      success: true,
      data: {
        all: list,
        available,
        used,
        expired,
        counts: {
          available: available.length,
          used: used.length,
          expired: expired.length,
        },
      },
    });
  } catch (err: any) {
    console.error("GET /api/user/coupons error:", err);
    return NextResponse.json({ error: err.message || "获取优惠券列表失败" }, { status: 500 });
  }
}
