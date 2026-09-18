import { prisma } from "@/lib/prisma";

export interface SearchGapItem {
  keyword: string;
  count: number;
  lastSearchedAt: Date;
  suggestedAction: string;
}

export interface SupplyDemandGapItem {
  category: string;
  demandCount: number; // 需求发布数
  providerCount: number; // 供给服务者数
  ratio: number; // 供需比
  status: "SURPLUS" | "BALANCED" | "SHORTAGE" | "EXTREME_SHORTAGE";
  suggestion: string;
}

export interface OperationsDigest {
  topSearchGaps: SearchGapItem[];
  supplyDemandGaps: SupplyDemandGapItem[];
  pendingAuditsCount: number;
  highRiskContentsCount: number;
  todayKeyTasks: string[];
}

/**
 * 1. 搜索缺口分析 (Search Gap Analysis)
 * 统计过去 N 天内用户搜索了什么但搜索结果为 0 的高频词汇
 */
export async function getSearchGaps(days = 7): Promise<SearchGapItem[]> {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const zeroResultLogs = await prisma.searchLog.findMany({
      where: {
        createdAt: { gte: since },
        resultCount: 0,
      },
      select: {
        keyword: true,
        createdAt: true,
      },
    });

    // 内存聚合高频无结果词
    const counts: Record<string, { count: number; lastTime: Date }> = {};
    for (const log of zeroResultLogs) {
      const kw = (log.keyword || "").trim();
      if (!kw || kw.length < 2) continue;
      if (!counts[kw]) {
        counts[kw] = { count: 0, lastTime: log.createdAt };
      }
      counts[kw].count += 1;
      if (log.createdAt > counts[kw].lastTime) {
        counts[kw].lastTime = log.createdAt;
      }
    }

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([keyword, data]) => {
        let suggestedAction = "建议联系周边商家入驻补充供给";
        if (keyword.includes("房") || keyword.includes("公寓")) {
          suggestedAction = "建议拓展该区域房源中介与房东发布";
        } else if (keyword.includes("招") || keyword.includes("工")) {
          suggestedAction = "建议拓展园区企业招聘信息";
        } else if (keyword.includes("修") || keyword.includes("通")) {
          suggestedAction = "建议定向招募便民师傅入驻";
        }

        return {
          keyword,
          count: data.count,
          lastSearchedAt: data.lastTime,
          suggestedAction,
        };
      });

    return sorted;
  } catch (err) {
    console.error("[AnalyticsQueryService] getSearchGaps failed:", err);
    return [];
  }
}

/**
 * 2. 供需缺口分析 (Supply-Demand Gap Analysis)
 * 比较需求大厅（ServiceRequest）各分类数量与认证服务者（ServiceProvider）数量
 */
export async function getSupplyDemandGaps(): Promise<SupplyDemandGapItem[]> {
  try {
    // 统计各服务类别需求数
    const requests = await prisma.serviceRequest.groupBy({
      by: ["category"],
      _count: { id: true },
    });

    // 统计各类别认证服务者数
    const providers = await prisma.serviceProvider.groupBy({
      by: ["serviceCategory"],
      where: { verificationStatus: "APPROVED" },
      _count: { id: true },
    });

    const providerMap = new Map<string, number>();
    providers.forEach((p) => {
      providerMap.set(p.serviceCategory, p._count.id);
    });

    // 常见标准品类列表，保证覆盖率
    const standardCategories = [
      "管道疏通",
      "家电维修",
      "保洁清洗",
      "搬家拉货",
      "数码电脑",
      "开锁换锁",
      "水电工程",
      "装修建材",
    ];

    const result: SupplyDemandGapItem[] = [];

    for (const cat of standardCategories) {
      const demand = requests.find((r) => r.category === cat)?._count.id || 0;
      const supply = providerMap.get(cat) || 0;

      let status: SupplyDemandGapItem["status"] = "BALANCED";
      let suggestion = "供需总体均衡，继续保持服务质量监控";

      if (supply === 0 && demand > 0) {
        status = "EXTREME_SHORTAGE";
        suggestion = "🚨 严重供给短缺：该分类已有需求积压，急需拓展至少 2 名师傅入驻";
      } else if (supply > 0 && demand / supply > 5) {
        status = "SHORTAGE";
        suggestion = "⚠️ 供给偏紧：单师傅平均承载需求较高，建议吸纳新师傅入驻";
      } else if (supply > 5 && demand === 0) {
        status = "SURPLUS";
        suggestion = "💡 供给充裕：建议在便民大厅加强向该分类用户的曝光与引流";
      }

      result.push({
        category: cat,
        demandCount: demand,
        providerCount: supply,
        ratio: supply > 0 ? parseFloat((demand / supply).toFixed(1)) : demand > 0 ? 999 : 0,
        status,
        suggestion,
      });
    }

    return result.sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        EXTREME_SHORTAGE: 1,
        SHORTAGE: 2,
        SURPLUS: 3,
        BALANCED: 4,
      };
      return (priorityOrder[a.status] || 9) - (priorityOrder[b.status] || 9);
    });
  } catch (err) {
    console.error("[AnalyticsQueryService] getSupplyDemandGaps failed:", err);
    return [];
  }
}

/**
 * 3. 获取运营今日摘要与关键待办事项（用于运营助手与今日重点任务生成）
 */
export async function getOperationsDigest(): Promise<OperationsDigest> {
  const [searchGaps, supplyGaps, pendingListings, pendingJobs, pendingReports] = await Promise.all([
    getSearchGaps(7),
    getSupplyDemandGaps(),
    prisma.listing.count({ where: { status: "PENDING" } }),
    prisma.job.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
  ]);

  const totalPendingAudits = pendingListings + pendingJobs;
  const severeSupplyShortages = supplyGaps.filter((g) => g.status === "EXTREME_SHORTAGE");
  const topGaps = searchGaps.slice(0, 3);

  const todayKeyTasks: string[] = [];

  if (totalPendingAudits > 0) {
    todayKeyTasks.push(`审核中心尚有 ${totalPendingAudits} 条待审核发布（招聘/便民），需尽快处理避免用户流失。`);
  }

  if (pendingReports > 0) {
    todayKeyTasks.push(`风控举报队列积压 ${pendingReports} 起用户举报，请优先核实高风险信息。`);
  }

  if (severeSupplyShortages.length > 0) {
    todayKeyTasks.push(
      `本地服务发现供给缺口：【${severeSupplyShortages.map((s) => s.category).join("、")}】无师傅入驻，建议定向招募。`
    );
  }

  if (topGaps.length > 0) {
    todayKeyTasks.push(
      `高频无结果搜索词：“${topGaps.map((g) => g.keyword).join("”、“")}”，建议引导发帖或采编对应内容。`
    );
  }

  if (todayKeyTasks.length === 0) {
    todayKeyTasks.push("全站供需与审核平稳运行中，建议策划新一期同城周末活动拉升活跃度。");
  }

  return {
    topSearchGaps: searchGaps,
    supplyDemandGaps: supplyGaps,
    pendingAuditsCount: totalPendingAudits,
    highRiskContentsCount: pendingReports,
    todayKeyTasks,
  };
}
