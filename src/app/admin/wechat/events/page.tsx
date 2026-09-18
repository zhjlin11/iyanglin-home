"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface UserEvent {
  id: string;
  openId: string;
  eventType: string;
  eventName: string | null;
  eventData: any;
  createdAt: string;
}

const EVENT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  FOLLOW: { label: "关注", icon: "📈", color: "#10b981" },
  UNFOLLOW: { label: "取消关注", icon: "📉", color: "#ef4444" },
  KEYWORD: { label: "关键词", icon: "🔑", color: "#8b5cf6" },
  MENU_CLICK: { label: "菜单点击", icon: "📋", color: "#f59e0b" },
  SCAN_QR: { label: "扫码", icon: "📱", color: "#06b6d4" },
  CUSTOMER_SERVICE: { label: "客服请求", icon: "💬", color: "#ec4899" },
  LEAD: { label: "商业线索", icon: "🎯", color: "#f97316" },
};

export default function WechatEventsPage() {
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 30;

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (typeFilter) params.set("eventType", typeFilter);
    fetch(`/api/admin/wechat/events?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setEvents(res.data);
          setTotal(res.pagination.total);
        }
      })
      .finally(() => setLoading(false));
  }, [page, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AdminLayout title="行为记录">
      <div style={{ padding: "20px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937", margin: 0 }}>📊 用户行为记录</h2>
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>微信用户的所有交互行为时间线</p>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              onClick={() => { setTypeFilter(""); setPage(1); }}
              style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 500, cursor: "pointer", border: "1px solid #e5e7eb", background: !typeFilter ? "#3b82f6" : "white", color: !typeFilter ? "white" : "#374151" }}
            >全部</button>
            {Object.entries(EVENT_LABELS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => { setTypeFilter(k); setPage(1); }}
                style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 500, cursor: "pointer", border: "1px solid #e5e7eb", background: typeFilter === k ? "#3b82f6" : "white", color: typeFilter === k ? "white" : "#374151" }}
              >{v.icon} {v.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px" }}>加载中...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "60px", background: "white", borderRadius: "12px" }}>暂无记录</div>
        ) : (
          <>
            <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              {events.map((ev, i) => {
                const meta = EVENT_LABELS[ev.eventType] || { label: ev.eventType, icon: "📌", color: "#6b7280" };
                return (
                  <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 18px", borderBottom: i < events.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                    <span style={{ fontSize: "20px", flexShrink: 0 }}>{meta.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", padding: "1px 8px", borderRadius: "4px", background: meta.color + "1a", color: meta.color, fontWeight: 500 }}>{meta.label}</span>
                        {ev.eventName && <span style={{ fontSize: "13px", color: "#374151", fontWeight: 500 }}>{ev.eventName}</span>}
                      </div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px", fontFamily: "monospace" }}>{ev.openId.slice(0, 20)}...</div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#9ca3af", flexShrink: 0 }}>
                      {new Date(ev.createdAt).toLocaleString("zh-CN")}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "white", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1, fontSize: "12px" }}>上一页</button>
                <span style={{ padding: "6px 14px", fontSize: "13px", color: "#6b7280" }}>{page} / {totalPages}（共{total}条）</span>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "white", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1, fontSize: "12px" }}>下一页</button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
