import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSession } from "@/lib/auth";
import { ensureAuthAccount, recordLogin, requestLoginMetadata } from "@/lib/account-service";

// In-memory rate limiter for registration (max 5 reqs / hr per IP)
const regRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRegRateLimit(ip: string, limit = 5, windowMs = 3600000): boolean {
  const now = Date.now();
  const record = regRateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    regRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  record.count += 1;
  return record.count > limit;
}

export async function POST(request: Request) {

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  if (checkRegRateLimit(clientIp, 10, 3600000)) {
    return NextResponse.json(
      { success: false, code: "REGISTER_RATE_LIMITED", error: "注册过于频繁，请稍后再试" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);

  if (!body?.username || !body?.password || body.password.length < 6) {
    return NextResponse.json({ error: "请输入有效的用户名和至少6位密码" }, { status: 400 });
  }

  // Security: Ignore any client-submitted role or admin claims
  const cleanUsername = String(body.username).trim();

  try {
    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        passwordHash: hashPassword(body.password),
        role: "USER", // STRICT SERVER-ENFORCED ROLE
        registrationSource: "PASSWORD",
      },
    });

    await ensureAuthAccount(user.id, "PASSWORD", user.username);
    await recordLogin(user.id, "PASSWORD", requestLoginMetadata(request));

    const token = signSession({
      id: user.id,
      username: user.username,
      role: "USER",
      sessionVersion: user.sessionVersion || 1,
    });

    const response = NextResponse.json({ ok: true, user: { id: user.id, username: user.username, role: "USER" } });
    const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 24 * 60 * 60 };

    response.cookies.set("yanglin_session", token, options);
    return response;
  } catch (error) {
    return NextResponse.json({ error: "用户名已存在，请换一个重试" }, { status: 409 });
  }
}
