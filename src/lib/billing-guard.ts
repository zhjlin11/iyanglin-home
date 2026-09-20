import { prisma } from "@/lib/prisma";

export type AssetType = "RMB" | "COIN" | "POINT" | "FREE_QUOTA";

export interface BillingQuoteResult {
  id?: string;
  isFree: boolean;
  freeReason?: "FREE_QUOTA" | "GLOBAL_FREE_CAMPAIGN" | "MODULE_FREE" | "ZERO_PRICE";
  quotaRemaining: number;
  freeQuotaTotal: number;
  allowRmb: boolean;
  priceRmbCents: number;
  priceRmbDisplay: string;
  allowCoin: boolean;
  priceCoins: number;
  priceCoinsDisplay: string;
  allowPoint: boolean;
  pricePoints: number;
  pricePointsDisplay: string;
  expiresAt?: string;
  module: string;
  action: string;
  subjectType: "COMPANY" | "USER";
  subjectId: string;
}

/** 格式化支付介质显示文本 (严禁展示原始分或内部技术单位) */
export function formatAssetAmount(assetType: AssetType, amount: number): string {
  switch (assetType) {
    case "RMB":
      return `¥${(amount / 100).toFixed(2)}`;
    case "COIN":
      return `${Math.round(amount)}金币`;
    case "POINT":
      return `${Math.round(amount)}积分`;
    case "FREE_QUOTA":
      return "免费额度";
    default:
      return `${amount}`;
  }
}

/** 周期Key生成 (按次/按天/按周/按月/按年) */
export function getQuotaPeriodKey(period: string = "30D", now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  switch ((period || "30D").toUpperCase()) {
    case "ONCE":
      return "ONCE_ALL";
    case "DAILY":
      return `${y}-${m}-${d}`;
    case "7D": {
      const firstDayOfYear = new Date(y, 0, 1);
      const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
      const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return `${y}-W${week}`;
    }
    case "30D":
    case "MONTHLY":
      return `${y}-${m}`;
    case "365D":
    case "YEARLY":
      return `${y}`;
    default:
      return `${y}-${m}`;
  }
}

/** 检查全站免费模式活动 */
export async function checkGlobalFreeCampaign(): Promise<{ isFree: boolean; announcement: string }> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "global_charge_free" },
    });
    if (!setting || !setting.value) {
      return { isFree: false, announcement: "" };
    }
    const parsed = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
    return {
      isFree: Boolean(parsed.isGlobalFree),
      announcement: String(parsed.freeAnnouncement || ""),
    };
  } catch {
    return { isFree: false, announcement: "" };
  }
}

/** 获取并保障模块收费配置 */
export async function getModuleChargeConfig(moduleKey: string) {
  let config = await prisma.chargeConfig.findUnique({
    where: { moduleKey },
  });

  if (!config) {
    const isDefaultFree = ["house", "event", "post", "article", "industrial"].includes(moduleKey);
    const moduleNameMap: Record<string, string> = {
      job: "招聘求职",
      listing: "分类信息",
      shop: "好店入驻",
      love: "相亲交友",
      house: "房产楼市",
      event: "同城活动",
      post: "社区贴子",
      article: "新闻资讯",
      industrial: "园区招商",
    };
    config = await prisma.chargeConfig.create({
      data: {
        moduleKey,
        moduleName: moduleNameMap[moduleKey] || moduleKey,
        unitPrice: isDefaultFree ? 0 : 500,
        isFree: isDefaultFree,
        isEnabled: true,
        freePostCount: 1,
        allowRmb: true,
        priceRmbCents: isDefaultFree ? 0 : 500,
        allowCoin: true,
        priceCoins: isDefaultFree ? 0 : 50,
        allowPoint: false,
        pricePoints: 500,
        freeQuota: 1,
        quotaPeriod: "30D",
      },
    });
  }

  return config;
}

/** 获取用户金币与积分资产余额 */
export async function getUserAssetBalances(userId: string): Promise<{ coins: number; points: number }> {
  const [wallet, pointAccount] = await Promise.all([
    prisma.coinWallet.findUnique({ where: { userId } }),
    prisma.pointAccount.findUnique({ where: { userId } }),
  ]);

  return {
    coins: wallet?.balance ?? 0,
    points: pointAccount?.balance ?? 0,
  };
}

/**
 * 服务端生成防篡改即时报价快照 (BillingQuote)
 */
export async function generateBillingQuote(params: {
  module: string;
  action?: "PUBLISH" | "PIN" | "HIGHLIGHT" | "REFRESH";
  subjectType: "COMPANY" | "USER";
  subjectId: string;
  userId: string;
  days?: number;
  metadata?: any;
}): Promise<BillingQuoteResult> {
  const { module, action = "PUBLISH", subjectType, subjectId, userId, days, metadata } = params;

  // 1. 全局免费活动判断
  const globalFree = await checkGlobalFreeCampaign();
  if (globalFree.isFree) {
    return {
      isFree: true,
      freeReason: "GLOBAL_FREE_CAMPAIGN",
      quotaRemaining: 9999,
      freeQuotaTotal: 9999,
      allowRmb: true,
      priceRmbCents: 0,
      priceRmbDisplay: "¥0.00",
      allowCoin: true,
      priceCoins: 0,
      priceCoinsDisplay: "0金币",
      allowPoint: true,
      pricePoints: 0,
      pricePointsDisplay: "0积分",
      module,
      action,
      subjectType,
      subjectId,
    };
  }

  // 2. 模块收费配置
  const config = await getModuleChargeConfig(module);

  // 模块全免费
  if (config.isFree && action === "PUBLISH") {
    return {
      isFree: true,
      freeReason: "MODULE_FREE",
      quotaRemaining: 9999,
      freeQuotaTotal: 9999,
      allowRmb: true,
      priceRmbCents: 0,
      priceRmbDisplay: "¥0.00",
      allowCoin: false,
      priceCoins: 0,
      priceCoinsDisplay: "0金币",
      allowPoint: false,
      pricePoints: 0,
      pricePointsDisplay: "0积分",
      module,
      action,
      subjectType,
      subjectId,
    };
  }

  // 3. 免费额度计算 (发布动作校验)
  const totalFreeQuota = config.freeQuota ?? config.freePostCount ?? 1;
  const periodKey = getQuotaPeriodKey(config.quotaPeriod || "30D");

  let quotaUsage = null;
  if (subjectType === "COMPANY") {
    quotaUsage = await prisma.billingQuotaUsage.findFirst({
      where: { companyId: subjectId, module, action, periodKey },
    });
  } else {
    quotaUsage = await prisma.billingQuotaUsage.findFirst({
      where: { userId: subjectId, module, action, periodKey },
    });
  }

  const usedCount = quotaUsage?.usedCount ?? 0;
  const remaining = Math.max(0, totalFreeQuota - usedCount);

  if (action === "PUBLISH" && remaining > 0) {
    return {
      isFree: true,
      freeReason: "FREE_QUOTA",
      quotaRemaining: remaining,
      freeQuotaTotal: totalFreeQuota,
      allowRmb: true,
      priceRmbCents: 0,
      priceRmbDisplay: "¥0.00",
      allowCoin: false,
      priceCoins: 0,
      priceCoinsDisplay: "0金币",
      allowPoint: false,
      pricePoints: 0,
      pricePointsDisplay: "0积分",
      module,
      action,
      subjectType,
      subjectId,
    };
  }

  // 4. 额度耗尽，计算收费价格快照
  let priceRmbCents = config.priceRmbCents;
  if (priceRmbCents <= 0 && config.unitPrice > 0) {
    priceRmbCents = config.unitPrice;
  }
  let priceCoins = config.priceCoins;
  if (priceCoins <= 0 && priceRmbCents > 0) {
    priceCoins = Math.round(priceRmbCents / 10);
  }
  let pricePoints = config.pricePoints;
  if (pricePoints <= 0 && priceRmbCents > 0) {
    pricePoints = priceRmbCents;
  }

  // 增值服务价格覆盖
  if (action === "PIN") {
    const d = Math.max(1, days || 1);
    priceRmbCents = (config.pinnedPriceRmbCents || config.pinnedPriceDaily || 500) * d;
    priceCoins = (config.pinnedPriceCoins || 50) * d;
    pricePoints = (config.pinnedPricePoints || 500) * d;
  } else if (action === "HIGHLIGHT") {
    priceRmbCents = config.highlightPriceRmbCents || config.highlightPriceDaily || 300;
    priceCoins = config.highlightPriceCoins || 30;
  } else if (action === "REFRESH") {
    priceRmbCents = config.refreshPriceRmbCents || config.refreshPriceOnce || 100;
    priceCoins = config.refreshPriceCoins || 10;
    pricePoints = config.refreshPricePoints || 100;
  }

  // 存入 BillingQuote (TTL 15分钟)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const quote = await prisma.billingQuote.create({
    data: {
      userId,
      companyId: subjectType === "COMPANY" ? subjectId : null,
      module,
      action,
      isFree: false,
      allowRmb: config.allowRmb ?? true,
      priceRmbCents,
      allowCoin: config.allowCoin ?? true,
      priceCoins,
      allowPoint: config.allowPoint ?? false,
      pricePoints,
      days,
      metadata: metadata ? metadata : undefined,
      status: "ACTIVE",
      expiresAt,
    },
  });

  return {
    id: quote.id,
    isFree: false,
    quotaRemaining: 0,
    freeQuotaTotal: totalFreeQuota,
    allowRmb: config.allowRmb ?? true,
    priceRmbCents,
    priceRmbDisplay: `¥${(priceRmbCents / 100).toFixed(2)}`,
    allowCoin: config.allowCoin ?? true,
    priceCoins,
    priceCoinsDisplay: `${priceCoins}金币`,
    allowPoint: config.allowPoint ?? false,
    pricePoints,
    pricePointsDisplay: `${pricePoints}积分`,
    expiresAt: expiresAt.toISOString(),
    module,
    action,
    subjectType,
    subjectId,
  };
}

/** 消耗免费额度并直接核销 */
export async function consumeFreeQuota(params: {
  module: string;
  action?: string;
  subjectType: "COMPANY" | "USER";
  subjectId: string;
  userId: string;
  resourceId?: string;
}) {
  const { module, action = "PUBLISH", subjectType, subjectId, userId, resourceId } = params;
  const config = await getModuleChargeConfig(module);
  const periodKey = getQuotaPeriodKey(config.quotaPeriod || "30D");

  // 记录免费配额使用
  if (subjectType === "COMPANY") {
    const existing = await prisma.billingQuotaUsage.findFirst({
      where: { companyId: subjectId, module, action, periodKey },
    });
    if (existing) {
      await prisma.billingQuotaUsage.update({
        where: { id: existing.id },
        data: { usedCount: { increment: 1 } },
      });
    } else {
      await prisma.billingQuotaUsage.create({
        data: {
          companyId: subjectId,
          module,
          action,
          periodKey,
          usedCount: 1,
        },
      });
    }
  } else {
    const existing = await prisma.billingQuotaUsage.findFirst({
      where: { userId: subjectId, module, action, periodKey },
    });
    if (existing) {
      await prisma.billingQuotaUsage.update({
        where: { id: existing.id },
        data: { usedCount: { increment: 1 } },
      });
    } else {
      await prisma.billingQuotaUsage.create({
        data: {
          userId: subjectId,
          module,
          action,
          periodKey,
          usedCount: 1,
        },
      });
    }
  }

  // 自动发放并核销免费权益
  const entitlement = await prisma.billingEntitlement.create({
    data: {
      userId,
      companyId: subjectType === "COMPANY" ? subjectId : null,
      module,
      action,
      assetType: "FREE_QUOTA",
      status: "CONSUMED",
      resourceId,
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 86400000),
    },
  });

  return entitlement;
}

/** 金币支付报价快照并换取发布权益 */
export async function payQuoteByCoin(params: { quoteId: string; userId: string }) {
  const { quoteId, userId } = params;

  const quote = await prisma.billingQuote.findUnique({
    where: { id: quoteId },
  });

  if (!quote) throw new Error("报价单不存在");
  if (quote.status !== "ACTIVE") throw new Error("该报价单已失效或已支付");
  if (quote.expiresAt < new Date()) throw new Error("报价单已过期，请刷新重新获取");
  if (!quote.allowCoin) throw new Error("该业务不支持金币支付");
  if (quote.userId !== userId) throw new Error("无权支付该报价单");

  // 事务操作：校验钱包 -> 扣除金币 -> 记录流水 -> 创建权益 -> 标记报价已支付
  return prisma.$transaction(async (tx) => {
    let wallet = await tx.coinWallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await tx.coinWallet.create({
        data: { userId, balance: 10, totalRecharged: 0, totalSpent: 0 },
      });
    }

    if (wallet.balance < quote.priceCoins) {
      throw new Error(`金币余额不足 (当前 ${wallet.balance} 金币，需 ${quote.priceCoins} 金币)`);
    }

    const updatedWallet = await tx.coinWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: quote.priceCoins },
        totalSpent: { increment: quote.priceCoins },
      },
    });

    await tx.coinTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -quote.priceCoins,
        type: "POST_FEE",
        remark: `支付${quote.module}发帖服务`,
        balanceBefore: wallet.balance,
        balanceAfter: updatedWallet.balance,
        businessType: quote.module,
        businessId: quote.id,
      },
    });

    const orderNo = `COIN${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
    const order = await tx.billingOrder.create({
      data: {
        orderNo,
        planName: `金币支付-${quote.module}`,
        targetKind: quote.module,
        targetId: quote.id,
        targetTitle: `金币支付-${quote.module}-${quote.action}`,
        amountCents: quote.priceRmbCents,
        assetType: "COIN",
        coinAmount: quote.priceCoins,
        quoteId: quote.id,
        paymentChannel: "COIN_BALANCE",
        status: "PAID",
        paidAt: new Date(),
        userId,
      },
    });

    const entitlement = await tx.billingEntitlement.create({
      data: {
        userId,
        companyId: quote.companyId,
        module: quote.module,
        action: quote.action,
        assetType: "COIN",
        sourceOrderId: order.id,
        quoteId: quote.id,
        status: "AVAILABLE",
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000), // 24小时内有效
      },
    });

    await tx.billingQuote.update({
      where: { id: quote.id },
      data: { status: "PAID" },
    });

    return {
      success: true,
      entitlementId: entitlement.id,
      orderNo,
      balanceAfter: updatedWallet.balance,
    };
  });
}

/** 积分支付报价快照并换取发布权益 */
export async function payQuoteByPoint(params: { quoteId: string; userId: string }) {
  const { quoteId, userId } = params;

  const quote = await prisma.billingQuote.findUnique({
    where: { id: quoteId },
  });

  if (!quote) throw new Error("报价单不存在");
  if (quote.status !== "ACTIVE") throw new Error("该报价单已失效或已支付");
  if (quote.expiresAt < new Date()) throw new Error("报价单已过期，请刷新重新获取");
  if (!quote.allowPoint) throw new Error("该业务不支持积分支付");
  if (quote.userId !== userId) throw new Error("无权支付该报价单");

  return prisma.$transaction(async (tx) => {
    let account = await tx.pointAccount.findUnique({ where: { userId } });
    if (!account) {
      account = await tx.pointAccount.create({
        data: { userId, balance: 0 },
      });
    }

    if (account.balance < quote.pricePoints) {
      throw new Error(`积分余额不足 (当前 ${account.balance} 积分，需 ${quote.pricePoints} 积分)`);
    }

    const updatedAccount = await tx.pointAccount.update({
      where: { id: account.id },
      data: {
        balance: { decrement: quote.pricePoints },
        totalSpent: { increment: quote.pricePoints },
      },
    });

    await tx.pointTransaction.create({
      data: {
        accountId: account.id,
        amount: -quote.pricePoints,
        type: "SPEND",
        remark: `积分兑换${quote.module}发帖服务`,
        balanceBefore: account.balance,
        balanceAfter: updatedAccount.balance,
        businessType: quote.module,
        businessId: quote.id,
      },
    });

    const orderNo = `PT${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
    const order = await tx.billingOrder.create({
      data: {
        orderNo,
        planName: `积分兑换-${quote.module}`,
        targetKind: quote.module,
        targetId: quote.id,
        targetTitle: `积分兑换-${quote.module}-${quote.action}`,
        amountCents: 0,
        assetType: "POINT",
        pointAmount: quote.pricePoints,
        quoteId: quote.id,
        paymentChannel: "POINT_BALANCE",
        status: "PAID",
        paidAt: new Date(),
        userId,
      },
    });

    const entitlement = await tx.billingEntitlement.create({
      data: {
        userId,
        companyId: quote.companyId,
        module: quote.module,
        action: quote.action,
        assetType: "POINT",
        sourceOrderId: order.id,
        quoteId: quote.id,
        status: "AVAILABLE",
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    await tx.billingQuote.update({
      where: { id: quote.id },
      data: { status: "PAID" },
    });

    return {
      success: true,
      entitlementId: entitlement.id,
      orderNo,
      balanceAfter: updatedAccount.balance,
    };
  });
}

/** 核销已发放的权益凭证并关联发布内容 ID */
export async function consumeEntitlement(params: {
  entitlementId: string;
  userId: string;
  resourceId: string;
  module?: string;
}) {
  const { entitlementId, userId, resourceId, module } = params;

  const ent = await prisma.billingEntitlement.findUnique({
    where: { id: entitlementId },
  });

  if (!ent) throw new Error("权益凭证不存在");
  if (ent.status !== "AVAILABLE") throw new Error("权益凭证已被核销或已失效");
  if (ent.expiresAt < new Date()) throw new Error("权益凭证已过期");
  if (ent.userId !== userId) throw new Error("无权使用该权益凭证");
  if (module && ent.module !== module) throw new Error("权益凭证与发布业务类型不匹配");

  return prisma.billingEntitlement.update({
    where: { id: entitlementId },
    data: {
      status: "CONSUMED",
      resourceId,
      usedAt: new Date(),
    },
  });
}

/**
 * 统一商业化发布事务门禁 (Transactional Billing Guard)
 *
 * 核心保障：
 * 1. 事务强一致性：权益核销/免费额度扣减 与 业务实体创建 在同一 prisma.$transaction 中完成。
 * 2. 凭证严格匹配：校验 userId、module、action、companyId、status=AVAILABLE、未过期。
 * 3. 额度并发防刷：在数据库事务中排他性校验 BillingQuotaUsage。
 * 4. 门禁全覆盖：根据 ChargeConfig 动态判断，支持全站免费或模块按策略收费。
 */
export async function executePublishWithBillingGuard<T>(params: {
  module: string;
  action?: "PUBLISH" | "PIN" | "HIGHLIGHT" | "REFRESH";
  userId: string;
  userRole?: string;
  companyId?: string | null;
  entitlementId?: string | null;
  adminBypass?: boolean;
  createResource: (tx: any) => Promise<T>;
}): Promise<
  | { success: true; item: T; entitlementId?: string }
  | { success: false; needPayment: true; quote: BillingQuoteResult; error: string }
> {
  const action = params.action || "PUBLISH";
  const roleUpper = String(params.userRole || "").toUpperCase();
  const isAdmin = roleUpper === "ADMIN";

  // 管理员跳过计费
  if (params.adminBypass && isAdmin) {
    const item = await prisma.$transaction(async (tx) => {
      return params.createResource(tx);
    });
    return { success: true, item };
  }

  // 1. 如果前端传入了预购权益凭证 (entitlementId)
  if (params.entitlementId && typeof params.entitlementId === "string" && params.entitlementId.trim()) {
    const entId = params.entitlementId.trim();

    try {
      const result = await prisma.$transaction(async (tx) => {
        const ent = await tx.billingEntitlement.findUnique({
          where: { id: entId },
        });

        if (!ent) {
          throw new Error("支付权益凭证不存在");
        }
        if (ent.userId !== params.userId) {
          throw new Error("无权使用该权益凭证（非当前登录用户持有）");
        }
        if (ent.module.toLowerCase() !== params.module.toLowerCase()) {
          throw new Error(`权益凭证业务类型不匹配：该凭证适用于 ${ent.module}，不可用于 ${params.module}`);
        }
        if (ent.action.toUpperCase() !== action.toUpperCase()) {
          throw new Error(`权益凭证操作类型不匹配：该凭证适用于 ${ent.action}，不可用于 ${action}`);
        }
        if (params.companyId && ent.companyId && ent.companyId !== params.companyId) {
          throw new Error("权益凭证企业主体不匹配");
        }
        if (ent.status !== "AVAILABLE") {
          throw new Error("权益凭证已被核销或已失效，请重新购买");
        }
        if (ent.expiresAt < new Date()) {
          throw new Error("权益凭证已过期，请重新购买");
        }

        // 创建内容实体
        const item = await params.createResource(tx);
        const resourceId = (item as any)?.id ? String((item as any).id) : null;

        // 原子核销权益凭证并关联 resourceId
        await tx.billingEntitlement.update({
          where: { id: ent.id },
          data: {
            status: "CONSUMED",
            resourceId,
            usedAt: new Date(),
          },
        });

        return { item, entitlementId: ent.id };
      });

      return { success: true, item: result.item, entitlementId: result.entitlementId };
    } catch (err: any) {
      throw new Error(err.message || "权益核销失败，发布已取消");
    }
  }

  // 2. 未传入权益凭证 -> 服务端事务内检查 ChargeConfig 与免费额度
  try {
    const result = await prisma.$transaction(async (tx) => {
      const globalFree = await checkGlobalFreeCampaign();
      const config = await getModuleChargeConfig(params.module);
      const periodKey = getQuotaPeriodKey(config.quotaPeriod || "30D");
      const freeQuota = config.freeQuota ?? 1;

      let isFreeApproved = false;
      let freeReason = "";

      if (globalFree.isFree) {
        isFreeApproved = true;
        freeReason = "GLOBAL_CAMPAIGN_FREE";
      } else if (config.isFree) {
        isFreeApproved = true;
        freeReason = "MODULE_ALWAYS_FREE";
      } else {
        // 检查当前主体的免费配额
        const existingUsage = params.companyId
          ? await tx.billingQuotaUsage.findFirst({
              where: { companyId: params.companyId, module: params.module, action, periodKey },
            })
          : await tx.billingQuotaUsage.findFirst({
              where: { userId: params.userId, module: params.module, action, periodKey },
            });

        const currentUsed = existingUsage ? existingUsage.usedCount : 0;
        if (currentUsed < freeQuota) {
          isFreeApproved = true;
          freeReason = "FREE_QUOTA";

          // 原子扣减/计次免费额度
          if (existingUsage) {
            await tx.billingQuotaUsage.update({
              where: { id: existingUsage.id },
              data: { usedCount: { increment: 1 } },
            });
          } else {
            await tx.billingQuotaUsage.create({
              data: {
                userId: params.companyId ? null : params.userId,
                companyId: params.companyId || null,
                module: params.module,
                action,
                periodKey,
                usedCount: 1,
              },
            });
          }
        }
      }

      if (!isFreeApproved) {
        // 额度已用尽，抛出特定异常使事务回滚，外部捕获生成报价
        const err: any = new Error("FREE_QUOTA_EXHAUSTED");
        err.code = "NEED_PAYMENT";
        throw err;
      }

      // 免费通过 -> 创建内容
      const item = await params.createResource(tx);
      const resourceId = (item as any)?.id ? String((item as any).id) : null;

      // 生成免费核销存证
      const freeEntitlement = await tx.billingEntitlement.create({
        data: {
          userId: params.userId,
          companyId: params.companyId || null,
          module: params.module,
          action,
          assetType: freeReason === "FREE_QUOTA" ? "FREE_QUOTA" : "FREE_PROMO",
          status: "CONSUMED",
          resourceId,
          usedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 86400000),
        },
      });

      return { item, entitlementId: freeEntitlement.id };
    });

    return { success: true, item: result.item, entitlementId: result.entitlementId };
  } catch (err: any) {
    if (err.code === "NEED_PAYMENT") {
      // 额度用尽 -> 生成防篡改报价快照返回前端收银台
      const quote = await generateBillingQuote({
        module: params.module,
        action,
        subjectType: params.companyId ? "COMPANY" : "USER",
        subjectId: params.companyId || params.userId,
        userId: params.userId,
      });

      return {
        success: false,
        needPayment: true,
        quote,
        error: `免费发布额度已用完，需支付后发布 (${quote.priceRmbDisplay} / ${quote.priceCoinsDisplay})`,
      };
    }

    throw err;
  }
}
