import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { executeBillingOrderRefund } from "@/lib/wechat-refund";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  try {
    const orders = await prisma.billingOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { id: true, username: true, nickname: true, phone: true } } },
    });

    const counts = {
      total: orders.length,
      paid: orders.filter((o) => o.status === "PAID").length,
      pending: orders.filter((o) => o.status === "PENDING_PAYMENT").length,
      refunded: orders.filter((o) => o.status === "REFUNDED").length,
    };

    // 批量加载微信交易号与退款凭证
    const orderIds = orders.map((o) => o.id);
    const payLogs = await prisma.operationLog.findMany({
      where: {
        targetId: { in: orderIds },
        action: { in: ["WECHAT_PAY_SUCCESS", "ADMIN_REFUND_ORDER"] },
      },
      orderBy: { createdAt: "desc" },
    });
    const logMap = new Map<string, any>();
    for (const log of payLogs) {
      if (!logMap.has(log.targetId!)) {
        logMap.set(log.targetId!, log.metadata);
      }
    }

    const enrichedOrders = orders.map((o) => {
      const meta = logMap.get(o.id) || {};
      return {
        ...o,
        transactionId: meta.transactionId || null,
        refundNo: meta.refundNo || null,
        wechatRefundId: meta.wechatRefundId || null,
        refundReason: meta.reason || null,
      };
    });

    return NextResponse.json({ counts, orders: enrichedOrders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "获取订单失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession(request);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "无权修改订单" }, { status: 403 });
  }

  try {
    const { orderId, action, note, reason } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "缺少订单 ID" }, { status: 400 });
    }

    const order = await prisma.billingOrder.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    if (action === "CONFIRM_PAID") {
      const updatedOrder = await prisma.billingOrder.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });

      // Apply Top-pin promotion to target item
      const topUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days top pin
      const targetId = order.targetId;
      const targetKind = order.targetKind.toLowerCase();

      if (targetKind === "house") await prisma.house.update({ where: { id: targetId }, data: { isTop: true, topUntil } }).catch(() => {});
      else if (targetKind === "listing") await prisma.listing.update({ where: { id: targetId }, data: { isTop: true, topUntil } }).catch(() => {});
      else if (targetKind === "job") await prisma.job.update({ where: { id: targetId }, data: { isTop: true, topUntil } }).catch(() => {});
      else if (targetKind === "shop") await prisma.shop.update({ where: { id: targetId }, data: { isTop: true, topUntil } }).catch(() => {});
      else if (targetKind === "event") await prisma.event.update({ where: { id: targetId }, data: { isTop: true, topUntil } }).catch(() => {});
      else if (targetKind === "post") await prisma.post.update({ where: { id: targetId }, data: { isTop: true, topUntil } }).catch(() => {});

      // Log Operation
      await prisma.operationLog.create({
        data: {
          userId: session.id,
          action: "ADMIN_CONFIRM_ORDER_PAID",
          targetId: orderId,
          metadata: { orderNo: order.orderNo, note: note || "管理员人工确认入账", operator: session.username },
        },
      });

      return NextResponse.json({ success: true, message: "订单已确认入账，内容置顶权益已实时生效！", order: updatedOrder });
    }

    if (action === "REFUND") {
      const refundResult = await executeBillingOrderRefund({
        orderId,
        reason: reason || note || "管理员后台发起原路退款",
        operatorId: session.id,
        operatorUsername: session.username,
      });

      return NextResponse.json({
        success: true,
        message: refundResult.automatedWechatRefund
          ? `已成功调用微信支付接口原路退款 ¥${(order.amountCents / 100).toFixed(2)}，权益已冲正回收！`
          : `退款已核销处理（订单已变更为已退款，权益已成功回收）。微信商户退款单号: ${refundResult.wechatRefundId}`,
        refundResult,
      });
    }

    if (action === "CANCEL") {
      const cancelledOrder = await prisma.billingOrder.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json({ success: true, message: "订单已取消", order: cancelledOrder });
    }

    return NextResponse.json({ error: "未知操作类型" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "修改订单状态失败" }, { status: 500 });
  }
}
