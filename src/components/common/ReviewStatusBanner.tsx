import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface ReviewStatusBannerProps {
  status: "APPROVED" | "PENDING" | "REJECTED" | "OFFLINE" | "OTHER";
  moduleName: string;
  channelUrl: string;
  channelName: string;
  isOwner?: boolean;
  isAdmin?: boolean;
  createdAt?: string | Date | null;
  adminReviewUrl?: string;
  rejectReason?: string;
}

/**
 * 顶部审核状态提示条 (供作者或管理员预览非公开内容时使用)
 */
export default function ReviewStatusBanner({
  status,
  moduleName,
  isOwner,
  isAdmin,
  createdAt,
  adminReviewUrl,
  rejectReason,
}: ReviewStatusBannerProps) {
  if (status === "APPROVED") return null;
  const createdDateStr = createdAt
    ? new Date(createdAt).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "近期提交";

  if (status === "PENDING") {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
          border: "1px solid #FCD34D",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          margin: "1rem auto",
          maxWidth: "1140px",
          boxShadow: "0 2px 10px rgba(245, 158, 11, 0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>⏳</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#92400E" }}>
                  【待审核预览模式】
                </span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "700",
                    background: "#F59E0B",
                    color: "white",
                  }}
                >
                  平台审核中
                </span>
                <span style={{ fontSize: "12px", color: "#B45309" }}>
                  仅{isOwner ? "您本人" : ""}{isOwner && isAdmin ? "及" : ""}{isAdmin ? "管理员" : ""}可见
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#78350F", margin: "4px 0 0 0" }}>
                您发布的{moduleName}正在平台人工审核中，提交时间：{createdDateStr}。审核通过后将自动对公众公开。
              </p>
            </div>
          </div>

          {isAdmin && adminReviewUrl && (
            <Link
              href={adminReviewUrl}
              style={{
                padding: "6px 14px",
                background: "#16A34A",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              🛠️ 管理员审核上线 →
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
          border: "1px solid #FCA5A5",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          margin: "1rem auto",
          maxWidth: "1140px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>❌</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px", fontWeight: "800", color: "#991B1B" }}>
                【未通过审核】
              </span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "700",
                  background: "#EF4444",
                  color: "white",
                }}
              >
                审核未通过
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#7F1D1D", margin: "4px 0 0 0" }}>
              {rejectReason || `该${moduleName}未达到平台合规发布标准，请修改后重新提交或联系客服咨询。`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "OFFLINE") {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
          border: "1px solid #CBD5E1",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          margin: "1rem auto",
          maxWidth: "1140px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>⏸️</span>
          <div>
            <span style={{ fontSize: "15px", fontWeight: "800", color: "#475569" }}>
              【已暂停/已下线】
            </span>
            <p style={{ fontSize: "13px", color: "#64748B", margin: "4px 0 0 0" }}>
              该{moduleName}当前已暂停公开展示，普通用户暂无法访问。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * 普通访客访问未审核内容时的友好提示页 (取代 404)
 */
export function VisitorPendingCard({
  moduleName,
  channelUrl,
  channelName,
  status = "PENDING",
}: {
  moduleName: string;
  channelUrl: string;
  channelName: string;
  status?: "APPROVED" | "PENDING" | "REJECTED" | "OFFLINE" | "OTHER";
}) {
  const isPending = status === "PENDING" || status === "APPROVED";
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            background: "white",
            borderRadius: "16px",
            padding: "2.5rem 2rem",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "52px", marginBottom: "1rem" }}>
            {isPending ? "⏳" : "🔒"}
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b", marginBottom: "8px" }}>
            {isPending ? `${moduleName}正在审核中` : `${moduleName}暂未公开`}
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "1.5rem" }}>
            {isPending
              ? `该${moduleName}已由发布者成功提交，平台专员正在进行内容真实性与合规审核。审核通过后将自动对全网公开展示，敬请期待！`
              : `该${moduleName}目前处于暂停或归档状态。您可以浏览杨林生活网其他精彩内容。`}
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href={channelUrl}
              style={{
                padding: "10px 20px",
                background: "#1967D2",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              浏览{channelName}
            </Link>
            <Link
              href="/"
              style={{
                padding: "10px 20px",
                background: "#f1f5f9",
                color: "#475569",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              返回网站首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
