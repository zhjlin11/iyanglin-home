import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transitionMallOrderStatus } from "@/lib/mall/mall-order-machine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const courierIdMatch = cookieHeader.match(/courier_token=([^;]+)/);
    const courierId = courierIdMatch ? courierIdMatch[1] : null;

    if (!courierId) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const courier = await prisma.courier.findUnique({ where: { id: courierId } });
    if (!courier) return NextResponse.json({ error: "身份无效" }, { status: 401 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { action, notes } = body; // START_DELIVERY | DELIVERED

    const order = await prisma.mallOrder.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

    if (order.assignedCourierId !== courierId) {
      return NextResponse.json({ error: "该订单未分配给您，无权操作" }, { status: 403 });
    }

    if (action === "START_DELIVERY") {
      const updated = await transitionMallOrderStatus({
        orderId: id,
        targetStatus: "DELIVERING",
        operator: "COURIER",
        operatorName: courier.name,
        notes: notes || "配送员已取货出发，正在前往送达地点",
      });
      return NextResponse.json({ success: true, message: "已标记为配送中", data: updated });
    } else if (action === "DELIVERED") {
      const updated = await transitionMallOrderStatus({
        orderId: id,
        targetStatus: "DELIVERED",
        operator: "COURIER",
        operatorName: courier.name,
        notes: notes || "配送员已送达客户指定地点",
      });
      return NextResponse.json({ success: true, message: "已标记为送达完成", data: updated });
    }

    return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "更新状态失败" }, { status: 500 });
  }
}
