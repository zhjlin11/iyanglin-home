import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export interface UnifiedPublishedItem {
  id: string;
  title: string;
  channel: "JOB" | "HOUSE" | "INDUSTRIAL" | "LISTING" | "POST" | "SERVICE";
  channelLabel: string;
  status: string;
  statusLabel: string;
  viewsCount?: number;
  isTop?: boolean;
  createdAt: string;
  link: string;
}

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const channel = (searchParams.get("channel") || "ALL").toUpperCase();
  const status = (searchParams.get("status") || "ALL").toUpperCase();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));

  const userId = session.id;

  try {
    const items: UnifiedPublishedItem[] = [];

    // Helper status filter
    const matchStatus = (itemStatus: string) => {
      if (status === "ALL") return true;
      return itemStatus.toUpperCase() === status;
    };

    const statusMap: Record<string, string> = {
      APPROVED: "已发布",
      PENDING: "审核中",
      REJECTED: "已驳回",
      OFFLINE: "已下架",
      DRAFT: "草稿",
      RESOLVED: "已解决",
      SOLD: "已成交",
    };

    // 1. 招聘 Job
    if (channel === "ALL" || channel === "JOB") {
      const jobs = await prisma.job.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      jobs.forEach((j) => {
        if (matchStatus(j.status)) {
          items.push({
            id: j.id,
            title: j.title,
            channel: "JOB",
            channelLabel: "求职招聘",
            status: j.status,
            statusLabel: statusMap[j.status] || j.status,
            isTop: j.isTop,
            createdAt: j.createdAt.toISOString(),
            link: `/jobs/${j.id}`,
          });
        }
      });
    }

    // 2. 房产 House
    if (channel === "ALL" || channel === "HOUSE") {
      const houses = await prisma.house.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      houses.forEach((h) => {
        if (matchStatus(h.status)) {
          items.push({
            id: h.id,
            title: h.title,
            channel: "HOUSE",
            channelLabel: "房产楼市",
            status: h.status,
            statusLabel: statusMap[h.status] || h.status,
            isTop: h.isTop,
            createdAt: h.createdAt.toISOString(),
            link: `/house/${h.id}`,
          });
        }
      });
    }

    // 3. 园区厂房 Industrial
    if (channel === "ALL" || channel === "INDUSTRIAL") {
      const industrials = await prisma.industrialProperty.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      industrials.forEach((i) => {
        // IndustrialProperty uses publishedAt or isTop
        const iStatus = "APPROVED"; // Default active
        if (matchStatus(iStatus)) {
          items.push({
            id: i.id,
            title: i.title,
            channel: "INDUSTRIAL",
            channelLabel: "园区招商",
            status: iStatus,
            statusLabel: "展示中",
            viewsCount: i.viewCount,
            isTop: i.isTop,
            createdAt: i.createdAt.toISOString(),
            link: `/industrial/${i.id}`,
          });
        }
      });
    }

    // 4. 便民信息 Listing
    if (channel === "ALL" || channel === "LISTING") {
      const listings = await prisma.listing.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      listings.forEach((l) => {
        if (matchStatus(l.status)) {
          items.push({
            id: l.id,
            title: l.title,
            channel: "LISTING",
            channelLabel: "便民信息",
            status: l.status,
            statusLabel: statusMap[l.status] || l.status,
            isTop: l.isTop,
            createdAt: l.createdAt.toISOString(),
            link: `/info/${l.id}`,
          });
        }
      });
    }

    // 5. 社区帖子 Post
    if (channel === "ALL" || channel === "POST") {
      const posts = await prisma.post.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      posts.forEach((p) => {
        if (matchStatus(p.status)) {
          items.push({
            id: p.id,
            title: p.title,
            channel: "POST",
            channelLabel: "社区论坛",
            status: p.status,
            statusLabel: statusMap[p.status] || p.status,
            viewsCount: p.viewsCount,
            isTop: p.isTop,
            createdAt: p.createdAt.toISOString(),
            link: `/community/${p.id}`,
          });
        }
      });
    }

    // 6. 师傅服务商品 ServiceProduct
    if (channel === "ALL" || channel === "SERVICE") {
      const provider = await prisma.serviceProvider.findUnique({
        where: { userId },
      });
      if (provider) {
        const products = await prisma.serviceProduct.findMany({
          where: { providerId: provider.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        });
        products.forEach((sp) => {
          const spStatus = sp.status === "ONLINE" ? "APPROVED" : "OFFLINE";
          if (matchStatus(spStatus)) {
            items.push({
              id: sp.id,
              title: sp.title,
              channel: "SERVICE",
              channelLabel: "服务项目",
              status: spStatus,
              statusLabel: sp.status === "ONLINE" ? "已上架" : "已下架",
              viewsCount: sp.salesCount,
              createdAt: sp.createdAt.toISOString(),
              link: `/services/${sp.id}`,
            });
          }
        });
      }
    }

    // 全局按创建时间倒序排序
    items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = items.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      success: true,
      total,
      page,
      pageSize,
      items: paginatedItems,
    });
  } catch (err: any) {
    console.error("[All-Published] Error:", err);
    return NextResponse.json(
      { error: err.message || "拉取聚合发布列表失败" },
      { status: 500 }
    );
  }
}
