import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { executeAgentWorkflow } from "@/lib/agent/agent-engine";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { agentRole, prompt, organizationId } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ success: false, error: "指令内容不能为空" }, { status: 400 });
    }

    const result = await executeAgentWorkflow({
      agentRole: agentRole || "OPERATIONS_AGENT",
      prompt,
      userId: session.userId,
      organizationId,
    });

    return NextResponse.json({
      success: true,
      reply: result.reply,
      executedActions: result.executedActions,
    });
  } catch (err: any) {
    console.error("[AgentExecuteAPI] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
