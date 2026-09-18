import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/wechat-bindstatus
 * Check if current user has WeChat account linked.
 */
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { wechatOpenId: true, wechatNickname: true, wechatAvatar: true },
  });

  return NextResponse.json({
    bound: !!user?.wechatOpenId,
    wechatNickname: user?.wechatNickname || null,
    wechatAvatar: user?.wechatAvatar || null,
  });
}
