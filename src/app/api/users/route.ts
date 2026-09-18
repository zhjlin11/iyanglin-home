import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { randomBytes, scryptSync } from "node:crypto";
import { ensureAuthAccount } from "@/lib/account-service";

export const dynamic = "force-dynamic";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export async function GET(request: Request) {
  const session = await requireAuth(request, ["ADMIN", "EDITOR", "REVIEWER"]);
  if (!session) return NextResponse.json({ error: "无管理员权限" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
  const search = searchParams.get("search")?.trim() || "";
  const role = searchParams.get("role") || "ALL";
  const status = searchParams.get("status") || "ALL";
  const registrationSource = searchParams.get("registrationSource") || "ALL";
  const wechatStatus = searchParams.get("wechatStatus") || "ALL";
  const quick = searchParams.get("quick") || "ALL";
  const sort = searchParams.get("sort") || "CREATED_DESC";
  const adminsOnly = searchParams.get("adminsOnly") === "true";

  const where: Record<string, any> = {};

  if (adminsOnly) {
    // 管理员中心：只返回拥有管理权限的账号，排除普通注册会员
    where.role = { in: ["ADMIN", "EDITOR", "REVIEWER"] };
  } else if (role !== "ALL") {
    where.role = role;
  }

  if (status === "ACTIVE") {
    where.status = { not: "DISABLED" };
  } else if (status === "DISABLED") {
    where.status = "DISABLED";
  }

  if (registrationSource !== "ALL") {
    where.registrationSource = registrationSource;
  }

  if (quick === "TODAY") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.createdAt = { gte: today };
  }

  if (wechatStatus === "BOUND") {
    where.OR = [{ wechatOpenId: { not: null } }, { authAccounts: { some: { provider: "WECHAT" } } }];
  } else if (wechatStatus === "UNBOUND") {
    where.AND = [
      ...(where.AND || []),
      { wechatOpenId: null },
      { authAccounts: { none: { provider: "WECHAT" } } },
    ];
  } else if (wechatStatus === "FOLLOWING") {
    where.AND = [...(where.AND || []), { wechatFollower: { is: { subscribed: true } } }];
  } else if (wechatStatus === "UNFOLLOWED") {
    where.AND = [...(where.AND || []), { wechatFollower: { is: { subscribed: false, unsubscribedAt: { not: null } } } }];
  }

  if (search) {
    const searchConditions = [
      { username: { contains: search, mode: "insensitive" } },
      { nickname: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { wechatNickname: { contains: search, mode: "insensitive" } },
      ...(session.role === "ADMIN" ? [{ wechatOpenId: { contains: search } }] : []),
    ];
    if (where.OR) {
      where.AND = [...(where.AND || []), { OR: searchConditions }];
    } else {
      where.OR = searchConditions;
    }
  }

  const [total, users, activeCount, lockedCount, staffCount] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        wechatAvatar: true,
        wechatNickname: true,
        wechatOpenId: true,
        phone: true,
        role: true,
        status: true,
        sessionVersion: true,
        createdAt: true,
        registrationSource: true,
        lastLoginAt: true,
        lastLoginProvider: true,
        lastActiveAt: true,
        avatarSource: true,
        nicknameSource: true,
        authAccounts: { select: { provider: true } },
        wechatAccounts: { select: { subscribed: true, subscribeAt: true, unsubscribeAt: true } },
        wechatFollower: { select: { subscribed: true, subscribeTime: true, unsubscribedAt: true } },
      },
      orderBy: sort === "LOGIN_DESC" ? { lastLoginAt: "desc" } : { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where: { status: { not: "DISABLED" } } }),
    prisma.user.count({ where: { status: "DISABLED" } }),
    prisma.user.count({ where: { role: { in: ["ADMIN", "EDITOR", "REVIEWER"] } } }),
  ]);

  const [totalAll, wechatUserCount, phoneUserCount, boundWechatCount, todayNewCount, registrationSources] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { OR: [{ wechatOpenId: { not: null } }, { authAccounts: { some: { provider: "WECHAT" } } }] } }),
    prisma.user.count({ where: { OR: [{ phone: { not: null } }, { authAccounts: { some: { provider: "PHONE" } } }] } }),
    prisma.user.count({ where: { authAccounts: { some: { provider: "WECHAT" } } } }),
    prisma.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.user.groupBy({ by: ["registrationSource"], _count: { _all: true } }),
  ]);

  const safeUsers = users.map((user) => {
    const providers = new Set(user.authAccounts.map((account) => account.provider));
    if (user.phone) providers.add("PHONE");
    if (user.wechatOpenId) providers.add("WECHAT");
    // All historical users can continue to use their existing password unless
    // they were created through a login-only channel with no password account.
    if (user.authAccounts.some((account) => account.provider === "PASSWORD")) providers.add("PASSWORD");
    const canonicalWechat = user.wechatAccounts[0];
    const follower = user.wechatFollower;
    const subscribed = canonicalWechat?.subscribed ?? follower?.subscribed ?? false;
    const bound = providers.has("WECHAT");
    const unfollowed = Boolean(canonicalWechat?.unsubscribeAt ?? follower?.unsubscribedAt);
    const effectiveAvatar = user.avatar || user.wechatAvatar || null;
    return {
      ...user,
      avatar: effectiveAvatar,
      wechatOpenId: undefined,
      wechatUnionId: undefined,
      authAccounts: undefined,
      wechatAccounts: undefined,
      wechatFollower: undefined,
      loginProviders: Array.from(providers),
      wechat: {
        bound,
        subscribed,
        state: !bound ? "UNBOUND" : subscribed ? "FOLLOWING" : unfollowed ? "UNFOLLOWED" : "BOUND",
        subscribeAt: canonicalWechat?.subscribeAt ?? follower?.subscribeTime ?? null,
        unsubscribeAt: canonicalWechat?.unsubscribeAt ?? follower?.unsubscribedAt ?? null,
      },
    };
  });

  return NextResponse.json({
    success: true,
    users: safeUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
    stats: {
      total: totalAll,
      active: activeCount,
      locked: lockedCount,
      staff: staffCount,
      wechatUsers: wechatUserCount,
      phoneUsers: phoneUserCount,
      boundWechat: boundWechatCount,
      todayNew: todayNewCount,
    },
    availableFilters: {
      registrationSources: registrationSources
        .map((item) => item.registrationSource)
        .filter((source): source is string => Boolean(source)),
    },
    permissions: {
      canManageUsers: session.role === "ADMIN",
      canViewRawIdentity: session.role === "ADMIN",
    },
  });
}

export async function POST(request: Request) {
  const session = await requireAuth(request, ["ADMIN"]);
  if (!session) return NextResponse.json({ error: "无管理员权限" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body?.username || !body?.password || !["admin", "editor", "reviewer", "ADMIN", "EDITOR", "REVIEWER"].includes(body.role)) {
    return NextResponse.json({ error: "缺少用户名、密码或无效的管理角色" }, { status: 400 });
  }
  const passwordHash = hashPassword(body.password);
  try {
    const user = await prisma.user.create({
      data: {
        username: String(body.username).trim(),
        nickname: body.nickname ? String(body.nickname).trim() : undefined,
        phone: body.phone ? String(body.phone).trim() : undefined,
        passwordHash,
        role: body.role.toUpperCase(),
        status: "ACTIVE",
        registrationSource: "ADMIN",
        nicknameSource: body.nickname ? "ADMIN" : "DEFAULT",
        avatarSource: "DEFAULT",
      },
    });
    await ensureAuthAccount(user.id, "PASSWORD", user.username);
    await ensureAuthAccount(user.id, "ADMIN", user.username);

    await prisma.operationLog.create({
      data: {
        userId: session.id,
        action: "create_admin_user",
        metadata: { targetUserId: user.id, username: user.username, role: user.role },
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "用户名或手机号已存在" }, { status: 400 });
    }
    return NextResponse.json({ error: "创建管理账号失败" }, { status: 500 });
  }
}
