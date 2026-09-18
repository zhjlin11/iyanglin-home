import { prisma } from "@/lib/prisma";

export interface PromotionPackageDef {
  packageKey: string;
  name: string;
  category: "PROMOTION" | "VERIFICATION" | "MEMBERSHIP";
  priceCents: number;
  originalPriceCents?: number;
  durationDays: number;
  benefits: string[];
  description: string;
  enabled: boolean;
  sortOrder: number;
}

export const DEFAULT_PROMOTION_PACKAGES: PromotionPackageDef[] = [
  {
    packageKey: "TOP_3_DAYS",
    name: "3天分类置顶",
    category: "PROMOTION",
    priceCents: 1500, // 15.00 元
    originalPriceCents: 2500,
    durationDays: 3,
    benefits: ["所属分类列表顶部黄金排位", "专属🔥置顶高光边框", "全天候曝光成倍增长", "到期自动平稳降序"],
    description: "适合短周期快速转手、紧急拼车或招聘求租",
    enabled: true,
    sortOrder: 1,
  },
  {
    packageKey: "TOP_7_DAYS",
    name: "7天黄金置顶",
    category: "PROMOTION",
    priceCents: 2800, // 28.00 元
    originalPriceCents: 4900,
    durationDays: 7,
    benefits: ["连续7天霸榜当前分类前排", "专属金黄色徽章强化信任", "优先推送同城搜索结果", "成交效率提升300%"],
    description: "85%街坊与商家的超值首选，性价比最高",
    enabled: true,
    sortOrder: 2,
  },
  {
    packageKey: "CATEGORY_FEATURED",
    name: "分类精选推荐",
    category: "PROMOTION",
    priceCents: 3500, // 35.00 元
    originalPriceCents: 5800,
    durationDays: 7,
    benefits: ["分类大厅「精选推荐」首屏卡片", "专属⭐精选红标徽章", "分类轮播精选特权", "同类优先相关推荐关联"],
    description: "适合优质商户、家政维修、农产生鲜等专业服务长期曝光",
    enabled: true,
    sortOrder: 3,
  },
  {
    packageKey: "HOME_FEATURED",
    name: "便民首页大厅推荐",
    category: "PROMOTION",
    priceCents: 5800, // 58.00 元
    originalPriceCents: 9800,
    durationDays: 7,
    benefits: ["便民大厅首页「精选推荐」大横幅首推", "全站核心流量枢纽直接导流", "置顶与精选双重标签护航", "尊贵黄金卡片视觉"],
    description: "杨林生活网全域流量王，适合品牌商家、特色美食、优质企业",
    enabled: true,
    sortOrder: 4,
  },
  {
    packageKey: "MERCHANT_BADGE",
    name: "商家/服务者实名认证",
    category: "VERIFICATION",
    priceCents: 0, // 现阶段特惠免费审核 (原价 99 元)
    originalPriceCents: 9900,
    durationDays: 365,
    benefits: ["点亮专属✓实名服务者蓝V徽章", "开通独立专属服务者主页", "所有发布信息附带可信背书", "大幅提升街坊咨询与复购率"],
    description: "建立长期经营可信度的基石，经杨林平台人工审核",
    enabled: true,
    sortOrder: 5,
  },
  {
    packageKey: "MEMBER_PLAN",
    name: "商家会员VIP年卡",
    category: "MEMBERSHIP",
    priceCents: 19900, // 199.00 元/年
    originalPriceCents: 39900,
    durationDays: 365,
    benefits: ["突破普通用户发布配额(最多可发20条)", "赠送全年每月2次免费置顶特权", "优先进入人工审核极速通道", "专属VIP服务商皇冠标"],
    description: "专为杨林本地长期经营的维修队、商家档口与服务商打造",
    enabled: true,
    sortOrder: 6,
  },
];

/**
 * 自动填充初始化商业化套餐价格配置 (DB 优先)
 */
export async function seedDefaultPromotionPackages() {
  try {
    const count = await prisma.promotionPackage.count();
    if (count === 0) {
      for (const p of DEFAULT_PROMOTION_PACKAGES) {
        await prisma.promotionPackage.create({
          data: p,
        });
      }
      console.log("[PROMOTION] Seeded default promotion packages successfully.");
    }
  } catch (e: any) {
    console.error("[PROMOTION seed error]:", e?.message);
  }
}

/**
 * 获取启用的套餐价格配置列表（保证从 DB 读取真实价格）
 */
export async function getPromotionPackages(category?: "PROMOTION" | "VERIFICATION" | "MEMBERSHIP") {
  await seedDefaultPromotionPackages();
  const where: any = { enabled: true };
  if (category) {
    where.category = category;
  }
  return prisma.promotionPackage.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
  });
}

/**
 * 根据 Key 查找套餐
 */
export async function getPromotionPackageByKey(key: string) {
  await seedDefaultPromotionPackages();
  return prisma.promotionPackage.findUnique({
    where: { packageKey: key },
  });
}

/**
 * 激活信息推广权益 (事务幂等执行)
 */
export async function activateListingPromotion(orderNo: string, source: "PAID" | "ADMIN" = "PAID") {
  return prisma.$transaction(async (tx) => {
    // 1. 查找推广记录
    const promo = await tx.listingPromotion.findUnique({
      where: { orderNo },
      include: { listing: true },
    });

    if (!promo) {
      throw new Error(`推广订单不存在: ${orderNo}`);
    }

    // 幂等防重激活
    if (promo.status === "ACTIVE" && promo.endAt && promo.endAt > new Date()) {
      return promo;
    }

    // 2. 匹配套餐天数
    const pkg = await tx.promotionPackage.findUnique({
      where: { packageKey: promo.promotionType },
    });
    const durationDays = pkg?.durationDays || (promo.promotionType === "TOP_3_DAYS" ? 3 : 7);
    const durationMs = durationDays * 24 * 60 * 60 * 1000;
    const now = new Date();
    const startAt = promo.startAt && promo.startAt > now ? promo.startAt : now;
    const endAt = new Date(startAt.getTime() + durationMs);

    // 3. 更新推广记录状态
    const updatedPromo = await tx.listingPromotion.update({
      where: { orderNo },
      data: {
        status: "ACTIVE",
        source,
        startAt,
        endAt,
      },
    });

    // 4. 更新便民信息对应加权字段
    const listingUpdateData: any = {};
    if (promo.promotionType === "TOP_3_DAYS" || promo.promotionType === "TOP_7_DAYS") {
      listingUpdateData.isTop = true;
      const currentTopUntil = promo.listing.topUntil ? promo.listing.topUntil.getTime() : 0;
      listingUpdateData.topUntil = new Date(Math.max(currentTopUntil, now.getTime()) + durationMs);
    } else if (promo.promotionType === "CATEGORY_FEATURED") {
      listingUpdateData.isFeatured = true;
      const currentFeaturedUntil = promo.listing.featuredUntil ? promo.listing.featuredUntil.getTime() : 0;
      listingUpdateData.featuredUntil = new Date(Math.max(currentFeaturedUntil, now.getTime()) + durationMs);
    } else if (promo.promotionType === "HOME_FEATURED") {
      listingUpdateData.isHomeFeatured = true;
      const currentHomeUntil = promo.listing.homeFeaturedUntil ? promo.listing.homeFeaturedUntil.getTime() : 0;
      listingUpdateData.homeFeaturedUntil = new Date(Math.max(currentHomeUntil, now.getTime()) + durationMs);
    }

    await tx.listing.update({
      where: { id: promo.resourceId },
      data: listingUpdateData,
    });

    // 5. 记录操作日志
    await tx.operationLog.create({
      data: {
        action: "PROMOTION_ACTIVATED",
        targetId: promo.resourceId,
        userId: promo.userId,
        metadata: {
          orderNo,
          promotionType: promo.promotionType,
          durationDays,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          source,
        },
      },
    });

    console.log(`[PROMOTION] Successfully activated ${promo.promotionType} for listing ${promo.resourceId}`);
    return updatedPromo;
  });
}

/**
 * 格式化剩余有效时间
 */
export function formatRemainingTime(endAt?: Date | string | null): string {
  if (!endAt) return "已到期";
  const target = new Date(endAt).getTime();
  const now = Date.now();
  const diffMs = target - now;
  if (diffMs <= 0) return "已到期";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remainHours = diffHours % 24;

  if (diffDays > 0) {
    return `剩余 ${diffDays}天${remainHours > 0 ? ` ${remainHours}小时` : ""}`;
  }
  if (diffHours > 0) {
    return `剩余 ${diffHours}小时`;
  }
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return `剩余 ${Math.max(1, diffMinutes)}分钟`;
}

/**
 * 提取发布者真实可信事实数据 (非虚构真实信用)
 */
export async function getProviderTrustFacts(userId?: string | null) {
  if (!userId) {
    return {
      phoneVerified: false,
      realNameVerified: false,
      merchantVerified: false,
      registeredDays: 1,
      publishedCount: 1,
      activeStatusText: "今天活跃",
      badgeText: "普通街坊",
      providerProfileId: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      serviceProvider: true,
    },
  });

  if (!user) {
    return {
      phoneVerified: false,
      realNameVerified: false,
      merchantVerified: false,
      registeredDays: 1,
      publishedCount: 1,
      activeStatusText: "今天活跃",
      badgeText: "普通街坊",
      providerProfileId: null,
    };
  }

  // 注册天数
  const regDays = Math.max(1, Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)));

  // 历史发布条数
  const publishedCount = await prisma.listing.count({
    where: { authorId: userId, status: "APPROVED" },
  });

  // 活跃状态
  let activeStatusText = "今天活跃";
  if (user.lastActiveAt) {
    const diffHours = (Date.now() - user.lastActiveAt.getTime()) / (1000 * 60 * 60);
    if (diffHours <= 24) activeStatusText = "今天活跃";
    else if (diffHours <= 72) activeStatusText = "3天内活跃";
    else activeStatusText = "近期活跃";
  }

  const sp = user.serviceProvider;
  const isApprovedProvider = sp && sp.verificationStatus === "APPROVED";

  let badgeText = "热心街坊";
  if (isApprovedProvider) {
    badgeText = sp.verificationType === "MERCHANT_VERIFIED" ? "✓ 认证商家" : "✓ 认证服务者";
  } else if (user.phoneVerifiedAt) {
    badgeText = "✓ 电话已核验";
  }

  return {
    phoneVerified: !!user.phoneVerifiedAt,
    realNameVerified: !!user.phoneVerifiedAt || !!isApprovedProvider,
    merchantVerified: !!isApprovedProvider,
    registeredDays: regDays,
    publishedCount,
    activeStatusText,
    badgeText,
    providerProfileId: isApprovedProvider ? sp.id : null,
  };
}
