"use client";

import React from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyText?: string;
}

export function DataTable<T>({ columns, data, keyExtractor, emptyText = "暂无数据" }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div style={{ background: "white", padding: "3rem", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📭</div>
        <p style={{ margin: 0, fontSize: "14px" }}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflowX: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
        <thead>
          <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
            {columns.map((col) => (
              <th key={col.key} style={{ padding: "12px 16px", fontWeight: "bold", color: "#475569", width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={keyExtractor(row)}
              style={{
                borderBottom: idx === data.length - 1 ? "none" : "1px solid #f1f5f9",
                transition: "background 0.15s ease",
              }}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ padding: "14px 16px", color: "#1e293b" }}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
