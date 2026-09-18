import { NextResponse } from "next/server";
import { getJsSdkConfig } from "@/lib/wechat-service";

/**
 * GET /api/wechat/jssdk?url=xxx
 * 为前端生成微信 JS-SDK 签名配置
 * 用于微信内分享、位置获取等功能
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageUrl = searchParams.get("url");

  if (!pageUrl) {
    return NextResponse.json(
      { error: "缺少 url 参数" },
      { status: 400 }
    );
  }

  try {
    const config = await getJsSdkConfig(pageUrl);
    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (err: any) {
    console.error("[WeChat JS-SDK] Error:", err);
    return NextResponse.json(
      { error: err.message || "JS-SDK 签名生成失败" },
      { status: 500 }
    );
  }
}
