import React from "react";
import CategoryIcon from "./CategoryIcon";

interface EventPlaceholderCoverProps {
  title: string;
  category?: string;
  height?: string | number;
}

export default function EventPlaceholderCover({
  title,
  category = "outdoor",
  height = "100%",
}: EventPlaceholderCoverProps) {
  const firstChar = title ? title.trim().charAt(0) : "动";

  return (
    <div
      style={{
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        background: "linear-gradient(135deg, #0b7a75, #149990)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        position: "relative",
        overflow: "hidden",
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: "-10px",
          bottom: "-10px",
          fontSize: "6rem",
          opacity: 0.15,
          fontWeight: "900",
          userSelect: "none",
          color: "white",
        }}
      >
        {firstChar}
      </div>

      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "0.5rem",
        }}
      >
        <CategoryIcon name={category} size={28} color="white" />
      </div>

      <div style={{ fontSize: "1.1rem", fontWeight: "bold", zIndex: 1, textShadow: "0 1px 2px rgba(0,0,0,0.2)", textAlign: "center" }}>
        {title}
      </div>

      <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "4px", zIndex: 1 }}>
        同城活动 · 精彩期待
      </div>
    </div>
  );
}
