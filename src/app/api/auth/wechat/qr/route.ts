import { NextResponse } from "next/server";
import { createQrSession } from "@/lib/qrSessions";
import QRCode from "qrcode";

/**
 * POST /api/auth/wechat/qr
 * 创建微信扫码登录二维码。
 *
 * 核心机制：
 *  - 二维码内容为 https://iyanglin.com/api/auth/wechat/qr/scan?token={token}
 *  - 用户使用微信扫一扫打开网页，触发 OAuth2 网页授权 (snsapi_userinfo)
 *  - 授权回调通过 sns/userinfo 接口安全获取用户真实微信头像与昵称
 *  - 写入 User / WechatAccount 档案，并确认 PC 端扫码登录会话
 *  - 同时返回 qrImageUrl (PNG Data URL) 和 svg 矢量图，全兼容前端组件
 */
export async function POST() {
  const session = createQrSession();

  try {
    const scanUrl = `https://iyanglin.com/api/auth/wechat/qr/scan?token=${session.token}`;

    const [svg, qrImageUrl] = await Promise.all([
      QRCode.toString(scanUrl, {
        type: "svg",
        margin: 1,
        width: 200,
        errorCorrectionLevel: "M",
      }),
      QRCode.toDataURL(scanUrl, {
        margin: 1,
        width: 240,
        errorCorrectionLevel: "M",
      }),
    ]);

    return NextResponse.json({
      token: session.token,
      qrImageUrl,
      svg,
    });
  } catch (err: any) {
    console.error("[WeChat QR] Failed to create QR code:", err);
    return NextResponse.json(
      { error: "创建微信二维码失败: " + (err.message || "未知错误") },
      { status: 500 }
    );
  }
}
