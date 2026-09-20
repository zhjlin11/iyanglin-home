import { NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scryptSync, timingSafeEqual, randomBytes } from "node:crypto";
import { getWechatSubscriptionForUser } from "@/lib/wechat-followers";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export async function GET(request: Request) {
  const session = await getSession(request);
  // 该 GET 同时用于公共导航栏探测登录状态；访客属于正常状态，不应污染浏览器控制台。
  if (!session) return NextResponse.json({ user: null });
  
  if (session.id === "env-admin") {
    return NextResponse.json({ user: { id: session.id, username: session.username, role: session.role } });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      username: true,
      nickname: true,
      phone: true,
      wechatOpenId: true,
      wechatUnionId: true,
      wechatNickname: true,
      avatar: true,
      wechatAvatar: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ user: null });

  // 优先展示自定义昵称 > 微信昵称 > 注册用户名（脱敏清洗内部历史前缀）
  const cleanUsername = user.username.startsWith("user_") && user.username.includes("_legacy_")
    ? user.username.replace(/^user_\d+_legacy_/, "")
    : user.username;
  const displayName = user.nickname || user.wechatNickname || cleanUsername;
  const avatar = user.avatar || user.wechatAvatar || null;
  const wechatSubscription = await getWechatSubscriptionForUser(user.id);

  const wechatBound = Boolean(user.wechatOpenId || user.wechatUnionId);
  const officialAccountFollowStatus: "FOLLOWED" | "NOT_FOLLOWED" | "UNKNOWN" = wechatSubscription?.subscribed
    ? "FOLLOWED"
    : wechatBound
    ? "NOT_FOLLOWED"
    : "UNKNOWN";

  const maskedPhone = user.phone && user.phone.length >= 7
    ? `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}`
    : user.phone || null;

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      phone: maskedPhone,
      avatar,
      displayName,
      role: user.role,
      createdAt: user.createdAt,
      wechatBound,
      wechatNickname: user.wechatNickname || null,
      wechatAvatar: user.wechatAvatar || null,
      officialAccountFollowStatus,
      wechatSubscribed: wechatSubscription?.subscribed ?? false,
    },
  });
}

export async function PATCH(request: Request) {
  if (!await requireAuth(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  
  const session = await getSession(request);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "环境变量管理员无法修改密码，请使用数据库用户" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.oldPassword || !body?.newPassword || body.newPassword.length < 6) {
    return NextResponse.json({ error: "缺少原密码或新密码不符合要求" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  const [salt, hash] = user.passwordHash.split(":");
  const derived = scryptSync(body.oldPassword, salt, 64);
  const isValid = derived.length === Buffer.from(hash, "hex").length && timingSafeEqual(derived, Buffer.from(hash, "hex"));
  
  if (!isValid) {
    return NextResponse.json({ error: "原密码错误" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: session.id },
    data: { passwordHash: hashPassword(body.newPassword) }
  });
  
  await prisma.operationLog.create({
    data: { action: "change_own_password", targetId: session.id, metadata: { username: user.username } }
  });

  // clear session so user must re-login
  const response = NextResponse.json({ ok: true });
  response.cookies.set("yanglin_session", "", { path: "/", maxAge: 0 });
  
  return response;
}
