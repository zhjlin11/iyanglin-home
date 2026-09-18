import React from "react";
import Link from "next/link";
import {
  Flame,
  Star,
  ShieldCheck,
  Building2,
  ChevronRight,
  Phone,
  Sparkles,
  MapPin,
  Clock,
  BadgeCheck,
} from "lucide-react";

interface InfoFeaturedShowcaseProps {
  featuredItems?: any[];
  providers?: any[];
}

export default function InfoFeaturedShowcase({
  featuredItems = [],
  providers = [],
}: InfoFeaturedShowcaseProps) {
  if (featuredItems.length === 0 && providers.length === 0) return null;

  return (
    <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. 精选推荐大横幅卡片群 (Featured Items) */}
      {featuredItems.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #fff7ed 100%)",
            borderRadius: "16px",
            padding: "18px 20px",
            border: "1px solid #fde68a",
            boxShadow: "0 4px 14px rgba(245, 158, 11, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "#f59e0b",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(245, 158, 11, 0.35)",
                }}
              >
                <Star size={18} fill="white" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#78350f", margin: 0 }}>
                    精选置顶推荐
                  </h3>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "#ef4444",
                      color: "white",
                      fontWeight: 800,
                      letterSpacing: "0.5px",
                    }}
                  >
                    HOT
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#92400e", margin: "2px 0 0 0" }}>
                  杨林生活网高光精选 · 成交效率提升 3 倍
                </p>
              </div>
            </div>

            <Link
              href="/info/new"
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#b45309",
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                textDecoration: "none",
                background: "rgba(255,255,255,0.7)",
                padding: "4px 10px",
                borderRadius: "20px",
                border: "1px solid #fcd34d",
              }}
            >
              <span>我也要上推荐</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "12px",
            }}
          >
            {featuredItems.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                href={`/info/${item.id}`}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  border: "1px solid #fef08a",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                {/* 缩略图 */}
                {item.images && item.images.length > 0 ? (
                  <div
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#f1f5f9",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#b45309",
                      fontWeight: 700,
                      fontSize: "12px",
                      flexShrink: 0,
                    }}
                  >
                    {item.category?.slice(0, 4) || "便民"}
                  </div>
                )}

                {/* 文本信息 */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "68px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "1px 5px",
                          borderRadius: "4px",
                          background: "#f59e0b",
                          color: "white",
                          fontWeight: 700,
                        }}
                      >
                        ⭐置顶
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>
                        {item.category}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: 1.3,
                      }}
                    >
                      {item.title}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#dc2626" }}>
                      {item.price === "面议" ? "面议" : `¥${item.price}`}
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                      <MapPin size={11} /> {item.area || "杨林"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 2. 认证服务商精选条带 (Certified Providers Strip) */}
      {providers.length > 0 && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "#0284c7",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(2, 132, 199, 0.3)",
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    本地认证服务商
                  </h3>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      fontWeight: 700,
                      border: "1px solid #bae6fd",
                    }}
                  >
                    实名人工核验
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                  专业队伍 · 执照核验 · 放心沟通
                </p>
              </div>
            </div>

            <Link
              href="/provider/apply"
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#0284c7",
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                textDecoration: "none",
              }}
            >
              <span>入驻认证</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              overflowX: "auto",
              paddingBottom: "6px",
            }}
          >
            {providers.map((p) => (
              <Link
                key={p.id}
                href={`/provider/${p.id}`}
                style={{
                  flexShrink: 0,
                  width: "168px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  padding: "14px 10px",
                  border: "1px solid #e2e8f0",
                  textDecoration: "none",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "8px",
                    overflow: "hidden",
                  }}
                >
                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt={p.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span>{p.name.slice(0, 2)}</span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#0f172a",
                    width: "100%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "4px", margin: "4px 0" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "1px 5px",
                      borderRadius: "4px",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      fontWeight: 600,
                    }}
                  >
                    {p.serviceCategory}
                  </span>
                  {p.isMember && (
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "1px 4px",
                        borderRadius: "4px",
                        background: "#fef3c7",
                        color: "#b45309",
                        fontWeight: 700,
                      }}
                    >
                      VIP
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    width: "100%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.serviceAreas && p.serviceAreas.length > 0
                    ? p.serviceAreas.join(" · ")
                    : "杨林经开区"}
                </div>
              </Link>
            ))}

            {/* 入驻申请快捷卡片 */}
            <Link
              href="/provider/apply"
              style={{
                flexShrink: 0,
                width: "140px",
                background: "#f0f9ff",
                borderRadius: "12px",
                padding: "14px 10px",
                border: "1px dashed #7dd3fc",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#0284c7",
              }}
            >
              <Building2 size={24} style={{ marginBottom: "6px", color: "#0284c7" }} />
              <span style={{ fontSize: "12px", fontWeight: 700 }}>成为服务商</span>
              <span style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>免费实名认证</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
