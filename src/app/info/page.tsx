import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import AdBanner from "@/components/AdBanner";
import { prisma } from "@/lib/prisma";
import InfoHallView from "@/components/info/InfoHallView";
import {
  getCategoryByKey,
  getCategoryByName,
} from "@/lib/info-categories";
import { getEnabledInfoAreas } from "@/lib/info-regions";

export const metadata: Metadata = {
  title: "杨林便民信息_二手闲置拼车维修家政求助 - 杨林生活网",
  description:
    "杨林生活网综合便民信息大厅，汇聚经开区与大学城同城顺风车、二手转让、家政保洁、家电维修、数码网络、本地农产生鲜、商务财税与街坊求助，100%真实本地生活互助平台。",
  keywords: [
    "杨林便民信息",
    "杨林拼车顺风车",
    "杨林二手闲置",
    "杨林家政维修",
    "杨林大学城便民",
    "嵩明分类信息网",
  ],
  openGraph: {
    title: "杨林便民信息 · 本地生活服务大厅 - 杨林生活网",
    description: "二手、拼车、维修、求助、转让、家政、本地服务，一站查询。",
    url: "https://iyanglin.com/info",
    siteName: "杨林生活网",
  },
  alternates: {
    canonical: "https://iyanglin.com/info",
  },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    subCategory?: string;
    area?: string;
    itemType?: string;
    timeRange?: string;
    hasImage?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function InfoPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const query = (params.q || "").trim();
  const selectedCategory = params.category || "all";
  const selectedSubCategory = params.subCategory || "all";
  const selectedArea = params.area || "all";
  const selectedItemType = params.itemType || "all";
  const selectedTimeRange = params.timeRange || "all";
  const hasImage = params.hasImage === "true";
  const selectedSort = params.sort || "newest";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const pageSize = 20;

  const now = new Date();

  // 1. 构建 Prisma Where 条件
  const where: any = {
    status: "APPROVED",
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: now } },
    ],
  };

  // 分类匹配 (兼容 key 与 name)
  const currentCatObj =
    selectedCategory !== "all"
      ? getCategoryByKey(selectedCategory) || getCategoryByName(selectedCategory)
      : null;

  if (currentCatObj) {
    where.category = { in: [currentCatObj.key, currentCatObj.name] };
  } else if (selectedCategory !== "all") {
    where.category = selectedCategory;
  }

  // 子类匹配
  if (selectedSubCategory !== "all" && !selectedSubCategory.startsWith("全部")) {
    where.subCategory = selectedSubCategory;
  }

  // 片区匹配
  if (selectedArea !== "all" && selectedArea !== "全部区域") {
    where.area = { contains: selectedArea };
  }

  // 供需匹配
  if (selectedItemType === "OFFER" || selectedItemType === "WANTED") {
    where.itemType = selectedItemType;
  }

  // 时间跨度过滤
  if (selectedTimeRange === "today") {
    where.createdAt = { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
  } else if (selectedTimeRange === "3days") {
    where.createdAt = { gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) };
  } else if (selectedTimeRange === "7days") {
    where.createdAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
  } else if (selectedTimeRange === "30days") {
    where.createdAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
  }

  // 只看有图
  if (hasImage) {
    where.images = { isEmpty: false };
  }

  // 关键词检索
  if (query) {
    where.AND = [
      {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { body: { contains: query, mode: "insensitive" } },
          { subCategory: { contains: query, mode: "insensitive" } },
          { fromPlace: { contains: query, mode: "insensitive" } },
          { toPlace: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
        ],
      },
    ];
  }

  // 2. 排序规则：置顶优先
  const orderByList: any[] = [{ isTop: "desc" }];
  if (selectedSort === "hottest") {
    orderByList.push({ viewsCount: "desc" });
    orderByList.push({ refreshedAt: "desc" });
  } else if (selectedSort === "price_asc") {
    orderByList.push({ priceNum: "asc" });
    orderByList.push({ refreshedAt: "desc" });
  } else if (selectedSort === "price_desc") {
    orderByList.push({ priceNum: "desc" });
    orderByList.push({ refreshedAt: "desc" });
  } else {
    // newest
    orderByList.push({ refreshedAt: "desc" });
    orderByList.push({ createdAt: "desc" });
  }

  // 3. 并行读取数据与运营指标，以及首页精选推荐与认证服务商
  const [
    totalCount,
    items,
    totalApprovedAll,
    todayApprovedCount,
    availableAreas,
    homeFeaturedItems,
    featuredProviders,
  ] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: [{ isTop: "desc" }, { isFeatured: "desc" }, ...orderByList.slice(1)],
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            phoneVerifiedAt: true,
            role: true,
          },
        },
      },
    }),
    prisma.listing.count({
      where: {
        status: "APPROVED",
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
    prisma.listing.count({
      where: {
        status: "APPROVED",
        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      },
    }),
    getEnabledInfoAreas(),
    prisma.listing.findMany({
      where: {
        status: "APPROVED",
        isHomeFeatured: true,
        OR: [{ homeFeaturedUntil: null }, { homeFeaturedUntil: { gt: now } }],
      },
      orderBy: [{ refreshedAt: "desc" }],
      take: 6,
    }),
    prisma.serviceProvider.findMany({
      where: { verificationStatus: "APPROVED" },
      orderBy: [{ sortOrder: "desc" }, { isMember: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
  ]);

  // 序列化为前端安全 JSON
  const serializedItems = items.map((item: any) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    category: item.category,
    subCategory: item.subCategory,
    itemType: item.itemType,
    price: item.price,
    priceUnit: item.priceUnit,
    condition: item.condition,
    area: item.area,
    address: item.address,
    contact: item.contact,
    contactName: item.contactName,
    wechat: item.wechat,
    images: item.images,
    viewsCount: item.viewsCount,
    isTop: item.isTop,
    isFeatured: item.isFeatured,
    status: item.status,
    rejectReason: item.rejectReason,
    expiresAt: item.expiresAt ? item.expiresAt.toISOString() : null,
    extraData: item.extraData,
    fromPlace: item.fromPlace,
    toPlace: item.toPlace,
    departureTime: item.departureTime,
    createdAt: item.createdAt.toISOString(),
    refreshedAt: item.refreshedAt.toISOString(),
    author: item.author
      ? {
          id: item.author.id,
          username: item.author.username,
          nickname: item.author.nickname,
          avatar: item.author.avatar,
          phoneVerifiedAt: item.author.phoneVerifiedAt ? item.author.phoneVerifiedAt.toISOString() : null,
          role: item.author.role,
        }
      : null,
  }));

  const serializedHomeFeatured = homeFeaturedItems.map((item: any) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    category: item.category,
    area: item.area,
    price: item.price,
    images: item.images,
    isTop: item.isTop,
    isFeatured: item.isFeatured,
    createdAt: item.createdAt.toISOString(),
  }));

  const serializedProviders = featuredProviders.map((p: any) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    serviceCategory: p.serviceCategory,
    serviceAreas: p.serviceAreas,
    verificationType: p.verificationType,
    isMember: p.isMember,
  }));

  return (
    <main>
      <Navbar />
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        <AdBanner placementKey="LISTING_TOP" maxItems={2} hidePlaceholder />
      </div>
      <InfoHallView
        initialItems={serializedItems}
        homeFeaturedItems={serializedHomeFeatured}
        featuredProviders={serializedProviders}
        totalCount={totalCount}
        totalApprovedAll={totalApprovedAll}
        todayApprovedCount={todayApprovedCount}
        currentPage={currentPage}
        pageSize={pageSize}
        areas={availableAreas.map((a: any) => a.name)}
        currentQuery={query}
        currentCategory={selectedCategory}
        currentSubCategory={selectedSubCategory}
        currentArea={selectedArea}
        currentItemType={selectedItemType}
        currentTimeRange={selectedTimeRange}
        currentHasImage={hasImage}
        currentSort={selectedSort}
      />
    </main>
  );
}
