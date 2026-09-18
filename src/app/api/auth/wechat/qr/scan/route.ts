import { NextResponse } from "next/server";
import { getQrSession, markScanned } from "@/lib/qrSessions";
import { randomBytes } from "node:crypto";

/**
 * GET /api/auth/wechat/qr/scan?token=xxx
 * Called when the user scans the QR code with WeChat.
 * Marks the session as scanned and redirects to WeChat OAuth.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(
      htmlPage("参数错误", "缺少token参数，请重新扫码"),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const session = getQrSession(token);
  if (!session) {
    return new Response(
      htmlPage("二维码已过期", "二维码已过期，请返回电脑端刷新重试"),
      { status: 410, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Mark as scanned
  markScanned(token);

  // Check WeChat service account config
  let appId = process.env.WECHAT_MP_APP_ID;
  if (!appId) {
    try {
      const { getWechatCredentials } = await import("@/lib/wechat-service");
      const creds = await getWechatCredentials();
      appId = creds.appId;
    } catch {}
  }
  if (!appId) {
    return new Response(
      htmlPage("配置错误", "微信登录尚未配置，请联系管理员"),
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Build OAuth URL — redirect to service account OAuth
  const forwardedHost =
    req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const origin = forwardedHost
    ? `${proto}://${forwardedHost}`
    : url.origin;

  const state = randomBytes(16).toString("hex");
  const redirectUri = encodeURIComponent(
    `https://iyanglin.com/api/auth/wechat/callback?qr_token=${token}`
  );

  const authUrl =
    `https://open.weixin.qq.com/connect/oauth2/authorize` +
    `?appid=${appId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=snsapi_userinfo` +
    `&state=${state}` +
    `#wechat_redirect`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("wechat_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 300,
  });

  return response;
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} - 杨林生活站</title>
<style>
body{font-family:-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;
min-height:100vh;margin:0;background:#f5f5f5;color:#333;}
.card{text-align:center;padding:40px 30px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.1);}
h1{font-size:20px;margin-bottom:12px;}
p{color:#666;font-size:14px;}
</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p></div></body>
</html>`;
}
