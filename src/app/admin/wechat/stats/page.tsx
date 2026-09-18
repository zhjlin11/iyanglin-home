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

export default function WechatStatsPage() {
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
    return <AdminLayout title="数据统计"><div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>加载中...</div></AdminLayout>;
  }
  if (error || !data) {
    return <AdminLayout title="数据统计"><div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>{error || "数据为空"}</div></AdminLayout>;
  }

  const summaryCards = [
    { label: "当前粉丝总数", value: data.cards.currentFollowers, color: "#3b82f6" },
    { label: "今日新关注", value: data.cards.todayFollows, color: "#10b981" },
    { label: "今日取消关注", value: data.cards.todayUnfollows, color: "#ef4444" },
    { label: "今日净增长", value: data.cards.todayFollows - data.cards.todayUnfollows, color: data.cards.todayFollows - data.cards.todayUnfollows >= 0 ? "#10b981" : "#ef4444" },
  ];

  const interactionCards = [
    { label: "今日关键词触发", value: data.cards.todayKeywords, color: "#8b5cf6" },
    { label: "今日菜单点击", value: data.cards.todayMenuClicks, color: "#f59e0b" },
    { label: "今日扫码次数", value: data.cards.todayScans, color: "#06b6d4" },
    { label: "总互动次数", value: data.cards.todayKeywords + data.cards.todayMenuClicks + data.cards.todayScans, color: "#3b82f6" },
  ];

  return (
    <AdminLayout title="数据统计">
      <div style={{ padding: "20px", maxWidth: "1200px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937", margin: "0 0 20px" }}>📊 公众号数据统计</h2>

        {/* 粉丝概览 */}
        <SectionTitle title="👥 粉丝数据" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
          {summaryCards.map((c) => <StatCard key={c.label} {...c} />)}
        </div>

        {/* 互动数据 */}
        <SectionTitle title="📈 互动数据 (今日)" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
          {interactionCards.map((c) => <StatCard key={c.label} {...c} />)}
        </div>

        {/* 7天趋势图 */}
        <SectionTitle title="📉 7天趋势" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <TrendChart title="关注趋势" data={data.trends.follows} color="#10b981" />
          <TrendChart title="关键词触发" data={data.trends.keywords} color="#8b5cf6" />
          <TrendChart title="扫码趋势" data={data.trends.scans} color="#06b6d4" />
        </div>

        {/* 排行榜 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <RankingList title="🔥 热门关键词 (7天)" items={data.hotKeywords} color="#8b5cf6" />
          <RankingList title="📋 热门菜单 (7天)" items={data.hotMenus} color="#f59e0b" />
        </div>

        {/* 运营状态 */}
        <SectionTitle title="🎯 运营状态" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
          <StatCard label="待处理咨询" value={data.cards.waitingConversations} color="#ec4899" />
          <StatCard label="新商业线索" value={data.cards.newLeads} color="#f97316" />
        </div>
      </div>
    </AdminLayout>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#374151", margin: "0 0 12px", paddingBottom: "8px", borderBottom: "1px solid #f0f0f0" }}>{title}</h3>;
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: "white", borderRadius: "12px", padding: "18px", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "26px", fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
        {value >= 0 ? value.toLocaleString() : value.toLocaleString()}
      </div>
    </div>
  );
}

function TrendChart({ title, data, color }: { title: string; data: Array<{ date: string; count: number }>; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div style={{ background: "white", borderRadius: "12px", padding: "18px", border: "1px solid #f0f0f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>{title}</span>
        <span style={{ fontSize: "12px", color: "#6b7280" }}>合计: <b style={{ color }}>{total}</b></span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "100px" }}>
        {data.map((d) => (
          <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>{d.count || ""}</span>
            <div style={{ width: "100%", maxWidth: "32px", height: `${Math.max((d.count / max) * 70, 3)}px`, background: color, borderRadius: "3px 3px 0 0", opacity: 0.75 }} />
            <span style={{ fontSize: "9px", color: "#9ca3af" }}>{d.date.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingList({ title, items, color }: { title: string; items: Array<{ name: string; count: number }>; color: string }) {
  return (
    <div style={{ background: "white", borderRadius: "12px", padding: "18px", border: "1px solid #f0f0f0" }}>
      <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937", margin: "0 0 12px" }}>{title}</h4>
      {items.length === 0 ? (
        <div style={{ color: "#9ca3af", fontSize: "13px", textAlign: "center", padding: "20px" }}>暂无数据</div>
      ) : (
        items.map((item, i) => (
          <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < items.length - 1 ? "1px solid #f5f5f5" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: i < 3 ? color : "#e5e7eb", color: i < 3 ? "white" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 600 }}>{i + 1}</span>
              <span style={{ fontSize: "13px", color: "#374151" }}>{item.name}</span>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>{item.count}</span>
          </div>
        ))
      )}
    </div>
  );
}
