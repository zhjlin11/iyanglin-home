import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权访问" }, { status: 403 });

    const categories = await prisma.mallCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (err: any) {
    return NextResponse.json({ error: "获取分类失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权操作" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const { name, icon, sortOrder, restrictedSale, status } = body;

    if (!name) return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });

    const category = await prisma.mallCategory.create({
      data: {
        name: String(name).trim(),
        icon: icon ? String(icon).trim() : "📦",
        sortOrder: parseInt(sortOrder || 0, 10),
        restrictedSale: Boolean(restrictedSale),
        status: status || "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "创建分类失败" }, { status: 500 });
  }
}
