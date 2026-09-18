import { prisma } from "@/lib/prisma";

export const ORDER_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAID: "PAID",
  ACCEPTED: "ACCEPTED",
  IN_SERVICE: "IN_SERVICE",
  WAITING_CONFIRM: "WAITING_CONFIRM",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REFUNDING: "REFUNDING",
  REFUNDED: "REFUNDED",
  DISPUTED: "DISPUTED",
  CLOSED: "CLOSED",
} as const;

export const ORDER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED", "CLOSED"],
  PAID: ["ACCEPTED", "REFUNDING", "CANCELLED"],
  ACCEPTED: ["IN_SERVICE", "REFUNDING", "DISPUTED"],
  IN_SERVICE: ["WAITING_CONFIRM", "COMPLETED", "DISPUTED"],
  WAITING_CONFIRM: ["COMPLETED", "CONFIRMED", "DISPUTED"],
  COMPLETED: ["CONFIRMED", "DISPUTED", "CLOSED"],
  CONFIRMED: ["DISPUTED", "CLOSED"],
  DISPUTED: ["IN_SERVICE", "WAITING_CONFIRM", "COMPLETED", "REFUNDING", "REFUNDED", "CLOSED"],
  REFUNDING: ["REFUNDED", "PAID", "ACCEPTED"],
  REFUNDED: ["CLOSED"],
  CANCELLED: ["CLOSED"],
  CLOSED: [],
};

/**
 * 校验订单状态跳转合法性
 */
export function canTransition(currentStatus: string, nextStatus: string): boolean {
  const allowed = ORDER_ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(nextStatus);
}

/**
 * 计算平台服务费抽佣
 * 优先级: 商家特殊独立抽佣率 (provider.commissionRate) > 分类配置抽佣率 (categoryRate) > 全局系统默认抽佣率 (globalRate)
 */
export async function calculateCommission(
  providerId: string,
  category: string,
  totalAmountCents: number
): Promise<{ platformFeeCents: number; providerIncomeCents: number; rate: number }> {
  const provider = await prisma.serviceProvider.findUnique({
    where: { id: providerId },
    select: { commissionRate: true },
  });

  let rate = 0.10; // 默认 10%

  if (provider && provider.commissionRate !== null && provider.commissionRate !== undefined) {
    rate = provider.commissionRate;
  } else {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: "SERVICE_COMMISSION_CATEGORY_RATES" },
      });
      if (setting?.value) {
        const rates = JSON.parse(setting.value);
        if (rates[category] !== undefined) {
          rate = Number(rates[category]);
        }
      }
    } catch {
      // ignore JSON parse error, fallback to global
    }

    if (rate === 0.10) {
      const globalSetting = await prisma.systemSetting.findUnique({
        where: { key: "SERVICE_COMMISSION_GLOBAL_RATE" },
      });
      if (globalSetting?.value) {
        const parsedGlobal = parseFloat(globalSetting.value);
        if (!isNaN(parsedGlobal) && parsedGlobal >= 0 && parsedGlobal <= 1) {
          rate = parsedGlobal;
        }
      }
    }
  }

  const platformFeeCents = Math.round(totalAmountCents * rate);
  const providerIncomeCents = totalAmountCents - platformFeeCents;

  return {
    platformFeeCents,
    providerIncomeCents,
    rate,
  };
}

/**
 * 支付成功后订单流转处理 (供微信支付异步通知 / 支付核销调用)
 */
export async function onOrderPaymentSuccess(orderNo: string, transactionId?: string) {
  const order = await prisma.serviceOrder.findUnique({
    where: { orderNo },
    include: { provider: true, user: true },
  });

  if (!order) {
    throw new Error(`服务订单 ${orderNo} 不存在`);
  }

  if (order.paymentStatus === "PAID" && order.status !== "PENDING_PAYMENT") {
    return order; // 幂等直接返回
  }

  // 更新订单状态为 PAID，写入 paidAt
  const updatedOrder = await prisma.serviceOrder.update({
    where: { id: order.id },
    data: {
      status: "PAID",
      paymentStatus: "PAID",
      paidAt: new Date(),
    },
  });

  // 更新服务商在途冻结履约资金 (pendingBalance)
  await prisma.serviceProvider.update({
    where: { id: order.providerId },
    data: {
      pendingBalance: { increment: order.providerIncomeCents },
    },
  });

  // 创建/更新结算单 (状态为 PENDING 履约中冻结)
  const existingSettlement = await prisma.settlement.findUnique({
    where: { orderId: order.id },
  });

  if (!existingSettlement) {
    const settlementNo = "SET" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    await prisma.settlement.create({
      data: {
        settlementNo,
        orderId: order.id,
        providerId: order.providerId,
        grossAmountCents: order.payAmountCents,
        platformFeeCents: order.platformFeeCents,
        netAmountCents: order.providerIncomeCents,
        status: "PENDING",
        remark: "订单付款成功，履约在途资金冻结中",
      },
    });
  }

  // 向服务商发送新订单待接单提醒通知
  if (order.provider.userId) {
    await prisma.notification.create({
      data: {
        userId: order.provider.userId,
        type: "SYSTEM_NOTICE",
        title: "您收到一笔新的本地服务订单！",
        content: `客户已完成在线支付 ¥${(order.payAmountCents / 100).toFixed(2)}，预约时间：${new Date(order.appointmentAt).toLocaleString("zh-CN")}，请及时前往工作台接单处理。`,
        link: `/provider/center?tab=orders`,
      },
    });
  }

  // 向客户发送支付成功通知
  await prisma.notification.create({
    data: {
      userId: order.userId,
      type: "SYSTEM_NOTICE",
      title: "服务订单支付成功",
      content: `您的订单【${order.productTitle}】已支付成功，平台已通知师傅接单，请保持电话畅通。`,
      link: `/orders/${order.id}`,
    },
  });

  // 记录操作日志
  await prisma.operationLog.create({
    data: {
      action: "SERVICE_ORDER_PAID",
      targetId: order.id,
      metadata: {
        orderNo: order.orderNo,
        amountCents: order.payAmountCents,
        transactionId,
      },
    },
  });

  return updatedOrder;
}

/**
 * 确认完工后的结算划转处理
 */
export async function completeOrderSettlement(orderId: string, isAutoConfirm = false) {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: { provider: true },
  });

  if (!order) throw new Error("订单不存在");

  // 更新结算单状态为 READY (可结算提现)
  await prisma.settlement.updateMany({
    where: { orderId: order.id, status: "PENDING" },
    data: {
      status: "READY",
      remark: isAutoConfirm ? "超时系统自动确认完工，已划转入可结余额" : "客户已确认完工，已划转入可结余额",
    },
  });

  // 将服务商资金从在途 pendingBalance 转移到可结算 availableBalance
  await prisma.serviceProvider.update({
    where: { id: order.providerId },
    data: {
      pendingBalance: { decrement: order.providerIncomeCents },
      availableBalance: { increment: order.providerIncomeCents },
      completedOrders: { increment: 1 },
    },
  });

  // 如果关联了服务商品，增加销量
  if (order.productId) {
    await prisma.serviceProduct.update({
      where: { id: order.productId },
      data: { salesCount: { increment: 1 } },
    }).catch(() => null);
  }

  // 通知服务商完工入账
  if (order.provider.userId) {
    await prisma.notification.create({
      data: {
        userId: order.provider.userId,
        type: "SYSTEM_NOTICE",
        title: "服务订单已确认完工入账",
        content: `订单【${order.productTitle}】已确认完工，预估净收入 ¥${(order.providerIncomeCents / 100).toFixed(2)} 已转入您的可结算余额中。`,
        link: `/provider/center?tab=settlement`,
      },
    });
  }
}
