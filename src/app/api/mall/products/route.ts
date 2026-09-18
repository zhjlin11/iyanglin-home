import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const q = searchParams.get("q")?.trim() || undefined;
    const sort = searchParams.get("sort") || "default"; // default | hot | new | price_asc | price_desc
    const tag = searchParams.get("tag"); // featured | hot | new
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const where: any = {
      status: "ON_SALE",
    };

    if (categoryId) where.categoryId = categoryId;
    if (tag === "featured") where.isFeatured = true;
    if (tag === "hot") where.isHot = true;
    if (tag === "new") where.isNew = true;

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { subtitle: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    let orderBy: any = [{ isFeatured: "desc" }, { createdAt: "desc" }];
    if (sort === "hot") orderBy = [{ salesCount: "desc" }, { createdAt: "desc" }];
    else if (sort === "new") orderBy = [{ createdAt: "desc" }];
    else if (sort === "price_asc") orderBy = [{ priceCents: "asc" }];
    else if (sort === "price_desc") orderBy = [{ priceCents: "desc" }];

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: { select: { id: true, name: true, icon: true } } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    console.error("GET /api/mall/products error:", err);
    return NextResponse.json({ error: "获取商品列表失败" }, { status: 500 });
  }
}
