import { prisma } from "@/lib/prisma";
import { activateListingPromotion } from "@/lib/info-promotions";

export async function seedDefaultPlans() {
  const count = await prisma.billingPlan.count();
  if (count > 0) return;

  const defaultPlans = [
    { name: "1天尝鲜置顶套餐", targetKind: "all", priceCents: 1000, durationDays: 1, description: "全天候首屏黄金展示 24 小时，流量倍增" },
    { name: "3天特惠置顶套餐", targetKind: "all", priceCents: 2800, durationDays: 3, description: "短周期快速转出，性价比优选" },
    { name: "7天黄金置顶套餐", targetKind: "all", priceCents: 6000, durationDays: 7, description: "85% 用户首选，醒目🔥黄冠徽章优先前排曝光" },
    { name: "30天包月尊享置顶套餐", targetKind: "all", priceCents: 19800, durationDays: 30, description: "商家店铺与房东大客户专享，全天候全域顶格霸屏" },
  ];

  for (const p of defaultPlans) {
    await prisma.billingPlan.create({ data: p });
  }
}

export async function listBillingPlans() {
  await seedDefaultPlans();
  return prisma.billingPlan.findMany({
    where: { enabled: true },
    orderBy: { priceCents: "asc" },
  });
}

export async function createBillingOrder(input: {
  planId: string;
  targetKind: string;
  targetId: string;
  targetTitle: string;
  userId?: string;
}) {
  const plan = await prisma.billingPlan.findUnique({ where: { id: input.planId } });
  if (!plan) throw new Error("置顶套餐不存在");

  const orderNo = `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const order = await prisma.billingOrder.create({
    data: {
      orderNo,
      planId: plan.id,
      planName: plan.name,
      targetKind: input.targetKind,
      targetId: input.targetId,
      targetTitle: input.targetTitle,
      amountCents: plan.priceCents,
      status: "PENDING_PAYMENT",
      userId: input.userId || undefined,
    },
  });

  return order;
}

export async function simulatePayOrder(orderNo: string) {
  const order = await prisma.billingOrder.findUnique({ where: { orderNo } });
  if (!order) throw new Error("订单不存在");

  if (order.status === "PAID") {
    return order;
  }

  const plan = order.planId ? await prisma.billingPlan.findUnique({ where: { id: order.planId } }) : null;
  const durationDays = plan ? plan.durationDays : 7;
  const topUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  // Update order status
  const updatedOrder = await prisma.billingOrder.update({
    where: { orderNo },
    data: { status: "PAID" },
  });

  // Activate top placement on target model
  const { targetKind, targetId } = order;
  if (targetKind === "shop") {
    await prisma.shop.update({ where: { id: targetId }, data: { isTop: true, topUntil } }).catch(() => {});
  } else if (targetKind === "house") {
    await prisma.house.update({ where: { id: targetId }, data: { isTop: true, topUntil } }).catch(() => {});
  } else if (targetKind === "listing_promotion") {
    await activateListingPromotion(orderNo, "PAID").catch(() => {});
  } else if (targetKind === "listing") {
    await prisma.listing.update({ where: { id: targetId }, data: { isTop: true, topUntil } }).catch(() => {});
  } else if (targetKind === "job") {
    await prisma.job.update({ where: { id: targetId }, data: { isTop: true, topUntil } }).catch(() => {});
  } else if (targetKind === "post") {
    await prisma.post.update({ where: { id: targetId }, data: { isTop: true, topUntil } }).catch(() => {});
  } else if (targetKind === "event") {
    await prisma.event.update({ where: { id: targetId }, data: { isTop: true, topUntil } }).catch(() => {});
  }

  await prisma.operationLog.create({
    data: {
      action: "BILLING_ORDER_PAID",
      targetId: order.id,
      metadata: { orderNo, amountCents: order.amountCents, targetKind, targetId, topUntil: topUntil.toISOString() },
    },
  });

  return updatedOrder;
}

export async function getBillingStats() {
  const paidOrders = await prisma.billingOrder.findMany({
    where: { status: "PAID" },
  });

  const totalAmountCents = paidOrders.reduce((sum, o) => sum + o.amountCents, 0);
  const totalOrdersCount = await prisma.billingOrder.count();

  const recentOrders = await prisma.billingOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    totalRevenueYuan: (totalAmountCents / 100).toFixed(2),
    paidOrdersCount: paidOrders.length,
    totalOrdersCount,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      planName: o.planName,
      targetKind: o.targetKind,
      targetTitle: o.targetTitle,
      amountYuan: (o.amountCents / 100).toFixed(2),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
  };
}
