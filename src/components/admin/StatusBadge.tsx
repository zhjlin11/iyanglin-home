"use client";

import React from "react";

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
}

export function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const normalized = (status || "").toUpperCase();

  let bg = "#64748b";
  let color = "#ffffff";
  let label = customLabel || status;

  switch (normalized) {
    case "APPROVED":
    case "PAID":
    case "ACTIVE":
    case "RESOLVED":
      bg = "#10b981";
      color = "#ffffff";
      if (!customLabel) {
        if (normalized === "APPROVED") label = "已发布";
        else if (normalized === "PAID") label = "已支付";
        else if (normalized === "ACTIVE") label = "正常";
        else if (normalized === "RESOLVED") label = "已解决";
      }
      break;
    case "PENDING":
    case "PENDING_PAYMENT":
    case "PROCESSING":
      bg = "#f59e0b";
      color = "#ffffff";
      if (!customLabel) {
        if (normalized === "PENDING") label = "待审核";
        else if (normalized === "PENDING_PAYMENT") label = "待支付";
        else if (normalized === "PROCESSING") label = "处理中";
      }
      break;
    case "REJECTED":
    case "DISABLED":
    case "FAILED":
    case "REFUNDED":
    case "REFUNDING":
      bg = "#ef4444";
      color = "#ffffff";
      if (!customLabel) {
        if (normalized === "REJECTED") label = "已拒绝";
        else if (normalized === "DISABLED") label = "已禁用";
        else if (normalized === "FAILED") label = "失败";
        else if (normalized === "REFUNDED") label = "已退款";
        else if (normalized === "REFUNDING") label = "退款中";
      }
      break;
    case "OFFLINE":
    case "CANCELLED":
    case "DRAFT":
    case "EXPIRED":
      bg = "#64748b";
      color = "#ffffff";
      if (!customLabel) {
        if (normalized === "OFFLINE") label = "已下线";
        else if (normalized === "CANCELLED") label = "已取消";
        else if (normalized === "DRAFT") label = "草稿";
        else if (normalized === "EXPIRED") label = "已到期";
      }
      break;
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "bold",
        backgroundColor: bg,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
