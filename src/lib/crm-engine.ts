import { prisma } from "@/lib/prisma";

/**
 * 手机号脱敏工具函数 (如 138****1234)
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return "未填电话";
  const cleaned = phone.trim();
  if (cleaned.length === 11) {
    return cleaned.slice(0, 3) + "****" + cleaned.slice(7);
  }
  if (cleaned.length > 7) {
    return cleaned.slice(0, 3) + "***" + cleaned.slice(-2);
  }
  return cleaned;
}

/**
 * 获取服务商 CRM 客户全景数据 (严格租户隔离：只能查该 providerId 的客户)
 */
export async function getProviderCrmData(providerId: string) {
  // 1. 获取属于该服务商的所有订单
  const orders = await prisma.serviceOrder.findMany({
    where: { providerId },
    select: {
      id: true,
      orderNo: true,
      userId: true,
      productTitle: true,
      payAmountCents: true,
      totalAmountCents: true,
      discountCents: true,
      status: true,
      createdAt: true,
      completedAt: true,
      confirmedAt: true,
      contactName: true,
      contactPhone: true,
      serviceArea: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. 获取属于该服务商的所有有效线索与联系事件
  const [leads, contactEvents, customerNotes] = await Promise.all([
    prisma.serviceLead.findMany({
      where: { providerId },
      include: {
        request: {
          select: {
            userId: true,
            contactName: true,
            contactPhone: true,
            area: true,
            category: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.contactEvent.findMany({
      where: { providerId, userId: { not: null } },
      select: {
        userId: true,
        action: true,
        source: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.providerCustomerNote.findMany({
      where: { providerId },
    }),
  ]);

  // 3. 构建客户聚合映射 (按 customerId / userId)
  const customerMap = new Map<string, {
    customerId: string;
    contactName: string;
    phone: string;
    orders: any[];
    leads: any[];
    contactEventsCount: number;
    lastInteractionAt: Date;
    firstInteractionAt: Date;
  }>();

  // 处理订单数据
  for (const o of orders) {
    if (!o.userId) continue;
    let entry = customerMap.get(o.userId);
    if (!entry) {
      entry = {
        customerId: o.userId,
        contactName: o.contactName || "微信客户",
        phone: o.contactPhone,
        orders: [],
        leads: [],
        contactEventsCount: 0,
        lastInteractionAt: o.createdAt,
        firstInteractionAt: o.createdAt,
      };
      customerMap.set(o.userId, entry);
    }
    entry.orders.push(o);
    if (o.createdAt > entry.lastInteractionAt) entry.lastInteractionAt = o.createdAt;
    if (o.createdAt < entry.firstInteractionAt) entry.firstInteractionAt = o.createdAt;
    if (o.contactName && entry.contactName === "微信客户") entry.contactName = o.contactName;
    if (o.contactPhone && !entry.phone) entry.phone = o.contactPhone;
  }

  // 处理需求线索
  for (const l of leads) {
    const uId = l.request?.userId;
    if (!uId) continue;
    let entry = customerMap.get(uId);
    if (!entry) {
      entry = {
        customerId: uId,
        contactName: l.request.contactName || "需求客户",
        phone: l.request.contactPhone,
        orders: [],
        leads: [],
        contactEventsCount: 0,
        lastInteractionAt: l.createdAt,
        firstInteractionAt: l.createdAt,
      };
      customerMap.set(uId, entry);
    }
    entry.leads.push(l);
    if (l.createdAt > entry.lastInteractionAt) entry.lastInteractionAt = l.createdAt;
    if (l.createdAt < entry.firstInteractionAt) entry.firstInteractionAt = l.createdAt;
  }

  // 处理咨询联系事件
  for (const ce of contactEvents) {
    if (!ce.userId) continue;
    let entry = customerMap.get(ce.userId);
    if (!entry) {
      entry = {
        customerId: ce.userId,
        contactName: "咨询客户",
        phone: "",
        orders: [],
        leads: [],
        contactEventsCount: 0,
        lastInteractionAt: ce.createdAt,
        firstInteractionAt: ce.createdAt,
      };
      customerMap.set(ce.userId, entry);
    }
    entry.contactEventsCount += 1;
    if (ce.createdAt > entry.lastInteractionAt) entry.lastInteractionAt = ce.createdAt;
    if (ce.createdAt < entry.firstInteractionAt) entry.firstInteractionAt = ce.createdAt;
  }

  // 4. 批量查询关联的用户基础信息 (昵称、头像)
  const userIds = Array.from(customerMap.keys());
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true,
      phone: true,
      createdAt: true,
    },
  });
  const userDict = new Map(users.map((u) => [u.id, u]));
  const noteDict = new Map(customerNotes.map((n) => [n.customerId, n]));

  // 5. 组装聚合客户列表
  let totalCustomers = 0;
  let customersWithCompletedOrders = 0;
  let repeatCustomers = 0;
  let totalCompletedRevenueCents = 0;

  const now = new Date();
  let remindersDueCount = 0;

  const customerList = Array.from(customerMap.values()).map((c) => {
    const user = userDict.get(c.customerId);
    const note = noteDict.get(c.customerId);

    // 统计订单
    const allOrders = c.orders;
    const completedOrders = allOrders.filter((o) =>
      ["COMPLETED", "CONFIRMED"].includes(o.status)
    );
    const paidOrders = allOrders.filter((o) =>
      ["PAID", "ACCEPTED", "IN_SERVICE", "COMPLETED", "CONFIRMED"].includes(o.status)
    );

    const totalSpentCents = completedOrders.reduce((sum, o) => sum + o.payAmountCents, 0);

    totalCustomers += 1;
    if (completedOrders.length > 0) {
      customersWithCompletedOrders += 1;
      totalCompletedRevenueCents += totalSpentCents;
    }
    if (completedOrders.length >= 2) {
      repeatCustomers += 1;
    }

    // 标签体系
    const existingTags = note?.tags || [];
    const derivedTags = [...existingTags];

    if (completedOrders.length >= 2 && !derivedTags.includes("老客户")) {
      derivedTags.unshift("老客户");
    }
    if (completedOrders.length >= 4 && !derivedTags.includes("高频客")) {
      derivedTags.unshift("高频客");
    }
    if (completedOrders.length === 1 && !derivedTags.includes("已成交")) {
      derivedTags.push("已成交");
    }
    if (allOrders.length === 0 && (c.leads.length > 0 || c.contactEventsCount > 0) && !derivedTags.includes("潜在意向")) {
      derivedTags.push("潜在意向");
    }

    const isReminderDue = note?.nextFollowUpAt && note.nextFollowUpAt <= now && !note.followUpCompleted;
    if (isReminderDue) {
      remindersDueCount += 1;
    }

    const rawPhone = c.phone || user?.phone || "";

    return {
      customerId: c.customerId,
      nickname: user?.nickname || user?.username || c.contactName || "匿名同城客户",
      avatar: user?.avatar || null,
      maskedPhone: maskPhone(rawPhone),
      rawPhone, // 仅在已有完成订单许可下保留
      totalOrdersCount: allOrders.length,
      completedOrdersCount: completedOrders.length,
      totalSpentCents,
      totalSpentYuan: (totalSpentCents / 100).toFixed(2),
      firstInteractionAt: c.firstInteractionAt,
      lastInteractionAt: c.lastInteractionAt,
      lastOrderProductTitle: allOrders[0]?.productTitle || null,
      lastOrderArea: allOrders[0]?.serviceArea || null,
      // CRM 档案
      tags: Array.from(new Set(derivedTags)),
      internalNotes: note?.notes || "",
      nextFollowUpAt: note?.nextFollowUpAt || null,
      followUpCompleted: note?.followUpCompleted || false,
      isReminderDue,
    };
  });

  // 排序：优先按最近互动时间倒序
  customerList.sort((a, b) => new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime());

  // 6. 计算核心经营指标
  const repeatRate =
    customersWithCompletedOrders > 0
      ? Number(((repeatCustomers / customersWithCompletedOrders) * 100).toFixed(1))
      : 0;

  const averageCustomerSpendCents =
    customersWithCompletedOrders > 0
      ? Math.round(totalCompletedRevenueCents / customersWithCompletedOrders)
      : 0;

  return {
    stats: {
      totalCustomers,
      customersWithCompletedOrders,
      repeatCustomers,
      repeatRate, // 百分比, 如 66.7
      totalCompletedRevenueCents,
      totalCompletedRevenueYuan: (totalCompletedRevenueCents / 100).toFixed(2),
      averageCustomerSpendCents,
      averageCustomerSpendYuan: (averageCustomerSpendCents / 100).toFixed(2),
      remindersDueCount,
    },
    customers: customerList,
  };
}
