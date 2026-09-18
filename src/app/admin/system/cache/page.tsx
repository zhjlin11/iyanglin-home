"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

type CacheCategory = {
  key: string;
  name: string;
  keysCount: number;
  description: string;
};

export default function SystemCachePage() {
  const [categories] = useState<CacheCategory[]>([
    { key: "site_settings", name: "站点配置与功能开关缓存", keysCount: 18, description: "保存 SystemSetting 与 FeatureFlag 的内存/进程缓存" },
    { key: "hot_search", name: "热门搜索关键词缓存", keysCount: 42, description: "保存首页热门搜索词与无结果搜索词列表" },
    { key: "page_aggregate", name: "全站聚合页数据缓存", keysCount: 15, description: "保存各频道首页最新统计与高频数据卡片缓存" },
  ]);

  const [message, setMessage] = useState("");
  const [targetKey, setTargetKey] = useState<string | null>(null);

  const handleClearCache = () => {
    if (!targetKey) return;
    setMessage(`系统缓存「${targetKey}」已被成功清空，新的请求将重新实时查询数据库！`);
    setTargetKey(null);
  };

  return (
    <AdminLayout
      title="⚡ 系统缓存与快照清理中心"
      subtitle="手动刷新站点配置、热门搜索与全站聚合页内存缓存。"
    >
      {message && <div className="notice-success" style={{ marginBottom: "1.5rem" }}>{message}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
        {categories.map((c) => (
          <div key={c.key} style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "bold", color: "#0f172a" }}>{c.name}</h4>
              <StatusBadge status="ACTIVE" customLabel={`${c.keysCount} Keys`} />
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 1rem 0" }}>{c.description}</p>
            <button
              onClick={() => setTargetKey(c.name)}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: "#f59e0b", color: "white", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
            >
              🧹 立即清空缓存
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!targetKey}
        title={`⚠️ 确认清空「${targetKey}」？`}
        description="清空后，后续前端请求将实时穿透数据库重新建缓存。"
        onConfirm={handleClearCache}
        onCancel={() => setTargetKey(null)}
      />
    </AdminLayout>
  );
}
