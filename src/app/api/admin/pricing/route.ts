import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  listChargeConfigs,
  updateChargeConfig,
  getGlobalFreeConfig,
  saveGlobalFreeConfig,
} from "@/lib/charge-config-store";

/** GET /api/admin/pricing — 获取所有板块收费配置 + 全局免费配置 */
export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const [configs, globalConfig] = await Promise.all([
    listChargeConfigs(),
    getGlobalFreeConfig(),
  ]);

  return NextResponse.json({
    configs: configs.map((c) => ({
      ...c,
      unitPriceYuan: (c.unitPrice / 100).toFixed(2),
      priceRmbYuan: ((c.priceRmbCents || c.unitPrice || 0) / 100).toFixed(2),
      pinnedPriceDailyYuan: (c.pinnedPriceDaily / 100).toFixed(2),
      pinnedPriceRmbYuan: ((c.pinnedPriceRmbCents || c.pinnedPriceDaily || 0) / 100).toFixed(2),
      highlightPriceDailyYuan: (c.highlightPriceDaily / 100).toFixed(2),
      highlightPriceRmbYuan: ((c.highlightPriceRmbCents || c.highlightPriceDaily || 0) / 100).toFixed(2),
      refreshPriceOnceYuan: (c.refreshPriceOnce / 100).toFixed(2),
      refreshPriceRmbYuan: ((c.refreshPriceRmbCents || c.refreshPriceOnce || 0) / 100).toFixed(2),
      maleAuditPriceYuan: ((c.maleAuditPrice || 0) / 100).toFixed(2),
      femaleAuditPriceYuan: ((c.femaleAuditPrice || 0) / 100).toFixed(2),
    })),
    globalConfig,
  });
}

/** PATCH /api/admin/pricing — 更新单个板块收费配置 */
export async function PATCH(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "仅管理员可修改收费配置" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.moduleKey) {
    return NextResponse.json({ error: "缺少 moduleKey" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  // 基础开关与周期
  if (body.isFree !== undefined) updateData.isFree = Boolean(body.isFree);
  if (body.isEnabled !== undefined) updateData.isEnabled = Boolean(body.isEnabled);
  if (body.discountRate !== undefined) updateData.discountRate = Number(body.discountRate);
  if (body.quotaPeriod !== undefined) updateData.quotaPeriod = String(body.quotaPeriod);
  if (body.chargeType !== undefined) updateData.chargeType = String(body.chargeType);

  // 免费额度与有效期
  if (body.freeQuota !== undefined) {
    const fq = Math.max(0, Math.round(Number(body.freeQuota)));
    updateData.freeQuota = fq;
    updateData.freePostCount = fq;
  } else if (body.freePostCount !== undefined) {
    const fq = Math.max(0, Math.round(Number(body.freePostCount)));
    updateData.freeQuota = fq;
    updateData.freePostCount = fq;
  }

  if (body.validDays !== undefined) {
    const vd = Math.max(0, Math.round(Number(body.validDays)));
    updateData.validDays = vd;
    updateData.expiryDays = vd;
  } else if (body.expiryDays !== undefined) {
    const vd = Math.max(0, Math.round(Number(body.expiryDays)));
    updateData.validDays = vd;
    updateData.expiryDays = vd;
  }

  // ── 三种支付介质配置 ──
  // 1. 人民币 (元 <-> 分)
  if (body.allowRmb !== undefined) updateData.allowRmb = Boolean(body.allowRmb);
  if (body.priceRmbYuan !== undefined) {
    const cents = Math.max(0, Math.round(Number(body.priceRmbYuan) * 100));
    updateData.priceRmbCents = cents;
    updateData.unitPrice = cents;
  } else if (body.priceRmbCents !== undefined) {
    const cents = Math.max(0, Math.round(Number(body.priceRmbCents)));
    updateData.priceRmbCents = cents;
    updateData.unitPrice = cents;
  } else if (body.unitPrice !== undefined) {
    const cents = Math.max(0, Math.round(Number(body.unitPrice)));
    updateData.priceRmbCents = cents;
    updateData.unitPrice = cents;
  }

  // 2. 金币
  if (body.allowCoin !== undefined) updateData.allowCoin = Boolean(body.allowCoin);
  if (body.priceCoins !== undefined) updateData.priceCoins = Math.max(0, Math.round(Number(body.priceCoins)));

  // 3. 积分
  if (body.allowPoint !== undefined) updateData.allowPoint = Boolean(body.allowPoint);
  if (body.pricePoints !== undefined) updateData.pricePoints = Math.max(0, Math.round(Number(body.pricePoints)));

  // ── 增值服务价格 ──
  if (body.pinnedPriceDailyYuan !== undefined) {
    const c = Math.max(0, Math.round(Number(body.pinnedPriceDailyYuan) * 100));
    updateData.pinnedPriceDaily = c;
    updateData.pinnedPriceRmbCents = c;
  } else if (body.pinnedPriceDaily !== undefined) {
    const c = Math.max(0, Math.round(Number(body.pinnedPriceDaily)));
    updateData.pinnedPriceDaily = c;
    updateData.pinnedPriceRmbCents = c;
  }
  if (body.pinnedAllowCoin !== undefined) updateData.pinnedAllowCoin = Boolean(body.pinnedAllowCoin);
  if (body.pinnedPriceCoins !== undefined) updateData.pinnedPriceCoins = Math.max(0, Math.round(Number(body.pinnedPriceCoins)));
  if (body.pinnedAllowPoint !== undefined) updateData.pinnedAllowPoint = Boolean(body.pinnedAllowPoint);
  if (body.pinnedPricePoints !== undefined) updateData.pinnedPricePoints = Math.max(0, Math.round(Number(body.pinnedPricePoints)));

  if (body.highlightPriceDailyYuan !== undefined) {
    const c = Math.max(0, Math.round(Number(body.highlightPriceDailyYuan) * 100));
    updateData.highlightPriceDaily = c;
    updateData.highlightPriceRmbCents = c;
  } else if (body.highlightPriceDaily !== undefined) {
    const c = Math.max(0, Math.round(Number(body.highlightPriceDaily)));
    updateData.highlightPriceDaily = c;
    updateData.highlightPriceRmbCents = c;
  }
  if (body.highlightAllowCoin !== undefined) updateData.highlightAllowCoin = Boolean(body.highlightAllowCoin);
  if (body.highlightPriceCoins !== undefined) updateData.highlightPriceCoins = Math.max(0, Math.round(Number(body.highlightPriceCoins)));

  if (body.refreshPriceOnceYuan !== undefined) {
    const c = Math.max(0, Math.round(Number(body.refreshPriceOnceYuan) * 100));
    updateData.refreshPriceOnce = c;
    updateData.refreshPriceRmbCents = c;
  } else if (body.refreshPriceOnce !== undefined) {
    const c = Math.max(0, Math.round(Number(body.refreshPriceOnce)));
    updateData.refreshPriceOnce = c;
    updateData.refreshPriceRmbCents = c;
  }
  if (body.refreshAllowCoin !== undefined) updateData.refreshAllowCoin = Boolean(body.refreshAllowCoin);
  if (body.refreshPriceCoins !== undefined) updateData.refreshPriceCoins = Math.max(0, Math.round(Number(body.refreshPriceCoins)));
  if (body.refreshAllowPoint !== undefined) updateData.refreshAllowPoint = Boolean(body.refreshAllowPoint);
  if (body.refreshPricePoints !== undefined) updateData.refreshPricePoints = Math.max(0, Math.round(Number(body.refreshPricePoints)));

  // 相亲男女审核费
  if (body.maleAuditPriceYuan !== undefined) updateData.maleAuditPrice = Math.max(0, Math.round(Number(body.maleAuditPriceYuan) * 100));
  else if (body.maleAuditPrice !== undefined) updateData.maleAuditPrice = Math.max(0, Math.round(Number(body.maleAuditPrice)));

  if (body.femaleAuditPriceYuan !== undefined) updateData.femaleAuditPrice = Math.max(0, Math.round(Number(body.femaleAuditPriceYuan) * 100));
  else if (body.femaleAuditPrice !== undefined) updateData.femaleAuditPrice = Math.max(0, Math.round(Number(body.femaleAuditPrice)));

  const updated = await updateChargeConfig(body.moduleKey, updateData);
  return NextResponse.json({ ok: true, config: updated });
}

/** POST /api/admin/pricing — 更新全局免费配置 */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "仅管理员可修改全局收费配置" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  await saveGlobalFreeConfig(
    Boolean(body.isGlobalFree),
    String(body.freeAnnouncement || "")
  );

  return NextResponse.json({ ok: true });
}
