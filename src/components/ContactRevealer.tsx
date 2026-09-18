"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  contact?: string;
  jobId?: string;
  maskedPhone?: string;
  hasPhone?: boolean;
  isLoggedIn?: boolean;
  compact?: boolean;
  redirectUrl?: string;
  /** 金币付费解锁参数 */
  targetKind?: "house" | "job" | "listing";
  targetId?: string;
  coinCost?: number;
  unlocked?: boolean; // 服务端已确认解锁（管理员/本人/VIP/已购买）
};

export default function ContactRevealer({
  contact,
  jobId,
  maskedPhone,
  hasPhone,
  isLoggedIn,
  compact,
  redirectUrl,
  targetKind,
  targetId,
  coinCost = 0,
  unlocked = false,
}: Props) {
  // 已解锁且有真实号码时直接展示（已购买/管理员/VIP/本人）
  const [revealedPhone, setRevealedPhone] = useState<string | null>(
    unlocked && contact && contact !== "同城面议" ? contact : null
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showCoinDialog, setShowCoinDialog] = useState(false);
  const [coinBalance, setCoinBalance] = useState<number | null>(null);

  // Legacy fallback
  const rawContact = contact || "";
  const effectiveHasPhone = hasPhone !== undefined ? hasPhone : !!(rawContact || maskedPhone);
  const effectiveMasked =
    maskedPhone ||
    (rawContact && rawContact !== "同城面议"
      ? rawContact.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")
      : "同城面议");

  // 是否需要金币付费（必须已登录才走金币流程，未登录先走登录）
  const needsCoinPayment = !!(isLoggedIn && targetKind && targetId && coinCost > 0 && !unlocked && !contact);

  const loginRedirectPath = redirectUrl
    ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
    : jobId
    ? `/login?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`
    : `/login`;

  const handleCoinUnlock = async () => {
    if (!targetKind || !targetId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/contact/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetKind, targetId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setRevealedPhone(data.phone);
        setShowCoinDialog(false);
        if (data.balance !== undefined) setCoinBalance(data.balance);
      } else if (res.status === 402) {
        // 余额不足
        setErrorMsg(`金币不足！当前 ${data.balance ?? 0} 金币，需要 ${data.required ?? coinCost} 金币`);
        setCoinBalance(data.balance ?? 0);
      } else if (res.status === 401) {
        window.location.href = loginRedirectPath;
      } else {
        setErrorMsg(data.message || "解锁失败，请稍后重试");
      }
    } catch {
      setErrorMsg("网络错误，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 如果未登录，跳转登录
    if (!isLoggedIn && !contact) {
      window.location.href = loginRedirectPath;
      return;
    }

    // 需要金币付费 → 弹出确认
    if (needsCoinPayment) {
      // 先查询余额
      setLoading(true);
      try {
        const res = await fetch(`/api/contact/unlock?targetKind=${targetKind}&targetId=${targetId}`);
        const data = await res.json();
        if (data.unlocked && data.phone) {
          // 已解锁（可能是VIP或之前购买的）
          setRevealedPhone(data.phone);
          return;
        }
        setCoinBalance(data.balance ?? null);
      } catch {
        // ignore, show dialog anyway
      } finally {
        setLoading(false);
      }
      setShowCoinDialog(true);
      return;
    }

    // 已由服务端注入真实号码，直接秒开
    if (contact && contact !== "同城面议") {
      setRevealedPhone(contact);
      if (jobId) {
        fetch(`/api/jobs/${jobId}/contact`).catch(() => {});
      }
      return;
    }

    // 只有 jobId 且已登录但未预注入
    if (jobId && isLoggedIn) {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/jobs/${jobId}/contact`);
        const data = await res.json();
        if (res.ok && data.success && data.phone) {
          setRevealedPhone(data.phone);
        } else if (data.maskedPhone) {
          setRevealedPhone(data.maskedPhone);
        } else {
          setErrorMsg(data.message || "联系方式解析失败");
        }
      } catch {
        if (maskedPhone && maskedPhone !== "暂未公开") {
          setRevealedPhone(maskedPhone);
        } else {
          setErrorMsg("联系方式解析失败");
        }
      } finally {
        setLoading(false);
      }
    } else if (rawContact) {
      setRevealedPhone(rawContact);
    }
  };

  const handleCopy = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const p = revealedPhone || rawContact;
    if (!p) return;
    navigator.clipboard.writeText(p);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ========== 金币支付确认弹窗 ==========
  const CoinDialog = () => {
    if (!showCoinDialog) return null;
    const hasEnough = coinBalance !== null && coinBalance >= coinCost;

    return (
      <div
        onClick={(e) => { e.stopPropagation(); setShowCoinDialog(false); }}
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "white", borderRadius: "16px", padding: "24px",
            maxWidth: "360px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>🔐</div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "900", color: "#0f172a" }}>
              解锁联系方式
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              查看完整电话号码需消耗金币
            </p>
          </div>

          {/* 费用信息 */}
          <div style={{
            background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "10px",
            padding: "14px", marginBottom: "14px", textAlign: "center",
          }}>
            <div style={{ fontSize: "12px", color: "#92400E", fontWeight: "600", marginBottom: "4px" }}>
              本次解锁费用
            </div>
            <div style={{ fontSize: "28px", fontWeight: "900", color: "#B45309" }}>
              {coinCost} <span style={{ fontSize: "14px" }}>金币</span>
            </div>
            {coinBalance !== null && (
              <div style={{ fontSize: "12px", color: hasEnough ? "#059669" : "#DC2626", marginTop: "4px", fontWeight: "700" }}>
                当前余额：{coinBalance} 金币 {!hasEnough && "（不足）"}
              </div>
            )}
          </div>

          {/* 提示 */}
          <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "16px", lineHeight: "1.5" }}>
            💡 解锁后可永久查看该联系方式。VIP会员可免费查看所有联系方式。
          </div>

          {errorMsg && (
            <div style={{
              fontSize: "12px", color: "#DC2626", background: "#FEF2F2",
              padding: "8px 10px", borderRadius: "8px", marginBottom: "12px",
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* 操作按钮 */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowCoinDialog(false)}
              style={{
                flex: 1, padding: "12px", borderRadius: "10px",
                background: "#F1F5F9", border: "none", fontSize: "14px",
                fontWeight: "700", color: "#64748b", cursor: "pointer",
              }}
            >
              取消
            </button>
            {hasEnough ? (
              <button
                onClick={handleCoinUnlock}
                disabled={loading}
                style={{
                  flex: 1.5, padding: "12px", borderRadius: "10px",
                  background: loading ? "#94a3b8" : "#0B7A75", border: "none",
                  fontSize: "14px", fontWeight: "700", color: "white",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "解锁中..." : `🪙 确认支付 ${coinCost} 金币`}
              </button>
            ) : (
              <a
                href="/profile"
                style={{
                  flex: 1.5, padding: "12px", borderRadius: "10px",
                  background: "#B45309", border: "none", fontSize: "14px",
                  fontWeight: "700", color: "white", cursor: "pointer",
                  textAlign: "center", textDecoration: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                💰 去充值金币
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ========== 1. 紧凑列表模式 ==========
  const isCompactMode = compact === true;
  if (isCompactMode) {
    if (!effectiveHasPhone || rawContact === "同城面议" || effectiveMasked === "同城面议") {
      return (
        <span style={{ fontSize: "11.5px", color: "#94a3b8", fontWeight: "600" }}>
          💬 同城面议
        </span>
      );
    }

    if (revealedPhone) {
      return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
          <a
            href={`tel:${revealedPhone}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              background: "#dcfce7",
              color: "#15803d",
              border: "1px solid #86efac",
              borderRadius: "14px",
              fontSize: "12px",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            📞 {revealedPhone}
          </a>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: "white",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "3px 6px",
              fontSize: "11px",
              color: "#475569",
              cursor: "pointer",
            }}
          >
            {copied ? "✓" : "复制"}
          </button>
        </div>
      );
    }

    return (
      <>
        <CoinDialog />
        <button
          type="button"
          onClick={handleReveal}
          title={needsCoinPayment ? `花费${coinCost}金币查看电话` : !isLoggedIn && !contact ? "点击登录查看完整电话" : "点击查看完整电话"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            background: "#0B7A75",
            color: "white",
            border: "none",
            borderRadius: "14px",
            fontSize: "11.5px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
        >
          {needsCoinPayment ? (
            <>🪙 {effectiveMasked} ({coinCost}金币)</>
          ) : (
            <>📞 {effectiveMasked} {!isLoggedIn && !contact ? "(需登录)" : ""}</>
          )}
        </button>
      </>
    );
  }

  // ========== 2. 详情页完整模式 ==========
  const displayPhone = revealedPhone || (contact ? (revealedPhone ? contact : effectiveMasked) : effectiveMasked);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      <CoinDialog />

      {/* 电话主卡片 */}
      <div
        style={{
          padding: "16px",
          background: revealedPhone
            ? "linear-gradient(135deg, #f0fdf4 0%, #e6f4f1 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          border: revealedPhone ? "1px solid #86efac" : "1px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {revealedPhone ? "✅ 真实联系电话" : needsCoinPayment ? "🪙 联系电话 (需付费解锁)" : "🔒 联系电话 (已隐私脱敏)"}
          </span>
          {revealedPhone ? (
            <span style={{ fontSize: "11px", background: "#dcfce7", color: "#15803d", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>
              已解锁
            </span>
          ) : needsCoinPayment ? (
            <span style={{ fontSize: "11px", background: "#FEF3C7", color: "#B45309", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>
              🪙 {coinCost}金币
            </span>
          ) : (
            <span style={{ fontSize: "11px", background: "#f1f5f9", color: "#64748b", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>
              登录后解锁
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ fontSize: "19px", fontWeight: "900", color: revealedPhone ? "#15803d" : "#0f172a", letterSpacing: "0.5px" }}>
            {effectiveHasPhone ? displayPhone : "暂未公开"}
          </div>

          {/* 未登录 → 登录按钮 */}
          {!revealedPhone && effectiveHasPhone && !isLoggedIn && !contact && !needsCoinPayment && (
            <Link
              href={loginRedirectPath}
              className="button button-small button-primary"
              style={{
                padding: "0 12px",
                fontSize: "12px",
                height: "32px",
                borderRadius: "8px",
                fontWeight: "700",
                whiteSpace: "nowrap",
                background: "#0B7A75",
                borderColor: "#0B7A75",
              }}
            >
              🔑 登录查看完整号码
            </Link>
          )}

          {/* 需要金币付费 → 解锁按钮 */}
          {!revealedPhone && effectiveHasPhone && needsCoinPayment && (
            <button
              type="button"
              className="button button-small button-primary"
              style={{
                padding: "0 14px",
                fontSize: "13px",
                height: "34px",
                borderRadius: "8px",
                fontWeight: "700",
                whiteSpace: "nowrap",
                background: "#B45309",
                borderColor: "#B45309",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
              onClick={handleReveal}
              disabled={loading}
            >
              {loading ? "查询中..." : `🪙 ${coinCost}金币解锁`}
            </button>
          )}

          {/* 已登录 + 免费查看（已解锁/无需付费）→ 查看按钮 */}
          {!revealedPhone && effectiveHasPhone && !needsCoinPayment && (isLoggedIn || contact) && (
            <button
              type="button"
              className="button button-small button-primary"
              style={{
                padding: "0 14px",
                fontSize: "13px",
                height: "34px",
                borderRadius: "8px",
                fontWeight: "700",
                whiteSpace: "nowrap",
                background: "#0B7A75",
                borderColor: "#0B7A75",
              }}
              onClick={handleReveal}
              disabled={loading}
            >
              {loading ? "正在解析..." : "👁️ 查看完整号码"}
            </button>
          )}
        </div>
      </div>

      {/* 已解锁后的操作按钮 */}
      {revealedPhone && (
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="button button-secondary"
            style={{ flex: 1, fontSize: "13px", height: "40px", borderRadius: "8px", fontWeight: "700" }}
            onClick={handleCopy}
          >
            {copied ? "✓ 号码已复制" : "📋 复制号码"}
          </button>
          <a
            href={`tel:${revealedPhone}`}
            className="button button-primary"
            style={{
              flex: 1.2,
              fontSize: "13px",
              height: "40px",
              borderRadius: "8px",
              fontWeight: "700",
              textAlign: "center",
              background: "#0B7A75",
              borderColor: "#0B7A75",
            }}
          >
            📲 一键直拨电话
          </a>
        </div>
      )}

      {/* 投递简历与应聘互动按钮 (仅招聘详情页展示) */}
      {jobId && !compact && (
        <button
          type="button"
          onClick={() => {
            if (!isLoggedIn) {
              window.location.href = `/login?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`;
              return;
            }
            setApplied(true);
            setTimeout(() => setApplied(false), 3000);
          }}
          className="button button-secondary"
          style={{
            width: "100%",
            height: "40px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "13px",
            color: applied ? "#15803d" : "#0f172a",
            borderColor: applied ? "#86efac" : "#cbd5e1",
            background: applied ? "#f0fdf4" : "#ffffff",
          }}
        >
          {applied ? "✅ 意向已送达招聘方 (HR稍后联系您)" : "📄 一键投递个人意向/简历"}
        </button>
      )}

      {errorMsg && !showCoinDialog && (
        <div style={{ fontSize: "12px", color: "var(--danger)", background: "#fee2e2", padding: "6px 10px", borderRadius: "6px" }}>
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  );
}
