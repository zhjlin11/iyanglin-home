"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

type ChargeConfigItem = {
  id: string;
  moduleKey: string;
  moduleName: string;
  unitPrice: number;
  unitPriceYuan: string;
  discountRate: number;
  isFree: boolean;
  isEnabled: boolean;
  freePostCount: number;
  expiryDays: number;
  pinnedPriceDaily: number;
  pinnedPriceDailyYuan: string;
  highlightPriceDaily: number;
  highlightPriceDailyYuan: string;
  refreshPriceOnce: number;
  refreshPriceOnceYuan: string;
  maleAuditPrice?: number;
  maleAuditPriceYuan?: string;
  femaleAuditPrice?: number;
  femaleAuditPriceYuan?: string;
  chargeType: string;

  // 三种支付介质
  allowRmb: boolean;
  priceRmbCents: number;
  priceRmbYuan: string;
  allowCoin: boolean;
  priceCoins: number;
  allowPoint: boolean;
  pricePoints: number;
  freeQuota: number;
  quotaPeriod: string; // ONCE | DAILY | 7D | 30D | 365D
  validDays: number;

  // 增值服务多介质
  pinnedAllowRmb?: boolean;
  pinnedPriceRmbCents?: number;
  pinnedPriceRmbYuan?: string;
  pinnedAllowCoin?: boolean;
  pinnedPriceCoins?: number;
  pinnedAllowPoint?: boolean;
  pinnedPricePoints?: number;

  highlightAllowRmb?: boolean;
  highlightPriceRmbCents?: number;
  highlightPriceRmbYuan?: string;
  highlightAllowCoin?: boolean;
  highlightPriceCoins?: number;

  refreshAllowRmb?: boolean;
  refreshPriceRmbCents?: number;
  refreshPriceRmbYuan?: string;
  refreshAllowCoin?: boolean;
  refreshPriceCoins?: number;
  refreshAllowPoint?: boolean;
  refreshPricePoints?: number;
};

type GlobalConfig = {
  isGlobalFree: boolean;
  freeAnnouncement: string;
};

type VipPackage = {
  id: string;
  targetModule: string;
  name: string;
  level: number;
  priceCents: number;
  priceYuan: string;
  durationDays: number;
  privileges: Record<string, any>;
  description?: string;
  badgeText?: string;
  isEnabled: boolean;
};

type SubPricing = {
  id: string;
  moduleKey: string;
  subKey: string;
  subName: string;
  unitPrice: number;
  unitPriceYuan: string;
  freePostCount: number;
  pinnedPriceDaily: number;
  pinnedPriceDailyYuan: string;
  refreshPriceOnce: number;
  refreshPriceOnceYuan: string;
  isFree: boolean;
  isEnabled: boolean;
};

const MODULE_ICONS: Record<string, string> = {
  job: "💼", house: "🏠", shop: "🏪", listing: "📋",
  article: "📰", love: "💕", event: "🎉", post: "💬",
};

const MODULE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  job:     { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  house:   { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  shop:    { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  listing: { bg: "#FFF7ED", text: "#C2410C", border: "#FDBA74" },
  article: { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  love:    { bg: "#FDF2F8", text: "#BE185D", border: "#FBCFE8" },
  event:   { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  post:    { bg: "#F0F9FF", text: "#0369A1", border: "#BAE6FD" },
};

const PERIOD_LABELS: Record<string, string> = {
  ONCE: "终身首发免费",
  DAILY: "每日重置",
  "7D": "每周重置",
  "30D": "每30天重置",
  "365D": "每年重置",
};

export default function AdminPricingPage() {
  const [activeTab, setActiveTab] = useState<"modules" | "vip" | "sub" | "coins">("modules");
  const [configs, setConfigs] = useState<ChargeConfigItem[]>([]);
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({ isGlobalFree: false, freeAnnouncement: "" });
  const [vipPackages, setVipPackages] = useState<VipPackage[]>([]);
  const [subPricings, setSubPricings] = useState<SubPricing[]>([]);
  const [loading, setLoading] = useState(true);

  // 编辑状态
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ChargeConfigItem>>({});
  const [editingSubKey, setEditingSubKey] = useState<string | null>(null);
  const [subForm, setSubForm] = useState<Partial<SubPricing>>({});
  const [editingVipId, setEditingVipId] = useState<string | null>(null);
  const [vipForm, setVipForm] = useState<Partial<VipPackage>>({});

  const [saving, setSaving] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [message, setMessage] = useState("");

  const centsToYuan = (cents: number = 0) => (cents / 100).toFixed(2);

  const fetchData = async () => {
    try {
      const [resPricing, resVip, resSub] = await Promise.all([
        fetch("/api/admin/pricing").then((r) => r.json()),
        fetch("/api/admin/vip-packages").then((r) => r.json()),
        fetch("/api/admin/sub-pricing?moduleKey=listing").then((r) => r.json()),
      ]);
      if (resPricing.configs) setConfigs(resPricing.configs);
      if (resPricing.globalConfig) setGlobalConfig(resPricing.globalConfig);
      if (resVip.packages) setVipPackages(resVip.packages);
      if (resSub.subPricings) setSubPricings(resSub.subPricings);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // 全局免费开关
  const saveGlobal = async () => {
    setSavingGlobal(true);
    const res = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(globalConfig),
    });
    if (res.ok) showMsg("✅ 全局配置已保存");
    else showMsg("❌ 保存失败");
    setSavingGlobal(false);
  };

  // 单板块编辑
  const startEdit = (c: ChargeConfigItem) => {
    setEditingKey(c.moduleKey);
    setEditForm({
      ...c,
      priceRmbYuan: c.priceRmbYuan || centsToYuan(c.priceRmbCents || c.unitPrice),
      pinnedPriceDailyYuan: c.pinnedPriceDailyYuan || centsToYuan(c.pinnedPriceRmbCents || c.pinnedPriceDaily),
      highlightPriceDailyYuan: c.highlightPriceDailyYuan || centsToYuan(c.highlightPriceRmbCents || c.highlightPriceDaily),
      refreshPriceOnceYuan: c.refreshPriceOnceYuan || centsToYuan(c.refreshPriceRmbCents || c.refreshPriceOnce),
      maleAuditPriceYuan: c.maleAuditPriceYuan || centsToYuan(c.maleAuditPrice),
      femaleAuditPriceYuan: c.femaleAuditPriceYuan || centsToYuan(c.femaleAuditPrice),
      allowRmb: c.allowRmb ?? true,
      priceCoins: c.priceCoins ?? (Math.round((c.priceRmbCents || c.unitPrice || 500) / 10)),
      allowCoin: c.allowCoin ?? true,
      pricePoints: c.pricePoints ?? (c.priceRmbCents || c.unitPrice || 500),
      allowPoint: c.allowPoint ?? false,
      freeQuota: c.freeQuota ?? c.freePostCount ?? 1,
      quotaPeriod: c.quotaPeriod || "30D",
      validDays: c.validDays ?? c.expiryDays ?? 30,
      pinnedAllowCoin: c.pinnedAllowCoin ?? true,
      pinnedPriceCoins: c.pinnedPriceCoins ?? 50,
      highlightAllowCoin: c.highlightAllowCoin ?? true,
      highlightPriceCoins: c.highlightPriceCoins ?? 30,
      refreshAllowCoin: c.refreshAllowCoin ?? true,
      refreshPriceCoins: c.refreshPriceCoins ?? 10,
    });
  };
  const cancelEdit = () => { setEditingKey(null); setEditForm({}); };

  const saveEdit = async () => {
    if (!editingKey) return;
    setSaving(true);
    const res = await fetch("/api/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleKey: editingKey,
        isFree: editForm.isFree,
        isEnabled: editForm.isEnabled,
        allowRmb: editForm.allowRmb,
        priceRmbYuan: editForm.priceRmbYuan,
        allowCoin: editForm.allowCoin,
        priceCoins: editForm.priceCoins,
        allowPoint: editForm.allowPoint,
        pricePoints: editForm.pricePoints,
        freeQuota: editForm.freeQuota,
        quotaPeriod: editForm.quotaPeriod,
        validDays: editForm.validDays,
        pinnedPriceDailyYuan: editForm.pinnedPriceDailyYuan,
        pinnedAllowCoin: editForm.pinnedAllowCoin,
        pinnedPriceCoins: editForm.pinnedPriceCoins,
        highlightPriceDailyYuan: editForm.highlightPriceDailyYuan,
        highlightAllowCoin: editForm.highlightAllowCoin,
        highlightPriceCoins: editForm.highlightPriceCoins,
        refreshPriceOnceYuan: editForm.refreshPriceOnceYuan,
        refreshAllowCoin: editForm.refreshAllowCoin,
        refreshPriceCoins: editForm.refreshPriceCoins,
        maleAuditPriceYuan: editForm.maleAuditPriceYuan,
        femaleAuditPriceYuan: editForm.femaleAuditPriceYuan,
      }),
    });
    if (res.ok) {
      showMsg("✅ 已更新「" + (editForm.moduleName || editingKey) + "」收费配置");
      cancelEdit();
      fetchData();
    } else {
      showMsg("❌ 保存失败");
    }
    setSaving(false);
  };

  // 子类定价保存
  const saveSubPricing = async (item: SubPricing) => {
    setSaving(true);
    const res = await fetch("/api/admin/sub-pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleKey: item.moduleKey,
        subKey: item.subKey,
        subName: item.subName,
        unitPrice: item.unitPrice,
        freePostCount: item.freePostCount,
        pinnedPriceDaily: item.pinnedPriceDaily,
        refreshPriceOnce: item.refreshPriceOnce,
        isFree: item.isFree,
        isEnabled: item.isEnabled,
      }),
    });
    if (res.ok) {
      showMsg(`✅ 已更新「${item.subName}」细分定价`);
      setEditingSubKey(null);
      fetchData();
    } else {
      showMsg("❌ 保存失败");
    }
    setSaving(false);
  };

  // VIP 套餐更新
  const saveVipPackage = async (pkg: VipPackage) => {
    setSaving(true);
    const priceCents = vipForm.priceYuan ? Math.round(parseFloat(vipForm.priceYuan) * 100) : pkg.priceCents;
    const res = await fetch("/api/admin/vip-packages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: pkg.id,
        name: pkg.name,
        priceCents,
        durationDays: pkg.durationDays,
        badgeText: pkg.badgeText,
        description: pkg.description,
        privileges: pkg.privileges,
        isEnabled: pkg.isEnabled,
      }),
    });
    if (res.ok) {
      showMsg(`✅ 已更新「${pkg.name}」套餐`);
      setEditingVipId(null);
      fetchData();
    } else {
      showMsg("❌ 保存失败");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout title="💰 收费策略大厅" subtitle="数据加载中...">
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>正在加载全站收费体系...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="💰 全站商业化收费策略总控大厅"
      subtitle="统一收费体系：支持 8 大核心板块人民币(元)、金币(代币)、积分(兑换)三种独立支付介质，免费额度防刷管控、B2B企业与相亲VIP会员套餐及增值服务定价。"
    >
      {message && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          padding: "12px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: "bold",
          background: message.startsWith("✅") ? "#ecfdf5" : "#fef2f2",
          color: message.startsWith("✅") ? "#065f46" : "#991b1b",
          border: `1px solid ${message.startsWith("✅") ? "#a7f3d0" : "#fecaca"}`,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        }}>
          {message}
        </div>
      )}

      {/* 顶部 Tab 导航 */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "1.5rem" }}>
        {[
          { key: "modules", label: "📦 8大板块计费与免费额度" },
          { key: "vip",     label: "👑 B2B/B2C 会员等级包" },
          { key: "sub",     label: "🚗 分类信息细分类目定价" },
          { key: "coins",   label: "🪙 杨林金币代币系统" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            style={{
              padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
              fontWeight: "bold", fontSize: "14px",
              color: activeTab === t.key ? "#0B7A75" : "#64748b",
              borderBottom: activeTab === t.key ? "3px solid #0B7A75" : "3px solid transparent",
              marginBottom: "-2px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== TAB 1: 8大核心板块计费 ===== */}
      {activeTab === "modules" && (
        <div>
          {/* 全局免费活动总控横幅 */}
          <section style={{
            background: globalConfig.isGlobalFree
              ? "linear-gradient(135deg, #15803d 0%, #166534 100%)"
              : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            borderRadius: "14px", padding: "1.25rem 1.5rem", color: "white", marginBottom: "1.5rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: globalConfig.isGlobalFree ? "#4ade80" : "#94a3b8", display: "inline-block" }} />
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold" }}>全站收费 / 节日活动一键总控</h3>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1", maxWidth: "600px" }}>
                    开启「全站免费模式」将跳过所有板块收费校验。适用于开站庆典、法定节假日等推广活动。
                  </p>
                </div>

                <button
                  onClick={() => setGlobalConfig({ ...globalConfig, isGlobalFree: !globalConfig.isGlobalFree })}
                  style={{
                    padding: "10px 22px", borderRadius: "12px", fontWeight: "bold", fontSize: "14px",
                    cursor: "pointer", transition: "all 0.2s", border: "2px solid",
                    background: globalConfig.isGlobalFree ? "#22c55e" : "#334155",
                    borderColor: globalConfig.isGlobalFree ? "#16a34a" : "#475569",
                    color: "white",
                  }}
                >
                  {globalConfig.isGlobalFree ? "🟢 已开启全站免费" : "⚪ 标准计费运行中"}
                </button>
              </div>

              {globalConfig.isGlobalFree && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#e2e8f0", marginBottom: "6px" }}>
                    免费活动公告（展示在全站发布与结算弹窗）
                  </label>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <textarea
                      value={globalConfig.freeAnnouncement}
                      onChange={(e) => setGlobalConfig({ ...globalConfig, freeAnnouncement: e.target.value })}
                      placeholder="输入活动文案..."
                      rows={2}
                      style={{
                        flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)",
                        background: "rgba(255,255,255,0.08)", color: "white", fontSize: "13px", resize: "none", outline: "none",
                      }}
                    />
                    <button
                      onClick={saveGlobal}
                      disabled={savingGlobal}
                      style={{
                        padding: "10px 20px", borderRadius: "8px", background: "#22c55e", color: "white",
                        border: "none", fontWeight: "bold", fontSize: "13px", cursor: "pointer",
                        opacity: savingGlobal ? 0.6 : 1,
                      }}
                    >
                      {savingGlobal ? "保存中..." : "✓ 同步公告"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 板块收费卡片网格 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.25rem" }}>
            {configs.map((c) => {
              const colors = MODULE_COLORS[c.moduleKey] || MODULE_COLORS.job;
              const icon = MODULE_ICONS[c.moduleKey] || "📦";
              const isEditing = editingKey === c.moduleKey;
              const isLove = c.moduleKey === "love";

              const priceYuanText = c.priceRmbYuan || centsToYuan(c.priceRmbCents || c.unitPrice);
              const coinsText = `${c.priceCoins || Math.round((c.priceRmbCents || c.unitPrice || 500) / 10)}金币`;
              const pointsText = c.allowPoint ? `${c.pricePoints || 0}积分` : "未开启";

              const quotaCount = c.freeQuota ?? c.freePostCount ?? 1;
              const periodText = PERIOD_LABELS[c.quotaPeriod || "30D"] || "每30天重置";

              return (
                <div key={c.moduleKey} style={{
                  background: "white", borderRadius: "14px", border: `1px solid ${colors.border}`,
                  overflow: "hidden", opacity: c.isEnabled ? 1 : 0.6,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}>
                  {/* 卡片头部 */}
                  <div style={{
                    background: colors.bg, padding: "16px 18px",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    borderBottom: `1px solid ${colors.border}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{
                        width: "42px", height: "42px", borderRadius: "12px",
                        background: colors.text, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "20px", color: "white",
                      }}>{icon}</span>
                      <div>
                        <div style={{ fontWeight: "800", fontSize: "16px", color: "#0f172a" }}>{c.moduleName}</div>
                        <span style={{
                          fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "4px",
                          background: c.isFree ? "#d1fae5" : "#fef3c7",
                          color: c.isFree ? "#065f46" : "#92400e",
                        }}>
                          {c.isFree ? "免费发布" : "按次收费"}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {c.isFree ? (
                        <div style={{ fontSize: "1.4rem", fontWeight: "800", color: colors.text }}>免费</div>
                      ) : (
                        <div style={{ fontSize: "1.4rem", fontWeight: "800", color: colors.text }}>
                          ¥{priceYuanText}
                          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "normal" }}>/次</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 卡片主体 */}
                  <div style={{ padding: "16px 18px" }}>
                    {/* 三种支付介质标牌 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                      <div style={{ background: "#EFF6FF", padding: "8px 10px", borderRadius: "8px", border: "1px solid #BFDBFE" }}>
                        <div style={{ fontSize: "11px", color: "#1D4ED8", fontWeight: "bold" }}>💴 人民币 (现金)</div>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "#1E3A8A" }}>
                          {c.allowRmb ? `¥${priceYuanText}` : "未开启"}
                        </div>
                      </div>
                      <div style={{ background: "#FFFBEB", padding: "8px 10px", borderRadius: "8px", border: "1px solid #FDE68A" }}>
                        <div style={{ fontSize: "11px", color: "#B45309", fontWeight: "bold" }}>🪙 金币 (代币)</div>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "#78350F" }}>
                          {c.allowCoin ? coinsText : "未开启"}
                        </div>
                      </div>
                      <div style={{ background: "#F5F3FF", padding: "8px 10px", borderRadius: "8px", border: "1px solid #DDD6FE" }}>
                        <div style={{ fontSize: "11px", color: "#6D28D9", fontWeight: "bold" }}>✨ 积分 (兑换)</div>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "#4C1D95" }}>
                          {pointsText}
                        </div>
                      </div>
                    </div>

                    {/* 免费配额与有效期 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                      <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "bold" }}>免费额度与重置周期</div>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "#334155" }}>
                          {quotaCount} 条 · {periodText}
                        </div>
                      </div>
                      <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "bold" }}>信息展示有效期</div>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "#334155" }}>
                          {(c.validDays ?? c.expiryDays ?? 30) === 0 ? "永久有效" : `${c.validDays ?? c.expiryDays ?? 30} 天`}
                        </div>
                      </div>
                    </div>

                    {/* 相亲男女差异化审核费 */}
                    {isLove && (
                      <div style={{ background: "#fdf2f8", border: "1px solid #fbcfe8", borderRadius: "8px", padding: "8px 12px", marginBottom: "12px", fontSize: "12px", color: "#9d174d", display: "flex", justifyContent: "space-between" }}>
                        <span>💘 资料审核费：</span>
                        <span>
                          <strong>男: ¥{c.maleAuditPriceYuan || centsToYuan(c.maleAuditPrice)}</strong> | <strong>女: ¥{c.femaleAuditPriceYuan || centsToYuan(c.femaleAuditPrice)}</strong>
                        </span>
                      </div>
                    )}

                    {/* 增值服务多介质展示 */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
                      <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px", background: "#fef3c7", color: "#b45309", fontWeight: "600" }}>
                        ⭐ 置顶: ¥{c.pinnedPriceDailyYuan || centsToYuan(c.pinnedPriceDaily)}/天 · {c.pinnedPriceCoins || 50}金币
                      </span>
                      <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px", background: "#fef2f2", color: "#dc2626", fontWeight: "600" }}>
                        🔥 加红: ¥{c.highlightPriceDailyYuan || centsToYuan(c.highlightPriceDaily)}/天 · {c.highlightPriceCoins || 30}金币
                      </span>
                      <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px", background: "#eff6ff", color: "#2563eb", fontWeight: "600" }}>
                        🔄 刷新: ¥{c.refreshPriceOnceYuan || centsToYuan(c.refreshPriceOnce)}/次 · {c.refreshPriceCoins || 10}金币
                      </span>
                    </div>

                    {isEditing ? (
                      <div style={{ background: "#f8fafc", margin: "-16px -18px -16px -18px", padding: "18px", borderTop: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b", marginBottom: "10px", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px" }}>
                          📐 基础发帖计费与免费额度配置 (单位：元 / 金币 / 积分)
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#1e3a8a", marginBottom: "4px" }}>
                              人民币发帖单价 (元)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.priceRmbYuan || ""}
                              onChange={(e) => setEditForm({ ...editForm, priceRmbYuan: e.target.value })}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                            <label style={{ fontSize: "11px", color: "#475569", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                              <input
                                type="checkbox"
                                checked={editForm.allowRmb ?? true}
                                onChange={(e) => setEditForm({ ...editForm, allowRmb: e.target.checked })}
                              />
                              允许微信支付
                            </label>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#78350f", marginBottom: "4px" }}>
                              金币发帖单价 (金币)
                            </label>
                            <input
                              type="number"
                              value={editForm.priceCoins || 0}
                              onChange={(e) => setEditForm({ ...editForm, priceCoins: parseInt(e.target.value) || 0 })}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                            <label style={{ fontSize: "11px", color: "#475569", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                              <input
                                type="checkbox"
                                checked={editForm.allowCoin ?? true}
                                onChange={(e) => setEditForm({ ...editForm, allowCoin: e.target.checked })}
                              />
                              允许金币抵扣
                            </label>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#4c1d95", marginBottom: "4px" }}>
                              积分兑换发帖 (积分)
                            </label>
                            <input
                              type="number"
                              value={editForm.pricePoints || 0}
                              onChange={(e) => setEditForm({ ...editForm, pricePoints: parseInt(e.target.value) || 0 })}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                            <label style={{ fontSize: "11px", color: "#475569", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                              <input
                                type="checkbox"
                                checked={editForm.allowPoint ?? false}
                                onChange={(e) => setEditForm({ ...editForm, allowPoint: e.target.checked })}
                              />
                              允许积分兑换
                            </label>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#334155", marginBottom: "4px" }}>
                              免费额度重置周期
                            </label>
                            <select
                              value={editForm.quotaPeriod || "30D"}
                              onChange={(e) => setEditForm({ ...editForm, quotaPeriod: e.target.value })}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            >
                              <option value="30D">每30天重置 (推荐)</option>
                              <option value="ONCE">终身仅免费首次</option>
                              <option value="DAILY">每日重置</option>
                              <option value="7D">每周重置</option>
                              <option value="365D">每年重置</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#334155", marginBottom: "4px" }}>
                              周期免费额度 (条)
                            </label>
                            <input
                              type="number"
                              value={editForm.freeQuota || 0}
                              onChange={(e) => setEditForm({ ...editForm, freeQuota: parseInt(e.target.value) || 0 })}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#334155", marginBottom: "4px" }}>
                              展示有效期 (天, 0=永久)
                            </label>
                            <input
                              type="number"
                              value={editForm.validDays || 0}
                              onChange={(e) => setEditForm({ ...editForm, validDays: parseInt(e.target.value) || 0 })}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                          </div>
                        </div>

                        {/* 增值服务价格 */}
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b", margin: "12px 0 8px 0", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px" }}>
                          ⭐ 增值服务定价配置 (单位：元 / 金币)
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#b45309", marginBottom: "4px" }}>置顶单价 (元/天)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.pinnedPriceDailyYuan || ""}
                              onChange={(e) => setEditForm({ ...editForm, pinnedPriceDailyYuan: e.target.value })}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#b45309", marginBottom: "4px" }}>置顶单价 (金币/天)</label>
                            <input
                              type="number"
                              value={editForm.pinnedPriceCoins || 50}
                              onChange={(e) => setEditForm({ ...editForm, pinnedPriceCoins: parseInt(e.target.value) || 0 })}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#dc2626", marginBottom: "4px" }}>加红单价 (元/天)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.highlightPriceDailyYuan || ""}
                              onChange={(e) => setEditForm({ ...editForm, highlightPriceDailyYuan: e.target.value })}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#dc2626", marginBottom: "4px" }}>加红单价 (金币/天)</label>
                            <input
                              type="number"
                              value={editForm.highlightPriceCoins || 30}
                              onChange={(e) => setEditForm({ ...editForm, highlightPriceCoins: parseInt(e.target.value) || 0 })}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#2563eb", marginBottom: "4px" }}>刷新单价 (元/次)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.refreshPriceOnceYuan || ""}
                              onChange={(e) => setEditForm({ ...editForm, refreshPriceOnceYuan: e.target.value })}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#2563eb", marginBottom: "4px" }}>刷新单价 (金币/次)</label>
                            <input
                              type="number"
                              value={editForm.refreshPriceCoins || 10}
                              onChange={(e) => setEditForm({ ...editForm, refreshPriceCoins: parseInt(e.target.value) || 0 })}
                              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                            />
                          </div>

                          {isLove && (
                            <>
                              <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#be185d", marginBottom: "4px" }}>🚹 男生审核费 (元)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editForm.maleAuditPriceYuan || ""}
                                  onChange={(e) => setEditForm({ ...editForm, maleAuditPriceYuan: e.target.value })}
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #fbcfe8", fontSize: "13px", color: "#be185d", fontWeight: "bold" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#be185d", marginBottom: "4px" }}>🚺 女生审核费 (元)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editForm.femaleAuditPriceYuan || ""}
                                  onChange={(e) => setEditForm({ ...editForm, femaleAuditPriceYuan: e.target.value })}
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #fbcfe8", fontSize: "13px", color: "#be185d", fontWeight: "bold" }}
                                />
                              </div>
                            </>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={saveEdit}
                            disabled={saving}
                            style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "#0f172a", color: "white", border: "none", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
                          >
                            {saving ? "保存中..." : "✓ 保存多介质收费参数"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{ padding: "10px 18px", borderRadius: "8px", background: "white", color: "#475569", border: "1px solid #cbd5e1", fontSize: "13px", cursor: "pointer" }}
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => startEdit(c)}
                          style={{ padding: "8px 14px", borderRadius: "8px", background: "#0f172a", color: "white", border: "none", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          🔧 调整多介质定价
                        </button>
                        <button
                          onClick={() => {
                            fetch("/api/admin/pricing", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ moduleKey: c.moduleKey, isFree: !c.isFree }),
                            }).then(() => { showMsg("已切换免费状态"); fetchData(); });
                          }}
                          style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", fontSize: "12px", cursor: "pointer" }}
                        >
                          {c.isFree ? "切换为按次收费" : "切换为免费发布"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== TAB 2: B2B/B2C 会员等级包 ===== */}
      {activeTab === "vip" && (
        <div>
          <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#0f172a" }}>👑 会员等级包 (复刻老站企业招聘包/相亲VIP/商家年费)</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              通过为企业雇主、相亲单身贵族及入驻商户提供周期性（月/季/年）打包特权与消费配额，实现高额商业转化。
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1rem" }}>
            {vipPackages.map((pkg) => {
              const isEditing = editingVipId === pkg.id;
              return (
                <div key={pkg.id} style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.25rem", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "4px", background: "#fef3c7", color: "#92400e", marginRight: "6px" }}>
                        {pkg.targetModule === "JOB" ? "💼 招聘企业" : pkg.targetModule === "LOVE" ? "💘 相亲交友" : "🏪 好店商家"}
                      </span>
                      <strong style={{ fontSize: "15px", color: "#0f172a" }}>{pkg.name}</strong>
                    </div>
                    <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#0B7A75" }}>
                      ¥{pkg.priceYuan}
                      <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "normal" }}>/{pkg.durationDays}天</span>
                    </div>
                  </div>

                  <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px 0", minHeight: "36px" }}>
                    {pkg.description || "包含专属尊贵角标与配额特权"}
                  </p>

                  <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", fontSize: "12px", color: "#334155", marginBottom: "12px" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>🎁 权益配额清单：</div>
                    {pkg.targetModule === "JOB" && (
                      <div>
                        • 职位发布数: <strong>{pkg.privileges?.maxJobs || 0}</strong> 条<br />
                        • 简历查看数: <strong>{pkg.privileges?.maxResumes || 0}</strong> 份<br />
                        • 面试邀约: <strong>{pkg.privileges?.maxInterviews || 0}</strong> 次
                      </div>
                    )}
                    {pkg.targetModule === "LOVE" && (
                      <div>
                        • 红娘牵线服务: <strong>{pkg.privileges?.matchTimes || 0}</strong> 次<br />
                        • 免费看联系方式: <strong>{pkg.privileges?.seeContactFree ? "支持" : "不支持"}</strong><br />
                        • 赠送置顶天数: <strong>{pkg.privileges?.giftPinnedDays || 0}</strong> 天
                      </div>
                    )}
                    {pkg.targetModule === "SHOP" && (
                      <div>
                        • 赠送置顶天数: <strong>{pkg.privileges?.giftPinnedDays || 0}</strong> 天<br />
                        • 每月动态发布数: <strong>{pkg.privileges?.momentsLimitPerMonth || 0}</strong> 条
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "11px", fontWeight: "bold", color: "#64748b" }}>套餐售价 (元):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={vipForm.priceYuan ?? pkg.priceYuan}
                        onChange={(e) => setVipForm({ ...vipForm, priceYuan: e.target.value })}
                        style={{ padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => saveVipPackage({ ...pkg, ...vipForm } as any)} style={{ flex: 1, padding: "6px", background: "#0B7A75", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>保存</button>
                        <button onClick={() => setEditingVipId(null)} style={{ padding: "6px 12px", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer" }}>取消</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingVipId(pkg.id); setVipForm(pkg); }} style={{ width: "100%", padding: "6px 0", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", color: "#334155", cursor: "pointer" }}>
                      🔧 修改套餐参数与价格
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== TAB 3: 分类信息细分子类定价 ===== */}
      {activeTab === "sub" && (
        <div>
          <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#0f172a" }}>🚗 分类信息细分类目独立定价 (复刻老站拼车/二手独立计费)</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              支持在统一分类信息板块下，对拼车（车找人、人找车、天天发车）、二手、家政等独立设置按次单价与免费额度。
            </p>
          </div>

          <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 16px" }}>细分类目名称</th>
                  <th style={{ padding: "12px 16px" }}>类目标识 (subKey)</th>
                  <th style={{ padding: "12px 16px" }}>发布单价</th>
                  <th style={{ padding: "12px 16px" }}>首发免费额度</th>
                  <th style={{ padding: "12px 16px" }}>置顶单价</th>
                  <th style={{ padding: "12px 16px" }}>刷新单价</th>
                  <th style={{ padding: "12px 16px" }}>状态</th>
                  <th style={{ padding: "12px 16px" }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {subPricings.map((sp) => {
                  const isEditing = editingSubKey === sp.subKey;
                  return (
                    <tr key={sp.subKey} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "bold", color: "#0f172a" }}>{sp.subName}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontFamily: "monospace" }}>{sp.subKey}</td>
                      <td style={{ padding: "12px 16px", color: "#0B7A75", fontWeight: "bold" }}>
                        {isEditing ? (
                          <input type="number" defaultValue={sp.unitPrice} onChange={(e) => setSubForm({ ...subForm, unitPrice: parseInt(e.target.value) || 0 })} style={{ width: "70px", padding: "4px" }} />
                        ) : (
                          sp.isFree ? "免费" : `¥${sp.unitPriceYuan}`
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {isEditing ? (
                          <input type="number" defaultValue={sp.freePostCount} onChange={(e) => setSubForm({ ...subForm, freePostCount: parseInt(e.target.value) || 0 })} style={{ width: "50px", padding: "4px" }} />
                        ) : (
                          `${sp.freePostCount} 条`
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#b45309" }}>¥{sp.pinnedPriceDailyYuan}/天</td>
                      <td style={{ padding: "12px 16px", color: "#2563eb" }}>¥{sp.refreshPriceOnceYuan}/次</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "11px", background: sp.isEnabled ? "#dcfce7" : "#fee2e2", color: sp.isEnabled ? "#15803d" : "#b91c1c" }}>
                          {sp.isEnabled ? "已启用" : "已停用"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => saveSubPricing({ ...sp, ...subForm } as any)} style={{ padding: "4px 8px", background: "#0B7A75", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}>保存</button>
                            <button onClick={() => setEditingSubKey(null)} style={{ padding: "4px 8px", background: "white", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}>取消</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingSubKey(sp.subKey); setSubForm(sp); }} style={{ padding: "4px 8px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}>
                            编辑
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== TAB 4: 杨林金币钱包与充值 ===== */}
      {activeTab === "coins" && (
        <div>
          <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#0f172a" }}>🪙 杨林金币代币系统 (复刻老站虚拟货币钱包)</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              金币兑换比例：<strong>1 元 = 10 金币</strong>。用户可预充值金币或每日签到获取，在发布信息、刷新、置顶时直接抵扣现金。
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {[
              { name: "100 金币", price: "¥10.00", coins: 100, bonus: 0, tag: "标准充值" },
              { name: "320 金币", price: "¥30.00", coins: 300, bonus: 20, tag: "赠送20金币" },
              { name: "550 金币", price: "¥50.00", coins: 500, bonus: 50, tag: "赠送50金币" },
              { name: "1150 金币", price: "¥100.00", coins: 1000, bonus: 150, tag: "超值赠送150金币" },
            ].map((p) => (
              <div key={p.name} style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "4px", background: "#fef3c7", color: "#92400e" }}>
                  {p.tag}
                </span>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#b45309", margin: "10px 0 4px 0" }}>
                  {p.name}
                </div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#0B7A75", marginBottom: "8px" }}>
                  售价: {p.price}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  包含 {p.coins} 基础币 + {p.bonus} 赠币
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
