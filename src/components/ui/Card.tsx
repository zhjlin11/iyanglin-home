"use client";

import React from "react";

export interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, hoverable = true, style }) => {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
        padding: "1.25rem",
        transition: hoverable ? "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
