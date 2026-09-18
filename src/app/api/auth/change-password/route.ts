import { NextResponse } from "next/server";
import { getSession, signSession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "未登录或不支持此操作" }, { status: 401 });
  }

  try {
    const { oldPassword, newPassword } = await request.json();
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "新密码长度至少需要6位" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const isValid = verifyPassword(oldPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "原密码输入错误" }, { status: 400 });
    }

    const newHash = hashPassword(newPassword);
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        passwordHash: newHash,
        sessionVersion: { increment: 1 },
        passwordChangedAt: new Date(),
      },
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: session.id,
        type: "ACCOUNT_SECURITY",
        title: "密码修改成功",
        content: "您的账号密码已成功修改，旧设备登录凭证已失效。",
      },
    });

    // Generate new token for current device
    const newToken = signSession({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      sessionVersion: updatedUser.sessionVersion,
    });

    const response = NextResponse.json({ success: true, message: "密码已修改，旧设备登录凭证已作废！" });
    response.headers.set(
      "Set-Cookie",
      `yanglin_session=${newToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器异常" }, { status: 500 });
  }
}
