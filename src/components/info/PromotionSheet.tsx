"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Flame,
  Star,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Zap,
  ArrowRight,
  Clock,
  Award,
} from "lucide-react";

interface PromotionPackage {
  id: string;
  packageKey: string;
  name: string;
  category: string;
  priceCents: number;
  originalPriceCents?: number;
  durationDays: number;
  benefits: string[];
  description?: string;
  enabled: boolean;
}

interface PromotionSheetProps {
  listingId: string;
  listingTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PromotionSheet({
  listingId,
  listingTitle,
  isOpen,
  onClose,
  onSuccess,
}: PromotionSheetProps) {
  const [packages, setPackages] = useState<PromotionPackage[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("TOP_7_DAYS");
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    orderNo: string;
    message: string;
  } | null>(null);

  // 加载后台动态配置的套餐价格
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setSuccessInfo(null);

    fetch("/api/info/packages?category=PROMOTION")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.packages) && data.packages.length > 0) {
          setPackages(data.packages);
          // 默认选中 7天置顶 或 第一个可用套餐
          const has7Days = data.packages.find((p: any) => p.packageKey === "TOP_7_DAYS");
          if (has7Days) {
            setSelectedKey("TOP_7_DAYS");
          } else {
            setSelectedKey(data.packages[0].packageKey);
          }
        } else {
          setError("未能加载推广套餐，请稍后重试");
        }
      })
      .catch((err) => {
        console.error("Load packages error:", err);
        setError("网络连接异常，加载套餐失败");
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPkg = packages.find((p) => p.packageKey === selectedKey) || packages[0];

  // 提交购买推广
  const handleStartPromote = async (isSimulate = false) => {
    if (!currentPkg) return;
    setPaying(true);
    setError(null);

    try {
      // 1. 创建推广订单
      const res = await fetch("/api/info/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          packageKey: currentPkg.packageKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "创建推广订单失败");
      }

      const { orderNo } = data;

      if (isSimulate || currentPkg.priceCents === 0) {
        // 2. 模拟/免费支付激活
        const payRes = await fetch("/api/billing/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNo, action: "simulate_pay" }),
        });
        const payData = await payRes.json();
        if (!payRes.ok || !payData.success) {
          throw new Error(payData.error || "模拟支付核销失败");
        }

        setSuccessInfo({
          orderNo,
          message: `恭喜！已成功开通【${currentPkg.name}】，权益已实时生效！`,
        });
        if (onSuccess) onSuccess();
      } else {
        // 3. 正常微信支付渠道跳转或弹窗唤起
        // 如当前系统有微信统一收银台：/billing/pay?orderNo=...
        window.location.href = `/billing/pay?orderNo=${orderNo}`;
      }
    } catch (err: any) {
      console.error("Promote error:", err);
      setError(err.message || "操作失败，请重试");
    } finally {
      setPaying(false);
    }
  };

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
      }}
    >
      {/* 遮罩层 */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* 弹窗/抽屉主体 (响应式设计: PC端居中卡片，手机端自适应大弹层) */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "560px",
          background: "#ffffff",
          borderRadius: "18px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          overflow: "hidden",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          zIndex: 10000,
        }}
      >
        {/* 顶部标题栏 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #fde68a",
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #ffedd5 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(245,158,11,0.35)",
              }}
            >
              <Flame size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#78350f", margin: 0 }}>
                  信息付费推广加速
                </h3>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "1px 6px",
                    borderRadius: "20px",
                    background: "#fef3c7",
                    color: "#b45309",
                    fontWeight: 700,
                    border: "1px solid #fde68a",
                  }}
                >
                  成交快 3 倍
                </span>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "#92400e",
                  margin: "2px 0 0 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "340px",
                }}
              >
                推广目标: {listingTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              borderRadius: "6px",
              color: "#92400e",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容区 */}
        <div style={{ padding: "18px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "12px",
                borderRadius: "10px",
              }}
            >
              <strong>提示:</strong> {error}
            </div>
          )}

          {successInfo ? (
            /* 支付成功激活面板 */
            <div style={{ textAlign: "center", padding: "24px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(22,163,74,0.2)",
                }}
              >
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h4 style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b", margin: 0 }}>
                  推广权益已激活！
                </h4>
                <p style={{ fontSize: "13px", color: "#475569", margin: "6px 0 0 0", maxWidth: "360px" }}>
                  {successInfo.message}
                </p>
                <p style={{ fontSize: "11px", color: "#94a3b8", margin: "6px 0 0 0" }}>
                  订单流水号: {successInfo.orderNo}
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  window.location.reload();
                }}
                style={{
                  marginTop: "8px",
                  padding: "10px 24px",
                  background: "#16a34a",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 700,
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
                }}
              >
                查看生效效果并刷新
              </button>
            </div>
          ) : (
            <>
              {/* 套餐选项卡片网格 */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "10px" }}>
                  选择推广套餐 (价格由后台实时动态同步)
                </div>

                {loading ? (
                  <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                    正在同步最新套餐价格...
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "10px",
                    }}
                  >
                    {packages.map((pkg) => {
                      const isSelected = selectedKey === pkg.packageKey;
                      const isHot = pkg.packageKey === "TOP_7_DAYS";
                      const isFeatured = pkg.packageKey === "HOME_FEATURED";

                      return (
                        <div
                          key={pkg.packageKey}
                          onClick={() => setSelectedKey(pkg.packageKey)}
                          style={{
                            position: "relative",
                            padding: "14px",
                            borderRadius: "12px",
                            cursor: "pointer",
                            border: isSelected ? "2px solid #f59e0b" : "1px solid #e2e8f0",
                            background: isSelected ? "#fffbeb" : "#f8fafc",
                            boxShadow: isSelected ? "0 2px 8px rgba(245,158,11,0.15)" : "none",
                            userSelect: "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {/* 角标 */}
                          {isHot && (
                            <span
                              style={{
                                position: "absolute",
                                top: "-8px",
                                right: "8px",
                                padding: "1px 6px",
                                fontSize: "10px",
                                fontWeight: 800,
                                borderRadius: "20px",
                                background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                                color: "white",
                              }}
                            >
                              85%街坊首选
                            </span>
                          )}
                          {isFeatured && (
                            <span
                              style={{
                                position: "absolute",
                                top: "-8px",
                                right: "8px",
                                padding: "1px 6px",
                                fontSize: "10px",
                                fontWeight: 800,
                                borderRadius: "20px",
                                background: "linear-gradient(135deg, #f59e0b 0%, #eab308 100%)",
                                color: "white",
                              }}
                            >
                              全域大横幅
                            </span>
                          )}

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b" }}>
                              {pkg.name}
                            </span>
                            {isSelected && (
                              <CheckCircle2 size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "baseline", gap: "2px", margin: "4px 0" }}>
                            <span style={{ fontSize: "12px", color: "#d97706", fontWeight: 700 }}>
                              ¥
                            </span>
                            <span style={{ fontSize: "20px", fontWeight: 900, color: "#d97706" }}>
                              {(pkg.priceCents / 100).toFixed(0)}
                            </span>
                            {pkg.originalPriceCents && (
                              <span style={{ fontSize: "11px", color: "#94a3b8", textDecoration: "line-through", marginLeft: "4px" }}>
                                ¥{(pkg.originalPriceCents / 100).toFixed(0)}
                              </span>
                            )}
                          </div>

                          <p style={{ fontSize: "11px", color: "#64748b", margin: 0, lineHeight: 1.3 }}>
                            {pkg.durationDays}天有效期 · 日均约 {(pkg.priceCents / pkg.durationDays / 100).toFixed(1)}元
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 权益特权清单 */}
              {currentPkg && (
                <div
                  style={{
                    padding: "14px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Sparkles size={15} style={{ color: "#f59e0b" }} />
                      当前套餐专属权益包含
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      {currentPkg.description}
                    </span>
                  </div>

                  <ul
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "6px",
                      margin: 0,
                      padding: 0,
                      listStyle: "none",
                    }}
                  >
                    {currentPkg.benefits.map((benefit, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#334155" }}>
                        <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 平台保障承诺 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  padding: "10px 14px",
                  background: "#fffbeb",
                  borderRadius: "10px",
                  border: "1px solid #fef3c7",
                  fontSize: "11px",
                  color: "#92400e",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={13} style={{ color: "#f59e0b" }} />
                  即时秒级生效
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <ShieldCheck size={13} style={{ color: "#10b981" }} />
                  到期平稳降序
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Award size={13} style={{ color: "#3b82f6" }} />
                  正规电子订单
                </span>
              </div>
            </>
          )}
        </div>

        {/* 底部操作区 (吸底或固定在底部) */}
        {!successInfo && (
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>实付金额:</span>
              <span style={{ fontSize: "22px", fontWeight: 900, color: "#d97706" }}>
                ¥{currentPkg ? (currentPkg.priceCents / 100).toFixed(2) : "0.00"}
              </span>
              {currentPkg?.originalPriceCents && (
                <span style={{ fontSize: "11px", color: "#94a3b8", textDecoration: "line-through", marginLeft: "4px" }}>
                  原价 ¥{(currentPkg.originalPriceCents / 100).toFixed(2)}
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* 开发/测试环境一键模拟支付按钮 */}
              <button
                type="button"
                disabled={paying || loading}
                onClick={() => handleStartPromote(true)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid #fcd34d",
                  background: "#fffbeb",
                  color: "#92400e",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                title="供开发测试与功能验收一键模拟微信核销，立即生效"
              >
                <Zap size={14} style={{ color: "#f59e0b" }} />
                <span>模拟支付激活</span>
              </button>

              {/* 微信支付开通按钮 */}
              <button
                type="button"
                disabled={paying || loading}
                onClick={() => handleStartPromote(false)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  background: "#07c160",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(7,193,96,0.3)",
                }}
              >
                <CreditCard size={15} />
                <span>{paying ? "处理中..." : "微信支付开通"}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
