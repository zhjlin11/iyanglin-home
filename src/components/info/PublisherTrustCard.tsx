import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Phone,
  Clock,
  ExternalLink,
  BadgeCheck,
  Building2,
  Calendar,
} from "lucide-react";

interface PublisherTrustCardProps {
  trustFacts: {
    phoneVerified: boolean;
    realNameVerified: boolean;
    merchantVerified: boolean;
    registeredDays: number;
    publishedCount: number;
    activeStatusText: string;
    badgeText: string;
    providerProfileId: string | null;
  };
  providerInfo?: {
    id: string;
    name: string;
    serviceCategory: string;
    verificationType: string;
    isMember?: boolean;
  } | null;
}

export default function PublisherTrustCard({
  trustFacts,
  providerInfo,
}: PublisherTrustCardProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        border: "1px solid #e2e8f0",
        padding: "18px 20px",
        marginTop: "20px",
      }}
    >
      {/* 标题 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "12px",
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={20} style={{ color: "#10b981" }} />
          <span style={{ fontWeight: 800, fontSize: "14px", color: "#1e293b" }}>
            发布者真实可信度核验
          </span>
        </div>
        <span
          style={{
            fontSize: "11px",
            padding: "2px 8px",
            borderRadius: "20px",
            background: "#ecfdf5",
            color: "#047857",
            fontWeight: 700,
            border: "1px solid #a7f3d0",
          }}
        >
          {trustFacts.badgeText}
        </span>
      </div>

      {/* 4大真实可信事实网格 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
          fontSize: "12px",
          textAlign: "center",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            padding: "10px 6px",
            borderRadius: "10px",
            background: "#f8fafc",
            border: "1px solid #f1f5f9",
          }}
        >
          <div style={{ color: "#64748b", fontSize: "11px" }}>电话核验</div>
          <div
            style={{
              fontWeight: 700,
              color: "#1e293b",
              marginTop: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            {trustFacts.phoneVerified ? (
              <span style={{ color: "#10b981", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                <CheckCircle2 size={13} /> 已通过
              </span>
            ) : (
              <span style={{ color: "#94a3b8" }}>未绑定</span>
            )}
          </div>
        </div>

        <div
          style={{
            padding: "10px 6px",
            borderRadius: "10px",
            background: "#f8fafc",
            border: "1px solid #f1f5f9",
          }}
        >
          <div style={{ color: "#64748b", fontSize: "11px" }}>实名背书</div>
          <div
            style={{
              fontWeight: 700,
              color: "#1e293b",
              marginTop: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            {trustFacts.realNameVerified ? (
              <span style={{ color: "#2563eb", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                <BadgeCheck size={13} /> 平台核验
              </span>
            ) : (
              <span style={{ color: "#94a3b8" }}>个人街坊</span>
            )}
          </div>
        </div>

        <div
          style={{
            padding: "10px 6px",
            borderRadius: "10px",
            background: "#f8fafc",
            border: "1px solid #f1f5f9",
          }}
        >
          <div style={{ color: "#64748b", fontSize: "11px" }}>入驻时间</div>
          <div style={{ fontWeight: 800, color: "#1e293b", marginTop: "4px" }}>
            {trustFacts.registeredDays} 天
          </div>
        </div>

        <div
          style={{
            padding: "10px 6px",
            borderRadius: "10px",
            background: "#f8fafc",
            border: "1px solid #f1f5f9",
          }}
        >
          <div style={{ color: "#64748b", fontSize: "11px" }}>活跃度</div>
          <div style={{ fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
            {trustFacts.activeStatusText}
          </div>
        </div>
      </div>

      {/* 认证服务商专属入口 (若发布者已开通认证主页) */}
      {providerInfo ? (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)",
            border: "1px solid #bfdbfe",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#2563eb",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Building2 size={18} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b" }}>
                  {providerInfo.name}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    background: "#2563eb",
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  {providerInfo.serviceCategory}认证
                </span>
              </div>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                已在杨林生活网开通独立服务商公开主页
              </p>
            </div>
          </div>

          <Link
            href={`/provider/${providerInfo.id}`}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              background: "#2563eb",
              color: "white",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: "0 2px 4px rgba(37,99,235,0.25)",
            }}
          >
            <span>进入服务者主页</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      ) : (
        <div
          style={{
            fontSize: "11px",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "4px",
          }}
        >
          <span>想点亮蓝V并开通独立服务者主页？</span>
          <Link
            href="/provider/apply"
            style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}
          >
            申请服务者认证 →
          </Link>
        </div>
      )}
    </div>
  );
}
