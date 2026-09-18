import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession } from "@/lib/auth";
import { verifyCode } from "@/lib/smsVerifyStore";
import { randomBytes, scryptSync } from "node:crypto";
import { ensureAuthAccount, recordLogin, requestLoginMetadata } from "@/lib/account-service";

/**
 * POST /api/auth/sms/verify
 * 验证短信验证码 — 验证成功后自动登录或注册
 *
 * Body: { phone: string, code: string }
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.phone || !body?.code) {
    return NextResponse.json(
      { error: "请输入手机号和验证码" },
      { status: 400 }
    );
  }

  const phone = String(body.phone).trim();
  const code = String(body.code).trim();

  // 验证手机号格式
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "手机号格式不正确" }, { status: 400 });
  }

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "验证码为6位数字" }, { status: 400 });
  }

  // 验证码校验
  const result = verifyCode(phone, code);
  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    // 查找已有用户（按手机号）
    let user = await prisma.user.findFirst({
      where: { phone },
    });

    let isNewUser = false;

    if (!user) {
      // 自动注册新用户
      isNewUser = true;

      const maskedPhone = `${phone.slice(0, 3)}****${phone.slice(7)}`;
      let username = `phone_${phone.slice(-4)}`;
      let attempt = 0;
      while (true) {
        const existing = await prisma.user.findUnique({
          where: { username },
        });
        if (!existing) break;
        attempt++;
        username = `phone_${phone.slice(-4)}_${randomBytes(3).toString("hex")}`;
        if (attempt > 5) {
          username = `phone_${randomBytes(6).toString("hex")}`;
          break;
        }
      }

      // 手机号用户设置随机密码
      const salt = randomBytes(16).toString("hex");
      const passwordHash = `${salt}:${scryptSync(
        randomBytes(32).toString("hex"),
        salt,
        64
      ).toString("hex")}`;

      user = await prisma.user.create({
        data: {
          username,
          nickname: maskedPhone,
          phone,
          phoneVerifiedAt: new Date(),
          passwordHash,
          role: "USER",
          registrationSource: "PHONE",
          nicknameSource: "DEFAULT",
          avatarSource: "DEFAULT",
        },
      });

      // 注册赠送积分
      try {
        const account = await prisma.pointAccount.create({
          data: { userId: user.id, balance: 20, totalEarned: 20 },
        });
        await prisma.pointTransaction.create({
          data: {
            accountId: account.id,
            amount: 20,
            type: "AVATAR",
            remark: "手机号注册赠送 +20 积分",
          },
        });
      } catch {
        // 积分创建可选
      }
    } else {
      // 更新手机验证时间
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerifiedAt: new Date(),
        },
      });
    }

    // 检查用户状态
    if (user.status === "DISABLED") {
      return NextResponse.json(
        { error: "该账号已被禁用" },
        { status: 403 }
      );
    }

    await ensureAuthAccount(user.id, "PHONE", phone);
    await recordLogin(user.id, "PHONE", requestLoginMetadata(request));

    // 签发 session
    const token = signSession({
      id: user.id,
      username: user.username,
      role: user.role,
      sessionVersion: user.sessionVersion || 1,
    });

    const response = NextResponse.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
      },
    });

    response.cookies.set("yanglin_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err) {
    console.error("[SMS验证] 异常:", err);
    return NextResponse.json(
      { error: "服务器异常，请稍后重试" },
      { status: 500 }
    );
  }
}
