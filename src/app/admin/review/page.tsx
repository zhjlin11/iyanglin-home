"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";

type ReviewItem = {
  id: string;
  kind: string;
  label: string;
  title: string;
  status: string;
  createdAt: string;
  authorName?: string;
  contact?: string;
};

const kindLabels: Record<string, { label: string; icon: string }> = {
  job: { label: "求职招聘", icon: "💼" },
  house: { label: "房产楼市", icon: "🏠" },
  listing: { label: "便民分类", icon: "📋" },
  shop: { label: "口碑好店", icon: "🏪" },
  event: { label: "同城活动", icon: "🎉" },
  love: { label: "相亲交友", icon: "💕" },
  post: { label: "贴吧社区", icon: "💬" },
  article: { label: "本地资讯", icon: "📰" },
  verification: { label: "身份认证", icon: "🪪" },
};

export default function AdminReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [totalPending, setTotalPending] = useState(0);
  const [filterKind, setFilterKind] = useState("all");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterKind !== "all") params.set("kind", filterKind);
    if (filterStatus !== "all") params.set("status", filterStatus);

    fetch(`/api/review?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setItems(data.items || []);
          setPendingCounts(data.pendingCounts || {});
          setTotalPending(data.totalPending || 0);
        } else {
          setError(data.error || "获取审核内容失败");
        }
      })
      .catch(() => setError("网络请求错误"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filterKind, filterStatus]);

  const updateStatus = async (item: ReviewItem, newStatus: string) => {
    setMsg("");
    setError("");
    try {
      const r = await fetch("/api/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, kind: item.kind, status: newStatus }),
      });
      const data = await r.json();
      if (r.ok && data.success) {
        setMsg(`✅ 已将内容「${item.title}」状态更新为：${newStatus === "approved" ? "已审核上线" : "已下线/驳回"}`);
        load();
      } else {
        setError(data.error || "操作失败");
      }
    } catch {
      setError("网络错误，操作失败");
    }
  };

  const columns: Column<ReviewItem>[] = [
    {
      key: "kind",
      header: "模块类型",
      width: "120px",
      render: (item) => {
        const info = kindLabels[item.kind] || { label: item.label, icon: "📦" };
        return (
          <span style={{ background: "#0f172a", color: "#38bdf8", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span>{info.icon}</span>
            <span>{info.label}</span>
          </span>
        );
      },
    },
    {
      key: "title",
      header: "内容标题 / 提交人",
      render: (item) => (
        <div>
          <div style={{ fontWeight: "bold", color: "#0f172a", fontSize: "14px", marginBottom: "3px" }}>
            {item.title}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "10px" }}>
            <span>👤 发布者: <b>{item.authorName}</b></span>
            {item.contact && <span>📞 电话: <b>{item.contact}</b></span>}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "当前状态",
      width: "110px",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "ai_check",
      header: "🤖 AI 初筛",
      width: "130px",
      render: (item) => {
        const isSpam =
          (item.title || "").includes("刷单") ||
          (item.title || "").includes("兼职代发") ||
          (item.title || "").includes("套现") ||
          (item.title || "").includes("高息");
        return (
          <span
            style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "10px",
              fontWeight: "700",
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              background: isSpam ? "#FEF2F2" : "#F0FDF4",
              color: isSpam ? "#DC2626" : "#16A34A",
              border: isSpam ? "1px solid #FECACA" : "1px solid #BBF7D0",
            }}
          >
            <span>{isSpam ? "⚠️ 疑似高危" : "✓ 智能初筛正常"}</span>
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "提交时间",
      width: "140px",
      render: (item) => <span style={{ fontSize: "12.5px", color: "#64748b" }}>{new Date(item.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>,
    },
    {
      key: "actions",
      header: "审核操作",
      width: "200px",
      render: (item) => (
        <div style={{ display: "flex", gap: "8px" }}>
          {item.status !== "approved" && (
            <button
              onClick={() => updateStatus(item, "approved")}
              style={{
                padding: "6px 12px",
                background: "#07c160",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ✅ 审核通过
            </button>
          )}
          {item.status !== "offline" && (
            <button
              onClick={() => updateStatus(item, "offline")}
              style={{
                padding: "6px 12px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ❌ 下线/驳回
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title="🛡️ 全站内容审核大厅"
      subtitle={`统一集中审核全站 8 大核心频道的新增发布与编辑内容。当前全站待审核总量：${totalPending} 条。`}
      actionButton={
        <button
          onClick={load}
          style={{
            padding: "8px 16px",
            background: "#0B7A75",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🔄 刷新审核列表
        </button>
      }
    >
      <div>
        {/* 提示信息 */}
        {msg && (
          <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "13.5px", fontWeight: "600" }}>
            {msg}
          </div>
        )}
        {error && (
          <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "13.5px" }}>
            ⚠️ {error}
          </div>
        )}

        {/* 顶部模块统计卡片 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "1.5rem" }}>
          {Object.entries(kindLabels).map(([k, info]) => {
            const count = pendingCounts[k] || 0;
            const isSelected = filterKind === k;
            return (
              <button
                key={k}
                onClick={() => setFilterKind(isSelected ? "all" : k)}
                style={{
                  background: isSelected ? "#0f172a" : "white",
                  color: isSelected ? "#38bdf8" : "#334155",
                  border: isSelected ? "1px solid #0f172a" : "1px solid #e2e8f0",
                  padding: "10px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: "18px" }}>{info.icon}</span>
                <span style={{ fontSize: "12px", fontWeight: "bold" }}>{info.label}</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    background: count > 0 ? (isSelected ? "#ef4444" : "#fef2f2") : "#f1f5f9",
                    color: count > 0 ? (isSelected ? "white" : "#b91c1c") : "#94a3b8",
                  }}
                >
                  {count} 待审
                </span>
              </button>
            );
          })}
        </div>

        {/* 状态过滤切换 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { id: "pending", label: `⏳ 待审核 (${totalPending})` },
              { id: "all", label: "📋 全部记录" },
              { id: "approved", label: "✅ 已上线" },
              { id: "offline", label: "❌ 已下线" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  background: filterStatus === st.id ? "#0B7A75" : "#e2e8f0",
                  color: filterStatus === st.id ? "white" : "#475569",
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: "13px", color: "#64748b" }}>
            当前列表共显示 <b>{items.length}</b> 条记录
          </div>
        </div>

        {/* 数据表格 */}
        {loading ? (
          <div style={{ background: "white", padding: "3rem", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
            <p style={{ margin: 0, fontSize: "14px" }}>正在加载待审核内容...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            keyExtractor={(item) => `${item.kind}_${item.id}`}
            emptyText="当前筛选条件下暂无审核记录。"
          />
        )}
      </div>
    </AdminLayout>
  );
}
