import { prisma } from "@/lib/prisma";
import { signSession } from "@/lib/auth";

export async function getMiniProgramCredentials() {
  let appId = process.env.WECHAT_MINI_APP_ID?.trim() || "";
  let appSecret = process.env.WECHAT_MINI_APP_SECRET?.trim() || "";

  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ["wechat_mini_app_id", "wechat_mini_app_secret"] } },
    });
    settings.forEach((s) => {
      if (!appId && s.key === "wechat_mini_app_id" && s.value) appId = s.value.trim();
      if (!appSecret && s.key === "wechat_mini_app_secret" && s.value) appSecret = s.value.trim();
    });
  } catch {}

  return { appId: appId || "wx_mock_mini_app_id", appSecret: appSecret || "mock_mini_secret" };
}

/**
 * 小程序 code2Session 换取 openid 与 unionid
 */
export async function code2Session(jsCode: string): Promise<{
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}> {
  const { appId, appSecret } = await getMiniProgramCredentials();

  // 若未配置外部真机密钥，或测试 mock code，优雅模拟返回测试 openid
  if (appId.startsWith("wx_mock") || jsCode.startsWith("mock_")) {
    return {
      openid: `mock_mini_openid_${jsCode}`,
      session_key: "mock_session_key_123456",
      unionid: jsCode.includes("union") ? "mock_unionid_shared_2026" : undefined,
    };
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${jsCode}&grant_type=authorization_code`;
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

/**
 * 小程序登录并执行统一多端账号归并 (UnionID 优先，杜绝重复创建账号)
 */
export async function loginOrMergeMiniProgramUser(params: {
  openid: string;
  unionid?: string;
  nickname?: string;
  avatarUrl?: string;
  currentUserId?: string; // 若已登录需要执行绑定
}) {
  const { appId } = await getMiniProgramCredentials();

  // 1. 优先通过 WechatIdentity 查找已有小程序身份
  let identity = await prisma.wechatIdentity.findUnique({
    where: {
      appType_openId: {
        appType: "MINI_PROGRAM",
        openId: params.openid,
      },
    },
    include: { user: true },
  });

  // 2. 如果存在 UnionID，跨端查找公众号已有用户或现有绑定的 User
  let targetUser = identity?.user || null;

  if (!targetUser && params.unionid) {
    const unionIdentity = await prisma.wechatIdentity.findFirst({
      where: { unionId: params.unionid },
      include: { user: true },
    });
    if (unionIdentity?.user) {
      targetUser = unionIdentity.user;
    } else {
      targetUser = await prisma.user.findFirst({
        where: { wechatUnionId: params.unionid },
      });
    }
  }

  // 3. 如果当前请求上下文已有登录用户，直接绑定到当前用户
  if (!targetUser && params.currentUserId) {
    targetUser = await prisma.user.findUnique({
      where: { id: params.currentUserId },
    });
  }

  // 4. 如果全平台均无对应用户，创建新 User (以微信手机号或默认昵称)
  if (!targetUser) {
    const username = `wx_mini_${params.openid.slice(-8)}`;
    targetUser = await prisma.user.create({
      data: {
        username,
        nickname: params.nickname || "微信小程序用户",
        avatar: params.avatarUrl || null,
        passwordHash: "NOPASSWORD_OAUTH_MINI",
        role: "USER",
        status: "ACTIVE",
        registrationSource: "MINI_PROGRAM",
        wechatUnionId: params.unionid || null,
      },
    });
  }

  // 5. 创建或更新 WechatIdentity 映射
  if (!identity) {
    identity = await prisma.wechatIdentity.create({
      data: {
        userId: targetUser.id,
        appType: "MINI_PROGRAM",
        appId,
        openId: params.openid,
        unionId: params.unionid || null,
      },
      include: { user: true },
    });
  } else if (!identity.unionId && params.unionid) {
    await prisma.wechatIdentity.update({
      where: { id: identity.id },
      data: { unionId: params.unionid },
    });
  }

  // 6. 发放统一 Session Token
  const token = signSession({
    id: targetUser.id,
    username: targetUser.username,
    role: targetUser.role,
    avatar: targetUser.avatar || undefined,
    sessionVersion: targetUser.sessionVersion,
  });

  return {
    user: {
      id: targetUser.id,
      username: targetUser.username,
      nickname: targetUser.nickname,
      avatar: targetUser.avatar,
      role: targetUser.role,
    },
    token,
  };
}
