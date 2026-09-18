import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权操作" }, { status: 403 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = String(body.name).trim();
    if (body.icon !== undefined) updateData.icon = String(body.icon).trim();
    if (body.sortOrder !== undefined) updateData.sortOrder = parseInt(body.sortOrder, 10);
    if (body.restrictedSale !== undefined) updateData.restrictedSale = Boolean(body.restrictedSale);
    if (body.status !== undefined) updateData.status = body.status;

    const category = await prisma.mallCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: category });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "修改分类失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权操作" }, { status: 403 });

    const { id } = await params;
    const prodCount = await prisma.product.count({ where: { categoryId: id } });
    if (prodCount > 0) {
      return NextResponse.json({ error: `该分类下已有 ${prodCount} 款商品，无法直接删除，请先调整商品分类` }, { status: 400 });
    }

    await prisma.mallCategory.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "分类删除成功" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "删除分类失败" }, { status: 500 });
  }
}
