import { prisma } from "@/lib/prisma";
import { getGlobalFreeConfig } from "@/lib/charge-config-store";

// 预设老站经典分类信息细分子类独立定价 (复刻老站 admin_info_payconfig.html)
const DEFAULT_SUB_PRICING = [
  {
    moduleKey: "listing",
    subKey: "car_look_person",
    subName: "拼车 · 车找人",
    unitPrice: 200,          // 2元/条
    freePostCount: 1,        // 首条免费
    pinnedPriceDaily: 300,   // 置顶3元/天
    refreshPriceOnce: 100,   // 刷新1元/次
    isFree: false,
    isEnabled: true,
    sortOrder: 1,
  },
  {
    moduleKey: "listing",
    subKey: "person_look_car",
    subName: "拼车 · 人找车",
    unitPrice: 100,          // 1元/条
    freePostCount: 2,        // 前2条免费
    pinnedPriceDaily: 200,   // 置顶2元/天
    refreshPriceOnce: 50,    // 刷新0.5元/次
    isFree: false,
    isEnabled: true,
    sortOrder: 2,
  },
  {
    moduleKey: "listing",
    subKey: "car_daily",
    subName: "拼车 · 天天发车 / 专线",
    unitPrice: 500,          // 5元/条
    freePostCount: 0,        // 不免费
    pinnedPriceDaily: 500,   // 置顶5元/天
    refreshPriceOnce: 100,
    isFree: false,
    isEnabled: true,
    sortOrder: 3,
  },
  {
    moduleKey: "listing",
    subKey: "second_hand",
    subName: "二手闲置 / 数码转让",
    unitPrice: 0,            // 免费发布
    freePostCount: 5,
    pinnedPriceDaily: 300,
    refreshPriceOnce: 50,
    isFree: true,
    isEnabled: true,
    sortOrder: 4,
  },
  {
    moduleKey: "listing",
    subKey: "housekeeping",
    subName: "家政保洁 / 维修疏通",
    unitPrice: 300,          // 3元/条
    freePostCount: 1,
    pinnedPriceDaily: 500,
    refreshPriceOnce: 100,
    isFree: false,
    isEnabled: true,
    sortOrder: 5,
  },
];

/** 初始化默认子分类定价(幂等) */
export async function seedDefaultSubCategoryPricing() {
  const count = await prisma.subCategoryPricing.count();
  if (count > 0) return;

  for (const item of DEFAULT_SUB_PRICING) {
    await prisma.subCategoryPricing.create({
      data: item,
    });
  }
}

/** 获取子类定价列表 */
export async function listSubCategoryPricing(moduleKey: string = "listing") {
  await seedDefaultSubCategoryPricing();
  return prisma.subCategoryPricing.findMany({
    where: { moduleKey },
    orderBy: { sortOrder: "asc" },
  });
}

/** 更新或新建子类独立定价 */
export async function upsertSubCategoryPricing(data: {
  moduleKey: string;
  subKey: string;
  subName: string;
  unitPrice?: number;
  freePostCount?: number;
  pinnedPriceDaily?: number;
  refreshPriceOnce?: number;
  isFree?: boolean;
  isEnabled?: boolean;
  sortOrder?: number;
}) {
  return prisma.subCategoryPricing.upsert({
    where: {
      moduleKey_subKey: {
        moduleKey: data.moduleKey,
        subKey: data.subKey,
      },
    },
    update: {
      subName: data.subName,
      unitPrice: data.unitPrice,
      freePostCount: data.freePostCount,
      pinnedPriceDaily: data.pinnedPriceDaily,
      refreshPriceOnce: data.refreshPriceOnce,
      isFree: data.isFree,
      isEnabled: data.isEnabled,
      sortOrder: data.sortOrder,
    },
    create: {
      moduleKey: data.moduleKey,
      subKey: data.subKey,
      subName: data.subName,
      unitPrice: data.unitPrice ?? 0,
      freePostCount: data.freePostCount ?? 0,
      pinnedPriceDaily: data.pinnedPriceDaily ?? 500,
      refreshPriceOnce: data.refreshPriceOnce ?? 100,
      isFree: data.isFree ?? false,
      isEnabled: data.isEnabled ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

/** 计算子分类精准发布费用 */
export async function calculateSubCategoryPostFee(
  moduleKey: string,
  subKey: string,
  options: { pinnedDays?: number; isRefresh?: boolean }
) {
  const globalConfig = await getGlobalFreeConfig();
  if (globalConfig.isGlobalFree) {
    return { baseFee: 0, pinnedFee: 0, refreshFee: 0, total: 0, isFree: true };
  }

  const subPricing = await prisma.subCategoryPricing.findUnique({
    where: {
      moduleKey_subKey: { moduleKey, subKey },
    },
  });

  if (!subPricing || !subPricing.isEnabled) {
    return null; // 回退使用主板块计费规则
  }

  const baseFee = subPricing.isFree ? 0 : subPricing.unitPrice;
  const pinnedFee = (options.pinnedDays || 0) * subPricing.pinnedPriceDaily;
  const refreshFee = options.isRefresh ? subPricing.refreshPriceOnce : 0;

  return {
    baseFee,
    pinnedFee,
    refreshFee,
    total: baseFee + pinnedFee + refreshFee,
    isFree: subPricing.isFree,
    freePostCount: subPricing.freePostCount,
  };
}
