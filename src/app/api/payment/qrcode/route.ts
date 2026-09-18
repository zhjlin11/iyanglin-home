import { NextResponse } from "next/server";
import QRCode from "qrcode";

/**
 * GET /api/payment/qrcode?text=xxx
 *
 * 将文本生成 QR 码 PNG 图片返回（用于微信支付扫码）
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");

  if (!text) {
    return NextResponse.json({ error: "缺少 text 参数" }, { status: 400 });
  }

  try {
    const buffer = await QRCode.toBuffer(text, {
      type: "png",
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "QR码生成失败" }, { status: 500 });
  }
}
