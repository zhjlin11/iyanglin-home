import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWechatUserInfo } from "@/lib/wechat-service";
import {
  getWechatSubscriptionForUser,
  upsertWechatFollower,
} from "@/lib/wechat-followers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const status = await getWechatSubscriptionForUser(session.id);
  return NextResponse.json({
    subscribed: status?.subscribed ?? false,
    verified: Boolean(status),
  });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      wechatOpenId: true,
      wechatUnionId: true,
      wechatNickname: true,
      wechatAvatar: true,
    },
  });
  if (!user?.wechatOpenId) {
    return NextResponse.json({ subscribed: false, verified: false, error: "当前账号未绑定公众号微信身份" });
  }

  const previous = await getWechatSubscriptionForUser(user.id);
  try {
    const wxUser = await getWechatUserInfo(user.wechatOpenId);
    if (wxUser.errcode) throw new Error("微信接口暂时无法核验");

    const subscribed = Number(wxUser.subscribe) === 1;
    const status = await upsertWechatFollower({
      openId: user.wechatOpenId,
      unionId: wxUser.unionid || user.wechatUnionId,
      nickname: wxUser.nickname || user.wechatNickname,
      avatar: wxUser.headimgurl || user.wechatAvatar,
      subscribed,
      subscribeTime: wxUser.subscribe_time
        ? new Date(Number(wxUser.subscribe_time) * 1000)
        : previous?.subscribeTime || null,
      unsubscribedAt: !subscribed && previous?.subscribed ? new Date() : previous?.unsubscribedAt || null,
      firstSeenSource: "OAUTH",
    }, user.id);

    return NextResponse.json({ subscribed: status.subscribed, verified: true });
  } catch {
    return NextResponse.json({
      subscribed: previous?.subscribed ?? false,
      verified: false,
      error: "暂时无法连接微信核验，请稍后重试",
    }, { status: 502 });
  }
}
