import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface ExperimentVariant {
  experimentKey: string;
  variant: "A" | "B";
  isSubject: boolean;
}

/**
 * 确定性哈希分流算法：同一用户（或设备识别符）在同一实验下永远进入同一分组
 */
export function getExperimentVariant(
  experimentKey: string,
  identifier: string,
  splitRatio = 50 // Variant A 占比 0-100
): "A" | "B" {
  if (!identifier) return "A";
  const hash = crypto
    .createHash("md5")
    .update(`${experimentKey}:${identifier}`)
    .digest("hex");
  const score = parseInt(hash.slice(0, 4), 16) % 100;
  return score < splitRatio ? "A" : "B";
}

/**
 * 记录增长转化行为事件
 */
export async function trackConversion(params: {
  experimentKey: string;
  variant: string;
  conversionEvent: string;
  userId?: string;
  source?: string;
}) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        userId: params.userId || null,
        eventName: `EXP_${params.experimentKey}_${params.conversionEvent}`,
        resourceType: "EXPERIMENT",
        resourceId: params.experimentKey,
        channel: params.source || "direct",
        metadata: {
          variant: params.variant,
          event: params.conversionEvent,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (e) {
    console.error("[ExperimentService] Failed to track conversion:", e);
  }
}

/**
 * 渠道来源格式化规范化
 */
export function normalizeChannelSource(sourceParam?: string | null): string {
  if (!sourceParam) return "direct";
  const s = sourceParam.toLowerCase().trim();
  if (s.includes("wechat") || s.includes("wx") || s.includes("mp")) return "wechat_official";
  if (s.includes("poster") || s.includes("haibao")) return "offline_poster";
  if (s.includes("douyin") || s.includes("tiktok")) return "douyin_shortvideo";
  if (s.includes("xiaohongshu") || s.includes("xhs")) return "xiaohongshu";
  if (s.includes("baidu")) return "baidu_search";
  if (s.includes("community") || s.includes("tieba")) return "local_community";
  return s.slice(0, 30);
}
