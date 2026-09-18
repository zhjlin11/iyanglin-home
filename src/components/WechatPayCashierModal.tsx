"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, CheckCircle2, ShieldCheck, RefreshCw, AlertCircle, Clock } from "lucide-react";
import { detectPaymentScene, invokeWeixinPay } from "@/lib/payment-utils";

interface WechatPayCashierModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNo: string;
  amountYuan: string;
  orderTitle?: string;
  onSuccess: (orderNo: string) => void;
  targetType?: "mall" | "service" | "billing";
}

export default function WechatPayCashierModal({
  isOpen,
  onClose,
  orderNo,
  amountYuan,
  orderTitle = "自营便利店订单",
  onSuccess,
}: WechatPayCashierModalProps) {
  const [loading, setLoading] = useState(true);
  const [codeUrl, setCodeUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [checking, setChecking] = useState(false);
  const [paid, setPaid] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5分钟有效倒计时

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 清除所有定时器
  const clearTimers = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  // 轮询检查支付状态
  const startPolling = useCallback(
    (targetOrderNo: string) => {
      clearTimers();
      let pollCount = 0;

      pollTimerRef.current = setInterval(async () => {
        pollCount += 1;
        if (pollCount > 150) {
          // 超过 5 分钟停止轮询
          clearTimers();
          return;
        }

        try {
          const res = await fetch(`/api/payment/status?orderNo=${encodeURIComponent(targetOrderNo)}`);
          if (!res.ok) return;
          const data = await res.json();

          if (data.paid) {
            clearTimers();
            setPaid(true);
            setTimeout(() => {
              onSuccess(targetOrderNo);
            }, 1200);
          }
        } catch {
          // 忽略轮询单次网络抖动
        }
      }, 2000);

      // 倒计时
      setCountdown(300);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearTimers();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    },
    [clearTimers, onSuccess]
  );

  // 初始化调起微信统一下单
  const initPayment = useCallback(async () => {
    if (!orderNo) return;
    setLoading(true);
    setErrorMessage("");
    setPaid(false);

    try {
      const scene = detectPaymentScene();
      const res = await fetch("/api/payment/wechat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNo,
          paymentScene: scene,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "获取微信支付二维码失败，请重试");
        setLoading(false);
        return;
      }

      // 1. JSAPI 微信内置浏览器需要授权
      if (data.needOAuth && data.oauthUrl) {
        window.location.href = data.oauthUrl;
        return;
      }

      // 2. JSAPI 微信内置浏览器直接调起微信支付原生控件
      if (data.jsapiParams) {
        setLoading(false);
        try {
          const payResult = await invokeWeixinPay(data.jsapiParams);
          if (payResult === "success") {
            startPolling(orderNo);
          } else if (payResult === "cancel") {
            setErrorMessage("您已在微信中取消支付");
          } else {
            setErrorMessage("微信支付未完成，请点击下方按钮重新发起或核验");
          }
        } catch {
          setErrorMessage("拉起微信支付控件失败");
        }
        return;
      }

      // 3. H5 手机外部浏览器跳转
      if (data.mwebUrl) {
        setLoading(false);
        window.location.href = data.mwebUrl;
        return;
      }

      // 4. PC NATIVE 扫码支付
      if (data.codeUrl) {
        setCodeUrl(data.codeUrl);
        setLoading(false);
        startPolling(orderNo);
      } else {
        setErrorMessage("未能获取到有效的微信支付二维码");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "请求微信支付网络异常，请稍后重试");
      setLoading(false);
    }
  }, [orderNo, startPolling]);

  useEffect(() => {
    if (isOpen && orderNo) {
      initPayment();
    } else {
      clearTimers();
    }
    return () => clearTimers();
  }, [isOpen, orderNo, initPayment, clearTimers]);

  // 用户手动点击“我已完成微信支付”主动核验
  const handleManualVerify = async () => {
    if (!orderNo || checking) return;
    setChecking(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/payment/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo }),
      });
      const data = await res.json();

      if (data.paid) {
        clearTimers();
        setPaid(true);
        setTimeout(() => {
          onSuccess(orderNo);
        }, 1000);
      } else {
        setErrorMessage(data.message || "暂未查询到微信支付成功记录，请稍后重试或确认是否已扣款");
      }
    } catch {
      setErrorMessage("连接支付查询服务器异常，请重试");
    } finally {
      setChecking(false);
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const countdownFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          position: "relative",
          animation: "modalFadeIn 0.2s ease-out",
        }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.25)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            cursor: "pointer",
            zIndex: 10,
          }}
          title="关闭"
        >
          <X size={18} />
        </button>

        {/* 顶部品牌背景 */}
        <div
          style={{
            background: "linear-gradient(135deg, #07C160 0%, #059669 100%)",
            padding: "24px 20px 20px",
            color: "#ffffff",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "20px",
              background: "rgba(255, 255, 255, 0.18)",
              fontSize: "12.5px",
              fontWeight: "600",
              marginBottom: "12px",
            }}
          >
            <ShieldCheck size={14} />
            <span>微信支付官方安全收银台</span>
          </div>

          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "4px" }}>
            {orderTitle}
          </div>

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "2px" }}>
            <span style={{ fontSize: "20px", fontWeight: "700" }}>¥</span>
            <span style={{ fontSize: "38px", fontWeight: "900", letterSpacing: "-1px", lineHeight: 1 }}>
              {amountYuan}
            </span>
          </div>

          <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "6px" }}>
            订单号: {orderNo}
          </div>
        </div>

        {/* 核心支付内容区 */}
        <div style={{ padding: "24px 20px", textAlign: "center" }}>
          {paid ? (
            <div style={{ padding: "30px 0" }}>
              <CheckCircle2 size={56} color="#07C160" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#0F172A", marginBottom: "6px" }}>
                微信支付成功！
              </div>
              <div style={{ fontSize: "13px", color: "#64748B" }}>
                便利店已接单，正在跳转至订单详情...
              </div>
            </div>
          ) : loading ? (
            <div style={{ padding: "40px 0" }}>
              <RefreshCw size={36} color="#07C160" className="animate-spin" style={{ margin: "0 auto 16px" }} />
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                正在向微信支付发起统一下单...
              </div>
              <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "6px" }}>
                请稍候，安全加密连接中
              </div>
            </div>
          ) : errorMessage && !codeUrl ? (
            <div style={{ padding: "24px 0" }}>
              <AlertCircle size={44} color="#EF4444" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: "14.5px", fontWeight: "700", color: "#DC2626", marginBottom: "8px" }}>
                收款码生成失败
              </div>
              <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "18px", padding: "0 10px" }}>
                {errorMessage}
              </div>
              <button
                onClick={initPayment}
                style={{
                  padding: "9px 24px",
                  borderRadius: "10px",
                  background: "#07C160",
                  color: "#ffffff",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                重新尝试
              </button>
            </div>
          ) : (
            <div>
              {/* 二维码容器 */}
              <div
                style={{
                  display: "inline-block",
                  padding: "12px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "2px solid #E2E8F0",
                  boxShadow: "0 6px 16px rgba(0, 0, 0, 0.04)",
                  position: "relative",
                  marginBottom: "14px",
                }}
              >
                {codeUrl ? (
                  <img
                    src={`/api/payment/qrcode?text=${encodeURIComponent(codeUrl)}`}
                    alt="微信支付二维码"
                    width={200}
                    height={200}
                    style={{ display: "block", borderRadius: "8px" }}
                  />
                ) : (
                  <div style={{ width: "200px", height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    二维码加载中...
                  </div>
                )}
              </div>

              {/* 扫码引导与状态 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "13.5px",
                  color: "#059669",
                  fontWeight: "700",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#07C160",
                    display: "inline-block",
                  }}
                />
                <span>请使用微信 App 扫描二维码支付</span>
              </div>

              {/* 倒计时 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "#94A3B8",
                  marginBottom: "16px",
                }}
              >
                <Clock size={13} />
                <span>二维码有效时间: {countdownFormatted}</span>
              </div>

              {errorMessage && (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#FEF2F2",
                    color: "#DC2626",
                    fontSize: "12px",
                    borderRadius: "8px",
                    marginBottom: "14px",
                    textAlign: "center",
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* 操作按钮组 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  disabled={checking}
                  onClick={handleManualVerify}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    background: "#07C160",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "700",
                    border: "none",
                    cursor: checking ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(7, 193, 96, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {checking ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>正在核验支付结果...</span>
                    </>
                  ) : (
                    <span>✓ 我已完成微信支付</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: "100%",
                    padding: "9px",
                    borderRadius: "10px",
                    background: "#F1F5F9",
                    color: "#64748B",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  稍后支付（返回订单详情）
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
