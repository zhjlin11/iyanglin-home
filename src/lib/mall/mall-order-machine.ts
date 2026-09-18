import { prisma } from "@/lib/prisma";
import { sendUnifiedNotification } from "@/lib/unified-notification";

export type MallDeliveryMethod = "DELIVERY" | "PICKUP";

export type MallOrderStatus =
  | "WAITING_PAYMENT"
  | "PAID"
  | "PICKING"
  | "READY"
  | "DELIVERING"
  | "DELIVERED"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDING"
  | "REFUNDED";

export type MallDeliveryType = "OWNER" | "COURIER" | "THIRD_PARTY";

/**
 * 生成规范的商城自营订单号: MO + 年月日(8位) + 毫秒后3位 + 3位随机数
 */
export function generateMallOrderNo(): string {
  const now = new Date();
  const y = now.getFullYear().toString();
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  const ms = now.getMilliseconds().toString().padStart(3, "0");
  const rand = Math.floor(100 + Math.random() * 900).toString();
  return `MO${y}${m}${d}${ms}${rand}`;
}

/**
 * 生成 6 位纯数字自提核销码 (100000 - 999999)
 */
export function generatePickupCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 微信支付成功统一回调处理 (严格幂等 + 原子扣库存 + 销量自增 + 日志 + 通知)
 */
export async function onMallOrderPaymentSuccess(orderNo: string, transactionId?: string) {
  console.log(`[MallOrderMachine] Processing payment success for orderNo: ${orderNo}`);

  // 1. 事务内执行状态更新与库存扣减
  const updatedOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.mallOrder.findUnique({
      where: { orderNo },
      include: {
        items: true,
        user: { select: { id: true, nickname: true, phone: true } },
      },
    });

    if (!order) {
      throw new Error(`MallOrder not found: ${orderNo}`);
    }

    // 幂等防护：若已支付，直接返回，避免二次扣减库存
    if (order.status !== "WAITING_PAYMENT") {
      console.log(`[MallOrderMachine] Order ${orderNo} already in status ${order.status}, skipping.`);
      return order;
    }

    // 自提单生成取货码
    let pickupCode: string | null = null;
    if (order.deliveryMethod === "PICKUP") {
      pickupCode = generatePickupCode();
    }

    // 更新订单状态
    const paidOrder = await tx.mallOrder.update({
      where: { orderNo },
      data: {
        status: "PAID",
        paidAt: new Date(),
        transactionId: transactionId || order.transactionId,
        pickupCode,
      },
      include: { items: true, user: true },
    });

    // 逐项扣减真实商品库存并累加销量 (原子操作)
    for (const item of order.items) {
      const prod = await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          salesCount: { increment: item.quantity },
        },
      });

      // 若库存扣至 <= 0，自动标记已售罄
      if (prod.stock <= 0 && prod.status === "ON_SALE") {
        await tx.product.update({
          where: { id: item.productId },
          data: { status: "SOLD_OUT" },
        });
      }
    }

    // 记录订单流转日志
    await tx.mallOrderLog.create({
      data: {
        orderId: order.id,
        operator: "SYSTEM",
        operatorName: "微信支付中枢",
        action: "PAY",
        notes: `微信在线支付成功，实付金额 ¥${(order.payAmountCents / 100).toFixed(2)}${
          pickupCode ? `，生成自提核销码: ${pickupCode}` : ""
        }`,
        metadata: {
          transactionId,
          paidAt: new Date().toISOString(),
          deliveryMethod: order.deliveryMethod,
        },
      },
    });

    return paidOrder;
  });

  // 2. 事务外触发多渠道通知
  try {
    const isPickup = updatedOrder.deliveryMethod === "PICKUP";
    const title = isPickup ? "🛒 自提订单支付成功" : "🚚 配送订单支付成功";
    const content = isPickup
      ? `您在自营便利店购买的商品已支付成功，店内已接单备货。您的专属取货码为【${updatedOrder.pickupCode}】，备齐后将通知您到店领取！`
      : `您在自营便利店购买的商品已支付成功，店内正在为您安排拣货打包，我们将尽快安排派送！`;

    // 2.1 推送给买家
    await sendUnifiedNotification({
      userId: updatedOrder.userId,
      category: "ORDER",
      type: "MALL_ORDER_PAID",
      title,
      content,
      link: `/mall/orders/${updatedOrder.id}`,
      channels: ["IN_APP", "WECHAT"],
      dedupeKey: `mall_pay_${updatedOrder.id}`,
    });

    // 2.2 推送给后台管理员/店长 (包含买了什么商品、联系电话与履约方式)
    const itemsSummary = updatedOrder.items
      .map((i) => `${i.productName} × ${i.quantity}${i.unit || "件"}`)
      .join("、");
    const adminTitle = `🔔 便利店新订单提醒 (${isPickup ? "到店自提" : "本地专配"}) · 实付 ¥${(updatedOrder.payAmountCents / 100).toFixed(2)}`;
    const adminContent = `买家【${updatedOrder.contactName} (${updatedOrder.contactPhone})】刚完成了微信支付！购买商品：${itemsSummary}。${
      isPickup
        ? `提货方式：到店自提 (核销码: ${updatedOrder.pickupCode})`
        : `送达地址：${updatedOrder.addressDetail} (期望：${updatedOrder.expectedDeliveryTime})`
    }`;

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    for (const admin of admins) {
      await sendUnifiedNotification({
        userId: admin.id,
        category: "ORDER",
        type: "MALL_ADMIN_NEW_ORDER",
        title: adminTitle,
        content: adminContent,
        link: `/admin/mall/orders`,
        channels: ["IN_APP", "WECHAT"],
        dedupeKey: `admin_mall_pay_${updatedOrder.id}_${admin.id}`,
      }).catch(() => {});
    }
  } catch (err: any) {
    console.error("[MallOrderMachine] Failed to send payment notification:", err.message);
  }

  return updatedOrder;
}

/**
 * 推进订单状态 (配货、派单、配送、核销、完成)
 */
export async function transitionMallOrderStatus(params: {
  orderId: string;
  targetStatus: MallOrderStatus;
  operator: "ADMIN" | "COURIER" | "USER" | "SYSTEM";
  operatorName?: string;
  notes?: string;
  deliveryType?: MallDeliveryType;
  courierId?: string;
  thirdPartyData?: {
    platform: string;
    riderName?: string;
    riderPhone?: string;
    feeCents?: number;
    notes?: string;
  };
}) {
  const { orderId, targetStatus, operator, operatorName, notes, deliveryType, courierId, thirdPartyData } = params;

  const order = await prisma.mallOrder.findUnique({
    where: { id: orderId },
    include: { courier: true, user: true },
  });

  if (!order) {
    throw new Error("订单不存在");
  }

  // 状态流转合法性校验
  const current = order.status;
  const updateData: any = { status: targetStatus };

  if (targetStatus === "PICKING") {
    if (!["PAID"].includes(current)) {
      throw new Error(`当前状态 [${current}] 无法变更为配货中`);
    }
    updateData.pickingAt = new Date();
  } else if (targetStatus === "READY") {
    // 配送单配齐
    if (!["PAID", "PICKING"].includes(current)) {
      throw new Error(`当前状态 [${current}] 无法变更为待配送`);
    }
    updateData.readyAt = new Date();
  } else if (targetStatus === "READY_FOR_PICKUP") {
    // 自提单配齐
    if (!["PAID", "PICKING"].includes(current)) {
      throw new Error(`当前状态 [${current}] 无法变更为待自提`);
    }
    updateData.readyAt = new Date();
    if (!order.pickupCode) {
      updateData.pickupCode = generatePickupCode();
    }
  } else if (targetStatus === "DELIVERING") {
    // 开始配送
    if (!["PAID", "PICKING", "READY"].includes(current)) {
      throw new Error(`当前状态 [${current}] 无法变更为配送中`);
    }
    updateData.deliveringAt = new Date();
    if (deliveryType) updateData.deliveryType = deliveryType;
    if (courierId) updateData.assignedCourierId = courierId;
    if (thirdPartyData) {
      updateData.thirdPartyPlatform = thirdPartyData.platform;
      updateData.thirdPartyRiderName = thirdPartyData.riderName;
      updateData.thirdPartyRiderPhone = thirdPartyData.riderPhone;
      updateData.thirdPartyFeeCents = thirdPartyData.feeCents;
      updateData.thirdPartyNotes = thirdPartyData.notes;
    }
  } else if (targetStatus === "DELIVERED") {
    if (!["DELIVERING"].includes(current)) {
      throw new Error(`当前状态 [${current}] 无法变更为已送达`);
    }
    updateData.deliveredAt = new Date();
  } else if (targetStatus === "PICKED_UP" || targetStatus === "COMPLETED") {
    updateData.completedAt = new Date();
    if (order.deliveryMethod === "PICKUP") {
      updateData.pickedUpAt = new Date();
    }
  } else if (targetStatus === "CANCELLED") {
    if (current !== "WAITING_PAYMENT" && operator === "USER") {
      throw new Error("已支付订单无法直接取消，请申请退款售后");
    }
    updateData.cancelledAt = new Date();
    updateData.cancelReason = notes || "用户取消";
  } else if (targetStatus === "REFUNDED") {
    updateData.cancelReason = notes || "订单已全额退款";
  }

  const updated = await prisma.$transaction(async (tx) => {
    const ord = await tx.mallOrder.update({
      where: { id: orderId },
      data: updateData,
      include: { courier: true, user: true, items: true },
    });

    await tx.mallOrderLog.create({
      data: {
        orderId,
        operator,
        operatorName: operatorName || operator,
        action: targetStatus,
        notes: notes || `订单状态流转至: ${targetStatus}`,
        metadata: {
          previousStatus: current,
          targetStatus,
          deliveryType,
          courierId,
          thirdPartyData,
        },
      },
    });

    // 若配送员送达，累加配送员累计派送数
    if (targetStatus === "DELIVERED" && ord.assignedCourierId) {
      await tx.courier.update({
        where: { id: ord.assignedCourierId },
        data: { totalDelivered: { increment: 1 } },
      });
    }

    return ord;
  });

  // 状态变更通知用户
  try {
    let notifTitle = "";
    let notifContent = "";

    if (targetStatus === "PICKING") {
      notifTitle = "📦 订单店内配货中";
      notifContent = `您在自营便利店的订单 ${order.orderNo} 正在店内拣货打包。`;
    } else if (targetStatus === "READY_FOR_PICKUP") {
      notifTitle = "🎉 商品已备齐，请到店自提";
      notifContent = `您的自提订单 ${order.orderNo} 已在便利店准备就绪！请凭取货码【${updated.pickupCode}】前往杨林经开区自营便利店自提。`;
    } else if (targetStatus === "DELIVERING") {
      notifTitle = "🛵 您的便利店订单已出发派送";
      const courierText = updated.courier
        ? `配送员 ${updated.courier.name}（${updated.courier.phone}）`
        : updated.thirdPartyPlatform
        ? `${updated.thirdPartyPlatform} 骑手`
        : "店主";
      notifContent = `订单 ${order.orderNo} 已由 ${courierText} 安排配送，请留意保持电话畅通！`;
    } else if (targetStatus === "DELIVERED") {
      notifTitle = "✅ 商品已送达";
      notifContent = `您的便利店订单 ${order.orderNo} 已顺利送达指定地点。如遇商品缺损可随时申请售后，祝您生活愉快！`;
    } else if (targetStatus === "COMPLETED") {
      notifTitle = "✨ 订单已完成";
      notifContent = `您的便利店订单 ${order.orderNo} 已确认收货完成。感谢支持杨林生活网自营便利店！`;
    }

    if (notifTitle) {
      await sendUnifiedNotification({
        userId: updated.userId,
        category: "ORDER",
        type: `MALL_STATUS_${targetStatus}`,
        title: notifTitle,
        content: notifContent,
        link: `/mall/orders/${order.id}`,
        channels: ["IN_APP", "WECHAT"],
      });
    }

    // 若分配了配送员，向配送员发送任务通知
    if (targetStatus === "DELIVERING" && updated.assignedCourierId && updated.courier?.userId) {
      await sendUnifiedNotification({
        userId: updated.courier.userId,
        category: "ORDER",
        type: "COURIER_NEW_TASK",
        title: "🛵 收到新配送任务",
        content: `您有新的派送订单 ${order.orderNo}，送达地址: ${order.addressDetail || order.deliveryZoneName}，请尽快查看处理！`,
        link: `/courier`,
        channels: ["IN_APP"],
      });
    }
  } catch (err: any) {
    console.error("[MallOrderMachine] Notification failed:", err.message);
  }

  return updated;
}

/**
 * 6 位数字取货码一键核销
 */
export async function verifyAndPickupOrder(params: {
  pickupCode: string;
  operatorName?: string;
}) {
  const code = params.pickupCode.trim();
  if (!code || code.length !== 6) {
    throw new Error("取货码必须为 6 位数字");
  }

  const order = await prisma.mallOrder.findFirst({
    where: {
      pickupCode: code,
      deliveryMethod: "PICKUP",
    },
    include: { user: true, items: true },
  });

  if (!order) {
    throw new Error("未找到对应取货码的有效自提订单，请核对数字");
  }

  if (order.status === "COMPLETED" || order.status === "PICKED_UP") {
    throw new Error(`该订单已于 ${order.pickedUpAt ? new Date(order.pickedUpAt).toLocaleString("zh-CN") : "此前"} 完成核销，请勿重复核销`);
  }

  if (order.status === "WAITING_PAYMENT") {
    throw new Error("该订单尚未支付，无法执行自提核销");
  }

  return await transitionMallOrderStatus({
    orderId: order.id,
    targetStatus: "COMPLETED",
    operator: "ADMIN",
    operatorName: params.operatorName || "门店核销员",
    notes: `门店输入取货码 [${code}] 成功核销提货`,
  });
}
