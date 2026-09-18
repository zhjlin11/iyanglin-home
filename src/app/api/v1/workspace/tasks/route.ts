import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { verifyOrgAccess } from "@/lib/organization-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get("organizationId");
  if (!orgId) return NextResponse.json({ error: "缺少 organizationId" }, { status: 400 });

  const access = await verifyOrgAccess(session.id, orgId);
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: 403 });

  const tasks = await prisma.organizationTask.findMany({
    where: { organizationId: orgId },
    include: {
      assignee: { select: { id: true, nickname: true, username: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, tasks });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { organizationId, action, taskId, title, content, type, assigneeId, priority, dueAt, status } = body;

  const access = await verifyOrgAccess(session.id, organizationId, "tasks:execute");
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: 403 });

  if (action === "create") {
    const task = await prisma.organizationTask.create({
      data: {
        organizationId,
        title,
        content,
        type: type || "LEAD_FOLLOW",
        assigneeId: assigneeId || session.id,
        priority: priority || "NORMAL",
        dueAt: dueAt ? new Date(dueAt) : null,
      },
    });
    return NextResponse.json({ success: true, task });
  }

  if (action === "update_status") {
    const task = await prisma.organizationTask.findUnique({ where: { id: taskId } });
    if (!task || task.organizationId !== organizationId) {
      return NextResponse.json({ error: "任务不存在或跨组织" }, { status: 400 });
    }
    const updated = await prisma.organizationTask.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });
    return NextResponse.json({ success: true, task: updated });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
