import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureBuiltinWorkflows } from "@/lib/workflow/workflow-engine";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  await ensureBuiltinWorkflows();

  const organizationId = req.nextUrl.searchParams.get("organizationId") || undefined;

  const [rules, executions] = await Promise.all([
    prisma.workflowRule.findMany({
      where: {
        OR: [
          { organizationId: null },
          ...(organizationId ? [{ organizationId }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workflowExecution.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { rule: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({ success: true, rules, executions });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  try {
    const { ruleId, enabled } = await req.json();
    const updated = await prisma.workflowRule.update({
      where: { id: ruleId },
      data: { enabled },
    });

    return NextResponse.json({ success: true, rule: updated });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
