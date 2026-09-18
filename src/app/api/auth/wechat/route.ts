import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

/**
 * GET /api/auth/wechat
 * Initiates WeChat OAuth login.
 * Auto-detects WeChat in-app browser vs desktop browser:
 *   - WeChat browser → Service Account web auth (oauth2/authorize)
 *   - Desktop browser → Open Platform QR scan (qrconnect), if configured
 *
 * Required env vars:
 *   WECHAT_MP_APP_ID      — 服务号 AppID (e.g. wx7884de8a5a30bcc0)
 *   WECHAT_MP_APP_SECRET   — 服务号 AppSecret
 *   WECHAT_OPEN_APP_ID     — 开放平台网站应用 AppID (optional, for PC QR login)
 *   WECHAT_OPEN_APP_SECRET — 开放平台网站应用 AppSecret (optional)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const redirectParam = url.searchParams.get("redirect") || url.searchParams.get("returnUrl") || "/profile";
  const redirectTarget = (redirectParam.startsWith("/") && !redirectParam.startsWith("//"))
    ? redirectParam
    : "/profile";

  const ua = req.headers.get("user-agent") || "";
  const isWeChatBrowser = /MicroMessenger/i.test(ua);

  // Get real origin from proxy headers (Nginx forwards x-forwarded-host)
  const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const origin = forwardedHost ? `${proto}://${forwardedHost}` : url.origin;

  const state = randomBytes(16).toString("hex");

  let authUrl: string;

  if (isWeChatBrowser) {
    // 微信内浏览器 → 服务号网页授权
    let appId = process.env.WECHAT_MP_APP_ID;
    if (!appId) {
      try {
        const { getWechatCredentials } = await import("@/lib/wechat-service");
        const creds = await getWechatCredentials();
        appId = creds.appId;
      } catch {}
    }
    if (!appId) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("微信登录尚未配置服务号AppID")}`);
    }
    const redirectUri = encodeURIComponent(
      `https://iyanglin.com/api/auth/wechat/callback`
    );
    authUrl =
      `https://open.weixin.qq.com/connect/oauth2/authorize` +
      `?appid=${appId}` +
      `&redirect_uri=${redirectUri}` +
      `&response_type=code` +
      `&scope=snsapi_userinfo` +
      `&state=${state}` +
      `#wechat_redirect`;
  } else {
    // PC 浏览器 → 开放平台扫码登录
    const appId = process.env.WECHAT_OPEN_APP_ID;
    if (!appId) {
      // 没配置 PC 开放平台 AppID 时，友善重定向至登录页并携带友好提示
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("PC端请使用账号密码登录，或在微信APP内直接打开本站一键登录")}`);
    }
    const redirectUri = encodeURIComponent(
      `${origin}/api/auth/wechat/callback?source=open`
    );
    authUrl =
      `https://open.weixin.qq.com/connect/qrconnect` +
      `?appid=${appId}` +
      `&redirect_uri=${redirectUri}` +
      `&response_type=code` +
      `&scope=snsapi_login` +
      `&state=${state}` +
      `#wechat_redirect`;
  }

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("wechat_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 300,
  });
  response.cookies.set("wechat_oauth_redirect", redirectTarget, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return response;
}
