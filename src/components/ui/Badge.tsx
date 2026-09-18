"use client";

import React from "react";

export interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "brand";
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ variant = "brand", children, style }) => {
  const getBadgeStyle = (): React.CSSProperties => {
    switch (variant) {
      case "success":
        return { background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" };
      case "warning":
        return { background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" };
      case "danger":
        return { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5" };
      case "info":
        return { background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" };
      case "neutral":
        return { background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" };
      case "brand":
      default:
        return { background: "rgba(11, 122, 117, 0.1)", color: "#0B7A75", border: "1px solid rgba(11, 122, 117, 0.25)" };
    }
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 600,
        lineHeight: "1.4",
        fontFamily: "'Inter', 'HarmonyOS Sans', sans-serif",
        whiteSpace: "nowrap",
        ...getBadgeStyle(),
        ...style,
      }}
    >
      {children}
    </span>
  );
};
