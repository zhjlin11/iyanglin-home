"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";

type SearchItem = {
  id: string;
  resourceType: string;
  title: string;
  summary: string;
  image?: string;
  category: string;
  location: string;
  priceOrMeta: string;
  status: string;
  publishedAt: string;
  url: string;
  score: number;
};

const moduleLabels: Record<string, string> = {
  ALL: "全部内容",
  JOB: "求职招聘",
  HOUSE: "房产楼市",
  INDUSTRIAL: "园区招商",
  SERVICE_PRODUCT: "本地服务",
  LISTING: "便民分类",
  SHOP: "商家黄页",
  EVENT: "同城活动",
  DATING: "相亲交友",
  POST: "社区论坛",
};

function SearchContent() {
  const [keyword, setKeyword] = useState("");
  const [activeType, setActiveType] = useState("ALL");
  const [sort, setSort] = useState("relevance");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [hotKeywords, setHotKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(false);

  const fetchResults = (q: string, type: string, s: string) => {
    if (!q.trim()) {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}&sort=${s}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setDurationMs(data.durationMs || 0);
        if (data.hotKeywords) setHotKeywords(data.hotKeywords);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  // Read initial params from URL on mount (no useSearchParams / Suspense)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("q") || "";
    const type = sp.get("type") || "ALL";
    setKeyword(q);
    setActiveType(type);
    fetchResults(q, type, sort);
    mounted.current = true;
  }, []);

  // Re-fetch when sort changes (skip initial mount)
  useEffect(() => {
    if (!mounted.current) return;
    fetchResults(keyword, activeType, sort);
  }, [sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    window.history.pushState({}, "", `/search?q=${encodeURIComponent(keyword)}&type=${activeType}`);
    fetchResults(keyword, activeType, sort);
  };

  const handleTypeChange = (type: string) => {
    setActiveType(type);
    window.history.pushState({}, "", `/search?q=${encodeURIComponent(keyword)}&type=${type}`);
    fetchResults(keyword, type, sort);
  };

  return (
    <main className="page-layout support-page search-channel">
      {/* Search Result Page Head Rules */}
      <head>
        <meta name="robots" content="noindex, follow" />
        <title>{keyword ? `"${keyword}" 的搜索结果 | 杨林生活网` : "全站聚合搜索 | 杨林生活网"}</title>
      </head>
      <Navbar />

      {/* Hero Search Section */}
      <section style={{ background: "linear-gradient(135deg, #0B7A75 0%, #085652 100%)", color: "white", padding: "2.5rem 0", marginBottom: "1.5rem" }}>
        <div className="shell" style={{ maxWidth: "960px" }}>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: "bold", margin: "0 0 1rem 0", textAlign: "center", color: "white" }}>
            🔍 搜杨林 · 一站式全站检索
          </h1>
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", width: "100%", boxSizing: "border-box" }}>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索杨林招聘、租房、同城活动、相亲嘉宾、好店商家、论坛贴子..."
              style={{
                flex: 1,
                padding: "14px 18px",
                fontSize: "16px",
                borderRadius: "10px",
                border: "none",
                outline: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            />
            <button
              type="submit"
              className="button button-primary"
              style={{
                padding: "0 28px",
                fontSize: "16px",
                fontWeight: "bold",
                borderRadius: "10px",
                background: "#f59e0b",
                borderColor: "#f59e0b",
                color: "white",
              }}
            >
              全站搜索
            </button>
          </form>

          {/* Hot Keywords Pills */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginTop: "1rem", fontSize: "13px" }}>
            <span style={{ opacity: "0.85" }}>🔥 热门搜索：</span>
            {(hotKeywords.length > 0 ? hotKeywords : ["招聘", "租房", "露营", "相亲", "干洗点", "工业园区"]).map((kw, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setKeyword(kw);
                  window.history.pushState({}, "", `/search?q=${encodeURIComponent(kw)}&type=${activeType}`);
                  fetchResults(kw, activeType, sort);
                }}
                style={{
                  background: "rgba(255,255,255,0.18)",
                  color: "white",
                  border: "none",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {kw}
              </button>
            ))}
          </div>

          {/* AI Semantic Search Banner */}
          <div style={{ marginTop: "1.25rem", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <span style={{ fontSize: "16px" }}>💡</span>
              <span>想用自然语言查找具体工作、租房、厂房或维修师傅？</span>
            </div>
            <a
              href="/assistant"
              style={{
                background: "#ffffff",
                color: "#0B7A75",
                fontWeight: "700",
                fontSize: "12px",
                padding: "4px 12px",
                borderRadius: "6px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>🤖 问问杨林生活助手</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Results Container */}
      <section className="shell" style={{ maxWidth: "1240px", paddingBottom: "4rem" }}>
        
        {/* Module Filter Pills & Sort Dropdown */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "1.5rem" }}>
          
          <div className="no-scrollbar" style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
            {Object.entries(moduleLabels).map(([typeKey, label]) => (
              <button
                key={typeKey}
                onClick={() => handleTypeChange(typeKey)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: activeType === typeKey ? "bold" : "normal",
                  background: activeType === typeKey ? "#0B7A75" : "#f1f5f9",
                  color: activeType === typeKey ? "white" : "#475569",
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
            <span style={{ color: "var(--text-muted)" }}>排序：</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border)", outline: "none" }}
            >
              <option value="relevance">🎯 相关度最高</option>
              <option value="latest">📅 最新发布</option>
            </select>
          </div>
        </div>

        {/* Query Stats */}
        {keyword && (
          <div style={{ marginBottom: "1.25rem", fontSize: "14px", color: "var(--text-muted)" }}>
            为关健字 <strong style={{ color: "#0B7A75" }}>"{keyword}"</strong> 找到 <b>{total}</b> 条结果 (用时 {durationMs} ms)
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
            🔍 正在检索全站实时数据库...
          </div>
        ) : items.length === 0 ? (
          <div style={{ background: "white", padding: "3rem 1.5rem", borderRadius: "12px", border: "1px solid var(--border)", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🔎</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 0.5rem 0", color: "#334155" }}>
              {keyword ? `未找到与 "${keyword}" 相关的全站结果` : "请输入关键词开始检索"}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
              尝试更换更通用的关键词（例如：“招聘”、“租房”、“露营”或“教师”）
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {items.map((item) => (
              <a
                key={`${item.resourceType}-${item.id}`}
                href={item.url}
                style={{
                  display: "flex",
                  gap: "1.25rem",
                  background: "white",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "transform 0.15s ease",
                }}
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{ width: "120px", height: "90px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ background: "#0B7A75", color: "white", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      📍 {item.location} · {new Date(item.publishedAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: "0 0 6px 0", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#475569", margin: 0, lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {item.summary}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <span style={{ color: "#0B7A75", fontWeight: "bold", fontSize: "14px" }}>{item.priceOrMeta}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>查看详情 →</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function SearchPage() {
  return <SearchContent />;
}
