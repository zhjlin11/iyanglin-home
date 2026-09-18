import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { seedDefaultPromotionPackages, formatRemainingTime } from "@/lib/info-promotions";
import { recalculateProviderRating } from "@/lib/service-matching";

export const dynamic = "force-dynamic";

function checkAdminAuth(session: any): session is { id: string; role: string; [key: string]: any } {
  if (!session?.id) return false;
  const role = String(session.role || "").toUpperCase();
  return role === "ADMIN" || role === "EDITOR";
}

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!checkAdminAuth(session)) {
      return NextResponse.json({ success: false, error: "无权访问商业化管理接口" }, { status: 403 });
    }

    await seedDefaultPromotionPackages();
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "overview";
    const now = new Date();

    if (tab === "overview") {
      const paidOrders = await prisma.billingOrder.findMany({
        where: { targetKind: "listing_promotion", status: "PAID" },
        select: { amountCents: true },
      });
      const totalRevenueCents = paidOrders.reduce((sum, o) => sum + o.amountCents, 0);

      const [
        activePromotionsCount,
        pendingProvidersCount,
        approvedProvidersCount,
        topListingsCount,
        featuredListingsCount,
        homeFeaturedCount,
      ] = await Promise.all([
        prisma.listingPromotion.count({
          where: { status: "ACTIVE", endAt: { gt: now } },
        }),
        prisma.serviceProvider.count({
          where: { verificationStatus: "PENDING" },
        }),
        prisma.serviceProvider.count({
          where: { verificationStatus: "APPROVED" },
        }),
        prisma.listing.count({
          where: { isTop: true, topUntil: { gt: now } },
        }),
        prisma.listing.count({
          where: { isFeatured: true, featuredUntil: { gt: now } },
        }),
        prisma.listing.count({
          where: { isHomeFeatured: true, homeFeaturedUntil: { gt: now } },
        }),
      ]);

      // 最近订单简报
      const recentOrders = await prisma.billingOrder.findMany({
        where: { targetKind: "listing_promotion" },
        orderBy: { createdAt: "desc" },
        take: 8,
      });

      return NextResponse.json({
        success: true,
        stats: {
          totalRevenueCents,
          totalRevenueYuan: (totalRevenueCents / 100).toFixed(2),
          activePromotionsCount,
          pendingProvidersCount,
          approvedProvidersCount,
          topListingsCount,
          featuredListingsCount,
          homeFeaturedCount,
        },
        recentOrders,
      });
    }

    if (tab === "orders") {
      const page = parseInt(searchParams.get("page") || "1", 10);
      const pageSize = 20;
      const status = searchParams.get("status");

      const where: any = { targetKind: "listing_promotion" };
      if (status && status !== "ALL") {
        where.status = status;
      }

      const [total, orders] = await Promise.all([
        prisma.billingOrder.count({ where }),
        prisma.billingOrder.findMany({
          where,
          include: {
            user: {
              select: { id: true, username: true, nickname: true, phone: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return NextResponse.json({
        success: true,
        total,
        page,
        pageSize,
        orders,
      });
    }

    if (tab === "promotions") {
      const status = searchParams.get("status");
      const where: any = {};
      if (status && status !== "ALL") {
        where.status = status;
      }

      const promotions = await prisma.listingPromotion.findMany({
        where,
        include: {
          listing: {
            select: { id: true, title: true, category: true, area: true, status: true },
          },
          user: {
            select: { id: true, username: true, nickname: true, phone: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const formatted = promotions.map((p) => ({
        ...p,
        remainingText: formatRemainingTime(p.endAt),
        isActive: p.status === "ACTIVE" && !!p.endAt && p.endAt > now,
      }));

      return NextResponse.json({
        success: true,
        promotions: formatted,
      });
    }

    if (tab === "providers") {
      const status = searchParams.get("status");
      const where: any = {};
      if (status && status !== "ALL") {
        where.verificationStatus = status;
      }

      const providers = await prisma.serviceProvider.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, nickname: true, phone: true, createdAt: true },
          },
        },
        orderBy: [{ verificationStatus: "asc" }, { createdAt: "desc" }],
      });

      return NextResponse.json({
        success: true,
        providers,
      });
    }

    if (tab === "pricing") {
      const packages = await prisma.promotionPackage.findMany({
        orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
      });

      return NextResponse.json({
        success: true,
        packages,
      });
    }

    if (tab === "requests") {
      const status = searchParams.get("status");
      const category = searchParams.get("category");
      const where: any = {};
      if (status && status !== "ALL") where.status = status;
      if (category && category !== "ALL") where.category = category;

      const requests = await prisma.serviceRequest.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, nickname: true, phone: true } },
          selectedProvider: { select: { id: true, name: true, phone: true, ratingAvg: true } },
          review: true,
          _count: { select: { leads: true, contactEvents: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return NextResponse.json({ success: true, requests });
    }

    if (tab === "leads") {
      const [
        totalRequests,
        matchedRequests,
        inProgressRequests,
        completedRequests,
        reviewedCount,
        totalContactEvents,
      ] = await Promise.all([
        prisma.serviceRequest.count(),
        prisma.serviceRequest.count({ where: { status: { in: ["MATCHED", "IN_PROGRESS", "COMPLETED"] } } }),
        prisma.serviceRequest.count({ where: { status: { in: ["IN_PROGRESS", "COMPLETED"] } } }),
        prisma.serviceRequest.count({ where: { status: "COMPLETED" } }),
        prisma.review.count(),
        prisma.contactEvent.count(),
      ]);

      const funnel = {
        totalRequests,
        matchedRequests,
        contactCount: totalContactEvents,
        inProgressRequests,
        completedRequests,
        reviewedCount,
        matchRate: totalRequests > 0 ? Math.round((matchedRequests / totalRequests) * 100) : 0,
        completeRate: totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0,
        reviewRate: completedRequests > 0 ? Math.round((reviewedCount / completedRequests) * 100) : 0,
      };

      const recentContactEvents = await prisma.contactEvent.findMany({
        include: {
          user: { select: { id: true, username: true, nickname: true } },
          provider: { select: { id: true, name: true, phone: true } },
          request: { select: { id: true, title: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({ success: true, funnel, recentContactEvents });
    }

    if (tab === "reviews") {
      const status = searchParams.get("status");
      const where: any = {};
      if (status && status !== "ALL") where.status = status;

      const reviews = await prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, nickname: true } },
          provider: { select: { id: true, name: true, phone: true, ratingAvg: true } },
          request: { select: { id: true, title: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return NextResponse.json({ success: true, reviews });
    }

    if (tab === "marketing") {
      const [
        platformCoupons,
        merchantCampaigns,
        allServiceOrders,
        totalUserCouponsUsed,
        totalSubsidizedCentsAgg,
      ] = await Promise.all([
        prisma.serviceCoupon.findMany({
          where: { issuerType: "PLATFORM" },
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { userCoupons: true } },
          },
        }),
        prisma.merchantCampaign.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                avatar: true,
                serviceCategory: true,
                phone: true,
              },
            },
          },
          take: 50,
        }),
        prisma.serviceOrder.findMany({
          select: {
            id: true,
            userId: true,
            payAmountCents: true,
            totalAmountCents: true,
            discountCents: true,
            source: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.userCoupon.count({
          where: { status: "USED" },
        }),
        prisma.serviceOrder.aggregate({
          where: {
            discountCents: { gt: 0 },
            status: { in: ["PAID", "ACCEPTED", "IN_SERVICE", "COMPLETED", "CONFIRMED"] },
          },
          _sum: { discountCents: true },
        }),
      ]);

      // 计算全平台复购与营销转化指标
      const userOrderCounts = new Map<string, number>();
      let totalCompletedOrders = 0;
      let repurchaseOrdersCount = 0;
      let couponDrivenOrdersCount = 0;

      for (const o of allServiceOrders) {
        if (["COMPLETED", "CONFIRMED", "PAID"].includes(o.status)) {
          totalCompletedOrders++;
          userOrderCounts.set(o.userId, (userOrderCounts.get(o.userId) || 0) + 1);
        }
        if (o.source === "REPURCHASE") {
          repurchaseOrdersCount++;
        }
        if (o.discountCents > 0 || o.source === "COUPON") {
          couponDrivenOrdersCount++;
        }
      }

      const totalUniqueCustomers = userOrderCounts.size;
      let repeatCustomersCount = 0;
      userOrderCounts.forEach((count) => {
        if (count >= 2) repeatCustomersCount++;
      });

      const overallRepeatRate =
        totalUniqueCustomers > 0
          ? Number(((repeatCustomersCount / totalUniqueCustomers) * 100).toFixed(1))
          : 0;

      const totalDiscountSubsidizedCents = totalSubsidizedCentsAgg._sum.discountCents || 0;

      return NextResponse.json({
        success: true,
        marketing: {
          metrics: {
            totalUniqueCustomers,
            repeatCustomersCount,
            overallRepeatRate,
            totalCompletedOrders,
            repurchaseOrdersCount,
            couponDrivenOrdersCount,
            totalUserCouponsUsed,
            totalDiscountSubsidizedCents,
            totalDiscountSubsidizedYuan: (totalDiscountSubsidizedCents / 100).toFixed(2),
          },
          platformCoupons,
          merchantCampaigns,
        },
      });
    }

    return NextResponse.json({ success: false, error: "未知的 tab 参数" }, { status: 400 });
  } catch (error: any) {
    console.error("[API /api/admin/commercial GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "获取商业化管理数据失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!checkAdminAuth(session)) {
      return NextResponse.json({ success: false, error: "无权操作商业化配置" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // 1. 更新套餐价格与配置
    if (action === "UPDATE_PACKAGE") {
      const { id, packageKey, name, priceCents, originalPriceCents, durationDays, enabled, benefits, description, sortOrder } = body;

      const updated = await prisma.promotionPackage.upsert({
        where: { packageKey },
        create: {
          packageKey,
          name,
          category: body.category || "PROMOTION",
          priceCents: parseInt(priceCents, 10),
          originalPriceCents: originalPriceCents ? parseInt(originalPriceCents, 10) : null,
          durationDays: parseInt(durationDays, 10),
          enabled: !!enabled,
          benefits: Array.isArray(benefits) ? benefits : [benefits].filter(Boolean),
          description: description || null,
          sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
        },
        update: {
          name,
          priceCents: parseInt(priceCents, 10),
          originalPriceCents: originalPriceCents ? parseInt(originalPriceCents, 10) : null,
          durationDays: parseInt(durationDays, 10),
          enabled: !!enabled,
          benefits: Array.isArray(benefits) ? benefits : [benefits].filter(Boolean),
          description: description || null,
          sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
        },
      });

      await prisma.operationLog.create({
        data: {
          action: "COMMERCIAL_PACKAGE_UPDATED",
          targetId: updated.id,
          userId: session.id,
          metadata: { packageKey, priceCents, durationDays },
        },
      });

      return NextResponse.json({ success: true, package: updated });
    }

    // 2. 审核服务商/商家认证
    if (action === "REVIEW_PROVIDER") {
      const { providerId, verificationStatus, rejectReason, isMember, yearsOfService } = body;

      if (!providerId || !["APPROVED", "REJECTED"].includes(verificationStatus)) {
        return NextResponse.json({ success: false, error: "审核参数错误" }, { status: 400 });
      }

      const now = new Date();
      const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      const updated = await prisma.serviceProvider.update({
        where: { id: providerId },
        data: {
          verificationStatus,
          rejectReason: verificationStatus === "REJECTED" ? rejectReason || "资料不齐全或不符合平台规范" : null,
          verifiedAt: verificationStatus === "APPROVED" ? now : null,
          validUntil: verificationStatus === "APPROVED" ? oneYearLater : null,
          reviewerId: session.id,
          isMember: isMember !== undefined ? !!isMember : undefined,
          yearsOfService: yearsOfService !== undefined ? yearsOfService : undefined,
        },
      });

      await prisma.operationLog.create({
        data: {
          action: "SERVICE_PROVIDER_REVIEWED",
          targetId: providerId,
          userId: session.id,
          metadata: { verificationStatus, rejectReason },
        },
      });

      return NextResponse.json({ success: true, provider: updated });
    }

    // 3. 管理员人工赠送/置顶 (ADMIN_PROMOTE)
    if (action === "ADMIN_PROMOTE") {
      const { listingId, promotionType, durationDays = 7 } = body;

      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing) {
        return NextResponse.json({ success: false, error: "信息不存在" }, { status: 404 });
      }

      const days = parseInt(durationDays, 10) || 7;
      const durationMs = days * 24 * 60 * 60 * 1000;
      const now = new Date();
      const endAt = new Date(now.getTime() + durationMs);
      const orderNo = `ADMIN_GIFT_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

      // 创建 ListingPromotion
      const promo = await prisma.listingPromotion.create({
        data: {
          orderNo,
          userId: session.id,
          resourceType: "LISTING",
          resourceId: listingId,
          promotionType: promotionType || "TOP_7_DAYS",
          amountCents: 0,
          status: "ACTIVE",
          source: "ADMIN",
          startAt: now,
          endAt,
        },
      });

      const updateData: any = {};
      if (promotionType === "HOME_FEATURED") {
        updateData.isHomeFeatured = true;
        updateData.homeFeaturedUntil = endAt;
      } else if (promotionType === "CATEGORY_FEATURED") {
        updateData.isFeatured = true;
        updateData.featuredUntil = endAt;
      } else {
        updateData.isTop = true;
        updateData.topUntil = endAt;
      }

      await prisma.listing.update({
        where: { id: listingId },
        data: updateData,
      });

      await prisma.operationLog.create({
        data: {
          action: "ADMIN_PROMOTION_GRANTED",
          targetId: listingId,
          userId: session.id,
          metadata: { orderNo, promotionType, days },
        },
      });

      return NextResponse.json({ success: true, promotion: promo });
    }

    // 4. 终止/停推/恢复推广
    if (action === "TOGGLE_PROMOTION") {
      const { promoId, active } = body;
      const promo = await prisma.listingPromotion.findUnique({
        where: { id: promoId },
        include: { listing: true },
      });

      if (!promo) {
        return NextResponse.json({ success: false, error: "推广记录不存在" }, { status: 404 });
      }

      const newStatus = active ? "ACTIVE" : "CANCELLED";
      await prisma.listingPromotion.update({
        where: { id: promoId },
        data: { status: newStatus },
      });

      // 若取消，将便民信息的对应置顶/推荐到期重置为当前
      if (!active && promo.listing) {
        const resetData: any = {};
        if (promo.promotionType === "HOME_FEATURED") {
          resetData.isHomeFeatured = false;
          resetData.homeFeaturedUntil = new Date();
        } else if (promo.promotionType === "CATEGORY_FEATURED") {
          resetData.isFeatured = false;
          resetData.featuredUntil = new Date();
        } else {
          resetData.isTop = false;
          resetData.topUntil = new Date();
        }

        await prisma.listing.update({
          where: { id: promo.resourceId },
          data: resetData,
        });
      }

      return NextResponse.json({ success: true, status: newStatus });
    }

    // 5. 更新服务需求状态与改派 (UPDATE_REQUEST_STATUS)
    if (action === "UPDATE_REQUEST_STATUS") {
      const { requestId, status, selectedProviderId, cancelReason } = body;
      const updateData: any = {};
      if (status) updateData.status = status;
      if (selectedProviderId !== undefined) updateData.selectedProviderId = selectedProviderId;
      if (cancelReason !== undefined) updateData.cancelReason = cancelReason;

      const updated = await prisma.serviceRequest.update({
        where: { id: requestId },
        data: updateData,
      });

      await prisma.operationLog.create({
        data: {
          action: "ADMIN_SERVICE_REQUEST_UPDATED",
          targetId: requestId,
          userId: session.id,
          metadata: { status, selectedProviderId },
        },
      });

      return NextResponse.json({ success: true, request: updated });
    }

    // 6. 真实评价审核与治理 (MODERATE_REVIEW)
    if (action === "MODERATE_REVIEW") {
      const { reviewId, status } = body;
      const review = await prisma.review.findUnique({ where: { id: reviewId } });
      if (!review) return NextResponse.json({ success: false, error: "评价不存在" }, { status: 404 });

      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: { status },
      });

      await recalculateProviderRating(review.providerId);

      await prisma.operationLog.create({
        data: {
          action: "ADMIN_REVIEW_MODERATED",
          targetId: reviewId,
          userId: session.id,
          metadata: { newStatus: status, providerId: review.providerId },
        },
      });

      return NextResponse.json({ success: true, review: updated });
    }

    // 7. 平台优惠券创建 (CREATE_PLATFORM_COUPON)
    if (action === "CREATE_PLATFORM_COUPON") {
      const {
        title,
        couponType = "FIXED",
        discountYuan,
        minSpendYuan = "0",
        totalQuantity = 200,
        validDays = 30,
        perUserLimit = 1,
        description,
        applicableCategory,
      } = body;

      if (!title || !discountYuan) {
        return NextResponse.json({ success: false, error: "请填写优惠券名称与减免金额" }, { status: 400 });
      }

      const discountCents = Math.round(parseFloat(discountYuan) * 100);
      const minSpendCents = Math.round(parseFloat(minSpendYuan) * 100);

      const coupon = await prisma.serviceCoupon.create({
        data: {
          title: String(title).trim(),
          issuerType: "PLATFORM",
          couponType,
          discountCents,
          valueCents: discountCents,
          minSpendCents,
          applicableScope: applicableCategory ? "CATEGORY" : "ALL",
          applicableCategory: applicableCategory || null,
          totalQuantity: parseInt(totalQuantity, 10) || 200,
          validDays: parseInt(validDays, 10) || 30,
          perUserLimit: parseInt(perUserLimit, 10) || 1,
          description: description ? String(description).trim() : "杨林生活网·官方补贴通用券",
          enabled: true,
        },
      });

      return NextResponse.json({ success: true, coupon });
    }

    // 8. 切换优惠券启用状态 (TOGGLE_COUPON)
    if (action === "TOGGLE_COUPON") {
      const { couponId, enabled } = body;
      const updated = await prisma.serviceCoupon.update({
        where: { id: couponId },
        data: { enabled: !!enabled },
      });
      return NextResponse.json({ success: true, coupon: updated });
    }

    // 9. 商家活动审核与状态更新 (REVIEW_CAMPAIGN)
    if (action === "REVIEW_CAMPAIGN") {
      const { campaignId, status, rejectReason } = body;
      const updated = await prisma.merchantCampaign.update({
        where: { id: campaignId },
        data: {
          status,
          rejectReason: rejectReason || null,
        },
      });
      return NextResponse.json({ success: true, campaign: updated });
    }

    return NextResponse.json({ success: false, error: "未知的 action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API /api/admin/commercial POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "商业化管理操作失败" },
      { status: 500 }
    );
  }
}
