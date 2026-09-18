import { prisma } from "@/lib/prisma";

export interface MatchReason {
  providerId: string;
  provider: any;
  score: number;
  reasons: string[];
}

/**
 * 手机号隐私脱敏工具函数
 * 13812345678 -> 138****5678
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  const cleaned = phone.trim();
  if (cleaned.length >= 11) {
    return cleaned.slice(0, 3) + "****" + cleaned.slice(-4);
  }
  if (cleaned.length >= 7) {
    return cleaned.slice(0, 3) + "***" + cleaned.slice(-2);
  }
  return cleaned.slice(0, 2) + "***";
}

/**
 * 微信号隐私脱敏
 */
export function maskWechat(wechat?: string | null): string {
  if (!wechat) return "";
  const cleaned = wechat.trim();
  if (cleaned.length <= 3) return cleaned + "***";
  return cleaned.slice(0, 2) + "***" + cleaned.slice(-1);
}

/**
 * 为服务需求执行规则匹配，并为前排服务商分发线索与站内消息
 */
export async function matchAndNotifyProviders(requestId: string): Promise<MatchReason[]> {
  try {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { id: true, nickname: true, username: true } } },
    });

    if (!request) return [];

    // 1. 查询所有有效认证的服务商 (排除已暂停接单与被驳回/封禁的服务商)
    const candidates = await prisma.serviceProvider.findMany({
      where: {
        verificationStatus: "APPROVED",
        operatingStatus: { in: ["OPEN", "BUSY"] },
      },
      include: {
        user: { select: { id: true, username: true, nickname: true } },
        coupons: { where: { enabled: true }, take: 2 },
      },
    });

    const scoredList: MatchReason[] = [];

    for (const p of candidates) {
      let score = 50; // 基础认证分
      const reasons: string[] = ["平台认证师傅"];

      // 类别匹配
      const catMatch =
        p.serviceCategory &&
        (p.serviceCategory.includes(request.category) ||
          request.category.includes(p.serviceCategory) ||
          p.serviceCategory.includes("综合") ||
          p.serviceCategory.includes("其它") ||
          p.intro.includes(request.category));

      if (catMatch) {
        score += 60;
        reasons.unshift(`专业${request.category}`);
      }

      // 区域覆盖
      const areaMatch =
        !p.serviceAreas ||
        p.serviceAreas.length === 0 ||
        p.serviceAreas.includes("杨林全区") ||
        p.serviceAreas.includes("全区覆盖") ||
        p.serviceAreas.some((a) => a.includes(request.area) || request.area.includes(a));

      if (areaMatch) {
        score += 30;
        reasons.push(`覆盖${request.area}`);
      }

      // 营业状态
      if (p.operatingStatus === "OPEN") {
        score += 20;
        reasons.push("接单中·可即时响应");
      } else if (p.operatingStatus === "BUSY") {
        score += 5;
        reasons.push("稍忙·预约上门");
      }

      // 商家会员加权
      if (p.isMember && (!p.memberUntil || p.memberUntil > new Date())) {
        score += 15;
        reasons.push("金牌商家会员");
      }

      // 真实评价好评加权 (仅当评价数 >= 3 时采信)
      if (p.ratingCount >= 3 && p.ratingAvg >= 4.5) {
        score += 15;
        reasons.push(`高好评率 (${p.ratingAvg.toFixed(1)}分)`);
      }

      // 历史完成单量加权 (每完成1单加2分，上限20分)
      const orderBonus = Math.min(20, (p.completedOrders || 0) * 2);
      score += orderBonus;

      scoredList.push({
        providerId: p.id,
        provider: p,
        score,
        reasons,
      });
    }

    // 按最终得分从高到低排序
    scoredList.sort((a, b) => b.score - a.score);

    // 取前 5 位优质匹配师傅
    const topMatches = scoredList.slice(0, 5);

    // 2. 为前 5 位服务商创建/更新 ServiceLead
    for (const item of topMatches) {
      const p = item.provider;
      try {
        await prisma.serviceLead.upsert({
          where: {
            requestId_providerId: {
              requestId: request.id,
              providerId: p.id,
            },
          },
          create: {
            requestId: request.id,
            providerId: p.id,
            status: "NEW",
          },
          update: {},
        });

        // 3. 发送站内消息通知
        if (p.userId) {
          await prisma.notification.create({
            data: {
              userId: p.userId,
              type: "SERVICE_REQUEST_MATCH",
              title: `🔔 匹配到杨林本地新需求：${request.title}`,
              content: `客户在【${request.area}】发布了【${request.category}】需求，期望时间：${request.preferredTime}。请前往商家工作台查阅接单！`,
              link: `/provider/center?requestId=${request.id}`,
            },
          });
        }
      } catch (err) {
        console.error(`[MATCH] Error creating lead for provider ${p.id}:`, err);
      }
    }

    // 4. 若有匹配到服务商，且状态仍为 PENDING_MATCH，则将需求状态流转为 MATCHED
    if (topMatches.length > 0 && request.status === "PENDING_MATCH") {
      await prisma.serviceRequest.update({
        where: { id: request.id },
        data: { status: "MATCHED" },
      });
    }

    return topMatches;
  } catch (e) {
    console.error("[MATCH] Error in matchAndNotifyProviders:", e);
    return [];
  }
}

/**
 * 获取需求的已匹配服务商列表 (供详情页前端展示)
 */
export async function getMatchedProvidersForRequest(requestId: string) {
  try {
    const leads = await prisma.serviceLead.findMany({
      where: { requestId },
      include: {
        provider: {
          include: {
            user: { select: { id: true, nickname: true, avatar: true } },
            coupons: { where: { enabled: true }, take: 2 },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (leads.length > 0) {
      return leads.map((lead) => ({
        leadId: lead.id,
        leadStatus: lead.status,
        provider: lead.provider,
      }));
    }

    // 若尚无线索，重新触发一次匹配
    const matches = await matchAndNotifyProviders(requestId);
    return matches.map((m) => ({
      leadId: null,
      leadStatus: "NEW",
      provider: m.provider,
      reasons: m.reasons,
    }));
  } catch (e) {
    console.error("[MATCH] getMatchedProvidersForRequest error:", e);
    return [];
  }
}

/**
 * 真实评价重新加权计算
 * 仅统计 status === "APPROVED" 的真实评价
 */
export async function recalculateProviderRating(providerId: string): Promise<{ avg: number; count: number }> {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        providerId,
        status: "APPROVED",
      },
      select: { rating: true },
    });

    const count = reviews.length;
    let avg = 5.0;

    if (count > 0) {
      const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
      avg = Math.round((sum / count) * 10) / 10;
    }

    await prisma.serviceProvider.update({
      where: { id: providerId },
      data: {
        ratingAvg: avg,
        ratingCount: count,
      },
    });

    return { avg, count };
  } catch (e) {
    console.error("[RATING] Error recalculating provider rating:", e);
    return { avg: 5.0, count: 0 };
  }
}
