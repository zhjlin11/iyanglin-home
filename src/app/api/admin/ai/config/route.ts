import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAiConfig, saveAiConfig } from "@/lib/ai-config-store";
import { prisma } from "@/lib/prisma";
import { invokeAi } from "@/lib/ai-service";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || !["ADMIN", "EDITOR"].includes(session.role.toUpperCase())) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // 测试连通性
    if (action === "test") {
      const startTime = Date.now();
      try {
        const testRes = await invokeAi({
          scene: "CHAT",
          systemPrompt: "你是一个测试助手，请回复PONG。",
          userPrompt: "PING",
          userId: session.id,
          fallbackFn: () => "PONG (Local Heuristic Fallback)",
        });

        const latency = Date.now() - startTime;
        return NextResponse.json({
          ok: true,
          latencyMs: latency,
          isFallback: testRes.isFallback,
          reply: testRes.content,
          message: testRes.isFallback
            ? "API Key 未配置或网络不通，已成功切换为智能本地规则兜底。"
            : "大模型连接成功，响应正常！",
        });
      } catch (err: any) {
        return NextResponse.json({
          ok: false,
          error: err.message || "连通测试失败",
          message: "连接异常，系统自动进入保护降级模式。",
        });
      }
    }

    // 获取当前配置
    const config = await getAiConfig();
    const safeConfig = {
      ...config,
      apiKey: config.apiKey ? "sk-••••••••••••••••••••••••" : "",
    };

    // 统计数据
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayCount, todayTokens, todayCost, avgLatency, recentLogs] = await Promise.all([
      prisma.aiUsageLog.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.aiUsageLog.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { inputTokens: true, outputTokens: true },
      }),
      prisma.aiUsageLog.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { costCents: true },
      }),
      prisma.aiUsageLog.aggregate({
        where: { createdAt: { gte: todayStart } },
        _avg: { latencyMs: true },
      }),
      prisma.aiUsageLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    const totalTokensSum = ((todayTokens._sum?.inputTokens || 0) + (todayTokens._sum?.outputTokens || 0));

    return NextResponse.json({
      success: true,
      config: safeConfig,
      stats: {
        todayCalls: todayCount,
        todayTokens: totalTokensSum,
        todayCostCents: todayCost._sum?.costCents || 0,
        avgLatencyMs: Math.round(avgLatency._avg?.latencyMs || 0),
      },
      recentLogs,
    });
  } catch (error: any) {
    console.error("[AI Config GET] Error:", error);
    return NextResponse.json({ error: error.message || "获取失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "只有超级管理员可配置 AI 服务" }, { status: 403 });
    }

    const body = await req.json();

    // 过滤脱敏 key
    const updateData = { ...body };
    if (updateData.apiKey && updateData.apiKey.includes("••••")) {
      delete updateData.apiKey;
    }

    const updated = await saveAiConfig(updateData);

    return NextResponse.json({
      success: true,
      config: {
        ...updated,
        apiKey: updated.apiKey ? "sk-••••••••••••••••••••••••" : "",
      },
      message: "AI 模型与规则配置更新成功！",
    });
  } catch (error: any) {
    console.error("[AI Config POST] Error:", error);
    return NextResponse.json({ error: error.message || "更新失败" }, { status: 500 });
  }
}
