"use client";

import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";

type Item = {
  id: string;
  kind: "article" | "job" | "listing" | "house" | "shop" | "post" | "event" | "love";
  title: string;
  company?: string;
  category?: string;
  contact?: string;
  price?: string;
  location?: string;
  salary?: string;
  phone?: string;
  address?: string;
  body: string;
  status: string;
  isTop?: boolean;
  isFeatured?: boolean;
  images?: string[];
  createdAt: string;
};

const kindMeta: Record<Item["kind"], { label: string; icon: string; bg: string; color: string; border: string }> = {
  house: { label: "房产楼市", icon: "🏠", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  job: { label: "求职招聘", icon: "💼", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  shop: { label: "口碑好店", icon: "🏪", bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  listing: { label: "综合信息", icon: "📋", bg: "#f0fdfa", color: "#0B7A75", border: "#99f6e4" },
  post: { label: "贴吧社区", icon: "💬", bg: "#ede9fe", color: "#6d28d9", border: "#ddd6fe" },
  love: { label: "相亲交友", icon: "💖", bg: "#fdf2f8", color: "#be185d", border: "#fbcfe8" },
  article: { label: "本地资讯", icon: "📰", bg: "#f0fdfa", color: "#0f766e", border: "#99f6e4" },
  event: { label: "同城活动", icon: "🎈", bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
};

function renderSubtitle(item: Item) {
  const parts: string[] = [];

  if (item.kind === "house") {
    if (item.category) parts.push(`🏷️ ${item.category}`);
    if (item.price) parts.push(`💰 ${item.price}`);
    if (item.location) parts.push(`📍 ${item.location}`);
  } else if (item.kind === "job") {
    if (item.company) parts.push(`🏢 ${item.company}`);
    if (item.salary) parts.push(`💰 ${item.salary}`);
  } else if (item.kind === "shop") {
    if (item.category) parts.push(`🏷️ ${item.category}`);
    if (item.address) parts.push(`📍 ${item.address}`);
  } else if (item.kind === "listing") {
    if (item.category) parts.push(`🏷️ ${item.category}`);
    if (item.contact) parts.push(`📞 ${item.contact}`);
  } else if (item.kind === "post") {
    if (item.category) parts.push(`💬 ${item.category === "yanglin" ? "杨林专区" : item.category === "news" ? "曝光爆料" : "综合讨论"}`);
  } else if (item.kind === "love") {
    if (item.category) parts.push(`🌸 ${item.category}`);
  } else if (item.kind === "article") {
    if (item.category) parts.push(`📰 资讯推荐`);
  } else if (item.kind === "event") {
    if (item.location) parts.push(`📍 ${item.location}`);
  }

  if (parts.length === 0) {
    parts.push(item.category || item.company || "杨林本地");
  }

  return parts.join(" · ");
}

export default function ContentManagerPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedPreview, setSelectedPreview] = useState<Item | null>(null);

  const pageSize = 15;
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mounted = useRef(false);
  const fetchRef = useRef(0);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const doFetch = (targetPage: number, kind: string, status: string, q: string) => {
    const id = ++fetchRef.current;
    const params = new URLSearchParams({ page: String(targetPage), pageSize: String(pageSize) });
    if (kind !== "all") params.set("kind", kind);
    if (status !== "all") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());

    setLoading(true);
    fetch(`/api/content?${params}`)
      .then(async (response) => {
        const data = await response.json();
        if (id !== fetchRef.current) return;
        if (!response.ok) throw new Error(data.error || "加载失败");
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        setError("");
      })
      .catch((reason) => {
        if (id === fetchRef.current) setError(reason.message);
      })
      .finally(() => {
        if (id === fetchRef.current) setLoading(false);
      });
  };

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const k = sp.get("kind") || "all";
    setKindFilter(k);
    doFetch(1, k, "all", "");
    const timer = setTimeout(() => { mounted.current = true; }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted.current) return;
    doFetch(1, kindFilter, statusFilter, query);
  }, [kindFilter, statusFilter]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      doFetch(1, kindFilter, statusFilter, value);
    }, 400);
  };

  const toggleTop = async (item: Item) => {
    setMessage("");
    setError("");
    const newIsTop = !item.isTop;
    const response = await fetch("/api/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, status: item.status, isTop: newIsTop }),
    });
    if (!response.ok) {
      setError("置顶状态切换失败");
      return;
    }
    showMsg(newIsTop ? "🔥 成功设置为黄金置顶" : "已取消置顶");
    doFetch(page, kindFilter, statusFilter, query);
  };

  const changeStatus = async (item: Item) => {
    const nextStatus = item.status === "approved" ? "offline" : "approved";
    setMessage("");
    setError("");
    const response = await fetch("/api/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, status: nextStatus }),
    });
    if (!response.ok) {
      setError("状态更新失败");
      return;
    }
    showMsg(nextStatus === "approved" ? "✅ 内容已成功发布上线" : "⏸ 内容已下线");
    doFetch(page, kindFilter, statusFilter, query);
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm("确认永久删除该条便民内容吗？删除后不可恢复。")) return;
    setMessage("");
    setError("");
    const response = await fetch("/api/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      setError("删除失败");
      return;
    }
    showMsg("🗑️ 内容已成功删除");
    doFetch(page, kindFilter, statusFilter, query);
  };

  return (
    <AdminLayout
      title="📦 全站便民内容综合管理大厅"
      subtitle="集中检索、智能流转、置顶推荐与精细化管理杨林生活网房产、招聘、好店、便民、社区等全模块内容。"
    >
      {/* 顶部消息条 */}
      {message && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "12px 18px", borderRadius: "10px", marginBottom: "1.25rem", fontWeight: "700" }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 18px", borderRadius: "10px", marginBottom: "1.25rem", fontWeight: "700" }}>
          ⚠️ {error}
        </div>
      )}

      {/* 频道快速分流胶囊栏 (带 Emoji 标牌与即时切换) */}
      <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "10px 14px", marginBottom: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "2px" }}>
          {[
            { key: "all", label: "全部内容", icon: "🌐" },
            { key: "house", label: "房产楼市", icon: "🏠" },
            { key: "job", label: "求职招聘", icon: "💼" },
            { key: "shop", label: "口碑好店", icon: "🏪" },
            { key: "listing", label: "便民分类", icon: "📋" },
            { key: "post", label: "贴吧社区", icon: "💬" },
            { key: "love", label: "相亲交友", icon: "💖" },
            { key: "article", label: "本地资讯", icon: "📰" },
            { key: "event", label: "同城活动", icon: "🎈" },
          ].map((c) => {
            const active = kindFilter === c.key;
            return (
              <button
                key={c.key}
                onClick={() => { setKindFilter(c.key); setPage(1); }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: active ? "1px solid #0B7A75" : "1px solid #e2e8f0",
                  background: active ? "#0B7A75" : "#f8fafc",
                  color: active ? "white" : "#475569",
                  fontWeight: active ? "800" : "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.15s",
                  boxShadow: active ? "0 2px 6px rgba(11, 122, 117, 0.25)" : "none",
                }}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 搜索与状态工具栏 */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          padding: "1rem 1.25rem",
          marginBottom: "1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* 状态分段选择器 */}
        <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "4px", borderRadius: "10px", gap: "4px" }}>
          <button
            onClick={() => { setStatusFilter("all"); setPage(1); }}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              background: statusFilter === "all" ? "white" : "transparent",
              color: statusFilter === "all" ? "#0f172a" : "#64748b",
              fontWeight: statusFilter === "all" ? "800" : "600",
              boxShadow: statusFilter === "all" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            全部状态
          </button>
          <button
            onClick={() => { setStatusFilter("approved"); setPage(1); }}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              background: statusFilter === "approved" ? "white" : "transparent",
              color: statusFilter === "approved" ? "#166534" : "#64748b",
              fontWeight: statusFilter === "approved" ? "800" : "600",
              boxShadow: statusFilter === "approved" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            🟢 已发布上线
          </button>
          <button
            onClick={() => { setStatusFilter("offline"); setPage(1); }}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              background: statusFilter === "offline" ? "white" : "transparent",
              color: statusFilter === "offline" ? "#991b1b" : "#64748b",
              fontWeight: statusFilter === "offline" ? "800" : "600",
              boxShadow: statusFilter === "offline" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            ⏸ 已下线/下架
          </button>
        </div>

        {/* 搜索框与总数提示 */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", flex: 1, justifyContent: "flex-end", minWidth: "280px" }}>
          <div style={{ position: "relative", minWidth: "240px", flex: 1, maxWidth: "360px" }}>
            <input
              type="text"
              placeholder="🔍 搜索标题、企业、分类、地点..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
                background: "#f8fafc",
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(""); doFetch(1, kindFilter, statusFilter, ""); }}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                ✕
              </button>
            )}
          </div>

          <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "700", whiteSpace: "nowrap" }}>
            共 <b>{total}</b> 条数据
          </span>
        </div>
      </div>

      {/* 核心内容管理数据表格 (自适应横向滚动，操作列绝对单行不折行) */}
      <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "1100px", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "700" }}>
                <th style={{ padding: "14px 18px", width: "130px", whiteSpace: "nowrap" }}>频道类型</th>
                <th style={{ padding: "14px 18px", minWidth: "380px" }}>内容标题与业务副标</th>
                <th style={{ padding: "14px 18px", width: "120px", whiteSpace: "nowrap" }}>当前状态</th>
                <th style={{ padding: "14px 18px", width: "150px", whiteSpace: "nowrap" }}>发布/更新时间</th>
                <th style={{ padding: "14px 18px", textAlign: "right", minWidth: "220px", whiteSpace: "nowrap" }}>管理操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}>
                    ⏳ 正在检索全站便民内容...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
                    🔍 未检索到匹配的便民内容记录
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const meta = kindMeta[item.kind] || { label: item.kind, icon: "📄", bg: "#f1f5f9", color: "#334155", border: "#e2e8f0" };
                  const subtitle = renderSubtitle(item);
                  const isApproved = item.status === "approved";

                  return (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white"; }}
                    >
                      {/* 频道类型 */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            background: meta.bg,
                            color: meta.color,
                            border: `1px solid ${meta.border}`,
                            padding: "4px 10px",
                            borderRadius: "14px",
                            fontSize: "12px",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </span>
                      </td>

                      {/* 内容标题与立体副标 */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span>{item.title}</span>
                          {item.isTop && (
                            <span style={{ fontSize: "10.5px", padding: "1px 6px", borderRadius: "4px", background: "#fef3c7", color: "#b45309", fontWeight: "800", border: "1px solid #fde68a" }}>
                              🔥 黄金置顶
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px", fontWeight: "500" }}>
                          {subtitle}
                        </div>
                      </td>

                      {/* 状态徽章 */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <StatusBadge status={item.status} />
                      </td>

                      {/* 发布时间 */}
                      <td style={{ padding: "14px 18px", color: "#64748b", fontSize: "12.5px", whiteSpace: "nowrap" }}>
                        {new Date(item.createdAt).toLocaleString("zh-CN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* 管理操作（精致轻量胶囊按钮，严格单行无折行） */}
                      <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end" }}>
                          {/* 招聘信息使用现有的后台编辑表单，保留职位字段、福利和审核状态。 */}
                          {item.kind === "job" && (
                            <a
                              href={`/admin/content/${item.id}/edit`}
                              style={{
                                padding: "4px 9px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "700",
                                background: "#f5f3ff",
                                color: "#6d28d9",
                                border: "1px solid #ddd6fe",
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                              }}
                            >
                              编辑
                            </a>
                          )}
                          {/* 1. 置顶 */}
                          <button
                            onClick={() => toggleTop(item)}
                            style={{
                              padding: "4px 9px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              background: item.isTop ? "#fef3c7" : "#f8fafc",
                              color: item.isTop ? "#b45309" : "#475569",
                              border: "1px solid #cbd5e1",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.isTop ? "降顶" : "🔥 置顶"}
                          </button>

                          {/* 2. 详情预览 */}
                          <button
                            onClick={() => setSelectedPreview(item)}
                            style={{
                              padding: "4px 9px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            👁️ 预览
                          </button>

                          {/* 3. 上线/下线 */}
                          <button
                            onClick={() => changeStatus(item)}
                            style={{
                              padding: "4px 9px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              background: isApproved ? "#fffbeb" : "#f0fdf4",
                              color: isApproved ? "#b45309" : "#15803d",
                              border: `1px solid ${isApproved ? "#fde68a" : "#bbf7d0"}`,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isApproved ? "下线" : "上线"}
                          </button>

                          {/* 4. 删除 */}
                          <button
                            onClick={() => deleteItem(item.id)}
                            style={{
                              padding: "4px 9px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              background: "#fef2f2",
                              color: "#b91c1c",
                              border: "1px solid #fecaca",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 底部标准分页组件 */}
        {totalPages > 1 && (
          <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", flexWrap: "wrap", gap: "12px" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              共 <b>{total}</b> 条记录 · 第 <b>{page}</b> / {totalPages} 页
            </span>

            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                disabled={page <= 1}
                onClick={() => { const p = Math.max(1, page - 1); setPage(p); doFetch(p, kindFilter, statusFilter, query); }}
                style={{
                  padding: "5px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: page <= 1 ? "#f1f5f9" : "white",
                  color: page <= 1 ? "#94a3b8" : "#334155",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                }}
              >
                ← 上一页
              </button>

              <span style={{ fontSize: "13px", fontWeight: "800", color: "#0B7A75", padding: "0 8px" }}>
                {page}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); doFetch(p, kindFilter, statusFilter, query); }}
                style={{
                  padding: "5px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: page >= totalPages ? "#f1f5f9" : "white",
                  color: page >= totalPages ? "#94a3b8" : "#334155",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                }}
              >
                下一页 →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 内容快速查看抽屉/模态框 */}
      {selectedPreview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "600px", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#0B7A75", fontWeight: "800", background: "#f0fdfa", padding: "2px 8px", borderRadius: "6px" }}>
                  {kindMeta[selectedPreview.kind]?.label || selectedPreview.kind}
                </span>
                <h3 style={{ margin: "6px 0 0 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                  {selectedPreview.title}
                </h3>
              </div>
              <button onClick={() => setSelectedPreview(null)} style={{ border: "none", background: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}>✕</button>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", marginBottom: "1rem", fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
              <div><b>业务特征：</b>{renderSubtitle(selectedPreview)}</div>
              <div><b>发布时间：</b>{new Date(selectedPreview.createdAt).toLocaleString("zh-CN")}</div>
              {selectedPreview.contact && <div><b>联系电话：</b>{selectedPreview.contact}</div>}
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>详细正文内容</div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "10px", fontSize: "13px", color: "#334155", lineHeight: "1.7", maxHeight: "200px", overflowY: "auto", whiteSpace: "pre-wrap" }}>
                {selectedPreview.body || "暂无正文描述。"}
              </div>
            </div>

            <button onClick={() => setSelectedPreview(null)} style={{ width: "100%", padding: "10px", background: "#0f172a", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13.5px" }}>
              关闭详情
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
