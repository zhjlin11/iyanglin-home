import { prisma } from "@/lib/prisma";

export interface RecommendationCardItem {
  id: string;
  title: string;
  subTitle?: string;
  tag?: string;
  priceText?: string;
  coverImage?: string;
  link: string;
  channel: string;
}

export interface RecommendationGroup {
  groupTitle: string;
  channelName: string;
  items: RecommendationCardItem[];
}

/**
 * 工业厂房详情页跨频道推荐:
 * 1. 经开区附近用工/招聘职位
 * 2. 厂区配套生活与工业服务（保洁、弱电强电维修、搬运）
 */
export async function getIndustrialRecommendations(
  industrialId: string,
  area = "杨林经开区"
): Promise<RecommendationGroup[]> {
  const [jobs, providers] = await Promise.all([
    prisma.job.findMany({
      where: {
        status: "APPROVED",
      },
      orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
      take: 4,
      select: {
        id: true,
        title: true,
        company: true,
        salary: true,
        area: true,
        images: true,
      },
    }),
    prisma.serviceProvider.findMany({
      where: {
        verificationStatus: "APPROVED",
        operatingStatus: "OPEN",
      },
      orderBy: [{ ratingAvg: "desc" }, { completedOrders: "desc" }],
      take: 4,
      select: {
        id: true,
        name: true,
        serviceCategory: true,
        ratingAvg: true,
        avatar: true,
      },
    }),
  ]);

  const jobItems: RecommendationCardItem[] = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    subTitle: j.company,
    tag: j.area || "经开区",
    priceText: j.salary,
    coverImage: j.images?.[0] || undefined,
    link: `/jobs/${j.id}`,
    channel: "JOB",
  }));

  const providerItems: RecommendationCardItem[] = providers.map((p) => ({
    id: p.id,
    title: p.name,
    subTitle: `${p.serviceCategory} · 真实好评 ${p.ratingAvg.toFixed(1)}分`,
    tag: "配套服务",
    coverImage: p.avatar || undefined,
    link: `/provider/${p.id}`,
    channel: "PROVIDER",
  }));

  return [
    {
      groupTitle: "🏭 经开区周边热门招工岗位",
      channelName: "招聘",
      items: jobItems,
    },
    {
      groupTitle: "⚡ 厂区配套服务与工程维修师傅",
      channelName: "便民",
      items: providerItems,
    },
  ];
}

/**
 * 招聘岗位详情页跨频道推荐:
 * 1. 厂区周边精选租房房源
 * 2. 上下班拼车/通勤便民动态
 */
export async function getJobRecommendations(
  jobId: string,
  area = "杨林"
): Promise<RecommendationGroup[]> {
  const [houses, carpools] = await Promise.all([
    prisma.house.findMany({
      where: {
        status: "APPROVED",
      },
      orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
      take: 4,
      select: {
        id: true,
        title: true,
        location: true,
        layout: true,
        price: true,
        images: true,
      },
    }),
    prisma.listing.findMany({
      where: {
        status: "APPROVED",
        OR: [
          { category: { contains: "拼车" } },
          { title: { contains: "车" } },
        ],
      },
      orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
      take: 4,
      select: {
        id: true,
        title: true,
        category: true,
        price: true,
        images: true,
      },
    }),
  ]);

  const houseItems: RecommendationCardItem[] = houses.map((h) => ({
    id: h.id,
    title: h.title,
    subTitle: `${h.location || "杨林"} · ${h.layout || "整租/合租"}`,
    tag: "职住就近",
    priceText: h.price ? `${h.price}元/月` : "面议",
    coverImage: h.images?.[0] || undefined,
    link: `/house/${h.id}`,
    channel: "HOUSE",
  }));

  const carpoolItems: RecommendationCardItem[] = carpools.map((c) => ({
    id: c.id,
    title: c.title,
    subTitle: c.category || "拼车通勤",
    tag: "通勤顺风车",
    priceText: c.price ? `${c.price}元` : undefined,
    coverImage: c.images?.[0] || undefined,
    link: `/info/${c.id}`,
    channel: "LISTING",
  }));

  return [
    {
      groupTitle: "🏠 企业周边 3 公里租房精选",
      channelName: "房产",
      items: houseItems,
    },
    {
      groupTitle: "🚗 上下班同城拼车与通勤互助",
      channelName: "便民",
      items: carpoolItems,
    },
  ];
}

/**
 * 房产详情页跨频道推荐:
 * 1. 搬家拉货/开锁疏通/保洁开荒师傅
 * 2. 邻里二手家具家电转让
 */
export async function getHouseRecommendations(
  houseId: string,
  area = "杨林"
): Promise<RecommendationGroup[]> {
  const [providers, secondHand] = await Promise.all([
    prisma.serviceProvider.findMany({
      where: {
        verificationStatus: "APPROVED",
        operatingStatus: "OPEN",
      },
      orderBy: [{ ratingAvg: "desc" }, { completedOrders: "desc" }],
      take: 4,
      select: {
        id: true,
        name: true,
        serviceCategory: true,
        ratingAvg: true,
        avatar: true,
      },
    }),
    prisma.listing.findMany({
      where: {
        status: "APPROVED",
        OR: [
          { category: { contains: "二手" } },
          { title: { contains: "转让" } },
          { title: { contains: "家电" } },
        ],
      },
      orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
      take: 4,
      select: {
        id: true,
        title: true,
        category: true,
        price: true,
        images: true,
      },
    }),
  ]);

  const providerItems: RecommendationCardItem[] = providers.map((p) => ({
    id: p.id,
    title: p.name,
    subTitle: `${p.serviceCategory} · 上门服务`,
    tag: "邻里师傅",
    coverImage: p.avatar || undefined,
    link: `/provider/${p.id}`,
    channel: "PROVIDER",
  }));

  const itemCards: RecommendationCardItem[] = secondHand.map((s) => ({
    id: s.id,
    title: s.title,
    subTitle: s.category || "二手闲置",
    tag: "同城闲置",
    priceText: s.price ? `¥${s.price}` : "面议",
    coverImage: s.images?.[0] || undefined,
    link: `/info/${s.id}`,
    channel: "LISTING",
  }));

  return [
    {
      groupTitle: "🔧 入住必备：搬家保洁与开锁维修师傅",
      channelName: "便民",
      items: providerItems,
    },
    {
      groupTitle: "🛋️ 邻里转让：高性价比二手家具家电",
      channelName: "便民",
      items: itemCards,
    },
  ];
}

/**
 * P6: 基于用户最近行为的智能推荐引擎 (带个性化开关与冷启动)
 */
export async function getUserPersonalizedRecommendations(
  userId?: string
): Promise<RecommendationGroup[]> {
  // 1. 检查用户隐私偏好设置 (是否关闭了个性化推荐)
  if (userId) {
    try {
      const pref = await prisma.userPreference.findUnique({
        where: { userId },
        select: { notifyOnFollowNewProduct: true },
      });
      if (pref && pref.notifyOnFollowNewProduct === false) {
        // 用户关闭了个性化推荐，直接返回冷启动通用精选
        return getColdStartRecommendations("🔥 杨林同城热门精选（已关闭个性化追踪）");
      }
    } catch {}
  }

  // 2. 若有用户ID，尝试提取最近收藏与行为特征
  let recentTargetType: string | null = null;
  let recentTitle: string | null = null;

  if (userId) {
    try {
      const lastFav = await prisma.favorite.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { resourceType: true, title: true },
      });
      if (lastFav) {
        recentTargetType = lastFav.resourceType;
        recentTitle = lastFav.title;
      }
    } catch {}
  }

  // 3. 动态生成可解释的推荐流
  if (recentTargetType === "JOB") {
    const jobs = await prisma.job.findMany({
      where: { status: "APPROVED" },
      orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
      take: 4,
    });
    return [
      {
        groupTitle: recentTitle
          ? `💼 根据你最近关注的【${recentTitle.slice(0, 8)}】推荐`
          : "💼 猜你感兴趣的杨林周边好工作",
        channelName: "招聘",
        items: jobs.map((j) => ({
          id: j.id,
          title: j.title,
          subTitle: j.company,
          tag: j.isTop ? "推广" : (j.area || "杨林"),
          priceText: j.salary,
          link: `/jobs/${j.id}`,
          channel: "JOB",
        })),
      },
    ];
  }

  // 4. 冷启动与默认高分推荐
  return getColdStartRecommendations("⭐ 杨林本地精选推荐");
}

async function getColdStartRecommendations(groupTitle: string): Promise<RecommendationGroup[]> {
  try {
    const [providers, listings] = await Promise.all([
      prisma.serviceProvider.findMany({
        where: { verificationStatus: "APPROVED", operatingStatus: "OPEN" },
        orderBy: [{ ratingAvg: "desc" }, { completedOrders: "desc" }],
        take: 3,
      }),
      prisma.listing.findMany({
        where: { status: "APPROVED" },
        orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
        take: 3,
      }),
    ]);

    const providerCards: RecommendationCardItem[] = providers.map((p) => ({
      id: p.id,
      title: p.name,
      subTitle: `${p.serviceCategory} · 好评${p.ratingAvg.toFixed(1)}分`,
      tag: "认证师傅",
      link: `/provider/${p.id}`,
      channel: "PROVIDER",
    }));

    const listingCards: RecommendationCardItem[] = listings.map((l) => ({
      id: l.id,
      title: l.title,
      subTitle: l.category || "便民生活",
      tag: l.isTop ? "推广" : "便民动态",
      priceText: l.price ? `¥${l.price}` : "免费",
      link: `/info/${l.id}`,
      channel: "LISTING",
    }));

    return [
      {
        groupTitle,
        channelName: "精选",
        items: [...providerCards, ...listingCards],
      },
    ];
  } catch {
    return [];
  }
}
