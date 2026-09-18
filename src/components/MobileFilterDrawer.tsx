"use client";

import React, { useState } from "react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  title: string;
  key: string;
  options: FilterOption[];
}

interface MobileFilterDrawerProps {
  basePath: string;
  groups: FilterGroup[];
  selectedValues: Record<string, string>;
  searchQuery?: string;
}

export default function MobileFilterDrawer({
  basePath,
  groups,
  selectedValues,
  searchQuery = "",
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const [tempValues, setTempValues] = useState<Record<string, string>>(selectedValues);

  const handleOpen = () => {
    setTempValues(selectedValues);
    setOpen(true);
  };

  const handleSelect = (groupKey: string, val: string) => {
    setTempValues((prev) => ({ ...prev, [groupKey]: val }));
  };

  const handleConfirm = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);

    for (const [k, v] of Object.entries(tempValues)) {
      if (v && v !== "all" && v !== "全部区域") {
        params.set(k, v);
      }
    }

    const qStr = params.toString();
    window.location.href = qStr ? `${basePath}?${qStr}` : basePath;
    setOpen(false);
  };

  const handleReset = () => {
    setTempValues({});
    window.location.href = basePath;
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        type="button"
        className="button button-secondary"
        style={{
          minHeight: "36px",
          padding: "6px 14px",
          fontSize: "13px",
          borderRadius: "20px",
          background: "#ffffff",
          borderColor: "var(--brand)",
          color: "#0B7A75",
          fontWeight: "bold",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span>🔍 筛选与排序</span>
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.5)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Bottom Sheet Drawer */}
          <div
            style={{
              position: "relative",
              background: "white",
              borderTopLeftRadius: "20px",
              borderTopRightRadius: "20px",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              zIndex: 10000,
              boxShadow: "0 -10px 30px rgba(0,0,0,0.15)",
              padding: "1.25rem",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", color: "#1e293b" }}>多维条件筛选</h3>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "#f1f5f9", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", fontSize: "14px" }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Options */}
            <div className="no-scrollbar" style={{ overflowY: "auto", padding: "1rem 0", flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {groups.map((group) => (
                <div key={group.key}>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "#64748b", marginBottom: "8px" }}>{group.title}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {group.options.map((opt) => {
                      const isSelected = (tempValues[group.key] || "all") === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelect(group.key, opt.value)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            border: isSelected ? "1px solid #0B7A75" : "1px solid #e2e8f0",
                            background: isSelected ? "#0B7A75" : "#f8fafc",
                            color: isSelected ? "white" : "#334155",
                            fontWeight: isSelected ? "bold" : "normal",
                            cursor: "pointer",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Action Buttons */}
            <div style={{ display: "flex", gap: "12px", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
              <button
                onClick={handleReset}
                type="button"
                className="button button-secondary"
                style={{ flex: 1, padding: "0.75rem", borderRadius: "10px", fontSize: "14px" }}
              >
                重置
              </button>
              <button
                onClick={handleConfirm}
                type="button"
                className="button button-primary"
                style={{ flex: 2, padding: "0.75rem", borderRadius: "10px", background: "#0B7A75", borderColor: "#0B7A75", fontSize: "14px", fontWeight: "bold" }}
              >
                确认筛选
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
