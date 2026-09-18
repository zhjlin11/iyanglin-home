import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: "商品不存在或已下架" }, { status: 404 });
    }

    // 关联同分类推荐
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: "ON_SALE",
      },
      take: 4,
    });

    return NextResponse.json({
      success: true,
      data: product,
      related,
    });
  } catch (err: any) {
    console.error("GET /api/mall/products/[id] error:", err);
    return NextResponse.json({ error: "获取商品详情失败" }, { status: 500 });
  }
}
