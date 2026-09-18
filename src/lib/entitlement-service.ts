import { prisma } from "@/lib/prisma";

export type EntitlementKey =
  | "CAN_PUBLISH_MORE"       // 突破每日发帖额度
  | "PROMOTION_DISCOUNT"     // 商业推广置顶享受优惠折扣
  | "VIEW_ADVANCED_STATS"    // 查看商机与客户深度漏斗分析
  | "CRM_ACCESS"             // 客户关系管理与全量跟进
  | "PRIORITY_REVIEW";       // 发布内容享受优先加急审核

/**
 * 校验用户是否享有指定权益
 */
export async function hasEntitlement(
  userId: string,
  key: EntitlementKey
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // 管理员与审核员拥有全量特权
  if (user && ["ADMIN", "EDITOR", "REVIEWER"].includes(user.role)) {
    return true;
  }

  // 检查有效会员卡
  const activeMemberships = await prisma.userMembership.findMany({
    where: {
      userId,
      status: "ACTIVE",
      expireDate: { gt: new Date() },
    },
    include: {
      package: true,
    },
  });

  if (activeMemberships.length === 0) {
    return false;
  }

  for (const m of activeMemberships) {
    const pkg = m.package;
    if (!pkg) continue;

    if (key === "CAN_PUBLISH_MORE") {
      return true; // 拥有任意有效会员均享有发帖额度翻倍
    }

    if (key === "PROMOTION_DISCOUNT") {
      if (pkg.level >= 2 || pkg.targetModule === "SHOP" || pkg.targetModule === "JOB") {
        return true;
      }
    }

    if (key === "VIEW_ADVANCED_STATS" || key === "CRM_ACCESS") {
      if (pkg.level >= 2 || pkg.targetModule === "JOB" || pkg.targetModule === "SHOP") {
        return true;
      }
    }

    if (key === "PRIORITY_REVIEW") {
      if (pkg.level >= 1) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 批量拉取用户所有权益布尔值
 */
export async function getUserEntitlements(
  userId: string
): Promise<Record<EntitlementKey, boolean>> {
  const keys: EntitlementKey[] = [
    "CAN_PUBLISH_MORE",
    "PROMOTION_DISCOUNT",
    "VIEW_ADVANCED_STATS",
    "CRM_ACCESS",
    "PRIORITY_REVIEW",
  ];

  const results = await Promise.all(
    keys.map(async (k) => [k, await hasEntitlement(userId, k)] as const)
  );

  return Object.fromEntries(results) as Record<EntitlementKey, boolean>;
}

/**
 * 获取用户在特定频道的发布限额与已发数量
 */
export async function getPublishQuota(
  userId: string,
  channel: "JOB" | "HOUSE" | "LISTING" | "POST"
): Promise<{ usedToday: number; dailyLimit: number; canPublish: boolean }> {
  const hasMore = await hasEntitlement(userId, "CAN_PUBLISH_MORE");
  const baseLimit =
    channel === "JOB" ? 3 : channel === "HOUSE" ? 3 : channel === "LISTING" ? 5 : 10;
  const dailyLimit = hasMore ? baseLimit * 3 : baseLimit;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let usedToday = 0;
  if (channel === "JOB") {
    usedToday = await prisma.job.count({
      where: { authorId: userId, createdAt: { gte: todayStart } },
    });
  } else if (channel === "HOUSE") {
    usedToday = await prisma.house.count({
      where: { authorId: userId, createdAt: { gte: todayStart } },
    });
  } else if (channel === "LISTING") {
    usedToday = await prisma.listing.count({
      where: { authorId: userId, createdAt: { gte: todayStart } },
    });
  } else if (channel === "POST") {
    usedToday = await prisma.post.count({
      where: { authorId: userId, createdAt: { gte: todayStart } },
    });
  }

  return {
    usedToday,
    dailyLimit,
    canPublish: usedToday < dailyLimit,
  };
}
