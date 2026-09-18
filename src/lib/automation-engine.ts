import { prisma } from "@/lib/prisma";

export interface AutomationExecutionReport {
  ruleId: string;
  ruleName: string;
  matchedCount: number;
  successCount: number;
  skippedCount: number;
  errors: string[];
}

/**
 * 频控与免打扰检查：避免高频骚扰用户
 * 每位用户 3 天内最多接收 1 条营销性质自动化通知
 */
async function canSendAutomatedNotification(userId: string): Promise<boolean> {
  try {
    const preference = await prisma.userPreference.findUnique({
      where: { userId },
      select: { notifyOnFollowCampaign: true },
    });
    if (preference && preference.notifyOnFollowCampaign === false) {
      return false; // 用户明确关闭了营销通知
    }

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const recentCount = await prisma.automationLog.count({
      where: {
        userId,
        status: "SUCCESS",
        createdAt: { gte: threeDaysAgo },
      },
    });

    return recentCount === 0;
  } catch {
    return true;
  }
}

/**
 * 运行单条自动化规则
 */
export async function executeAutomationRule(ruleId: string): Promise<AutomationExecutionReport> {
  const rule = await prisma.automationRule.findUnique({
    where: { id: ruleId },
  });

  if (!rule || !rule.enabled) {
    return {
      ruleId,
      ruleName: rule?.name || "未知规则",
      matchedCount: 0,
      successCount: 0,
      skippedCount: 0,
      errors: ["规则不存在或已被禁用"],
    };
  }

  let matchedCount = 0;
  let successCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  const now = new Date();

  try {
    // 1. 收藏 3 天未转化召回
    if (rule.triggerType === "FAVORITE_UNORDERED_3D") {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

      const favorites = await prisma.favorite.findMany({
        where: {
          createdAt: { gte: fourDaysAgo, lte: threeDaysAgo },
        },
        take: 30,
        select: { id: true, userId: true, title: true, resourceType: true, resourceId: true },
      });

      matchedCount = favorites.length;

      for (const fav of favorites) {
        const canSend = await canSendAutomatedNotification(fav.userId);
        if (!canSend) {
          skippedCount++;
          continue;
        }

        await prisma.notification.create({
          data: {
            userId: fav.userId,
            type: "SYSTEM",
            title: "👀 您收藏的便民服务还在等您",
            content: `您之前关注了“${fav.title.slice(0, 20)}”，商家今日仍在接单中，点击查看详情或发起咨询。`,
            link: `/${fav.resourceType.toLowerCase() === "job" ? "jobs" : "info"}/${fav.resourceId}`,
          },
        });

        await prisma.automationLog.create({
          data: {
            ruleId: rule.id,
            userId: fav.userId,
            action: "NOTIFICATION",
            status: "SUCCESS",
            result: `已发送收藏召回通知: ${fav.title.slice(0, 15)}`,
          },
        });

        successCount++;
      }
    }

    // 2. VIP 会员 7 天内到期提醒
    else if (rule.triggerType === "VIP_EXPIRE_7D") {
      const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const eightDaysLater = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);

      const memberships = await prisma.userMembership.findMany({
        where: {
          status: "ACTIVE",
          expireDate: { gte: sevenDaysLater, lte: eightDaysLater },
        },
        take: 50,
        include: { user: true },
      });

      matchedCount = memberships.length;

      for (const m of memberships) {
        const canSend = await canSendAutomatedNotification(m.userId);
        if (!canSend) {
          skippedCount++;
          continue;
        }

        await prisma.notification.create({
          data: {
            userId: m.userId,
            type: "SYSTEM",
            title: "👑 VIP 会员到期提醒",
            content: `您的会员权益将在 7 天后到期。续期可继续享受置顶折扣、免广告及专属客服标识。`,
            link: "/profile?tab=vip",
          },
        });

        await prisma.automationLog.create({
          data: {
            ruleId: rule.id,
            userId: m.userId,
            action: "NOTIFICATION",
            status: "SUCCESS",
            result: "已发送会员到期续费提醒",
          },
        });

        successCount++;
      }
    }

    // 3. 7 天未活跃老用户唤醒
    else if (rule.triggerType === "INACTIVE_USER_7D") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      const inactiveUsers = await prisma.user.findMany({
        where: {
          status: "ACTIVE",
          lastActiveAt: { gte: eightDaysAgo, lte: sevenDaysAgo },
        },
        take: 30,
        select: { id: true, nickname: true, username: true },
      });

      matchedCount = inactiveUsers.length;

      for (const u of inactiveUsers) {
        const canSend = await canSendAutomatedNotification(u.id);
        if (!canSend) {
          skippedCount++;
          continue;
        }

        await prisma.notification.create({
          data: {
            userId: u.id,
            type: "SYSTEM",
            title: "🌟 杨林生活网本周新鲜事速递",
            content: `${u.nickname || "邻居"}您好，杨林经开区近期上新了 30+ 优质岗位与便民好店，欢迎回来看看！`,
            link: "/jobs",
          },
        });

        await prisma.automationLog.create({
          data: {
            ruleId: rule.id,
            userId: u.id,
            action: "NOTIFICATION",
            status: "SUCCESS",
            result: "已发送 7 天未活跃唤醒通知",
          },
        });

        successCount++;
      }
    }

    // 更新规则执行统计
    await prisma.automationRule.update({
      where: { id: rule.id },
      data: {
        executionCount: { increment: successCount },
        lastRunAt: now,
      },
    });
  } catch (err: any) {
    errors.push(err.message || "执行异常");
    console.error(`[AutomationEngine] Execution error on rule ${ruleId}:`, err);
  }

  return {
    ruleId,
    ruleName: rule.name,
    matchedCount,
    successCount,
    skippedCount,
    errors,
  };
}

/**
 * 初始化默认自动化规则（如果数据库中为空）
 */
export async function ensureDefaultAutomationRules(): Promise<void> {
  try {
    const count = await prisma.automationRule.count();
    if (count === 0) {
      await prisma.automationRule.createMany({
        data: [
          {
            name: "用户收藏 3 天未转化温馨提醒",
            triggerType: "FAVORITE_UNORDERED_3D",
            actionType: "NOTIFICATION",
            conditionsJson: JSON.stringify({ intervalDays: 3 }),
            enabled: true,
          },
          {
            name: "VIP 会员到期前 7 天续期提醒",
            triggerType: "VIP_EXPIRE_7D",
            actionType: "NOTIFICATION",
            conditionsJson: JSON.stringify({ daysBeforeExpire: 7 }),
            enabled: true,
          },
          {
            name: "7 天未活跃老街坊召回通知",
            triggerType: "INACTIVE_USER_7D",
            actionType: "NOTIFICATION",
            conditionsJson: JSON.stringify({ inactiveDays: 7 }),
            enabled: true,
          },
        ],
      });
      console.log("[AutomationEngine] Default automation rules seeded.");
    }
  } catch (e) {
    console.error("[AutomationEngine] ensureDefaultAutomationRules failed:", e);
  }
}

/**
 * 一键调度触发所有已启用的自动化规则
 */
export async function triggerAutomationRules() {
  await ensureDefaultAutomationRules();
  const rules = await prisma.automationRule.findMany({ where: { enabled: true } });
  let totalMatched = 0;
  let totalSuccess = 0;
  let totalSkipped = 0;
  const reports: AutomationExecutionReport[] = [];

  for (const r of rules) {
    const rep = await executeAutomationRule(r.id);
    totalMatched += rep.matchedCount;
    totalSuccess += rep.successCount;
    totalSkipped += rep.skippedCount;
    reports.push(rep);
  }

  return {
    matchedCount: totalMatched,
    successCount: totalSuccess,
    skippedCount: totalSkipped,
    reports,
  };
}

