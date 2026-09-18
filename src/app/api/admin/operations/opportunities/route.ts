import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSearchGaps, getSupplyDemandGaps } from "@/lib/analytics-query-service";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || !["ADMIN", "EDITOR"].includes(session.role.toUpperCase())) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status") || "ALL";
    const refresh = searchParams.get("refresh") === "true";

    const [searchGapsRaw, supplyDemandGapsRaw] = await Promise.all([
      getSearchGaps(7),
      getSupplyDemandGaps(),
    ]);

    if (refresh) {
      for (const gap of searchGapsRaw.filter((g) => g.count >= 2)) {
        const oppId = `gap_search_${encodeURIComponent(gap.keyword)}`;
        await prisma.operationOpportunity.upsert({
          where: { id: oppId },
          update: {
            dataJson: JSON.stringify(gap),
            priority: gap.count >= 5 ? "URGENT" : "HIGH",
          },
          create: {
            id: oppId,
            type: "SEARCH_GAP",
            title: `高频未满足搜索：${gap.keyword}`,
            description: `近7天被搜索 ${gap.count} 次但无搜索结果，建议拓展该类目的真实招聘、房产或商家入驻。`,
            dataJson: JSON.stringify(gap),
            priority: gap.count >= 5 ? "URGENT" : "HIGH",
            status: "PENDING",
          },
        });
      }

      for (const gap of supplyDemandGapsRaw.filter((g) => g.demandCount > g.providerCount)) {
        const oppId = `gap_supply_${encodeURIComponent(gap.category)}`;
        await prisma.operationOpportunity.upsert({
          where: { id: oppId },
          update: {
            dataJson: JSON.stringify(gap),
            priority: gap.demandCount > 5 ? "URGENT" : "HIGH",
          },
          create: {
            id: oppId,
            type: "SUPPLY_DEMAND_GAP",
            title: `重点品类【${gap.category}】供需偏紧`,
            description: `近30天需求发布数 ${gap.demandCount} 条，平台入驻商户仅 ${gap.providerCount} 家，建议定向拓品。`,
            dataJson: JSON.stringify(gap),
            priority: gap.demandCount > 5 ? "URGENT" : "HIGH",
            status: "PENDING",
          },
        });
      }
    }

    const whereClause: any = {};
    if (status && status !== "ALL") {
      whereClause.status = status;
    }
    if (type && type !== "ALL") {
      whereClause.type = type;
    }

    const opportunities = await prisma.operationOpportunity.findMany({
      where: whereClause,
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      take: 100,
    });

    const searchGaps = searchGapsRaw.slice(0, 15).map((g) => ({
      keyword: g.keyword,
      query: g.keyword,
      count: g.count,
      lastSearchedAt: g.lastSearchedAt,
      lastSearched: g.lastSearchedAt,
      suggestedAction: g.suggestedAction,
      suggestion: g.suggestedAction,
    }));

    const supplyDemandGaps = supplyDemandGapsRaw.map((g) => ({
      category: g.category,
      demandCount: g.demandCount,
      providerCount: g.providerCount,
      supplyCount: g.providerCount,
      ratio: g.ratio,
      status: g.status,
      severity: g.status === "EXTREME_SHORTAGE" ? "HIGH" : g.status === "SHORTAGE" ? "MEDIUM" : "LOW",
      suggestion: g.suggestion,
      recommendation: g.suggestion,
    }));

    return NextResponse.json({
      success: true,
      opportunities,
      summary: {
        totalOpportunities: opportunities.length,
        searchGapsCount: searchGaps.length,
        supplyDemandGapsCount: supplyDemandGaps.length,
      },
      searchGaps,
      supplyDemandGaps,
    });
  } catch (error: any) {
    console.error("[Opportunities GET] Error:", error);
    return NextResponse.json({ error: error.message || "获取商机数据失败" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || !["ADMIN", "EDITOR"].includes(session.role.toUpperCase())) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少商机ID" }, { status: 400 });
    }

    const updated = await prisma.operationOpportunity.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      opportunity: updated,
      message: "状态更新成功",
    });
  } catch (error: any) {
    console.error("[Opportunities PATCH] Error:", error);
    return NextResponse.json({ error: error.message || "更新商机失败" }, { status: 500 });
  }
}
