import { prisma } from "@/lib/prisma";

export type VipPackagePrivileges = {
  maxJobs?: number;              // 招聘: 最大可发布职位数
  maxResumes?: number;           // 招聘: 最大可查看简历联系方式数
  maxInterviews?: number;        // 招聘: 在线面试邀约次数
  matchTimes?: number;           // 相亲: 尊享红娘人工牵线次数
  seeContactFree?: boolean;      // 相亲: 免费查看心仪嘉宾微信号/手机
  giftPinnedDays?: number;       // 商家/房产: 赠送黄金置顶天数
  momentsLimitPerMonth?: number; // 商家: 每月发布动态额度
};

// 预设老站经典会员套餐
const DEFAULT_PACKAGES = [
  // 1. 招聘企业直聘套餐 (复刻老站 163kCMS admin_job_payconfig.html)
  {
    targetModule: "JOB",
    name: "企业基础招聘月卡",
    level: 1,
    priceCents: 9800, // ¥98.00
    durationDays: 30,
    badgeText: "企业VIP",
    description: "适合中小型商户快速招人，包含10条在招职位与30份简历下载特权",
    privileges: { maxJobs: 10, maxResumes: 30, maxInterviews: 20 },
    sortOrder: 1,
  },
  {
    targetModule: "JOB",
    name: "企业标准招聘季卡",
    level: 2,
    priceCents: 23800, // ¥238.00 (打8折)
    durationDays: 90,
    badgeText: "金牌雇主",
    description: "适合高频用工企业，包含25条职位、100份简历下载及无限次面试邀约",
    privileges: { maxJobs: 25, maxResumes: 100, maxInterviews: 100 },
    sortOrder: 2,
  },
  {
    targetModule: "JOB",
    name: "企业年度霸屏年卡",
    level: 3,
    priceCents: 68800, // ¥688.00
    durationDays: 365,
    badgeText: "钻石名企",
    description: "杨林大学城知名企业专属，全年无限发布职位、赠送500份简历与专属客服",
    privileges: { maxJobs: 100, maxResumes: 500, maxInterviews: 500 },
    sortOrder: 3,
  },

  // 2. 相亲交友 VIP 会员 (复刻老站 admin_love_payconfig.html / admin_vip.html)
  {
    targetModule: "LOVE",
    name: "单身贵族月度VIP",
    level: 1,
    priceCents: 6800, // ¥68.00
    durationDays: 30,
    badgeText: "相亲VIP",
    description: "解锁专属VIP皇冠角标，免费查看嘉宾联系方式，赠送3次红娘人工牵线",
    privileges: { matchTimes: 3, seeContactFree: true },
    sortOrder: 4,
  },
  {
    targetModule: "LOVE",
    name: "至尊红娘季度VIP",
    level: 2,
    priceCents: 15800, // ¥158.00
    durationDays: 90,
    badgeText: "至尊VIP",
    description: "红娘一对一重点推荐，赠送10次牵线服务与个人主页7天黄金置顶",
    privileges: { matchTimes: 10, seeContactFree: true, giftPinnedDays: 7 },
    sortOrder: 5,
  },

  // 3. 商家入驻黄页年费 (复刻老站 admin_info_biz_feeconfig.html)
  {
    targetModule: "SHOP",
    name: "口碑好店金牌年费会员",
    level: 1,
    priceCents: 29800, // ¥298.00/年
    durationDays: 365,
    badgeText: "金牌商家",
    description: "商家专属主页、认证蓝V标识、赠送15天全站置顶及每月30条动态发布",
    privileges: { giftPinnedDays: 15, momentsLimitPerMonth: 30 },
    sortOrder: 6,
  },
];

/** 初始化默认会员等级包(幂等) */
export async function seedDefaultVipPackages() {
  const count = await prisma.memberVipPackage.count();
  if (count > 0) return;

  for (const pkg of DEFAULT_PACKAGES) {
    await prisma.memberVipPackage.create({
      data: {
        targetModule: pkg.targetModule,
        name: pkg.name,
        level: pkg.level,
        priceCents: pkg.priceCents,
        durationDays: pkg.durationDays,
        badgeText: pkg.badgeText,
        description: pkg.description,
        privileges: pkg.privileges,
        isEnabled: true,
        sortOrder: pkg.sortOrder,
      },
    });
  }
}

/** 获取会员等级包列表 */
export async function listVipPackages(targetModule?: string) {
  await seedDefaultVipPackages();
  return prisma.memberVipPackage.findMany({
    where: targetModule ? { targetModule } : undefined,
    orderBy: [{ targetModule: "asc" }, { sortOrder: "asc" }],
  });
}

/** 创建会员套餐 */
export async function createVipPackage(data: {
  targetModule: string;
  name: string;
  level: number;
  priceCents: number;
  durationDays: number;
  privileges: VipPackagePrivileges;
  description?: string;
  badgeText?: string;
  isEnabled?: boolean;
}) {
  return prisma.memberVipPackage.create({
    data: {
      targetModule: data.targetModule,
      name: data.name,
      level: data.level,
      priceCents: data.priceCents,
      durationDays: data.durationDays,
      privileges: data.privileges as any,
      description: data.description,
      badgeText: data.badgeText,
      isEnabled: data.isEnabled ?? true,
    },
  });
}

/** 更新会员套餐 */
export async function updateVipPackage(id: string, data: Partial<{
  name: string;
  level: number;
  priceCents: number;
  durationDays: number;
  privileges: VipPackagePrivileges;
  description: string;
  badgeText: string;
  isEnabled: boolean;
}>) {
  return prisma.memberVipPackage.update({
    where: { id },
    data: data as any,
  });
}

/** 删除会员套餐 */
export async function deleteVipPackage(id: string) {
  return prisma.memberVipPackage.delete({ where: { id } });
}

/** 查询用户在特定板块的有效会员状态及剩余配额 */
export async function getUserMembership(userId: string, targetModule: string) {
  const now = new Date();
  const membership = await prisma.userMembership.findFirst({
    where: {
      userId,
      targetModule,
      status: "ACTIVE",
      expireDate: { gt: now },
    },
    include: { package: true },
    orderBy: { expireDate: "desc" },
  });
  return membership;
}

/** 扣减会员权益配额 (如发布职位扣减 remainingJobs) */
export async function consumeMembershipQuota(
  userId: string,
  targetModule: string,
  quotaKey: "remainingJobs" | "remainingResumes" | "matchTimes" | "giftPinnedDays",
  amount: number = 1
): Promise<{ success: boolean; message: string; remaining?: number }> {
  const membership = await getUserMembership(userId, targetModule);
  if (!membership) {
    return { success: false, message: "未开通有效会员或会员已过期" };
  }

  const quota = (membership.remainingQuota as Record<string, number>) || {};
  const current = quota[quotaKey] ?? 0;

  if (current < amount) {
    return { success: false, message: `您的会员权益额度不足 (剩余 ${current})，请升级或单次付费`, remaining: current };
  }

  quota[quotaKey] = current - amount;

  await prisma.userMembership.update({
    where: { id: membership.id },
    data: { remainingQuota: quota },
  });

  return { success: true, message: `扣减权益成功，剩余 ${quota[quotaKey]}`, remaining: quota[quotaKey] };
}

/** 开通/续费会员 */
export async function grantMembership(userId: string, packageId: string) {
  const pkg = await prisma.memberVipPackage.findUnique({ where: { id: packageId } });
  if (!pkg) throw new Error("会员套餐不存在");

  const now = new Date();
  const existing = await getUserMembership(userId, pkg.targetModule);

  let startDate = now;
  let expireDate = new Date(now.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);

  // 初始配额
  const p = (pkg.privileges as VipPackagePrivileges) || {};
  let initialQuota: Record<string, number> = {
    remainingJobs: p.maxJobs || 0,
    remainingResumes: p.maxResumes || 0,
    matchTimes: p.matchTimes || 0,
    giftPinnedDays: p.giftPinnedDays || 0,
  };

  // 如果已有未过期的同板块会员，顺延天数并累加配额
  if (existing) {
    startDate = existing.startDate;
    expireDate = new Date(existing.expireDate.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);
    const oldQuota = (existing.remainingQuota as Record<string, number>) || {};
    initialQuota = {
      remainingJobs: (oldQuota.remainingJobs || 0) + (p.maxJobs || 0),
      remainingResumes: (oldQuota.remainingResumes || 0) + (p.maxResumes || 0),
      matchTimes: (oldQuota.matchTimes || 0) + (p.matchTimes || 0),
      giftPinnedDays: (oldQuota.giftPinnedDays || 0) + (p.giftPinnedDays || 0),
    };

    return prisma.userMembership.update({
      where: { id: existing.id },
      data: {
        packageId: pkg.id,
        expireDate,
        remainingQuota: initialQuota,
        status: "ACTIVE",
      },
    });
  }

  return prisma.userMembership.create({
    data: {
      userId,
      packageId: pkg.id,
      targetModule: pkg.targetModule,
      startDate,
      expireDate,
      status: "ACTIVE",
      remainingQuota: initialQuota,
    },
  });
}
