import React from "react";
import CategoryIcon from "./CategoryIcon";

interface ShopPlaceholderCoverProps {
  name: string;
  category?: string;
  height?: string | number;
  showAdminAction?: boolean;
  shopId?: string;
}

const gradientPalettes = [
  { from: "#0b7a75", to: "#149990" },
  { from: "#2563eb", to: "#60a5fa" },
  { from: "#7c3aed", to: "#a78bfa" },
  { from: "#db2777", to: "#f472b6" },
  { from: "#ea580c", to: "#fb923c" },
  { from: "#059669", to: "#34d399" },
  { from: "#4f46e5", to: "#818cf8" },
  { from: "#0891b2", to: "#22d3ee" },
  { from: "#b91c1c", to: "#f87171" },
  { from: "#7e22ce", to: "#c084fc" },
  { from: "#0d9488", to: "#5eead4" },
  { from: "#c2410c", to: "#fdba74" },
];

const gradientAngles = [135, 150, 120, 160, 140, 125];

function nameHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default function ShopPlaceholderCover({
  name,
  category = "food",
  height = "100%",
  showAdminAction = false,
  shopId,
}: ShopPlaceholderCoverProps) {
  const hash = nameHash(name || "商家");
  const palette = gradientPalettes[hash % gradientPalettes.length];
  const angle = gradientAngles[hash % gradientAngles.length];
  const firstChar = name ? name.trim().charAt(0) : "店";
  const secondChar = name && name.trim().length > 1 ? name.trim().charAt(1) : "";

  return (
    <div
      style={{
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        background: `linear-gradient(${angle}deg, ${palette.from}, ${palette.to})`,
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
          right: "-8px",
          bottom: "-12px",
          fontSize: "5.5rem",
          opacity: 0.12,
          fontWeight: "900",
          userSelect: "none",
          color: "white",
          lineHeight: 1,
          letterSpacing: "-0.05em",
        }}
      >
        {firstChar}{secondChar}
      </div>

      <div
        style={{
          position: "absolute",
          left: "-20px",
          top: "-20px",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.08)",
        }}
      />

      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "0.4rem",
        }}
      >
        <CategoryIcon name={category} size={26} color="white" />
      </div>

      <div
        style={{
          fontSize: "1rem",
          fontWeight: "bold",
          zIndex: 1,
          textShadow: "0 1px 3px rgba(0,0,0,0.25)",
          maxWidth: "90%",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </div>

      {showAdminAction && shopId && (
        <a
          href={`/admin/content/${shopId}/edit`}
          style={{
            marginTop: "12px",
            fontSize: "12px",
            color: palette.from,
            background: "white",
            padding: "4px 12px",
            borderRadius: "20px",
            textDecoration: "none",
            fontWeight: "bold",
            zIndex: 2,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          + 补充门店图片
        </a>
      )}
    </div>
  );
}
