import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
      select: { id: true },
    });

    if (!provider) {
      return NextResponse.json({ error: "您尚未认证为服务商" }, { status: 403 });
    }

    const coupons = await prisma.serviceCoupon.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { userCoupons: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: coupons });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "获取卡券列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
      select: { id: true, verificationStatus: true },
    });

    if (!provider || provider.verificationStatus !== "APPROVED") {
      return NextResponse.json({ error: "只有审核通过的服务商才可创建优惠券" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      couponType = "FIXED", // FIXED | DISCOUNT | NEW_USER | REPEAT
      discountYuan,
      valueRate,
      minSpendYuan = "0",
      maxDiscountYuan,
      totalQuantity = 100,
      validDays = 30,
      perUserLimit = 1,
      description,
      applicableScope = "ALL", // ALL | CATEGORY | PRODUCT
      applicableProductId,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "请填写优惠券名称" }, { status: 400 });
    }

    const discountCents = discountYuan ? Math.round(parseFloat(discountYuan) * 100) : 0;
    const minSpendCents = minSpendYuan ? Math.round(parseFloat(minSpendYuan) * 100) : 0;
    const maxDiscountCents = maxDiscountYuan ? Math.round(parseFloat(maxDiscountYuan) * 100) : null;
    const valueCents = couponType === "DISCOUNT" ? parseInt(valueRate || "85", 10) : discountCents;

    if (couponType !== "DISCOUNT" && discountCents <= 0) {
      return NextResponse.json({ error: "立减金额必须大于0" }, { status: 400 });
    }

    const coupon = await prisma.serviceCoupon.create({
      data: {
        providerId: provider.id,
        title: String(title).trim(),
        issuerType: "PROVIDER",
        couponType,
        discountCents,
        valueCents,
        minSpendCents,
        maxDiscountCents,
        applicableScope,
        applicableProductId: applicableScope === "PRODUCT" ? applicableProductId : null,
        totalQuantity: parseInt(totalQuantity, 10) || 100,
        validDays: parseInt(validDays, 10) || 30,
        perUserLimit: parseInt(perUserLimit, 10) || 1,
        description: description ? String(description).trim() : null,
        enabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `🎉 优惠券【${coupon.title}】创建成功！已支持前台用户领取与核销`,
      data: coupon,
    });
  } catch (err: any) {
    console.error("POST /api/provider/marketing/coupons error:", err);
    return NextResponse.json({ error: err.message || "创建卡券失败" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
      select: { id: true },
    });

    if (!provider) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const body = await request.json();
    const { couponId, enabled } = body;

    if (!couponId || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    await prisma.serviceCoupon.updateMany({
      where: { id: couponId, providerId: provider.id },
      data: { enabled },
    });

    return NextResponse.json({ success: true, message: "卡券状态已更新" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "更新状态失败" }, { status: 500 });
  }
}
