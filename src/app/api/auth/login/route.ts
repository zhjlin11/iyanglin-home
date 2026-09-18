import { NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSession, isLegacyHash, upgradePasswordHash } from "@/lib/auth";
import { ensureAuthAccount, recordFailedLogin, recordLogin, requestLoginMetadata } from "@/lib/account-service";

// In-memory rate limiter for login (max 10 reqs / 15 mins per IP)
const loginRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(ip: string, limit = 10, windowMs = 900000): boolean {
  const now = Date.now();
  const record = loginRateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    loginRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  record.count += 1;
  return record.count > limit;
}

export async function POST(request: Request) {

  try { validateEnv(); } catch { return NextResponse.json({ error: "服务器配置不完整" }, { status: 503 }); }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  // Rate limiting check
  if (checkLoginRateLimit(clientIp, 10, 900000)) {
    return NextResponse.json(
      { success: false, code: "LOGIN_RATE_LIMITED", error: "尝试登录过于频繁，请15分钟后再试" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);

  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: "账号或密码错误" }, { status: 400 });
  }

  const cleanUsername = String(body.username).trim();
  const loginMetadata = requestLoginMetadata(request);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: cleanUsername },
        { authAccounts: { some: { provider: "PASSWORD", providerAccountId: cleanUsername } } },
      ],
    },
  });

  if (!user) {
    await recordFailedLogin("PASSWORD", loginMetadata).catch(() => undefined);
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }

  const isValid = verifyPassword(body.password, user.passwordHash);

  if (!isValid) {
    await recordFailedLogin("PASSWORD", loginMetadata).catch(() => undefined);
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }

  if (user.status !== "ACTIVE") {
    return NextResponse.json({ error: "该账号已被禁用" }, { status: 403 });
  }

  // [AUDIT FIX P2-03] Auto-migrate weak PBKDF2 hash to scrypt on successful login
  if (isLegacyHash(user.passwordHash)) {
    upgradePasswordHash(user.id, body.password).catch(() => {});
  }

  await ensureAuthAccount(user.id, "PASSWORD", user.username);
  await recordLogin(user.id, "PASSWORD", loginMetadata);

  const token = signSession({
    id: user.id,
    username: user.username,
    role: user.role,
    sessionVersion: user.sessionVersion || 1,
  });

  const response = NextResponse.json({ ok: true, user: { id: user.id, username: user.username, role: user.role } });
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 24 * 60 * 60 };

  // Set new session cookie
  response.cookies.set("yanglin_session", token, options);
  // Clear old cookies to avoid confusion
  response.cookies.set("yanglin_admin", "", { ...options, maxAge: 0 });
  response.cookies.set("yanglin_role", "", { ...options, maxAge: 0 });

  return response;
}
