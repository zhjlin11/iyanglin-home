import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AGENT_TOOLS } from "@/lib/agent/agent-tools";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  try {
    const { actionLogId, organizationId } = await req.json();
    if (!actionLogId) {
      return NextResponse.json({ success: false, error: "缺少 actionLogId" }, { status: 400 });
    }

    const undoTool = AGENT_TOOLS["undo_action"];
    const result = await undoTool.execute({
      input: { actionLogId },
      userId: session.userId,
      organizationId,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "已成功撤销该动作" });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
