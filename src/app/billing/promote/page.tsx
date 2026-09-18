"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { detectPaymentScene, invokeWeixinPay } from "@/lib/payment-utils";
import Navbar from "@/components/Navbar";

type Plan = {
  id: string;
  name: string;
  priceCents: number;
  durationDays: number;
  description: string;
};

type Order = {
  id: string;
  orderNo: string;
  planName: string;
  amountCents: number;
  status: string;
};

type PayStep = "select" | "qrcode" | "success";

const channelIcons: Record<string, { icon: string; name: string; color: string; bg: string }> = {
  shop: { icon: "🏪", name: "好店名录", color: "#d97706", bg: "#fef3c7" },
  job: { icon: "💼", name: "招聘求职", color: "#2563eb", bg: "#eff6ff" },
  house: { icon: "🏠", name: "房产楼市", color: "#059669", bg: "#ecfdf5" },
  info: { icon: "📱", name: "二手便民", color: "#7c3aed", bg: "#f5f3ff" },
  article: { icon: "📰", name: "本地资讯", color: "#0284c7", bg: "#f0f9ff" },
  love: { icon: "💖", name: "相亲交友", color: "#e11d48", bg: "#fff1f2" },
  community: { icon: "💬", name: "社区论坛", color: "#0891b2", bg: "#ecfeff" },
};

export default function PromoteCheckoutPage({ searchParams }: { searchParams: Promise<{ kind?: string; id?: string; title?: string }> }) {
  const { kind = "shop", id = "", title = "杨林热门好店" } = use(searchParams);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [order, setOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [payStep, setPayStep] = useState<PayStep>("select");
  const [codeUrl, setCodeUrl] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentChannel = channelIcons[kind] || { icon: "🎯", name: "分类信息", color: "#047857", bg: "#ecfdf5" };

  const [userWallet, setUserWallet] = useState<{ loggedIn: boolean; coins: number; points: number }>({ loggedIn: false, coins: 0, points: 0 });

  useEffect(() => {
    fetch("/api/billing/plans")
      .then((res) => res.json())
      .then((data) => {
        if (data.plans && data.plans.length > 0) {
          const sorted = [...data.plans].sort((a: Plan, b: Plan) => a.priceCents - b.priceCents);
          setPlans(sorted);
          const recommendPlan = sorted.find((p) => p.durationDays === 7) || sorted[0];
          setSelectedPlanId(recommendPlan ? recommendPlan.id : sorted[0].id);
        }
      })
      .catch(() => {});

    // 查询当前登录用户的金币钱包与积分
    fetch("/api/user/wallet")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.loggedIn) {
          setUserWallet({ loggedIn: true, coins: data.coins || 0, points: data.points || 0 });
        }
      })
      .catch(() => {});
  }, []);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // 轮询支付状态
  const startPolling = useCallback((orderNo: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPollCount(0);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?orderNo=${encodeURIComponent(orderNo)}`);
        const data = await res.json();
        if (data.paid) {
          if (pollRef.current) clearInterval(pollRef.current);
          setPayStep("success");
        }
        setPollCount((c) => {
          if (c >= 120) {
            if (pollRef.current) clearInterval(pollRef.current);
          }
          return c + 1;
        });
      } catch {
        // Continue polling
      }
    }, 2500);
  }, []);

  const createOrderAndPay = async () => {
    if (!selectedPlanId) {
      setMessage("请选择要开通的置顶推广套餐");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      // 1. 创建计费订单
      const orderRes = await fetch("/api/billing/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          targetKind: kind,
          targetId: id || "generic",
          targetTitle: title,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        setMessage(err.error || "创建订单失败，请稍后重试");
        setSubmitting(false);
        return;
      }

      const orderData = await orderRes.json();
      setOrder(orderData.order);

      // 2. 调用微信支付统一下单，获取二维码
      const payRes = await fetch("/api/payment/wechat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo: orderData.order.orderNo, paymentScene: detectPaymentScene() }),
      });

      if (!payRes.ok) {
        const err = await payRes.json().catch(() => ({}));
        if (err.error?.includes("配置缺失") || err.error?.includes("未配置")) {
          // 降级为收银台展示与待审核模式
          setCodeUrl(`weixin://wxpay/bizpayurl?pr=promote_${orderData.order.orderNo}`);
          setPayStep("qrcode");
          startPolling(orderData.order.orderNo);
          setSubmitting(false);
          return;
        }
        setMessage(err.error || "微信支付收银台唤起失败");
        setSubmitting(false);
        return;
      }

      const payData = await payRes.json();

      // JSAPI: 微信内直接支付
      if (payData.needOAuth && payData.oauthUrl) {
        window.location.href = payData.oauthUrl;
        return;
      }

      if (payData.jsapiParams) {
        try {
          const payResult = await invokeWeixinPay(payData.jsapiParams);
          if (payResult === "success") {
            startPolling(orderData.order.orderNo);
            setPayStep("qrcode"); // 进入等待确认状态
          } else if (payResult === "cancel") {
            setMessage("您已取消支付");
          } else {
            setMessage("支付未完成，请重试");
          }
        } catch { setMessage("拉起微信支付失败"); }
        return;
      }

      // H5: 手机浏览器跳转微信
      if (payData.mwebUrl) {
        window.location.href = payData.mwebUrl;
        return;
      }

      // NATIVE: PC 扫码
      setCodeUrl(payData.codeUrl);
      setPayStep("qrcode");
      startPolling(orderData.order.orderNo);
    } catch {
      setMessage("网络连接异常，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const payByCoinsDirect = async () => {
    if (!selectedPlanId) {
      setMessage("请选择要开通的置顶推广套餐");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      // 1. 创建订单
      const orderRes = await fetch("/api/billing/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          targetKind: kind,
          targetId: id || "generic",
          targetTitle: title,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        setMessage(err.error || "创建订单失败");
        setSubmitting(false);
        return;
      }

      const orderData = await orderRes.json();
      setOrder(orderData.order);

      // 2. 调用金币直扣
      const coinRes = await fetch("/api/billing/pay-by-coin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo: orderData.order.orderNo }),
      });

      const coinData = await coinRes.json();
      if (!coinRes.ok || !coinData.ok) {
        setMessage(coinData.error || "金币支付失败");
        setSubmitting(false);
        return;
      }

      // 成功
      setPayStep("success");
    } catch {
      setMessage("网络连接异常，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelPayment = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPayStep("select");
    setCodeUrl("");
    setOrder(null);
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <Navbar />

      {/* 顶部轻奢导航栏 */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "12px 1rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <button
            onClick={() => window.history.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#64748b",
              fontWeight: "700",
              fontSize: "14px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span>←</span> 返回上一页
          </button>

          <div style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>杨林生活网</span> / <span>运营推广服务中心</span> / <span style={{ color: "#0f172a", fontWeight: "700" }}>🔥 黄金置顶特权</span>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: "1000px", margin: "2rem auto 5rem auto", padding: "0 1rem" }}>
        {/* ======== 步骤1: 选择套餐 ======== */}
        {payStep === "select" && (
          <div>
            {/* Header 标牌与主标题 */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "linear-gradient(135deg, #fef3c7 0%, #ffedd5 100%)",
                  color: "#b45309",
                  padding: "4px 14px",
                  borderRadius: "20px",
                  fontSize: "12.5px",
                  fontWeight: "800",
                  border: "1px solid #fde68a",
                  marginBottom: "10px",
                  boxShadow: "0 2px 8px rgba(245, 158, 11, 0.15)",
                }}
              >
                <span>👑</span> 全站黄金曝光推广服务
              </div>

              <h1
                style={{
                  fontSize: "clamp(24px, 4vw, 32px)",
                  fontWeight: "900",
                  color: "#0f172a",
                  margin: "0 0 8px 0",
                  letterSpacing: "-0.5px",
                }}
              >
                🔥 提交内容置顶推广申请
              </h1>

              <p style={{ color: "#64748b", fontSize: "15px", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
                锁定频道列表首屏黄金席位，专享醒目黄冠徽章，获得高出普通条目 <strong style={{ color: "#e11d48" }}>10 倍</strong> 的曝光与转化量！
              </p>
            </div>

            {/* 当前待置顶内容豪华预览卡片 */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                padding: "1.5rem 1.75rem",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                marginBottom: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: currentChannel.bg,
                    color: currentChannel.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  {currentChannel.icon}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", background: currentChannel.bg, color: currentChannel.color, padding: "2px 8px", borderRadius: "8px", fontWeight: "800" }}>
                      {currentChannel.name}
                    </span>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      条目ID: {id ? <code style={{ color: "#64748b" }}>{id}</code> : "未指定 (全频道推广)"}
                    </span>
                  </div>

                  <div style={{ fontSize: "17px", fontWeight: "900", color: "#0f172a" }}>
                    {title}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "6px 14px",
                  borderRadius: "12px",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  color: "#166534",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>⚡</span> 付款后自动秒级排期生效
              </div>
            </div>

            {message ? (
              <div style={{ padding: "12px 16px", background: "#fff1f2", color: "#be123c", fontSize: "13.5px", borderRadius: "12px", marginBottom: "1.5rem", border: "1px solid #fecdd3", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div>⚠️ {message}</div>
                {message.includes("登录") && (
                  <a
                    href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/billing/promote")}`}
                    style={{ background: "#be123c", color: "white", padding: "4px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", textDecoration: "none" }}
                  >
                    立即登录 →
                  </a>
                )}
              </div>
            ) : null}

            {/* 套餐选择网格 */}
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", margin: 0 }}>
                  💎 请选择置顶推广套餐
                </h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>支持微信安全支付 · 实时开通</span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                }}
              >
                {plans.map((p) => {
                  const selected = p.id === selectedPlanId;
                  const isPopular = p.durationDays === 7;
                  const isMonth = p.durationDays >= 30;
                  const priceYuan = (p.priceCents / 100).toFixed(2);
                  const perDayPrice = (p.priceCents / 100 / (p.durationDays || 1)).toFixed(1);

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      style={{
                        background: selected ? "linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)" : "#ffffff",
                        borderRadius: "20px",
                        border: selected ? "2.5px solid #047857" : "1px solid #e2e8f0",
                        padding: "1.5rem",
                        cursor: "pointer",
                        position: "relative",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: selected ? "0 8px 24px rgba(4, 120, 87, 0.12)" : "0 2px 10px rgba(0,0,0,0.02)",
                        transform: selected ? "translateY(-3px)" : "none",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      {/* 推荐或超值徽章 */}
                      {isPopular && (
                        <div
                          style={{
                            position: "absolute",
                            top: "-11px",
                            right: "16px",
                            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                            color: "white",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "800",
                            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.35)",
                          }}
                        >
                          🔥 85% 商家首选
                        </div>
                      )}

                      {isMonth && (
                        <div
                          style={{
                            position: "absolute",
                            top: "-11px",
                            right: "16px",
                            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                            color: "white",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "800",
                            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.35)",
                          }}
                        >
                          👑 至尊霸屏超值
                        </div>
                      )}

                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                          <div style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a" }}>{p.name}</div>
                          {selected && (
                            <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#047857", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" }}>
                              ✓
                            </span>
                          )}
                        </div>

                        {/* 价格展示 */}
                        <div style={{ display: "flex", alignItems: "baseline", gap: "4px", margin: "0.75rem 0 0.5rem 0" }}>
                          <span style={{ fontSize: "18px", fontWeight: "800", color: "#e11d48" }}>¥</span>
                          <span style={{ fontSize: "32px", fontWeight: "900", color: "#e11d48", lineHeight: 1 }}>{priceYuan}</span>
                          {p.durationDays > 1 && (
                            <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "4px" }}>
                              (约 ¥{perDayPrice}/天)
                            </span>
                          )}
                        </div>

                        <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5", margin: "0 0 1rem 0" }}>
                          {p.description}
                        </p>
                      </div>

                      {/* 权益小清单 */}
                      <div style={{ paddingTop: "0.75rem", borderTop: "1px dashed #e2e8f0", fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "5px" }}>
                        <div>✓ 频道首屏固定置顶位</div>
                        <div>✓ 专属【🔥黄金置顶】标识</div>
                        <div>✓ 尊享高倍流量倾斜</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4 大置顶推广权益服务保障 */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                padding: "1.75rem",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                marginBottom: "2rem",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🛡️</span> 平台官方置顶推广 4 重特权保障
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "22px", marginBottom: "6px" }}>🚀</div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>10倍首屏前排展示</div>
                  <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>无论何时发布新内容，您的条目始终稳居分类列表最顶部！</div>
                </div>

                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "22px", marginBottom: "6px" }}>👑</div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>尊享专属置顶徽章</div>
                  <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>配备醒目高光黄金置顶角标与加粗标题，显著提升点击率。</div>
                </div>

                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "22px", marginBottom: "6px" }}>⚡</div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>全自动极速生效</div>
                  <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>微信扫码支付后系统自动打标排期，秒级生效无需漫长等待。</div>
                </div>

                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "22px", marginBottom: "6px" }}>📊</div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>透明数据与续费管理</div>
                  <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>支持在个人中心随时查看置顶倒计时与访问量，到期自由续期。</div>
                </div>
              </div>
            </div>

            {/* 底部悬浮结算结算栏 */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                padding: "1.25rem 1.75rem",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "2px" }}>
                  已选：<strong style={{ color: "#0f172a" }}>{selectedPlan ? selectedPlan.name : "未选择"}</strong>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ fontSize: "14px", color: "#64748b" }}>应付总额：</span>
                  <span style={{ fontSize: "18px", fontWeight: "800", color: "#e11d48" }}>¥</span>
                  <span style={{ fontSize: "30px", fontWeight: "900", color: "#e11d48", lineHeight: 1 }}>
                    {selectedPlan ? (selectedPlan.priceCents / 100).toFixed(2) : "0.00"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                {userWallet.loggedIn && (
                  <button
                    onClick={payByCoinsDirect}
                    disabled={submitting || (userWallet.coins < Math.round((selectedPlan?.priceCents || 0) / 10))}
                    style={{
                      background: (userWallet.coins >= Math.round((selectedPlan?.priceCents || 0) / 10))
                        ? "linear-gradient(135deg, #d97706 0%, #b45309 100%)"
                        : "#e2e8f0",
                      color: (userWallet.coins >= Math.round((selectedPlan?.priceCents || 0) / 10)) ? "white" : "#94a3b8",
                      fontSize: "14px",
                      fontWeight: "800",
                      padding: "14px 20px",
                      borderRadius: "14px",
                      border: "none",
                      cursor: (userWallet.coins >= Math.round((selectedPlan?.priceCents || 0) / 10) && !submitting) ? "pointer" : "not-allowed",
                      boxShadow: (userWallet.coins >= Math.round((selectedPlan?.priceCents || 0) / 10)) ? "0 4px 14px rgba(217, 119, 6, 0.3)" : "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    title={`当前金币余额: ${userWallet.coins} 金币`}
                  >
                    <span>🪙</span>
                    {userWallet.coins >= Math.round((selectedPlan?.priceCents || 0) / 10)
                      ? `金币余额秒开 (扣 ${Math.round((selectedPlan?.priceCents || 0) / 10)} 币 / 余 ${userWallet.coins})`
                      : `金币不足 (余 ${userWallet.coins} 币)`}
                  </button>
                )}

                <button
                  onClick={createOrderAndPay}
                  disabled={submitting}
                  style={{
                    background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                    color: "white",
                    fontSize: "15px",
                    fontWeight: "800",
                    padding: "14px 28px",
                    borderRadius: "14px",
                    border: "none",
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 16px rgba(4, 120, 87, 0.35)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "transform 0.15s",
                  }}
                >
                  <span>🟢</span> {submitting ? "正在创建订单..." : "微信扫码直付"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======== 步骤2: 微信扫码支付收银台 ======== */}
        {payStep === "qrcode" && order && (
          <div style={{ maxWidth: "440px", margin: "2rem auto" }}>
            <div
              style={{
                background: "#ffffff",
                borderRadius: "24px",
                border: "1px solid #e2e8f0",
                padding: "2rem",
                textAlign: "center",
                boxShadow: "0 12px 36px rgba(0,0,0,0.08)",
                position: "relative",
              }}
            >
              {/* 微信支付绿色品牌头部 */}
              <div
                style={{
                  background: "linear-gradient(135deg, #07c160 0%, #059669 100%)",
                  borderRadius: "16px",
                  padding: "1.25rem",
                  marginBottom: "1.5rem",
                  color: "white",
                  boxShadow: "0 6px 16px rgba(7, 193, 96, 0.25)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "14px", fontWeight: "700", opacity: 0.95 }}>
                  <span>🟢</span> 微信安全支付收银台
                </div>
                <div style={{ fontSize: "32px", fontWeight: "900", margin: "6px 0 2px 0" }}>
                  ¥{(order.amountCents / 100).toFixed(2)}
                </div>
                <div style={{ fontSize: "13px", opacity: 0.9 }}>{order.planName}</div>
              </div>

              {/* QR 码 */}
              <div
                style={{
                  padding: "14px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "2px solid #e2e8f0",
                  display: "inline-block",
                  marginBottom: "1rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                }}
              >
                {codeUrl ? (
                  <img
                    src={`/api/payment/qrcode?text=${encodeURIComponent(codeUrl)}`}
                    alt="微信支付二维码"
                    width={220}
                    height={220}
                    style={{ display: "block" }}
                  />
                ) : (
                  <div style={{ width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "13px" }}>
                    ⏳ 二维码生成中...
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13.5px", color: "#047857", fontWeight: "800", marginBottom: "1rem" }}>
                <span className="animate-spin">⏳</span> 正在等待微信扫码支付中...
              </div>

              {/* 订单信息明细 */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  fontSize: "12px",
                  color: "#64748b",
                  textAlign: "left",
                  marginBottom: "1.25rem",
                  border: "1px solid #f1f5f9",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>推广条目：</span>
                  <span style={{ fontWeight: "700", color: "#0f172a", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>订单编号：</span>
                  <code>{order.orderNo}</code>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>轮询监测：</span>
                  <span style={{ color: "#059669", fontWeight: "700" }}>已监测 {pollCount * 2.5}s (自动核销)</span>
                </div>
              </div>

              {/* 取消支付 */}
              <button
                onClick={cancelPayment}
                style={{
                  width: "100%",
                  background: "none",
                  border: "1px solid #cbd5e1",
                  borderRadius: "12px",
                  padding: "10px",
                  cursor: "pointer",
                  color: "#64748b",
                  fontSize: "13px",
                  fontWeight: "700",
                }}
              >
                取消支付，返回重新选择套餐
              </button>
            </div>
          </div>
        )}

        {/* ======== 步骤3: 支付成功 ======== */}
        {payStep === "success" && order && (
          <div style={{ maxWidth: "480px", margin: "2rem auto" }}>
            <div
              style={{
                background: "#ffffff",
                borderRadius: "24px",
                border: "1px solid #e2e8f0",
                padding: "2.5rem 2rem",
                textAlign: "center",
                boxShadow: "0 12px 36px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", margin: "0 auto 16px auto", boxShadow: "0 8px 24px rgba(5, 150, 105, 0.2)" }}>
                ✓
              </div>

              <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "900", color: "#0f172a" }}>
                置顶推广已成功生效！
              </h2>

              <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 1.5rem 0" }}>
                订单号: <code>{order.orderNo}</code>
              </p>

              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "1.25rem",
                  borderRadius: "16px",
                  fontSize: "13.5px",
                  color: "#166534",
                  textAlign: "left",
                  lineHeight: "1.7",
                  marginBottom: "1.75rem",
                }}
              >
                <div><strong>👑 套餐名称：</strong>{order.planName}</div>
                <div><strong>🎯 推广目标：</strong>{title}</div>
                <div><strong>✨ 特权状态：</strong>已激活首屏前排置顶与黄金徽章展示！</div>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <a
                  href="/profile"
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#047857",
                    color: "white",
                    borderRadius: "12px",
                    fontWeight: "800",
                    fontSize: "14px",
                    textDecoration: "none",
                    textAlign: "center",
                    boxShadow: "0 4px 12px rgba(4, 120, 87, 0.3)",
                  }}
                >
                  前往个人中心查看 →
                </a>

                <a
                  href={`/${kind === "shop" ? "haodian" : kind}`}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#f1f5f9",
                    color: "#334155",
                    borderRadius: "12px",
                    fontWeight: "700",
                    fontSize: "14px",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  返回频道前台
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
