import { prisma } from "@/lib/prisma";

/**
 * 用户领取优惠券 (原子事务防超卖防刷)
 */
export async function claimCoupon(userId: string, couponId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. 查询优惠券基础规则
    const coupon = await tx.serviceCoupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new Error("该优惠券不存在");
    }

    if (!coupon.enabled) {
      throw new Error("该优惠券已暂停发放");
    }

    const now = new Date();
    if (coupon.startAt && now < coupon.startAt) {
      throw new Error("该优惠券领取活动尚未开始");
    }
    if (coupon.endAt && now > coupon.endAt) {
      throw new Error("该优惠券活动已结束，无法领取");
    }

    // 2. 库存校验
    if (coupon.totalQuantity > 0 && coupon.receivedQuantity >= coupon.totalQuantity) {
      throw new Error("手慢了，该优惠券已被抢光！");
    }

    // 3. 每人限领张数校验
    const userClaimedCount = await tx.userCoupon.count({
      where: {
        userId,
        couponId,
      },
    });

    if (userClaimedCount >= coupon.perUserLimit) {
      throw new Error(`您已达到该优惠券的每人限领上限（每人限领 ${coupon.perUserLimit} 张）`);
    }

    // 4. 计算到期时间
    let expiresAt: Date;
    if (coupon.endAt) {
      const daysFromNow = new Date(now.getTime() + coupon.validDays * 24 * 60 * 60 * 1000);
      expiresAt = daysFromNow < coupon.endAt ? daysFromNow : coupon.endAt;
    } else {
      expiresAt = new Date(now.getTime() + coupon.validDays * 24 * 60 * 60 * 1000);
    }

    // 5. 创建用户优惠券记录
    const userCoupon = await tx.userCoupon.create({
      data: {
        userId,
        couponId,
        status: "AVAILABLE",
        receivedAt: now,
        expiresAt,
      },
      include: {
        coupon: true,
      },
    });

    // 6. 增加已领数量
    await tx.serviceCoupon.update({
      where: { id: couponId },
      data: {
        receivedQuantity: { increment: 1 },
      },
    });

    return userCoupon;
  });
}

/**
 * 校验并计算优惠券折扣 (严格服务端校验)
 */
export async function validateAndCalculateCoupon(params: {
  userCouponId: string;
  userId: string;
  providerId: string;
  productId: string;
  category: string;
  totalAmountCents: number;
}) {
  const { userCouponId, userId, providerId, productId, category, totalAmountCents } = params;

  const userCoupon = await prisma.userCoupon.findUnique({
    where: { id: userCouponId },
    include: { coupon: true },
  });

  if (!userCoupon) {
    return { isValid: false, reason: "优惠券不存在", discountCents: 0 };
  }

  if (userCoupon.userId !== userId) {
    return { isValid: false, reason: "无权使用他人优惠券", discountCents: 0 };
  }

  if (userCoupon.status !== "AVAILABLE") {
    return { isValid: false, reason: "该优惠券已被使用或已作废", discountCents: 0 };
  }

  const now = new Date();
  if (userCoupon.expiresAt < now) {
    return { isValid: false, reason: "该优惠券已过有效期", discountCents: 0 };
  }

  const coupon = userCoupon.coupon;
  if (!coupon.enabled) {
    return { isValid: false, reason: "该优惠券已停用", discountCents: 0 };
  }

  // 校验发行方与归属商户
  if (coupon.issuerType === "PROVIDER") {
    if (coupon.providerId && coupon.providerId !== providerId) {
      return { isValid: false, reason: "该优惠券仅限指定商户/师傅使用", discountCents: 0 };
    }
  }

  // 校验品类适用范围
  if (coupon.applicableScope === "CATEGORY" && coupon.applicableCategory) {
    if (coupon.applicableCategory !== category) {
      return { isValid: false, reason: `该优惠券仅限【${coupon.applicableCategory}】分类使用`, discountCents: 0 };
    }
  }

  // 校验指定商品范围
  if (coupon.applicableScope === "PRODUCT" && coupon.applicableProductId) {
    if (coupon.applicableProductId !== productId) {
      return { isValid: false, reason: "该优惠券仅限特定服务商品使用", discountCents: 0 };
    }
  }

  // 校验最低消费门槛
  if (totalAmountCents < coupon.minSpendCents) {
    return {
      isValid: false,
      reason: `未满使用门槛（满 ¥${(coupon.minSpendCents / 100).toFixed(2)} 可用）`,
      discountCents: 0,
    };
  }

  // 计算折扣金额
  let discountCents = 0;
  if (coupon.couponType === "DISCOUNT") {
    // 折扣券：例如 valueCents 为 85 代表 8.5折
    const discountRate = coupon.valueCents > 0 ? coupon.valueCents : 90;
    const rawDiscount = Math.round((totalAmountCents * (100 - discountRate)) / 100);
    discountCents = coupon.maxDiscountCents
      ? Math.min(rawDiscount, coupon.maxDiscountCents)
      : rawDiscount;
  } else {
    // 满减券 / 新客立减 / 复购立减券
    const faceValue = coupon.discountCents > 0 ? coupon.discountCents : coupon.valueCents;
    discountCents = Math.min(totalAmountCents, faceValue);
  }

  // 防止出现负数或超额折扣，至少需付 1 分钱
  if (discountCents >= totalAmountCents) {
    discountCents = Math.max(0, totalAmountCents - 1);
  }

  return {
    isValid: true,
    discountCents,
    coupon,
    userCoupon,
  };
}

/**
 * 订单未履约全额退款时，优惠券退回保护
 */
export async function rollbackUserCoupon(userCouponId: string, orderId: string) {
  try {
    const userCoupon = await prisma.userCoupon.findUnique({
      where: { id: userCouponId },
      include: { coupon: true },
    });

    if (!userCoupon || userCoupon.usedOrderId !== orderId) {
      return false;
    }

    const now = new Date();
    // 只有仍在有效期内的优惠券才恢复为 AVAILABLE，已过期的置为 EXPIRED
    const newStatus = userCoupon.expiresAt > now ? "AVAILABLE" : "EXPIRED";

    await prisma.$transaction(async (tx) => {
      await tx.userCoupon.update({
        where: { id: userCouponId },
        data: {
          status: newStatus,
          usedAt: null,
          usedOrderId: null,
        },
      });

      // 回退已核销数量
      await tx.serviceCoupon.update({
        where: { id: userCoupon.couponId },
        data: {
          usedQuantity: { decrement: 1 },
        },
      });

      // 发送站内退券通知
      await tx.notification.create({
        data: {
          userId: userCoupon.userId,
          type: "SYSTEM_NOTICE",
          title: "优惠券已全额退回您的账户",
          content: `您的服务订单退款成功，原订单使用的【${userCoupon.coupon.title}】已退回卡包，${
            newStatus === "AVAILABLE" ? "在有效期内可继续使用。" : "因已超出原有效期，卡券已过期。"
          }`,
          link: "/profile?tab=coupons",
        },
      });
    });

    return true;
  } catch (err) {
    console.error("rollbackUserCoupon error:", err);
    return false;
  }
}
