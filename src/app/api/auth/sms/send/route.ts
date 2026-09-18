import { NextResponse } from "next/server";
import { isRateLimited, getClientIp } from "@/lib/rate-limiter";
import { generateCode, sendSmsCode } from "@/lib/tencent-sms";
import { canSend, recordSend, saveCode } from "@/lib/smsVerifyStore";

/**
 * POST /api/auth/sms/send
 * 发送短信验证码
 *
 * Body: { phone: string }
 */
export async function POST(request: Request) {
  // [AUDIT FIX P1-01] Rate limiting: 5 SMS per 10 minutes per IP
  const clientIp = getClientIp(request);
  if (isRateLimited("sms", clientIp, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "短信发送过于频繁，请稍后再试" }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.phone) {
    return NextResponse.json({ error: "请输入手机号" }, { status: 400 });
  }

  const phone = String(body.phone).trim();

  // 验证手机号格式 (中国大陆)
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "手机号格式不正确" }, { status: 400 });
  }

  // 频率限制
  const sendCheck = canSend(phone);
  if (!sendCheck.ok) {
    return NextResponse.json(
      { error: `发送过于频繁，请${sendCheck.waitSeconds}秒后重试` },
      { status: 429 }
    );
  }

  // 生成验证码
  const code = generateCode();

  // 发送短信
  const result = await sendSmsCode(phone, code);

  if (!result.success) {
    console.error("[SMS发送失败]", phone, result.error);
    return NextResponse.json(
      { error: result.error || "短信发送失败，请稍后重试" },
      { status: 500 }
    );
  }

  // 存储验证码
  saveCode(phone, code);
  recordSend(phone);

  return NextResponse.json({ success: true, message: "验证码已发送" });
}
