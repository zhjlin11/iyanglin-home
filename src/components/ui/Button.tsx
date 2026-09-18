"use client";

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  style = {},
  disabled,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "primary":
        return {
          background: "linear-gradient(135deg, #0B7A75 0%, #085652 100%)",
          color: "#ffffff",
          border: "none",
          boxShadow: "0 2px 8px rgba(11, 122, 117, 0.25)",
        };
      case "secondary":
        return {
          background: "#f1f5f9",
          color: "#0f172a",
          border: "1px solid #e2e8f0",
        };
      case "outline":
        return {
          background: "transparent",
          color: "#0B7A75",
          border: "1px solid #0B7A75",
        };
      case "ghost":
        return {
          background: "transparent",
          color: "#475569",
          border: "none",
        };
      case "danger":
        return {
          background: "#ef4444",
          color: "#ffffff",
          border: "none",
        };
      default:
        return {};
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case "sm":
        return { padding: "6px 12px", fontSize: "12px", borderRadius: "6px" };
      case "lg":
        return { padding: "12px 24px", fontSize: "16px", borderRadius: "10px" };
      case "md":
      default:
        return { padding: "8px 16px", fontSize: "14px", borderRadius: "8px" };
    }
  };

  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        fontWeight: 600,
        fontFamily: "'Inter', 'HarmonyOS Sans', sans-serif",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        outline: "none",
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
