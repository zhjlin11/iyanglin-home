import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    let preferredCategories: string[] = [];
    let preferredArea: string | null = null;

    if (session?.id) {
      const pref = await prisma.userPreference.findUnique({
        where: { userId: session.id },
      });
      if (pref) {
        preferredCategories = pref.preferredCategories;
        preferredArea = pref.preferredArea;
      }
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "6", 10);

    const whereClause: any = {
      status: "ONLINE",
    };

    if (preferredCategories.length > 0) {
      whereClause.category = { in: preferredCategories };
    }

    let products = await prisma.serviceProduct.findMany({
      where: whereClause,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            avatar: true,
            ratingAvg: true,
            ratingCount: true,
            operatingStatus: true,
            serviceAreas: true,
          },
        },
      },
      orderBy: [{ salesCount: "desc" }, { sortOrder: "asc" }],
      take: limit,
    });

    // 如果偏好分类下的商品不足，补充高销量热销商品
    if (products.length < limit) {
      const existingIds = products.map((p) => p.id);
      const fallbackProducts = await prisma.serviceProduct.findMany({
        where: {
          status: "ONLINE",
          id: { notIn: existingIds },
        },
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              avatar: true,
              ratingAvg: true,
              ratingCount: true,
              operatingStatus: true,
              serviceAreas: true,
            },
          },
        },
        orderBy: [{ salesCount: "desc" }, { sortOrder: "asc" }],
        take: limit - products.length,
      });
      products = [...products, ...fallbackProducts];
    }

    const data = products.map((p) => {
      let badge = "本地热选";
      if (preferredCategories.includes(p.category)) {
        badge = "偏好推荐";
      } else if (p.salesCount >= 10) {
        badge = "高频复购";
      } else if (p.provider?.ratingAvg >= 4.8) {
        badge = "金牌口碑";
      }

      return {
        id: p.id,
        title: p.title,
        category: p.category,
        pricingType: p.pricingType,
        priceCents: p.priceCents,
        priceYuan: (p.priceCents / 100).toFixed(2),
        unit: p.unit,
        coverImage: p.coverImage || (p.images?.length > 0 ? p.images[0] : null),
        salesCount: p.salesCount,
        recommendBadge: badge,
        provider: p.provider,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("GET /api/services/recommended error:", err);
    return NextResponse.json({ error: err.message || "获取推荐服务失败" }, { status: 500 });
  }
}
