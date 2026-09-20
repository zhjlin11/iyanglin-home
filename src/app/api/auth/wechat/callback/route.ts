import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession, getSession } from "@/lib/auth";
import { markConfirmed } from "@/lib/qrSessions";
import { recordLogin, requestLoginMetadata, resolveWechatIdentity } from "@/lib/account-service";
import { getWechatCredentials } from "@/lib/wechat-service";
import {
  getWechatSubscriptionForUser,
  linkWechatFollowerToUser,
} from "@/lib/wechat-followers";

/**
 * GET /api/auth/wechat/callback
 * WeChat OAuth callback — handles both service account and open platform flows.
 * Exchanges code for token, gets user info, creates/links account, issues session.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const source = url.searchParams.get("source"); // "open" for open platform
  const qrToken = url.searchParams.get("qr_token"); // QR scan flow

  // Get real origin from proxy headers
  const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const origin = forwardedHost ? `${proto}://${forwardedHost}` : url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=wechat_cancelled`);
  }

  // Verify CSRF state (only for direct OAuth flow without qr_token)
  if (!qrToken) {
    const cookieHeader = req.headers.get("cookie") || "";
    const savedState = cookieHeader.match(/wechat_oauth_state=([^;]+)/)?.[1];
    if (!savedState || savedState !== state) {
      return NextResponse.redirect(`${origin}/login?error=wechat_state_mismatch`);
    }
  }

  // Determine which AppID/Secret to use
  let appId: string | undefined;
  let appSecret: string | undefined;

  if (source === "open") {
    // Open Platform (PC QR scan)
    appId = process.env.WECHAT_OPEN_APP_ID;
    appSecret = process.env.WECHAT_OPEN_APP_SECRET;
  } else {
    // Service Account (WeChat in-app browser). Use the same secure settings
    // resolver as the official-account service, including configured DB values.
    try {
      const credentials = await getWechatCredentials();
      appId = credentials.appId;
      appSecret = credentials.appSecret;
    } catch {
      return NextResponse.redirect(`${origin}/login?error=wechat_not_configured`);
    }
  }

  if (!appId || !appSecret) {
    return NextResponse.redirect(`${origin}/login?error=wechat_not_configured`);
  }

  try {
    // Step 1: Exchange code for access_token
    const tokenUrl =
      `https://api.weixin.qq.com/sns/oauth2/access_token` +
      `?appid=${appId}` +
      `&secret=${appSecret}` +
      `&code=${code}` +
      `&grant_type=authorization_code`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.errcode) {
      console.error("[WeChat OAuth] Token error:", tokenData);
      return NextResponse.redirect(`${origin}/login?error=wechat_token_failed`);
    }

    const { access_token, openid, unionid } = tokenData;

    // Step 2: Get user info from WeChat
    const userInfoUrl =
      `https://api.weixin.qq.com/sns/userinfo` +
      `?access_token=${access_token}` +
      `&openid=${openid}` +
      `&lang=zh_CN`;

    const userInfoRes = await fetch(userInfoUrl);
    const wxUser = await userInfoRes.json();

    if (wxUser.errcode) {
      console.error("[WeChat OAuth] UserInfo error:", wxUser);
      return NextResponse.redirect(`${origin}/login?error=wechat_userinfo_failed`);
    }

    const wxNickname = wxUser.nickname || "微信用户";
    const wxAvatar = wxUser.headimgurl || null;

    // Step 3: Resolve the canonical WeChat identity before creating a user.
    // This checks both the new identity table and legacy User.wechat* records.
    // If the user is already logged in (e.g. paying/binding), link to the existing session
    const currentSession = await getSession(req);
    const { user, isNewUser } = await resolveWechatIdentity({
      appId,
      openId: openid,
      unionId: unionid || null,
      nickname: wxNickname,
      avatarUrl: wxAvatar,
    }, currentSession?.id);

    if (isNewUser) {
      // Points creation is optional and must never prevent sign-in.
      try {
        const account = await prisma.pointAccount.create({
          data: { userId: user.id, balance: 20, totalEarned: 20 },
        });
        await prisma.pointTransaction.create({
          data: { accountId: account.id, amount: 20, type: "AVATAR", remark: "微信注册赠送 +20 积分" },
        });
      } catch {
        // Existing or unavailable points accounts are intentionally ignored.
      }
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.redirect(`${origin}/login?error=account_disabled`);
    }

    await recordLogin(user.id, "WECHAT", requestLoginMetadata(req));

    // 网页授权只负责登录，不等于关注公众号。把两种状态单独记录。
    const subscriptionStatus = source === "open"
      ? await getWechatSubscriptionForUser(user.id)
      : await linkWechatFollowerToUser({
          userId: user.id,
          openId: openid,
          unionId: unionid || null,
          source: "OAUTH",
        });

    // Step 4: Issue session
    if (qrToken) {
      // QR scan flow — mark QR session as confirmed, show success page on mobile
      markConfirmed(qrToken, user.id);
      const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>登录成功 - 杨林生活站</title>
<style>
body{font-family:-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;
min-height:100vh;margin:0;background:#f0fdf4;color:#333;}
.card{text-align:center;padding:40px 30px;background:#fff;border-radius:16px;
box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:320px;}
.icon{font-size:64px;margin-bottom:16px;}
h1{font-size:20px;color:#16a34a;margin-bottom:8px;}
p{color:#666;font-size:14px;line-height:1.6;}
</style></head>
<body><div class="card">
<div class="icon">✅</div>
<h1>登录成功</h1>
<p>请返回电脑端继续操作<br/>电脑端将自动登录</p>
</div></body></html>`;
      const response = new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
      return response;
    }

    // Direct flow — issue session cookie and redirect
    const token = signSession({
      id: user.id,
      username: user.username,
      role: user.role,
      avatar: user.avatar || user.wechatAvatar || undefined,
      sessionVersion: user.sessionVersion || 1,
    });

    // 读取目标跳转路径（由 /api/auth/wechat 设置在 Cookie 中）
    const cookieHeader = req.headers.get("cookie") || "";
    const redirectCookie = cookieHeader.match(/wechat_oauth_redirect=([^;]+)/)?.[1];
    let nextPath = "/profile";
    if (redirectCookie) {
      try {
        const decoded = decodeURIComponent(redirectCookie);
        if (decoded.startsWith("/") && !decoded.startsWith("//")) {
          nextPath = decoded;
        }
      } catch {}
    }

    const response = NextResponse.redirect(`${origin}${nextPath}`);
    response.cookies.set("yanglin_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    // Clean up state and redirect cookies
    response.cookies.set("wechat_oauth_state", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set("wechat_oauth_redirect", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error("[WeChat OAuth] Unexpected error:", err);
    return NextResponse.redirect(`${origin}/login?error=wechat_server_error`);
  }
}
