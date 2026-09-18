import { prisma } from "@/lib/prisma";

export type IdentityMode = "RESIDENT" | "MERCHANT" | "ENTERPRISE";

export interface UserCapabilities {
  isJobSeeker: boolean;
  resumeId?: string;
  isCompany: boolean;
  companyName?: string;
  isProvider: boolean;
  providerId?: string;
  providerCategory?: string;
  isMerchant: boolean;
  shopId?: string;
  shopName?: string;
  isLandlord: boolean;
  housesCount: number;
  isAdmin: boolean;
  verifiedRealName: boolean;
  verifiedEnterprise: boolean;
  verifiedProvider: boolean;
}

/**
 * 获取用户的多重业务能力与身份标签
 */
export async function getUserCapabilities(userId: string): Promise<UserCapabilities> {
  const [
    user,
    resume,
    jobsCount,
    provider,
    shop,
    housesCount,
    verifications,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    }),
    prisma.resume.findFirst({
      where: { authorId: userId },
      select: { id: true },
    }),
    prisma.job.count({
      where: { authorId: userId },
    }),
    prisma.serviceProvider.findUnique({
      where: { userId },
      select: { id: true, serviceCategory: true },
    }),
    prisma.shop.findFirst({
      where: { authorId: userId },
      select: { id: true, name: true },
    }),
    prisma.house.count({
      where: { authorId: userId },
    }),
    prisma.verificationRecord.findMany({
      where: { userId, status: "APPROVED" },
      select: { verifyType: true, companyName: true },
    }),
  ]);

  const verifiedTypes = new Set(verifications.map((v) => v.verifyType));
  const enterpriseRecord = verifications.find((v) => v.verifyType === "ENTERPRISE");

  const isCompany = jobsCount > 0 || verifiedTypes.has("ENTERPRISE");
  const isProvider = !!provider || verifiedTypes.has("PROVIDER");
  const isMerchant = !!shop || verifiedTypes.has("MERCHANT");
  const isLandlord = housesCount > 0 || verifiedTypes.has("LANDLORD");
  const isAdmin = ["ADMIN", "EDITOR", "REVIEWER"].includes(user?.role || "");

  return {
    isJobSeeker: !!resume,
    resumeId: resume?.id,
    isCompany,
    companyName: enterpriseRecord?.companyName || undefined,
    isProvider,
    providerId: provider?.id,
    providerCategory: provider?.serviceCategory,
    isMerchant,
    shopId: shop?.id,
    shopName: shop?.name,
    isLandlord,
    housesCount,
    isAdmin,
    verifiedRealName: verifiedTypes.has("REAL_NAME"),
    verifiedEnterprise: verifiedTypes.has("ENTERPRISE"),
    verifiedProvider: verifiedTypes.has("PROVIDER"),
  };
}

/**
 * 校验并返回用户当前可用模式 (RESIDENT | MERCHANT | ENTERPRISE)
 */
export async function resolveUserMode(
  userId: string,
  preferredMode?: string
): Promise<IdentityMode> {
  const caps = await getUserCapabilities(userId);

  if (preferredMode === "ENTERPRISE") {
    if (caps.isCompany || caps.isAdmin) return "ENTERPRISE";
  }

  if (preferredMode === "MERCHANT") {
    if (caps.isProvider || caps.isMerchant || caps.isAdmin) return "MERCHANT";
  }

  return "RESIDENT";
}

/**
 * 获取全平台统一用户画像 (供个人中心及工作台一次性拉取)
 */
export async function getUnifiedUserProfile(userId: string) {
  const [user, capabilities, pointAccount, coinWallet, unreadNotificationsCount, activeMemberships] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          phone: true,
          wechatNickname: true,
          role: true,
          communityBadge: true,
          createdAt: true,
        },
      }),
      getUserCapabilities(userId),
      prisma.pointAccount.findUnique({
        where: { userId },
      }),
      prisma.coinWallet.findUnique({
        where: { userId },
      }),
      prisma.notification.count({
        where: { userId, readAt: null },
      }),
      prisma.userMembership.findMany({
        where: {
          userId,
          status: "ACTIVE",
          expireDate: { gt: new Date() },
        },
        include: {
          package: true,
        },
      }),
    ]);

  return {
    user,
    capabilities,
    assets: {
      points: pointAccount?.balance || 0,
      coins: coinWallet?.balance || 0,
    },
    unreadNotificationsCount,
    memberships: activeMemberships,
  };
}
