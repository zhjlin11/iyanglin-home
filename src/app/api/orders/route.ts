import { NextResponse } from "next/server";
import { hasRole, requireAuth, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const orderStatuses = ["pending_payment", "paid", "cancelled", "refunded"] as const;
type OrderStatusInput = (typeof orderStatuses)[number];

const statusValue = (status: OrderStatusInput) => status.toUpperCase() as "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "REFUNDED";

export async function GET(request: Request) {
  if (!requireAuth(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!hasRole(request, ["admin"])) return NextResponse.json({ error: "只有管理员可以查看订单" }, { status: 403 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const order = await prisma.billingOrder.findUnique({ where: { id }, include: { plan: true } });
    return order ? NextResponse.json({ order }) : NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  const status = url.searchParams.get("status");
  const orders = await prisma.billingOrder.findMany({
    where: status && orderStatuses.includes(status as OrderStatusInput) ? { status: statusValue(status as OrderStatusInput) } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { id: true, username: true, nickname: true, phone: true } } },
  });

  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  const body = await request.json().catch(() => null);

  if (!body || !body.targetKind || !body.targetId) {
    return NextResponse.json({ error: "缺少 targetKind 或 targetId 参数" }, { status: 400 });
  }

  const orderNo = `YL_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const amountCents = parseInt(body.amountCents, 10) || 200; // 默认200分 (2元)
  const planName = body.planName || "相亲嘉宾风采写真解锁";

  const order = await prisma.billingOrder.create({
    data: {
      orderNo,
      planName,
      targetKind: body.targetKind,
      targetId: body.targetId,
      targetTitle: body.targetTitle || "相亲嘉宾写真",
      amountCents,
      status: "PENDING_PAYMENT",
      userId: session?.id || undefined,
    },
  });

  return NextResponse.json({
    orderNo: order.orderNo,
    id: order.id,
    amountCents: order.amountCents,
    amountYuan: (order.amountCents / 100).toFixed(2),
    planName: order.planName,
    status: order.status,
  });
}

export async function PATCH(request: Request) {
  if (!requireAuth(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!hasRole(request, ["admin"])) return NextResponse.json({ error: "只有管理员可以更新订单" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body?.id || !orderStatuses.includes(body.status)) {
    return NextResponse.json({ error: "订单参数无效" }, { status: 400 });
  }

  const order = await prisma.billingOrder.update({
    where: { id: body.id },
    data: { status: statusValue(body.status) },
  });

  await prisma.operationLog.create({
    data: {
      action: "update_order_status",
      targetId: order.id,
      metadata: { orderNo: order.orderNo, status: body.status, targetTitle: order.targetTitle },
    },
  });

  return NextResponse.json({ order });
}
