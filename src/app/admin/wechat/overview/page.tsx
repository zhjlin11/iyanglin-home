"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface OverviewData {
  cards: {
    currentFollowers: number;
    todayFollows: number;
    todayUnfollows: number;
    todayKeywords: number;
    todayMenuClicks: number;
    todayScans: number;
    waitingConversations: number;
    newLeads: number;
  };
  trends: {
    follows: Array<{ date: string; count: number }>;
    keywords: Array<{ date: string; count: number }>;
    scans: Array<{ date: string; count: number }>;
  };
  hotKeywords: Array<{ name: string; count: number }>;
  hotMenus: Array<{ name: string; count: number }>;
}

export default function WechatOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/wechat/overview")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(res.error || "加载失败");
      })
      .catch(() => setError("网络错误"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout title="公众号概览">
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>加载中...</div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="公众号概览">
        <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>{error || "数据为空"}</div>
      </AdminLayout>
    );
  }

  const cards = [
    { label: "当前粉丝", value: data.cards.currentFollowers, color: "#3b82f6", icon: "👥" },
    { label: "今日新增", value: data.cards.todayFollows, color: "#10b981", icon: "📈" },
    { label: "今日取关", value: data.cards.todayUnfollows, color: "#ef4444", icon: "📉" },
    { label: "关键词触发", value: data.cards.todayKeywords, color: "#8b5cf6", icon: "🔑" },
    { label: "菜单点击", value: data.cards.todayMenuClicks, color: "#f59e0b", icon: "📋" },
    { label: "扫码次数", value: data.cards.todayScans, color: "#06b6d4", icon: "📱" },
    { label: "待处理咨询", value: data.cards.waitingConversations, color: "#ec4899", icon: "💬" },
    { label: "新线索", value: data.cards.newLeads, color: "#f97316", icon: "🎯" },
  ];

  return (
    <AdminLayout title="公众号概览">
      <div style={{ padding: "20px", maxWidth: "1200px" }}>
        {/* 数据卡片 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          {cards.map((c) => (
            <div
              key={c.label}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                border: "1px solid #f0f0f0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>{c.label}</span>
                <span style={{ fontSize: "20px" }}>{c.icon}</span>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: c.color, fontVariantNumeric: "tabular-nums" }}>
                {c.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* 趋势图 + 排行 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* 7天关注趋势 */}
          <TrendCard title="7天关注趋势" data={data.trends.follows} color="#3b82f6" />
          <TrendCard title="7天关键词触发" data={data.trends.keywords} color="#8b5cf6" />
          <TrendCard title="7天扫码趋势" data={data.trends.scans} color="#06b6d4" />

          {/* 热门排行 */}
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px", color: "#1f2937" }}>🔥 热门关键词 (7天)</h3>
            {data.hotKeywords.length === 0 ? (
              <div style={{ color: "#9ca3af", fontSize: "13px", textAlign: "center", padding: "20px" }}>暂无数据</div>
            ) : (
              <div>
                {data.hotKeywords.map((kw, i) => (
                  <div key={kw.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < data.hotKeywords.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: i < 3 ? "#ef4444" : "#e5e7eb", color: i < 3 ? "white" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600 }}>{i + 1}</span>
                      <span style={{ fontSize: "13px", color: "#374151" }}>{kw.name}</span>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#3b82f6", fontVariantNumeric: "tabular-nums" }}>{kw.count}</span>
                  </div>
                ))}
              </div>
            )}

            <h3 style={{ fontSize: "15px", fontWeight: 600, marginTop: "24px", marginBottom: "16px", color: "#1f2937" }}>📋 热门菜单 (7天)</h3>
            {data.hotMenus.length === 0 ? (
              <div style={{ color: "#9ca3af", fontSize: "13px", textAlign: "center", padding: "20px" }}>暂无数据</div>
            ) : (
              <div>
                {data.hotMenus.map((m, i) => (
                  <div key={m.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < data.hotMenus.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: i < 3 ? "#f59e0b" : "#e5e7eb", color: i < 3 ? "white" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600 }}>{i + 1}</span>
                      <span style={{ fontSize: "13px", color: "#374151" }}>{m.name}</span>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>{m.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/* 简易趋势柱状图组件 */
function TrendCard({ title, data, color }: { title: string; data: Array<{ date: string; count: number }>; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
      <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px", color: "#1f2937" }}>{title}</h3>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
        {data.map((d) => (
          <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>{d.count}</span>
            <div
              style={{
                width: "100%",
                maxWidth: "40px",
                height: `${Math.max((d.count / max) * 80, 4)}px`,
                background: color,
                borderRadius: "4px 4px 0 0",
                opacity: 0.8,
                transition: "height 0.3s ease",
              }}
            />
            <span style={{ fontSize: "10px", color: "#9ca3af" }}>{d.date.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
