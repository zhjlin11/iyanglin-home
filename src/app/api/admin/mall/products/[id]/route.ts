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
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle ? String(body.subtitle).trim() : null;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.brand !== undefined) updateData.brand = body.brand ? String(body.brand).trim() : null;
    if (body.barcode !== undefined) updateData.barcode = body.barcode ? String(body.barcode).trim() : null;
    if (body.unit !== undefined) updateData.unit = String(body.unit).trim();
    if (body.specification !== undefined) updateData.specification = body.specification ? String(body.specification).trim() : null;
    if (body.priceCents !== undefined) updateData.priceCents = Math.max(0, parseInt(body.priceCents, 10));
    if (body.originalPriceCents !== undefined) updateData.originalPriceCents = body.originalPriceCents ? Math.max(0, parseInt(body.originalPriceCents, 10)) : null;
    if (body.costCents !== undefined) updateData.costCents = body.costCents ? Math.max(0, parseInt(body.costCents, 10)) : null;
    if (body.stock !== undefined) {
      const s = Math.max(0, parseInt(body.stock, 10));
      updateData.stock = s;
      if (s === 0 && (!body.status || body.status === "ON_SALE")) {
        updateData.status = "SOLD_OUT";
      }
    }
    if (body.lowStockThreshold !== undefined) updateData.lowStockThreshold = Math.max(1, parseInt(body.lowStockThreshold, 10));
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isFeatured !== undefined) updateData.isFeatured = Boolean(body.isFeatured);
    if (body.isHot !== undefined) updateData.isHot = Boolean(body.isHot);
    if (body.isNew !== undefined) updateData.isNew = Boolean(body.isNew);
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.images !== undefined) updateData.images = Array.isArray(body.images) ? body.images : [body.coverImage];
    if (body.description !== undefined) updateData.description = body.description;
    if (body.restrictedSale !== undefined) updateData.restrictedSale = Boolean(body.restrictedSale);

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("PUT /api/admin/mall/products/[id] error:", err);
    return NextResponse.json({ error: err.message || "更新商品失败" }, { status: 500 });
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

    // 检查是否有关联订单
    const orderCount = await prisma.mallOrderItem.count({ where: { productId: id } });
    if (orderCount > 0) {
      // 物理删除受保护，改为下架归档
      await prisma.product.update({
        where: { id },
        data: { status: "OFF_SALE" },
      });
      return NextResponse.json({
        success: true,
        message: `该商品已有 ${orderCount} 笔历史订单记录，为保障财务数据完整性已自动转为【已下架】状态`,
      });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "商品已彻底删除" });
  } catch (err: any) {
    console.error("DELETE /api/admin/mall/products/[id] error:", err);
    return NextResponse.json({ error: err.message || "删除商品失败" }, { status: 500 });
  }
}
