"use client";

import React, { useState } from "react";
import { Ticket, Sparkles, Check, Flame } from "lucide-react";

interface ProviderCouponClaimCardProps {
  coupons: any[];
  campaigns: any[];
}

export default function ProviderCouponClaimCard({
  coupons = [],
  campaigns = [],
}: ProviderCouponClaimCardProps) {
  const [claimedMap, setClaimedMap] = useState<Record<string, boolean>>({});
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (couponId: string) => {
    if (claimingId) return;
    setClaimingId(couponId);
    try {
      const res = await fetch("/api/coupons/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId }),
      });
      const json = await res.json();
      if (json.success) {
        setClaimedMap((prev) => ({ ...prev, [couponId]: true }));
        alert("🎉 恭喜！优惠券已成功存入您的个人卡包，下单时自动抵扣！");
      } else {
        alert(json.error || "领取失败，请稍后重试");
      }
    } catch {
      alert("网络异常，请稍后重试");
    } finally {
      setClaimingId(null);
    }
  };

  if (coupons.length === 0 && campaigns.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
      {/* 正在进行的店铺特惠活动 */}
      {campaigns.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              style={{
                background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                borderRadius: "14px",
                padding: "16px 20px",
                border: "1px solid #fed7aa",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                boxShadow: "0 2px 8px rgba(251, 146, 60, 0.12)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: "#ea580c",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Flame size={22} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        backgroundColor: "#ea580c",
                        color: "#ffffff",
                        fontSize: "0.7rem",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontWeight: 700,
                      }}
                    >
                      {camp.badgeText || "店铺特惠"}
                    </span>
                    <strong style={{ fontSize: "1rem", color: "#9a3412" }}>{camp.title}</strong>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#c2410c", marginTop: "4px" }}>
                    {camp.subtitle || camp.content.slice(0, 40)}
                  </div>
                </div>
              </div>

              {camp.discountRate ? (
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ea580c" }}>
                  {camp.discountRate * 10}折 特惠
                </div>
              ) : camp.discountCents ? (
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ea580c" }}>
                  立减 ¥{(camp.discountCents / 100).toFixed(0)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* 店铺可领优惠券列表 */}
      {coupons.length > 0 && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "18px 20px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Ticket size={18} color="#0f766e" />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              店铺专属优惠券 · 进店立领
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
            {coupons.map((coupon) => {
              const isClaimed = claimedMap[coupon.id];
              const isClaiming = claimingId === coupon.id;

              return (
                <div
                  key={coupon.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px dashed #fca5a5",
                    backgroundColor: "#fff5f5",
                    gap: "10px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: 700 }}>¥</span>
                      <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "#dc2626" }}>
                        {(coupon.discountCents / 100).toFixed(0)}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "4px" }}>
                        满 ¥{(coupon.minSpendCents / 100).toFixed(0)} 可用
                      </span>
                    </div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>
                      {coupon.title}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isClaimed || isClaiming}
                    onClick={() => handleClaim(coupon.id)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "16px",
                      backgroundColor: isClaimed ? "#e2e8f0" : "#dc2626",
                      color: isClaimed ? "#64748b" : "#ffffff",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: isClaimed || isClaiming ? "default" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {isClaimed ? (
                      <>
                        <Check size={14} />
                        <span>已领取</span>
                      </>
                    ) : isClaiming ? (
                      <span>领取中...</span>
                    ) : (
                      <span>立即领取</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
