"use client";

import React from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface ChartCardProps {
  title: string;
  data: DataPoint[];
  color?: string;
  unit?: string;
}

export function ChartCard({ title, data, color = "#0B7A75", unit = "条" }: ChartCardProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>{title}</h4>
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>近 7 天趋势</span>
      </div>

      <div className="adm-chart-bars" style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "120px", paddingTop: "10px" }}>
        {data.map((pt, idx) => {
          const heightPercent = Math.max(10, Math.round((pt.value / maxValue) * 100));
          return (
            <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "bold", color: pt.value > 0 ? "#0f172a" : "#cbd5e1" }}>
                {pt.value}
              </span>
              <div
                style={{
                  width: "100%",
                  maxHeight: "80px",
                  height: `${heightPercent}%`,
                  background: pt.value > 0 ? color : "#f1f5f9",
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.3s ease",
                }}
              />
              <span style={{ fontSize: "11px", color: "#64748b" }}>{pt.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
