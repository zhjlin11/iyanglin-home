"use client";

import React, { useState, useEffect } from "react";

export interface BillingQuoteData {
  id?: string;
  isFree: boolean;
  freeReason?: string;
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
  module: string;
  action: string;
}

export interface UserBalances {
  coins: number;
  points: number;
}

interface BillingCheckoutModalProps {
  isOpen: boolean;
  quote: BillingQuoteData | null;
  userBalances?: UserBalances;
  onSuccess: (entitlementId: string) => void;
  onClose: () => void;
}

export default function BillingCheckoutModal({
  isOpen,
  quote,
  userBalances = { coins: 0, points: 0 },
  onSuccess,
  onClose,
}: BillingCheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<"RMB" | "COIN" | "POINT">("RMB");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [balances, setBalances] = useState<UserBalances>(userBalances);

  // 微信扫码状态
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [currentOrderNo, setCurrentOrderNo] = useState("");
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    setBalances(userBalances);
  }, [userBalances]);

  // 轮询支付状态
  useEffect(() => {
    let timer: any = null;
    if (isPolling && (currentOrderNo || quote?.id)) {
      timer = setInterval(async () => {
        try {
          const query = currentOrderNo ? `orderNo=${currentOrderNo}` : `quoteId=${quote?.id}`;
          const res = await fetch(`/api/billing/pay-quote?${query}`);
          const data = await res.json();
          if (data.paid && data.entitlementId) {
            clearInterval(timer);
            setIsPolling(false);
            onSuccess(data.entitlementId);
          }
        } catch (e) {
          console.error("轮询支付异常:", e);
        }
      }, 2000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPolling, currentOrderNo, quote?.id, onSuccess]);

  if (!isOpen || !quote) return null;

  const canUseCoin = quote.allowCoin && balances.coins >= quote.priceCoins;
  const canUsePoint = quote.allowPoint && balances.points >= quote.pricePoints;

  // 执行支付
  const handlePay = async (method: "RMB" | "COIN" | "POINT") => {
    if (!quote.id) {
      setErrorMsg("报价单失效，请刷新页面重新提交");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {

      if (method === "COIN") {
        const res = await fetch("/api/billing/pay-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quoteId: quote.id, payMethod: "COIN" }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "金币支付失败");
        }
        onSuccess(data.entitlementId);
        return;
      }

      if (method === "POINT") {
        const res = await fetch("/api/billing/pay-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quoteId: quote.id, payMethod: "POINT" }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "积分支付失败");
        }
        onSuccess(data.entitlementId);
        return;
      }

      if (method === "RMB") {
        const res = await fetch("/api/billing/pay-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quoteId: quote.id, payMethod: "WECHAT_NATIVE" }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "微信下单失败");
        }
        setCurrentOrderNo(data.orderNo);
        setQrCodeUrl(data.codeUrl);
        setIsPolling(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "支付发起失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          animation: "scaleUp 0.2s ease-out",
        }}
      >
        {/* 顶部 Header */}
        <div
          style={{
            padding: "20px 24px",
            background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", opacity: 0.85, fontWeight: "600", letterSpacing: "0.5px" }}>
              商业化计费收银台
            </div>
            <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", fontWeight: "800" }}>
              发布结算 · 额度已达上限
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: "white",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* 提示栏 */}
        <div
          style={{
            padding: "12px 20px",
            background: "#FEF3C7",
            borderBottom: "1px solid #FDE68A",
            fontSize: "13px",
            color: "#92400E",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>💡</span>
          <span>
            当前周期的免费发布额度 ({quote.freeQuotaTotal}条) 已用完，请选择支付介质完成发布。您的草稿内容已完整保留。
          </span>
        </div>

        {/* 主体内容 */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px 14px",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: "10px",
                color: "#B91C1C",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {/* 微信二维码展示 */}
          {qrCodeUrl ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#1E293B", marginBottom: "8px" }}>
                微信扫码支付 {quote.priceRmbDisplay}
              </div>
              <div
                style={{
                  width: "190px",
                  height: "190px",
                  margin: "0 auto 12px auto",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCodeUrl)}`}
                  alt="微信支付二维码"
                  style={{ width: "170px", height: "170px" }}
                />
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "16px" }}>
                打开手机微信扫一扫，支付成功后系统将自动完成发布
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                选择支付介质 (支持元、金币、积分)
              </div>

              {/* 1. 人民币现金微信支付 */}
              {quote.allowRmb && (
                <div
                  onClick={() => setSelectedMethod("RMB")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: selectedMethod === "RMB" ? "2px solid #2563EB" : "1px solid #E2E8F0",
                    background: selectedMethod === "RMB" ? "#EFF6FF" : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: "#07C160",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "20px",
                        fontWeight: "bold",
                      }}
                    >
                      微
                    </div>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>
                        微信支付 (人民币)
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B" }}>
                        即时到账 · 官方微信安全支付
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#2563EB" }}>
                      {quote.priceRmbDisplay}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94A3B8" }}>/次</div>
                  </div>
                </div>
              )}

              {/* 2. 金币代币支付 */}
              {quote.allowCoin && (
                <div
                  onClick={() => setSelectedMethod("COIN")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: selectedMethod === "COIN" ? "2px solid #D97706" : "1px solid #E2E8F0",
                    background: selectedMethod === "COIN" ? "#FFFBEB" : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: "#F59E0B",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                    >
                      🪙
                    </div>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>
                        金币抵扣
                      </div>
                      <div style={{ fontSize: "12px", color: balances.coins >= quote.priceCoins ? "#059669" : "#DC2626" }}>
                        当前钱包余额: {balances.coins} 金币 {balances.coins < quote.priceCoins ? "(余额不足)" : "(充足)"}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#D97706" }}>
                      {quote.priceCoinsDisplay}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94A3B8" }}>/次</div>
                  </div>
                </div>
              )}

              {/* 3. 积分兑换 */}
              {quote.allowPoint && (
                <div
                  onClick={() => setSelectedMethod("POINT")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: selectedMethod === "POINT" ? "2px solid #7C3AED" : "1px solid #E2E8F0",
                    background: selectedMethod === "POINT" ? "#F5F3FF" : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: "#8B5CF6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                    >
                      ✨
                    </div>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>
                        积分兑换
                      </div>
                      <div style={{ fontSize: "12px", color: balances.points >= quote.pricePoints ? "#059669" : "#DC2626" }}>
                        当前可用积分: {balances.points} 积分 {balances.points < quote.pricePoints ? "(积分不足)" : "(充足)"}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#7C3AED" }}>
                      {quote.pricePointsDisplay}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94A3B8" }}>/次</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮栏 */}
        {!qrCodeUrl && (
          <div
            style={{
              padding: "16px 24px",
              background: "#F8FAFC",
              borderTop: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 18px",
                borderRadius: "10px",
                border: "1px solid #CBD5E1",
                background: "white",
                color: "#475569",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              稍后支付
            </button>

            <button
              type="button"
              onClick={() => handlePay(selectedMethod)}
              disabled={
                loading ||
                (selectedMethod === "COIN" && !canUseCoin) ||
                (selectedMethod === "POINT" && !canUsePoint)
              }
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: "10px",
                border: "none",
                background:
                  selectedMethod === "COIN" && !canUseCoin
                    ? "#CBD5E1"
                    : selectedMethod === "POINT" && !canUsePoint
                    ? "#CBD5E1"
                    : selectedMethod === "COIN"
                    ? "#D97706"
                    : selectedMethod === "POINT"
                    ? "#7C3AED"
                    : "#2563EB",
                color: "white",
                fontSize: "15px",
                fontWeight: "700",
                cursor:
                  (selectedMethod === "COIN" && !canUseCoin) ||
                  (selectedMethod === "POINT" && !canUsePoint)
                    ? "not-allowed"
                    : "pointer",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            >
              {loading
                ? "支付处理中..."
                : selectedMethod === "COIN"
                ? canUseCoin
                  ? `确认使用 ${quote.priceCoinsDisplay} 支付`
                  : "金币不足，请使用微信支付"
                : selectedMethod === "POINT"
                ? canUsePoint
                  ? `确认使用 ${quote.pricePointsDisplay} 兑换`
                  : "积分不足，请使用微信支付"
                : `立即微信支付 ${quote.priceRmbDisplay}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
