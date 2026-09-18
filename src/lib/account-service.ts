import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export type LoginProvider = "PASSWORD" | "PHONE" | "WECHAT" | "ADMIN";

export type LoginMetadata = {
  ip?: string | null;
  userAgent?: string | null;
};

export type WechatIdentity = {
  appId: string;
  openId: string;
  unionId?: string | null;
  nickname?: string | null;
  avatarUrl?: string | null;
};

function generatedWechatUsername() {
  return `wx_${randomBytes(8).toString("hex")}`;
}

function generatedPassword() {
  return hashPassword(randomBytes(32).toString("hex"));
}

function canSyncAvatar(source: string | null | undefined, avatar: string | null) {
  if (!avatar || !source || source === "DEFAULT" || source === "WECHAT") return true;
  if (avatar.includes("qlogo.cn") || avatar.startsWith("/UploadFile/image/2019/")) return true;
  return false;
}

function canSyncNickname(source: string | null | undefined, nickname: string | null) {
  return !nickname || !source || source === "DEFAULT" || source === "WECHAT";
}

export function requestLoginMetadata(request: Request): LoginMetadata {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return {
    ip: forwardedFor?.split(",")[0]?.trim() || null,
    userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
  };
}

export async function ensureAuthAccount(
  userId: string,
  provider: LoginProvider,
  providerAccountId?: string | null,
) {
  return prisma.authAccount.upsert({
    where: { userId_provider: { userId, provider } },
    create: { userId, provider, providerAccountId: providerAccountId || null },
    update: providerAccountId ? { providerAccountId } : {},
  });
}

export async function recordLogin(
  userId: string,
  provider: LoginProvider,
  metadata: LoginMetadata = {},
) {
  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: now, lastActiveAt: now, lastLoginProvider: provider },
    }),
    prisma.authAccount.updateMany({
      where: { userId, provider },
      data: { lastLoginAt: now },
    }),
    prisma.loginLog.create({
      data: {
        userId,
        provider,
        ip: metadata.ip || null,
        userAgent: metadata.userAgent || null,
        success: true,
      },
    }),
  ]);
}

export async function recordFailedLogin(
  provider: LoginProvider,
  metadata: LoginMetadata = {},
) {
  await prisma.loginLog.create({
    data: {
      provider,
      ip: metadata.ip || null,
      userAgent: metadata.userAgent || null,
      success: false,
    },
  });
}

/**
 * Resolves WeChat to one platform user. It deliberately checks the old
 * User.wechat* columns as a compatibility fallback before creating anything.
 */
export async function resolveWechatIdentity(identity: WechatIdentity) {
  const now = new Date();
  const avatarUrl = identity.avatarUrl
    ? identity.avatarUrl.replace(/^http:\/\//i, "https://")
    : null;

  const existingWechat = await prisma.wechatAccount.findUnique({
    where: { appId_openId: { appId: identity.appId, openId: identity.openId } },
    include: { user: true },
  });

  let user = existingWechat?.user || await prisma.user.findFirst({
    where: {
      OR: [
        { wechatOpenId: identity.openId },
        ...(identity.unionId ? [{ wechatUnionId: identity.unionId }] : []),
      ],
    },
  });

  if (!user && identity.unionId) {
    const accountByUnion = await prisma.wechatAccount.findFirst({
      where: { unionId: identity.unionId },
      include: { user: true },
    });
    user = accountByUnion?.user || null;
  }

  let isNewUser = false;
  if (!user) {
    isNewUser = true;
    const shortId = randomBytes(2).toString("hex").toUpperCase();
    user = await prisma.user.create({
      data: {
        username: generatedWechatUsername(),
        passwordHash: generatedPassword(),
        nickname: identity.nickname || `微信用户_${shortId}`,
        nicknameSource: identity.nickname ? "WECHAT" : "DEFAULT",
        avatar: avatarUrl || null,
        avatarSource: avatarUrl ? "WECHAT" : "DEFAULT",
        registrationSource: "WECHAT",
        wechatOpenId: identity.openId,
        wechatUnionId: identity.unionId || null,
        wechatNickname: identity.nickname || null,
        wechatAvatar: avatarUrl || null,
        role: "USER",
      },
    });
  } else {
    const syncAvatar = avatarUrl && canSyncAvatar(user.avatarSource, user.avatar);
    const syncNickname = identity.nickname && canSyncNickname(user.nicknameSource, user.nickname);
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        wechatOpenId: identity.openId,
        ...(identity.unionId ? { wechatUnionId: identity.unionId } : {}),
        wechatNickname: identity.nickname || null,
        wechatAvatar: avatarUrl || null,
        ...(syncAvatar ? { avatar: avatarUrl, avatarSource: "WECHAT" } : {}),
        ...(syncNickname ? { nickname: identity.nickname, nicknameSource: "WECHAT" } : {}),
      },
    });
  }

  await prisma.$transaction([
    prisma.wechatAccount.upsert({
      where: { appId_openId: { appId: identity.appId, openId: identity.openId } },
      create: {
        userId: user.id,
        appId: identity.appId,
        openId: identity.openId,
        unionId: identity.unionId || null,
        nickname: identity.nickname || null,
        avatarUrl: identity.avatarUrl || null,
        lastSyncAt: now,
      },
      update: {
        userId: user.id,
        ...(identity.unionId ? { unionId: identity.unionId } : {}),
        nickname: identity.nickname || null,
        avatarUrl: identity.avatarUrl || null,
        lastSyncAt: now,
      },
    }),
    prisma.authAccount.upsert({
      where: { userId_provider: { userId: user.id, provider: "WECHAT" } },
      create: { userId: user.id, provider: "WECHAT", providerAccountId: identity.openId },
      update: { providerAccountId: identity.openId, lastLoginAt: now },
    }),
  ]);

  return { user, isNewUser };
}
