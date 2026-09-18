import { prisma } from "@/lib/prisma";

// 默认板块配置(首次运行自动初始化)
const DEFAULT_MODULES = [
  { moduleKey: "job",     moduleName: "招聘信息", sortOrder: 1, pinnedPriceDaily: 500, highlightPriceDaily: 300, refreshPriceOnce: 100 },
  { moduleKey: "house",   moduleName: "房产楼市", sortOrder: 2, pinnedPriceDaily: 800, highlightPriceDaily: 500, refreshPriceOnce: 200 },
  { moduleKey: "shop",    moduleName: "好店商家", sortOrder: 3, pinnedPriceDaily: 1000, highlightPriceDaily: 500, refreshPriceOnce: 200 },
  { moduleKey: "listing", moduleName: "分类信息", sortOrder: 4, pinnedPriceDaily: 300, highlightPriceDaily: 200, refreshPriceOnce: 100 },
  { moduleKey: "article", moduleName: "新闻资讯", sortOrder: 5, pinnedPriceDaily: 500, highlightPriceDaily: 300, refreshPriceOnce: 100 },
  { moduleKey: "love",    moduleName: "相亲交友", sortOrder: 6, pinnedPriceDaily: 500, highlightPriceDaily: 300, refreshPriceOnce: 100 },
  { moduleKey: "event",   moduleName: "同城活动", sortOrder: 7, pinnedPriceDaily: 500, highlightPriceDaily: 300, refreshPriceOnce: 100 },
  { moduleKey: "post",    moduleName: "社区贴子", sortOrder: 8, pinnedPriceDaily: 200, highlightPriceDaily: 100, refreshPriceOnce: 50 },
];

/** 初始化默认板块配置(幂等) */
export async function seedChargeConfigs() {
  const count = await prisma.chargeConfig.count();
  if (count > 0) return;

  for (const m of DEFAULT_MODULES) {
    await prisma.chargeConfig.create({
      data: {
        moduleKey: m.moduleKey,
        moduleName: m.moduleName,
        unitPrice: 0,
        discountRate: 1.0,
        isFree: true,
        isEnabled: true,
        freePostCount: 3,
        expiryDays: 30,
        pinnedPriceDaily: m.pinnedPriceDaily,
        highlightPriceDaily: m.highlightPriceDaily,
        refreshPriceOnce: m.refreshPriceOnce,
        chargeType: "COUNT",
        sortOrder: m.sortOrder,
      },
    });
  }
}

/** 获取所有板块收费配置 */
export async function listChargeConfigs() {
  await seedChargeConfigs();
  return prisma.chargeConfig.findMany({ orderBy: { sortOrder: "asc" } });
}

/** 更新单个板块收费配置 */
export async function updateChargeConfig(moduleKey: string, data: Record<string, any>) {
  return prisma.chargeConfig.update({
    where: { moduleKey },
    data,
  });
}

/** 获取全站免费模式配置 */
export async function getGlobalFreeConfig() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "global_charge_free" },
  });
  if (!setting) {
    return { isGlobalFree: false, freeAnnouncement: "为了回馈广大乡亲，本站现开启全站免费发布活动！" };
  }
  try {
    return JSON.parse(setting.value);
  } catch {
    return { isGlobalFree: false, freeAnnouncement: "" };
  }
}

/** 保存全站免费模式配置 */
export async function saveGlobalFreeConfig(isGlobalFree: boolean, freeAnnouncement: string) {
  const value = JSON.stringify({ isGlobalFree, freeAnnouncement });
  await prisma.systemSetting.upsert({
    where: { key: "global_charge_free" },
    update: { value, updatedAt: new Date() },
    create: {
      group: "BILLING",
      key: "global_charge_free",
      value,
      valueType: "json",
      description: "全站收费控制与活动公告配置",
      isPublic: false,
    },
  });
}

/** 计算发布费用明细 (支持相亲男女差异化审核费) */
export async function calculatePostFee(moduleKey: string, options: {
  pinnedDays?: number;
  isHighlight?: boolean;
  isRefresh?: boolean;
  gender?: "male" | "female" | string;
}) {
  const globalConfig = await getGlobalFreeConfig();
  if (globalConfig.isGlobalFree) {
    return { baseFee: 0, auditFee: 0, pinnedFee: 0, highlightFee: 0, refreshFee: 0, total: 0, isFree: true };
  }

  const config = await prisma.chargeConfig.findUnique({ where: { moduleKey } });
  if (!config) throw new Error("未找到板块计费配置");

  // 相亲男女差异化审核费计算 (复刻老站 admin_love_payconfig.html)
  let auditFee = 0;
  if (moduleKey === "love") {
    if (options.gender === "male") {
      auditFee = config.maleAuditPrice || 0;
    } else if (options.gender === "female") {
      auditFee = config.femaleAuditPrice || 0;
    }
  }

  if (config.isFree) {
    // 板块免费，但增值服务与审核费可能仍然有效
    const pinnedFee = (options.pinnedDays || 0) * config.pinnedPriceDaily;
    const highlightFee = options.isHighlight ? config.highlightPriceDaily : 0;
    const refreshFee = options.isRefresh ? config.refreshPriceOnce : 0;
    return {
      baseFee: 0,
      auditFee,
      pinnedFee,
      highlightFee,
      refreshFee,
      total: auditFee + pinnedFee + highlightFee + refreshFee,
      isFree: true,
    };
  }

  const baseFee = Math.round(config.unitPrice * config.discountRate);
  const pinnedFee = (options.pinnedDays || 0) * config.pinnedPriceDaily;
  const highlightFee = options.isHighlight ? config.highlightPriceDaily : 0;
  const refreshFee = options.isRefresh ? config.refreshPriceOnce : 0;

  return {
    baseFee,
    auditFee,
    pinnedFee,
    highlightFee,
    refreshFee,
    total: baseFee + auditFee + pinnedFee + highlightFee + refreshFee,
    isFree: false,
  };
}
