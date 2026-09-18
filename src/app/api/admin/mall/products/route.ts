import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const status = searchParams.get("status") || undefined;
    const q = searchParams.get("q")?.trim() || undefined;
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      include: { category: true },
    });

    const filtered = lowStockOnly
      ? products.filter((p) => p.stock <= p.lowStockThreshold || p.status === "SOLD_OUT")
      : products;

    return NextResponse.json({ success: true, data: filtered });
  } catch (err: any) {
    console.error("GET /api/admin/mall/products error:", err);
    return NextResponse.json({ error: "获取商品管理列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      name,
      subtitle,
      categoryId,
      brand,
      barcode,
      unit,
      specification,
      priceCents,
      originalPriceCents,
      costCents,
      stock,
      lowStockThreshold,
      status,
      isFeatured,
      isHot,
      isNew,
      coverImage,
      images,
      description,
      restrictedSale,
    } = body;

    if (!name || !categoryId || priceCents === undefined) {
      return NextResponse.json({ error: "请填写商品名称、分类与售价" }, { status: 400 });
    }

    const parsedPrice = Math.max(0, parseInt(priceCents, 10));
    const parsedStock = Math.max(0, parseInt(stock ?? 0, 10));

    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        subtitle: subtitle ? String(subtitle).trim() : null,
        categoryId,
        brand: brand ? String(brand).trim() : null,
        barcode: barcode ? String(barcode).trim() : null,
        unit: unit ? String(unit).trim() : "件",
        specification: specification ? String(specification).trim() : null,
        priceCents: parsedPrice,
        originalPriceCents: originalPriceCents ? Math.max(0, parseInt(originalPriceCents, 10)) : null,
        costCents: costCents ? Math.max(0, parseInt(costCents, 10)) : null,
        stock: parsedStock,
        lowStockThreshold: lowStockThreshold ? Math.max(1, parseInt(lowStockThreshold, 10)) : 5,
        status: status || (parsedStock > 0 ? "ON_SALE" : "SOLD_OUT"),
        isFeatured: Boolean(isFeatured),
        isHot: Boolean(isHot),
        isNew: Boolean(isNew),
        isSelfOperated: true,
        coverImage: coverImage ? String(coverImage).trim() : null,
        images: Array.isArray(images) ? images : coverImage ? [coverImage] : [],
        description: description ? String(description).trim() : null,
        restrictedSale: Boolean(restrictedSale),
      },
      include: { category: true },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (err: any) {
    console.error("POST /api/admin/mall/products error:", err);
    return NextResponse.json({ error: err.message || "创建商品失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权操作" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const { action, ids, targetStatus } = body;

    // 批量上下架操作
    if (action === "BATCH_STATUS" && Array.isArray(ids) && targetStatus) {
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { status: targetStatus },
      });
      return NextResponse.json({ success: true, message: `成功更新 ${ids.length} 件商品状态为 ${targetStatus}` });
    }

    return NextResponse.json({ error: "不支持的批量操作" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "批量操作失败" }, { status: 500 });
  }
}
