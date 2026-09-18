import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { verifyOrgAccess } from "@/lib/organization-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get("organizationId");
  if (!orgId) return NextResponse.json({ error: "缺少 organizationId" }, { status: 400 });

  const access = await verifyOrgAccess(session.id, orgId, "orders:read");
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: 403 });

  const providerId = access.organization.providerId;
  if (!providerId) return NextResponse.json({ success: true, orders: [] });

  const where: any = { providerId };

  // 技师隔离规则：如果是技师角色，只能查看指派给自己的工单！
  if (access.role === "TECHNICIAN") {
    where.technicianId = session.id;
  }

  const orders = await prisma.serviceOrder.findMany({
    where,
    include: {
      technician: { select: { id: true, nickname: true, username: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, orders, role: access.role });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { organizationId, action, orderId, technicianId, notes, completionImages } = body;

  const access = await verifyOrgAccess(session.id, organizationId);
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: 403 });

  const providerId = access.organization.providerId;
  const order = await prisma.serviceOrder.findUnique({ where: { id: orderId } });
  if (!order || order.providerId !== providerId) {
    return NextResponse.json({ error: "订单不存在或跨组织越权" }, { status: 400 });
  }

  // 1. 管理员/店长指派技师
  if (action === "assign_technician") {
    if (!["OWNER", "ADMIN", "OPERATOR"].includes(access.role as string)) {
      return NextResponse.json({ error: "仅管理员或店长有权指派技师" }, { status: 403 });
    }

    const updated = await prisma.serviceOrder.update({
      where: { id: orderId },
      data: { technicianId },
    });

    return NextResponse.json({ success: true, order: updated });
  }

  // 2. 技师更新服务履约状态 / 提交完工
  if (action === "technician_progress") {
    // 技师只能修改分配给自己的工单
    if (access.role === "TECHNICIAN" && order.technicianId !== session.id) {
      return NextResponse.json({ error: "您只能提交分配给自己的工单进展" }, { status: 403 });
    }

    const updated = await prisma.serviceOrder.update({
      where: { id: orderId },
      data: {
        completionNotes: notes || order.completionNotes,
        completionImages: completionImages || order.completionImages,
        status: "WAITING_CONFIRM",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, order: updated });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
