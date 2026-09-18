import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { verifyOrgAccess, createOrgInvite, logOrgAudit, OrgRole } from "@/lib/organization-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get("organizationId");
  if (!orgId) return NextResponse.json({ error: "缺少 organizationId" }, { status: 400 });

  const access = await verifyOrgAccess(session.id, orgId);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          phone: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const invites = await prisma.organizationInvite.findMany({
    where: { organizationId: orgId, isUsed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, members, invites, myRole: access.role });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { organizationId, action, role, invitePhone, memberId, targetUserId } = body;

  if (!organizationId) return NextResponse.json({ error: "缺少 organizationId" }, { status: 400 });

  const access = await verifyOrgAccess(session.id, organizationId, "org:members:manage");
  if (!access.authorized) {
    return NextResponse.json({ error: access.error || "权限不足" }, { status: 403 });
  }

  if (action === "invite") {
    const invite = await createOrgInvite({
      organizationId,
      operatorId: session.id,
      role: (role as OrgRole) || "OPERATOR",
      invitePhone,
    });

    await logOrgAudit({
      organizationId,
      operatorId: session.id,
      operatorName: session.username,
      action: "INVITE_MEMBER",
      details: { role, inviteCode: invite.inviteCode, invitePhone },
    });

    return NextResponse.json({ success: true, invite });
  }

  if (action === "update_role") {
    const targetMember = await prisma.organizationMember.findUnique({
      where: { id: memberId },
    });
    if (!targetMember || targetMember.organizationId !== organizationId) {
      return NextResponse.json({ error: "成员不存在或跨组织" }, { status: 400 });
    }
    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "不能修改组织 Owner 角色" }, { status: 403 });
    }

    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role },
    });

    await logOrgAudit({
      organizationId,
      operatorId: session.id,
      operatorName: session.username,
      action: "UPDATE_MEMBER_ROLE",
      targetId: memberId,
      details: { newRole: role },
    });

    return NextResponse.json({ success: true, member: updated });
  }

  if (action === "remove") {
    const targetMember = await prisma.organizationMember.findUnique({
      where: { id: memberId },
    });
    if (!targetMember || targetMember.organizationId !== organizationId) {
      return NextResponse.json({ error: "成员不存在或跨组织" }, { status: 400 });
    }
    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "禁止移除组织 Owner" }, { status: 403 });
    }

    await prisma.organizationMember.delete({ where: { id: memberId } });

    await logOrgAudit({
      organizationId,
      operatorId: session.id,
      operatorName: session.username,
      action: "REMOVE_MEMBER",
      targetId: memberId,
    });

    return NextResponse.json({ success: true, message: "已移除该成员" });
  }

  return NextResponse.json({ error: "未知操作类型" }, { status: 400 });
}
