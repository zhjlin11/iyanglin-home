import { NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || !["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "无权访问用户管理中心" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true,
        sessionVersion: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ total: users.length, users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "获取用户失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession(request);
  if (!session || !["ADMIN"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "无权修改用户权限" }, { status: 403 });
  }

  try {
    const { userId, role, status, action, newPassword } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "缺少目标用户 ID" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "目标用户不存在" }, { status: 404 });
    }

    // Safety Rule: Cannot disable or demote the last ADMIN or current logged in ADMIN self!
    if (session.id === userId && (action === "DISABLE" || (role && role !== "ADMIN"))) {
      return NextResponse.json({ error: "不能对当前登录管理员账号执行禁用或降级操作！" }, { status: 400 });
    }

    const updateData: any = {};

    if (role) {
      updateData.role = role.toUpperCase();
    }

    if (status) {
      updateData.status = status.toUpperCase();
      if (status.toUpperCase() === "DISABLED") {
        updateData.sessionVersion = { increment: 1 };
      }
    }

    // Keep the legacy action name compatible while the new UI uses LOGOUT_ALL.
    if (action === "LOGOUT_ALL" || action === "REVOKE_SESSION") {
      updateData.sessionVersion = { increment: 1 };
    }

    if (action === "RESET_PASSWORD" && newPassword && newPassword.length >= 6) {
      updateData.passwordHash = hashPassword(newPassword);
      updateData.sessionVersion = { increment: 1 };
      updateData.passwordChangedAt = new Date();
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        nickname: true,
        role: true,
        status: true,
        sessionVersion: true,
      },
    });

    // Log Operation
    await prisma.operationLog.create({
      data: {
        userId: session.id,
        action: `ADMIN_MANAGE_USER_${action || "UPDATE"}`,
        targetId: userId,
        metadata: { targetUsername: targetUser.username, role, status, action },
      },
    });

    return NextResponse.json({ success: true, user: updated, message: "用户账号权限与 Session 状态修改成功！" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "操作失败" }, { status: 500 });
  }
}
