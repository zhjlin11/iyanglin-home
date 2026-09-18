import { prisma } from "@/lib/prisma";

export interface UnifiedResource {
  resourceType:
    | "JOB"
    | "HOUSE"
    | "INDUSTRIAL"
    | "INFO"
    | "COMMUNITY"
    | "SERVICE_PRODUCT"
    | "SERVICE_PROVIDER"
    | "MERCHANT";
  resourceId: string;
  title: string;
  subtitle?: string;
  coverImage?: string;
  price?: string;
  status?: string;
  organizationId?: string;
  ownerName?: string;
  contactPhone?: string;
  viewCount?: number;
  url: string;
  raw?: any;
}

/**
 * 统一获取全站任意类型业务资源
 */
export async function getResourceUnified(
  resourceType: string,
  resourceId: string
): Promise<UnifiedResource | null> {
  const type = resourceType.toUpperCase();

  try {
    switch (type) {
      case "JOB": {
        const item = await prisma.job.findUnique({
          where: { id: resourceId },
          include: { organization: true, author: true },
        });
        if (!item) return null;
        return {
          resourceType: "JOB",
          resourceId: item.id,
          title: item.title,
          subtitle: `${item.company} · ${item.area || "杨林"}`,
          price: item.salary || "面议",
          status: item.status,
          organizationId: item.organizationId || undefined,
          ownerName: item.company || item.author?.nickname || undefined,
          contactPhone: undefined,
          viewCount: 0,
          url: `/jobs/${item.id}`,
          raw: item,
        };
      }

      case "HOUSE": {
        const item = await prisma.house.findUnique({
          where: { id: resourceId },
          include: { author: true },
        });
        if (!item) return null;
        return {
          resourceType: "HOUSE",
          resourceId: item.id,
          title: item.title,
          subtitle: `${item.location || "杨林"} · ${item.layout}`,
          coverImage: item.images?.[0],
          price: `${item.price} 元/月`,
          status: item.status,
          ownerName: item.author?.nickname || undefined,
          contactPhone: item.contact || undefined,
          viewCount: 0,
          url: `/house/${item.id}`,
          raw: item,
        };
      }

      case "INDUSTRIAL": {
        const item = await prisma.industrialProperty.findUnique({
          where: { id: resourceId },
          include: { user: true },
        });
        if (!item) return null;
        return {
          resourceType: "INDUSTRIAL",
          resourceId: item.id,
          title: item.title,
          subtitle: item.address || item.region || "杨林经开区",
          coverImage: item.images?.[0],
          price: item.rentPrice ? `${item.rentPrice} ${item.priceUnit}` : (item.salePrice ? `${item.salePrice} 万元` : "面议"),
          status: item.status,
          ownerName: item.contactName || undefined,
          contactPhone: item.contactPhone || undefined,
          viewCount: item.viewCount || 0,
          url: `/industrial/${item.id}`,
          raw: item,
        };
      }

      case "INFO": {
        const item = await prisma.listing.findUnique({
          where: { id: resourceId },
          include: { author: true },
        });
        if (!item) return null;
        return {
          resourceType: "INFO",
          resourceId: item.id,
          title: item.title,
          subtitle: item.category || "便民分类",
          coverImage: item.images?.[0],
          price: item.price ? `${item.price} 元` : undefined,
          status: item.status,
          ownerName: item.contactName || item.author?.nickname || undefined,
          contactPhone: item.contact || undefined,
          viewCount: item.viewsCount || 0,
          url: `/info/${item.id}`,
          raw: item,
        };
      }

      case "COMMUNITY": {
        const item = await prisma.post.findUnique({
          where: { id: resourceId },
          include: { author: true },
        });
        if (!item) return null;
        return {
          resourceType: "COMMUNITY",
          resourceId: item.id,
          title: item.title,
          subtitle: item.category || "同城贴吧",
          coverImage: item.images?.[0],
          status: item.status,
          ownerName: item.author?.nickname || item.author?.username || undefined,
          viewCount: item.viewsCount || 0,
          url: `/community/${item.id}`,
          raw: item,
        };
      }

      case "SERVICE_PRODUCT": {
        const item = await prisma.serviceProduct.findUnique({
          where: { id: resourceId },
          include: { provider: true },
        });
        if (!item) return null;
        return {
          resourceType: "SERVICE_PRODUCT",
          resourceId: item.id,
          title: item.title,
          subtitle: item.provider?.name || "自营便民",
          coverImage: item.coverImage || undefined,
          price: `${(item.priceCents / 100).toFixed(2)} 元`,
          status: item.status,
          organizationId: undefined,
          ownerName: item.provider?.name,
          contactPhone: item.provider?.phone,
          viewCount: item.salesCount || 0,
          url: `/services/${item.id}`,
          raw: item,
        };
      }

      case "SERVICE_PROVIDER": {
        const item = await prisma.serviceProvider.findUnique({
          where: { id: resourceId },
        });
        if (!item) return null;
        return {
          resourceType: "SERVICE_PROVIDER",
          resourceId: item.id,
          title: item.name,
          subtitle: item.serviceCategory || "本地师傅",
          coverImage: item.avatar || undefined,
          status: item.operatingStatus,
          organizationId: undefined,
          ownerName: item.name,
          contactPhone: item.phone,
          viewCount: item.completedOrders || 0,
          url: `/provider/${item.id}`,
          raw: item,
        };
      }

      case "MERCHANT": {
        const item = await prisma.shop.findUnique({
          where: { id: resourceId },
          include: { author: true },
        });
        if (!item) return null;
        return {
          resourceType: "MERCHANT",
          resourceId: item.id,
          title: item.name,
          subtitle: item.category || "同城好店",
          coverImage: item.logo || item.images?.[0] || undefined,
          status: item.status,
          ownerName: item.author?.nickname || item.name,
          contactPhone: item.phone || undefined,
          viewCount: 0,
          url: `/haodian/${item.id}`,
          raw: item,
        };
      }

      default:
        return null;
    }
  } catch (e) {
    console.error(`[ResourceService] Failed to load ${resourceType}:${resourceId}:`, e);
    return null;
  }
}

/**
 * 统一跨频道搜索资源（供 AI Agent、开放 API、聚合推荐调用）
 */
export async function searchResourcesUnified(params: {
  keyword?: string;
  resourceType?: string;
  organizationId?: string;
  limit?: number;
}): Promise<UnifiedResource[]> {
  const limit = Math.min(params.limit || 10, 50);
  const kw = params.keyword?.trim() || "";

  const results: UnifiedResource[] = [];

  try {
    // 1. 招聘检索
    if (!params.resourceType || params.resourceType === "JOB") {
      const jobs = await prisma.job.findMany({
        where: {
          status: "APPROVED",
          ...(params.organizationId ? { organizationId: params.organizationId } : {}),
          ...(kw
            ? {
                OR: [
                  { title: { contains: kw, mode: "insensitive" } },
                  { company: { contains: kw, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      for (const j of jobs) {
        results.push({
          resourceType: "JOB",
          resourceId: j.id,
          title: j.title,
          subtitle: `${j.company} · ${j.area || "杨林"}`,
          price: j.salary || "面议",
          status: j.status,
          organizationId: j.organizationId || undefined,
          ownerName: j.company,
          contactPhone: undefined,
          viewCount: 0,
          url: `/jobs/${j.id}`,
        });
      }
    }

    // 2. 房产检索
    if (!params.resourceType || params.resourceType === "HOUSE") {
      const houses = await prisma.house.findMany({
        where: {
          status: "APPROVED",
          ...(kw
            ? {
                OR: [
                  { title: { contains: kw, mode: "insensitive" } },
                  { location: { contains: kw, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      for (const h of houses) {
        results.push({
          resourceType: "HOUSE",
          resourceId: h.id,
          title: h.title,
          subtitle: `${h.location || "杨林"} · ${h.layout}`,
          coverImage: h.images?.[0],
          price: `${h.price} 元/月`,
          status: h.status,
          contactPhone: h.contact || undefined,
          viewCount: 0,
          url: `/house/${h.id}`,
        });
      }
    }

    // 3. 服务与好店检索
    if (!params.resourceType || params.resourceType === "SERVICE_PRODUCT") {
      const services = await prisma.serviceProduct.findMany({
        where: {
          status: "ONLINE",
          ...(kw ? { title: { contains: kw, mode: "insensitive" } } : {}),
        },
        include: { provider: true },
        take: limit,
        orderBy: { salesCount: "desc" },
      });

      for (const s of services) {
        results.push({
          resourceType: "SERVICE_PRODUCT",
          resourceId: s.id,
          title: s.title,
          subtitle: s.provider?.name || "自营便民",
          coverImage: s.coverImage || undefined,
          price: `${(s.priceCents / 100).toFixed(2)} 元`,
          status: s.status,
          organizationId: undefined,
          ownerName: s.provider?.name,
          contactPhone: s.provider?.phone,
          viewCount: s.salesCount || 0,
          url: `/services/${s.id}`,
        });
      }
    }
  } catch (e) {
    console.error("[ResourceService] Search error:", e);
  }

  return results.slice(0, limit);
}
