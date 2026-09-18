import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.mallCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            products: { where: { status: "ON_SALE" } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (err: any) {
    console.error("GET /api/mall/categories error:", err);
    return NextResponse.json({ error: "获取分类列表失败" }, { status: 500 });
  }
}
