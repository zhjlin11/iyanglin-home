import { NextRequest, NextResponse } from "next/server";
import { code2Session, loginOrMergeMiniProgramUser } from "@/lib/wechat-miniprogram";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code, nickname, avatarUrl } = body;

    if (!code) {
      return NextResponse.json({ error: "缺少小程序登录凭证 code" }, { status: 400 });
    }

    const sessionRes = await code2Session(code);
    if (!sessionRes.openid) {
      return NextResponse.json(
        { error: sessionRes.errmsg || "微信小程序鉴权失败" },
        { status: 400 }
      );
    }

    const currentSession = await getSession(req);
    const result = await loginOrMergeMiniProgramUser({
      openid: sessionRes.openid,
      unionid: sessionRes.unionid,
      nickname,
      avatarUrl,
      currentUserId: currentSession?.id,
    });

    return NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
    });
  } catch (err: any) {
    console.error("[MINI_LOGIN_ERR]", err);
    return NextResponse.json({ error: err.message || "登录处理失败" }, { status: 500 });
  }
}
