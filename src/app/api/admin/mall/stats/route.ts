import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      todayPaidOrders,
      pendingPickingCount,
      pendingDeliveryCount,
      readyPickupCount,
      pendingAfterSaleCount,
      allProducts,
      todayRevenueSum,
    ] = await Promise.all([
      prisma.mallOrder.count({
        where: {
          paidAt: { gte: startOfToday },
          status: { notIn: ["CANCELLED", "WAITING_PAYMENT"] },
        },
      }),
      prisma.mallOrder.count({
        where: { status: "PAID" },
      }),
      prisma.mallOrder.count({
        where: { status: { in: ["READY", "DELIVERING"] } },
      }),
      prisma.mallOrder.count({
        where: { status: "READY_FOR_PICKUP" },
      }),
      prisma.mallAfterSale.count({
        where: { status: "PENDING" },
      }),
      prisma.product.findMany({
        where: { status: { not: "DRAFT" } },
        select: { id: true, name: true, stock: true, lowStockThreshold: true, status: true, priceCents: true },
      }),
      prisma.mallOrder.aggregate({
        where: {
          paidAt: { gte: startOfToday },
          status: { notIn: ["CANCELLED", "WAITING_PAYMENT"] },
        },
        _sum: { payAmountCents: true },
      }),
    ]);

    const lowStockProducts = allProducts.filter(
      (p) => p.stock <= p.lowStockThreshold || p.status === "SOLD_OUT"
    );

    return NextResponse.json({
      success: true,
      data: {
        todayOrders: todayPaidOrders,
        todayRevenueCents: todayRevenueSum._sum.payAmountCents || 0,
        pendingPicking: pendingPickingCount,
        pendingDelivery: pendingDeliveryCount,
        readyPickup: readyPickupCount,
        pendingAfterSale: pendingAfterSaleCount,
        lowStockCount: lowStockProducts.length,
        lowStockList: lowStockProducts.slice(0, 10),
      },
    });
  } catch (err: any) {
    console.error("GET /api/admin/mall/stats error:", err);
    return NextResponse.json({ error: "获取统计数据失败" }, { status: 500 });
  }
}
