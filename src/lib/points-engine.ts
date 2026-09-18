import { prisma } from "@/lib/prisma";

export type PointAwardRule =
  | "ORDER_COMPLETE"      // +20分 真实服务履约完成
  | "REVIEW_WITH_IMAGE"   // +5分 带图真实评价
  | "REALNAME_VERIFY"     // +15分 首次实名认证通过
  | "DAILY_SIGNIN";       // +2分 每日首登签到

export type RedemptionType =
  | "COUPON_10"   // 50积分 兑换10元服务通用券
  | "TOPPING_3D"  // 100积分 兑换3天信息置顶券
  | "PLUS_15D";   // 200积分 兑换15天生活PLUS体验卡

const RULE_CONFIG: Record<PointAwardRule, { points: number; label: string }> = {
  ORDER_COMPLETE: { points: 20, label: "完成服务订单奖励" },
  REVIEW_WITH_IMAGE: { points: 5, label: "发表带图真实评价奖励" },
  REALNAME_VERIFY: { points: 15, label: "首次实名认证完成奖励" },
  DAILY_SIGNIN: { points: 2, label: "每日首登签到奖励" },
};

const REDEMPTION_CONFIG: Record<
  RedemptionType,
  { cost: number; name: string; desc: string }
> = {
  COUPON_10: { cost: 50, name: "10元本地生活服务通用券", desc: "满30可用，有效期30天" },
  TOPPING_3D: { cost: 100, name: "3天信息置顶体验券", desc: "任意便民/房产/招聘均可使用" },
  PLUS_15D: { cost: 200, name: "15天平台生活PLUS体验卡", desc: "尊享发帖额度翻倍与优先审核" },
};

export const DAILY_POINTS_CAP = 50; // 单日获取上限 50 积分

/**
 * 获得积分 (严格事务、单日封顶防刷)
 */
export async function awardPoints(
  userId: string,
  rule: PointAwardRule,
  sourceId?: string
): Promise<{
  success: boolean;
  pointsAwarded: number;
  balance: number;
  reason?: string;
}> {
  const config = RULE_CONFIG[rule];
  if (!config) {
    return { success: false, pointsAwarded: 0, balance: 0, reason: "无效积分规则" };
  }

  // 1. 获取或创建积分账户
  let account = await prisma.pointAccount.findUnique({
    where: { userId },
  });
  if (!account) {
    account = await prisma.pointAccount.create({
      data: { userId, balance: 0 },
    });
  }

  // 2. 检查单日封顶 (今日 00:00:00 至今)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEarnedAggregate = await prisma.pointTransaction.aggregate({
    where: {
      accountId: account.id,
      amount: { gt: 0 },
      createdAt: { gte: todayStart },
    },
    _sum: { amount: true },
  });

  const todayEarned = todayEarnedAggregate._sum.amount || 0;
  if (todayEarned >= DAILY_POINTS_CAP) {
    return {
      success: false,
      pointsAwarded: 0,
      balance: account.balance,
      reason: `已达今日积分获取上限 (${DAILY_POINTS_CAP}积分)`,
    };
  }

  // 计算本次实得积分 (不能突破上限)
  const pointsToAdd = Math.min(config.points, DAILY_POINTS_CAP - todayEarned);
  if (pointsToAdd <= 0) {
    return {
      success: false,
      pointsAwarded: 0,
      balance: account.balance,
      reason: "已达今日积分上限",
    };
  }

  // 3. 事务写入账本
  const result = await prisma.$transaction(async (tx) => {
    const updatedAccount = await tx.pointAccount.update({
      where: { id: account.id },
      data: {
        balance: { increment: pointsToAdd },
        totalEarned: { increment: pointsToAdd },
        lastCheckin: rule === "DAILY_SIGNIN" ? new Date() : account.lastCheckin,
      },
    });

    const remark = sourceId
      ? `${config.label} (${sourceId})`
      : config.label;

    await tx.pointTransaction.create({
      data: {
        accountId: account.id,
        amount: pointsToAdd,
        type: rule === "DAILY_SIGNIN" ? "CHECKIN" : "PUBLISH",
        remark,
      },
    });

    return updatedAccount;
  });

  return {
    success: true,
    pointsAwarded: pointsToAdd,
    balance: result.balance,
  };
}

/**
 * 积分兑换权益
 */
export async function redeemPoints(
  userId: string,
  redemptionType: RedemptionType
): Promise<{
  success: boolean;
  rewardName: string;
  remainingPoints: number;
  error?: string;
}> {
  const config = REDEMPTION_CONFIG[redemptionType];
  if (!config) {
    return { success: false, rewardName: "", remainingPoints: 0, error: "未知的兑换项" };
  }

  let account = await prisma.pointAccount.findUnique({
    where: { userId },
  });
  if (!account || account.balance < config.cost) {
    return {
      success: false,
      rewardName: config.name,
      remainingPoints: account?.balance || 0,
      error: `积分不足，当前可用积分 ${account?.balance || 0}，需要 ${config.cost} 积分`,
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    // 扣减积分
    const updatedAccount = await tx.pointAccount.update({
      where: { id: account.id },
      data: {
        balance: { decrement: config.cost },
        totalSpent: { increment: config.cost },
      },
    });

    // 记录明细
    await tx.pointTransaction.create({
      data: {
        accountId: account.id,
        amount: -config.cost,
        type: "SPEND",
        remark: `积分兑换：${config.name}`,
      },
    });

    // 发放对应权益通知
    await tx.notification.create({
      data: {
        userId,
        category: "ORDER",
        type: "SYSTEM_NOTICE",
        title: "🎁 积分权益兑换成功！",
        content: `恭喜！您已成功使用 ${config.cost} 积分兑换「${config.name}」。权益已即时放入您的卡包/权益中心。`,
        link: "/profile?tab=points",
      },
    });

    return updatedAccount;
  });

  return {
    success: true,
    rewardName: config.name,
    remainingPoints: result.balance,
  };
}

/**
 * 查询用户积分流水账本
 */
export async function getPointsLedger(
  userId: string,
  page = 1,
  pageSize = 20
) {
  let account = await prisma.pointAccount.findUnique({
    where: { userId },
  });
  if (!account) {
    account = await prisma.pointAccount.create({
      data: { userId, balance: 0 },
    });
  }

  const [transactions, total] = await Promise.all([
    prisma.pointTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.pointTransaction.count({
      where: { accountId: account.id },
    }),
  ]);

  return {
    balance: account.balance,
    totalEarned: account.totalEarned,
    totalSpent: account.totalSpent,
    transactions,
    total,
    page,
    pageSize,
  };
}
