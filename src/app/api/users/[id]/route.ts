import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function maskIdentifier(value: string | null | undefined) {
  if (!value) return null;
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(request, ["ADMIN", "EDITOR", "REVIEWER"]);
  if (!session) return NextResponse.json({ error: "无管理员权限" }, { status: 403 });
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      authAccounts: { select: { provider: true, providerAccountId: true, createdAt: true, lastLoginAt: true } },
      wechatAccounts: true,
      wechatFollower: { select: { subscribed: true, subscribeTime: true, unsubscribedAt: true } },
      loginLogs: { orderBy: { createdAt: "desc" }, take: 10, select: { provider: true, success: true, createdAt: true, ip: true, userAgent: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  const canViewRawIdentity = session.role === "ADMIN";
  const wechatAccounts = user.wechatAccounts.map((account) => ({
    ...account,
    openId: canViewRawIdentity ? account.openId : maskIdentifier(account.openId),
    unionId: canViewRawIdentity ? account.unionId : maskIdentifier(account.unionId),
  }));
  return NextResponse.json({
    success: true,
    user: {
      ...user,
      wechatOpenId: canViewRawIdentity ? user.wechatOpenId : maskIdentifier(user.wechatOpenId),
      wechatUnionId: canViewRawIdentity ? user.wechatUnionId : maskIdentifier(user.wechatUnionId),
      wechatAccounts,
      loginLogs: user.loginLogs.map((log) => ({
        ...log,
        ip: canViewRawIdentity ? log.ip : maskIdentifier(log.ip),
        userAgent: undefined,
      })),
    },
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(request, ["ADMIN"]);
  if (!session) return NextResponse.json({ error: "仅超级管理员可解绑微信" }, { status: 403 });
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, include: { authAccounts: true } });
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  const remainingLoginMethods = user.authAccounts.filter((account) => account.provider !== "WECHAT");
  if (remainingLoginMethods.length === 0) {
    return NextResponse.json({ error: "该账号仅绑定微信，请先绑定手机号或设置密码后再解绑" }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.wechatAccount.deleteMany({ where: { userId: id } }),
    prisma.authAccount.deleteMany({ where: { userId: id, provider: "WECHAT" } }),
    prisma.wechatFollower.updateMany({ where: { userId: id }, data: { userId: null } }),
    prisma.user.update({
      where: { id },
      data: { wechatOpenId: null, wechatUnionId: null, wechatNickname: null, wechatAvatar: null },
    }),
    prisma.operationLog.create({
      data: { userId: session.id, action: "admin_unbind_wechat", metadata: { targetUserId: id } },
    }),
  ]);
  return NextResponse.json({ success: true });
}
