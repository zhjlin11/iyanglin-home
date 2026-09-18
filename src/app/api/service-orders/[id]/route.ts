import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskPhoneNumber } from "@/lib/service-matching";

/**
 * GET /api/service-orders/[id] — 订单详情（严格权限与门牌隐私保护）
 */
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
    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        provider: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
        user: {
          select: { id: true, nickname: true, username: true, avatar: true },
        },
        product: true,
        review: true,
        refunds: { orderBy: { createdAt: "desc" } },
        afterSales: { orderBy: { createdAt: "desc" } },
        settlement: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 权限校验：只能是下单客户、接单师傅或管理员
    const isCustomer = order.userId === session.id;
    const isProvider = order.provider.userId === session.id;
    const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";

    if (!isCustomer && !isProvider && !isAdmin) {
      return NextResponse.json({ error: "无权访问此订单" }, { status: 403 });
    }

    // 隐私处理：若为服务商查看，且订单处于未接单阶段 (PAID 或 PENDING_PAYMENT)，脱敏详细门牌号
    const sanitizedOrder = { ...order };
    if (isProvider && (order.status === "PENDING_PAYMENT" || order.status === "PAID")) {
      sanitizedOrder.addressDetail = "【接单后系统自动解密详细门牌】";
      sanitizedOrder.contactPhone = maskPhoneNumber(order.contactPhone);
    }

    return NextResponse.json({
      success: true,
      data: sanitizedOrder,
      meta: {
        isCustomer,
        isProvider,
        isAdmin,
      },
    });
  } catch (err: any) {
    console.error("GET /api/service-orders/[id] error:", err);
    return NextResponse.json({ error: "获取订单详情失败" }, { status: 500 });
  }
}
