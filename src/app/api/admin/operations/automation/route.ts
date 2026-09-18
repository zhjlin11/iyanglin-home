import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerAutomationRules } from "@/lib/automation-engine";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || !["ADMIN", "EDITOR"].includes(session.role.toUpperCase())) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const [rules, recentLogs] = await Promise.all([
      prisma.automationRule.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.automationLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      success: true,
      rules,
      recentLogs,
    });
  } catch (error: any) {
    console.error("[Automation GET] Error:", error);
    return NextResponse.json({ error: error.message || "获取自动化规则失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "仅管理员可执行自动化规则调度" }, { status: 403 });
    }

    const body = await req.json();
    const { action, ruleId } = body;

    // 手动触发一次规则检查
    if (action === "trigger_all") {
      const report = await triggerAutomationRules();
      return NextResponse.json({
        success: true,
        report,
        message: `自动化规则执行完毕: 匹配 ${report.matchedCount} 项，发送 ${report.successCount} 项通知，跳过 ${report.skippedCount} 项（防骚扰频控）。`,
      });
    }

    // 启用/停用单条规则
    if (action === "toggle" && ruleId) {
      const rule = await prisma.automationRule.findUnique({ where: { id: ruleId } });
      if (!rule) return NextResponse.json({ error: "规则不存在" }, { status: 404 });

      const updated = await prisma.automationRule.update({
        where: { id: ruleId },
        data: { enabled: !rule.enabled },
      });

      return NextResponse.json({
        success: true,
        rule: updated,
        message: updated.enabled ? "规则已启用" : "规则已停用",
      });
    }

    return NextResponse.json({ error: "无效指令" }, { status: 400 });
  } catch (error: any) {
    console.error("[Automation POST] Error:", error);
    return NextResponse.json({ error: error.message || "执行自动化调度失败" }, { status: 500 });
  }
}
