import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPromotionPackageByKey, formatRemainingTime } from "@/lib/info-promotions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json({ success: false, error: "listingId 不能为空" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        isTop: true,
        topUntil: true,
        isFeatured: true,
        featuredUntil: true,
        isHomeFeatured: true,
        homeFeaturedUntil: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ success: false, error: "信息不存在" }, { status: 404 });
    }

    const now = new Date();
    const isTopActive = listing.isTop && !!listing.topUntil && listing.topUntil > now;
    const isFeaturedActive = listing.isFeatured && !!listing.featuredUntil && listing.featuredUntil > now;
    const isHomeFeaturedActive = listing.isHomeFeatured && !!listing.homeFeaturedUntil && listing.homeFeaturedUntil > now;

    // 获取最近生效的推广订单列表
    const promotions = await prisma.listingPromotion.findMany({
      where: {
        resourceId: listingId,
        status: "ACTIVE",
        endAt: { gt: now },
      },
      orderBy: { endAt: "desc" },
    });

    const formattedPromotions = promotions.map((p: any) => ({
      ...p,
      remainingText: formatRemainingTime(p.endAt),
    }));

    return NextResponse.json({
      success: true,
      listingId,
      status: {
        isTop: isTopActive,
        topUntil: listing.topUntil,
        topRemainingText: isTopActive ? formatRemainingTime(listing.topUntil) : null,
        isFeatured: isFeaturedActive,
        featuredUntil: listing.featuredUntil,
        featuredRemainingText: isFeaturedActive ? formatRemainingTime(listing.featuredUntil) : null,
        isHomeFeatured: isHomeFeaturedActive,
        homeFeaturedUntil: listing.homeFeaturedUntil,
        homeFeaturedRemainingText: isHomeFeaturedActive ? formatRemainingTime(listing.homeFeaturedUntil) : null,
      },
      activePromotions: formattedPromotions,
    });
  } catch (error: any) {
    console.error("[API /api/info/promote GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "获取推广状态失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session?.id) {
      return NextResponse.json({ success: false, error: "请先登录后进行推广" }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, packageKey } = body;

    if (!listingId || !packageKey) {
      return NextResponse.json({ success: false, error: "缺少必要参数 (listingId 或 packageKey)" }, { status: 400 });
    }

    // 1. 验证 Listing 归属与有效性
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json({ success: false, error: "信息不存在" }, { status: 404 });
    }

    const roleUpper = String(session.role || "").toUpperCase();
    const isOwner = listing.authorId === session.id;
    const isAdmin = roleUpper === "ADMIN" || roleUpper === "EDITOR";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "您无权为他人发布的信息购买推广" }, { status: 403 });
    }

    // 2. 从数据库动态拉取套餐配置，保证真实价格
    const pkg = await getPromotionPackageByKey(packageKey);
    if (!pkg || !pkg.enabled) {
      return NextResponse.json({ success: false, error: "所选推广套餐不存在或已下线" }, { status: 400 });
    }

    // 3. 生成统一商业订单编号
    const orderNo = `PROMO_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. 创建全站统一 BillingOrder
    const order = await prisma.billingOrder.create({
      data: {
        orderNo,
        planId: pkg.id,
        planName: pkg.name,
        targetKind: "listing_promotion",
        targetId: listingId,
        targetTitle: `[便民推广] ${listing.title.slice(0, 30)} - ${pkg.name}`,
        amountCents: pkg.priceCents,
        status: "PENDING_PAYMENT",
        userId: session.id,
      },
    });

    // 5. 创建便民专属 ListingPromotion 预挂载记录
    const promo = await prisma.listingPromotion.create({
      data: {
        orderNo,
        userId: session.id,
        resourceType: "LISTING",
        resourceId: listingId,
        promotionType: packageKey,
        amountCents: pkg.priceCents,
        status: "PENDING_PAYMENT",
        source: "PAID",
        paymentOrderId: order.id,
      },
    });

    return NextResponse.json({
      success: true,
      orderNo,
      amountCents: pkg.priceCents,
      package: {
        key: pkg.packageKey,
        name: pkg.name,
        priceCents: pkg.priceCents,
        durationDays: pkg.durationDays,
        benefits: pkg.benefits,
      },
      paymentOrderId: order.id,
      listingTitle: listing.title,
    });
  } catch (error: any) {
    console.error("[API /api/info/promote POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "创建推广订单失败" },
      { status: 500 }
    );
  }
}
