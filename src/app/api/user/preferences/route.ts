import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 1. 获取用户偏好设置
    const preference = await prisma.userPreference.findUnique({
      where: { userId: session.id },
    });

    // 2. 聚合生成用户「常用服务」列表 (根据真实历史订单)
    const completedOrders = await prisma.serviceOrder.findMany({
      where: {
        userId: session.id,
        status: { in: ["COMPLETED", "CONFIRMED", "PAID", "IN_SERVICE"] },
        productId: { not: null },
      },
      include: {
        product: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                avatar: true,
                serviceCategory: true,
                operatingStatus: true,
                ratingAvg: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 按 productId 分组统计
    const productMap = new Map<string, {
      product: any;
      orderCount: number;
      latestOrderId: string;
      latestOrderNo: string;
      latestBookedAt: Date;
      latestPayAmountCents: number;
      lastAddress: {
        contactName: string;
        contactPhone: string;
        serviceArea: string;
        addressDetail: string;
      };
    }>();

    for (const o of completedOrders) {
      if (!o.product || !o.productId) continue;
      let p = productMap.get(o.productId);
      if (!p) {
        p = {
          product: o.product,
          orderCount: 0,
          latestOrderId: o.id,
          latestOrderNo: o.orderNo,
          latestBookedAt: o.createdAt,
          latestPayAmountCents: o.payAmountCents,
          lastAddress: {
            contactName: o.contactName,
            contactPhone: o.contactPhone,
            serviceArea: o.serviceArea,
            addressDetail: o.addressDetail,
          },
        };
        productMap.set(o.productId, p);
      }
      p.orderCount += 1;
    }

    const commonServices = Array.from(productMap.values()).map((item) => ({
      productId: item.product.id,
      title: item.product.title,
      category: item.product.category,
      priceCents: item.product.priceCents,
      unit: item.product.unit,
      coverImage: item.product.coverImage || (item.product.images?.length > 0 ? item.product.images[0] : null),
      provider: item.product.provider,
      orderCount: item.orderCount,
      latestOrderId: item.latestOrderId,
      latestOrderNo: item.latestOrderNo,
      latestBookedAt: item.latestBookedAt,
      latestPayAmountYuan: (item.latestPayAmountCents / 100).toFixed(2),
      lastAddress: item.lastAddress,
      reorderUrl: `/services/${item.product.id}/checkout?reorderFrom=${item.latestOrderId}`,
    }));

    // 按预约频次从高到低排序
    commonServices.sort((a, b) => b.orderCount - a.orderCount);

    return NextResponse.json({
      success: true,
      data: {
        preference: preference || {
          preferredCategories: [],
          preferredArea: "杨林大学城",
          notifyOnFollowNewProduct: true,
          notifyOnFollowCampaign: true,
          notifyOnCouponExpiring: true,
        },
        commonServices,
      },
    });
  } catch (err: any) {
    console.error("GET /api/user/preferences error:", err);
    return NextResponse.json({ error: err.message || "获取用户偏好失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const {
      preferredCategories = [],
      preferredArea,
      notifyOnFollowNewProduct,
      notifyOnFollowCampaign,
      notifyOnCouponExpiring,
    } = body;

    const preference = await prisma.userPreference.upsert({
      where: { userId: session.id },
      update: {
        preferredCategories: Array.isArray(preferredCategories) ? preferredCategories : [],
        preferredArea: preferredArea !== undefined ? String(preferredArea).trim() : undefined,
        notifyOnFollowNewProduct: typeof notifyOnFollowNewProduct === "boolean" ? notifyOnFollowNewProduct : undefined,
        notifyOnFollowCampaign: typeof notifyOnFollowCampaign === "boolean" ? notifyOnFollowCampaign : undefined,
        notifyOnCouponExpiring: typeof notifyOnCouponExpiring === "boolean" ? notifyOnCouponExpiring : undefined,
      },
      create: {
        userId: session.id,
        preferredCategories: Array.isArray(preferredCategories) ? preferredCategories : [],
        preferredArea: preferredArea ? String(preferredArea).trim() : "杨林大学城",
        notifyOnFollowNewProduct: notifyOnFollowNewProduct ?? true,
        notifyOnFollowCampaign: notifyOnFollowCampaign ?? true,
        notifyOnCouponExpiring: notifyOnCouponExpiring ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "偏好设置已更新！",
      data: preference,
    });
  } catch (err: any) {
    console.error("POST /api/user/preferences error:", err);
    return NextResponse.json({ error: err.message || "更新偏好失败" }, { status: 500 });
  }
}
