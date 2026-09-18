import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(request, ["ADMIN", "EDITOR", "REVIEWER"]);
  if (!session) return NextResponse.json({ error: "无管理员权限" }, { status: 403 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true,
      avatarSource: true,
      nicknameSource: true,
      registrationSource: true,
      wechatAvatar: true,
      wechatNickname: true,
      wechatOpenId: true,
      wechatUnionId: true,
      phone: true,
      phoneVerifiedAt: true,
      role: true,
      status: true,
      sessionVersion: true,
      passwordChangedAt: true,
      createdAt: true,
      lastLoginAt: true,
      lastActiveAt: true,
      lastLoginProvider: true,
      authAccounts: {
        select: { provider: true, providerAccountId: true, createdAt: true, lastLoginAt: true },
        orderBy: { createdAt: "asc" as const },
      },
      wechatFollower: {
        select: {
          openId: true, subscribed: true, subscribeTime: true,
          unsubscribedAt: true, firstSeenSource: true, qrScene: true,
          lastSyncedAt: true, lastInteractionAt: true,
        },
      },
      pointAccount: {
        select: { balance: true, totalEarned: true },
      },
      _count: {
        select: { posts: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  // Mask sensitive data for non-ADMIN roles
  const safeUser = { ...user } as any;
  if (session.role !== "ADMIN") {
    if (safeUser.wechatOpenId) safeUser.wechatOpenId = safeUser.wechatOpenId.slice(0, 8) + "***";
    if (safeUser.wechatUnionId) safeUser.wechatUnionId = safeUser.wechatUnionId.slice(0, 8) + "***";
    if (safeUser.phone) safeUser.phone = safeUser.phone.slice(0, 3) + "****" + safeUser.phone.slice(-4);
  }

  return NextResponse.json({ success: true, user: safeUser });
}
