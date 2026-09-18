"use client";

import React, { useState } from "react";
import CategoryIcon from "./CategoryIcon";

interface CategoryFilterGridProps {
  currentCategory: string;
}

const primaryCategories: Record<string, string> = {
  outdoor: "户外拓展",
  sport: "体育运动",
  party: "同城聚餐",
  family: "亲子活动",
  training: "技能培训",
  charity: "公益爱心",
  jobfair: "招聘双选",
};

const secondaryCategories: Record<string, string> = {
  camping: "精致露营",
  hiking: "徒步登山",
  cycling: "骑行车友",
  reading: "读书沙龙",
  show: "演出音乐",
  exhibit: "艺术展览",
  salon: "创业交流",
  esports: "电竞比赛",
  photo: "摄影采风",
};

export default function CategoryFilterGrid({ currentCategory }: CategoryFilterGridProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background: "white", padding: "1.25rem", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}>
      
      {/* 4-column responsive grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px 8px",
        }}
      >
        <a href="/active" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", textDecoration: "none", color: currentCategory === "all" ? "#0B7A75" : "var(--text)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: currentCategory === "all" ? "#0B7A75" : "#f1f5f9", color: currentCategory === "all" ? "white" : "#0B7A75", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CategoryIcon name="all" size={24} color={currentCategory === "all" ? "white" : "#0B7A75"} />
          </div>
          <span style={{ fontSize: "12px", fontWeight: currentCategory === "all" ? "bold" : "normal", whiteSpace: "nowrap" }}>全部分类</span>
        </a>

        {Object.entries(primaryCategories).map(([key, label]) => (
          <a key={key} href={`/active?category=${key}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", textDecoration: "none", color: currentCategory === key ? "#0B7A75" : "var(--text)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: currentCategory === key ? "#0B7A75" : "#f1f5f9", color: currentCategory === key ? "white" : "#0B7A75", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CategoryIcon name={key} size={24} color={currentCategory === key ? "white" : "#0B7A75"} />
            </div>
            <span style={{ fontSize: "12px", fontWeight: currentCategory === key ? "bold" : "normal", whiteSpace: "nowrap" }}>{label}</span>
          </a>
        ))}
      </div>

      {/* Expanded categories */}
      {expanded && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px 8px",
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px dashed #e2e8f0",
          }}
        >
          {Object.entries(secondaryCategories).map(([key, label]) => (
            <a key={key} href={`/active?category=${key}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", textDecoration: "none", color: currentCategory === key ? "#0B7A75" : "var(--text)" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: currentCategory === key ? "#0B7A75" : "#f1f5f9", color: currentCategory === key ? "white" : "#0B7A75", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CategoryIcon name={key} size={24} color={currentCategory === key ? "white" : "#0B7A75"} />
              </div>
              <span style={{ fontSize: "12px", fontWeight: currentCategory === key ? "bold" : "normal", whiteSpace: "nowrap" }}>{label}</span>
            </a>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <div style={{ textAlign: "center", marginTop: "10px", paddingTop: "6px" }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "transparent",
            border: "none",
            color: "#0B7A75",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {expanded ? "收起分类 ▲" : "更多分类 (露营/徒步/骑行/电竞...) ▼"}
        </button>
      </div>
    </div>
  );
}
