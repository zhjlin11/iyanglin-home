import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/services/products — 查询标准化服务商品列表
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const area = searchParams.get("area");
    const providerId = searchParams.get("providerId");
    const pricingType = searchParams.get("pricingType");
    const keyword = searchParams.get("q");
    const sort = searchParams.get("sort") || "recommend"; // recommend | price_asc | price_desc | sales

    const where: any = {
      status: "ONLINE",
    };

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (providerId) {
      where.providerId = providerId;
    }

    if (pricingType) {
      where.pricingType = pricingType;
    }

    if (area && area !== "全区") {
      where.OR = [
        { serviceAreas: { has: area } },
        { serviceAreas: { has: "杨林全区" } },
        { serviceAreas: { isEmpty: true } },
      ];
    }

    if (keyword) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: keyword, mode: "insensitive" } },
            { description: { contains: keyword, mode: "insensitive" } },
            { category: { contains: keyword, mode: "insensitive" } },
          ],
        },
      ];
    }

    let orderBy: any = [{ sortOrder: "desc" }, { salesCount: "desc" }, { createdAt: "desc" }];
    if (sort === "price_asc") {
      orderBy = [{ priceCents: "asc" }];
    } else if (sort === "price_desc") {
      orderBy = [{ priceCents: "desc" }];
    } else if (sort === "sales") {
      orderBy = [{ salesCount: "desc" }];
    }

    const products = await prisma.serviceProduct.findMany({
      where,
      orderBy,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            avatar: true,
            serviceCategory: true,
            verificationType: true,
            verificationStatus: true,
            isMember: true,
            ratingAvg: true,
            ratingCount: true,
            completedOrders: true,
            serviceAreas: true,
            operatingStatus: true,
          },
        },
      },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: products,
      total: products.length,
    });
  } catch (err: any) {
    console.error("GET /api/services/products error:", err);
    return NextResponse.json({ error: "获取服务列表失败" }, { status: 500 });
  }
}

/**
 * POST /api/services/products — 服务商发布/新增标准化服务商品
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 查询当前登录用户的服务商身份
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
    });

    if (!provider || provider.verificationStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "只有通过审核的认证服务商才可发布标准化服务商品" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      category,
      description,
      coverImage,
      images,
      pricingType,
      priceCents,
      minPriceCents,
      maxPriceCents,
      unit,
      serviceDuration,
      serviceAreas,
      bookingRequired,
    } = body;

    if (!title || !category || !priceCents || priceCents <= 0) {
      return NextResponse.json({ error: "请完整填写服务标题、分类与价格" }, { status: 400 });
    }

    const product = await prisma.serviceProduct.create({
      data: {
        providerId: provider.id,
        title: String(title).trim(),
        category: String(category).trim(),
        description: String(description || "").trim(),
        coverImage: coverImage || null,
        images: Array.isArray(images) ? images : [],
        pricingType: pricingType || "FIXED",
        priceCents: parseInt(priceCents, 10),
        minPriceCents: minPriceCents ? parseInt(minPriceCents, 10) : null,
        maxPriceCents: maxPriceCents ? parseInt(maxPriceCents, 10) : null,
        unit: unit || "次",
        serviceDuration: serviceDuration || "约1小时",
        serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : provider.serviceAreas,
        bookingRequired: bookingRequired !== false,
        status: "ONLINE",
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (err: any) {
    console.error("POST /api/services/products error:", err);
    return NextResponse.json({ error: err.message || "创建服务商品失败" }, { status: 500 });
  }
}
