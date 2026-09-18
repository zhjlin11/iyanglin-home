import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/services/products/[id] — 服务详情
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.serviceProduct.findUnique({
      where: { id },
      include: {
        provider: {
          include: {
            coupons: { where: { enabled: true } },
            reviews: {
              where: { status: "APPROVED" },
              take: 5,
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "服务商品不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (err: any) {
    console.error("GET /api/services/products/[id] error:", err);
    return NextResponse.json({ error: "获取服务详情失败" }, { status: 500 });
  }
}

/**
 * PATCH /api/services/products/[id] — 更新/上下架服务商品
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.serviceProduct.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!product) {
      return NextResponse.json({ error: "服务商品不存在" }, { status: 404 });
    }

    // 鉴权：只有商品归属的服务商或超级管理员可修改
    if (product.provider.userId !== session.id && session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权修改该服务商品" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.category !== undefined) updateData.category = String(body.category).trim();
    if (body.description !== undefined) updateData.description = String(body.description).trim();
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.pricingType !== undefined) updateData.pricingType = body.pricingType;
    if (body.priceCents !== undefined) updateData.priceCents = parseInt(body.priceCents, 10);
    if (body.minPriceCents !== undefined) updateData.minPriceCents = body.minPriceCents ? parseInt(body.minPriceCents, 10) : null;
    if (body.maxPriceCents !== undefined) updateData.maxPriceCents = body.maxPriceCents ? parseInt(body.maxPriceCents, 10) : null;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.serviceDuration !== undefined) updateData.serviceDuration = body.serviceDuration;
    if (body.serviceAreas !== undefined) updateData.serviceAreas = body.serviceAreas;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.serviceProduct.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("PATCH /api/services/products/[id] error:", err);
    return NextResponse.json({ error: err.message || "更新服务商品失败" }, { status: 500 });
  }
}
