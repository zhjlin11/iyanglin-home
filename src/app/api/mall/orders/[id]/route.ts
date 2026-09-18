import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transitionMallOrderStatus } from "@/lib/mall/mall-order-machine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.mallOrder.findUnique({
      where: { id },
      include: {
        items: true,
        courier: { select: { id: true, name: true, phone: true } },
        logs: { orderBy: { createdAt: "asc" } },
        afterSale: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 权限判断：普通用户只能查看自己的订单
    if (order.userId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权查看该订单" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (err: any) {
    console.error("GET /api/mall/orders/[id] error:", err);
    return NextResponse.json({ error: "获取订单详情失败" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action; // CANCEL | CONFIRM_RECEIVED

    const order = await prisma.mallOrder.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

    if (order.userId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权操作该订单" }, { status: 403 });
    }

    if (action === "CANCEL") {
      if (order.status !== "WAITING_PAYMENT") {
        return NextResponse.json({ error: "仅未支付订单可直接取消，已支付订单请申请售后退款" }, { status: 400 });
      }
      await transitionMallOrderStatus({
        orderId: id,
        targetStatus: "CANCELLED",
        operator: "USER",
        operatorName: session.username,
        notes: body.reason || "用户主动取消未支付订单",
      });
      return NextResponse.json({ success: true, message: "订单已成功取消" });
    } else if (action === "CONFIRM_RECEIVED") {
      if (!["DELIVERED", "DELIVERING"].includes(order.status)) {
        return NextResponse.json({ error: "订单未处于配送/送达状态，无法确认收货" }, { status: 400 });
      }
      await transitionMallOrderStatus({
        orderId: id,
        targetStatus: "COMPLETED",
        operator: "USER",
        operatorName: session.username,
        notes: "用户在个人端主动点击确认收货",
      });
      return NextResponse.json({ success: true, message: "确认收货成功，感谢您的惠顾！" });
    }

    return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
  } catch (err: any) {
    console.error("PUT /api/mall/orders/[id] error:", err);
    return NextResponse.json({ error: err.message || "操作失败" }, { status: 500 });
  }
}
