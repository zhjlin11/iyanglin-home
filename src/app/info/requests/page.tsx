"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const CATEGORIES = [
  "全部",
  "家电维修",
  "管道疏通",
  "开锁换锁",
  "家政保洁",
  "房屋修缮",
  "搬家拉货",
  "数码电脑",
  "便民跑腿",
  "其它便民",
];

const AREAS = ["全城", "杨林大学城", "杨林经开区", "杨林老城区", "职教园区", "嘉丽泽"];

const STATUS_FILTERS = [
  { key: "ALL", label: "全部需求" },
  { key: "MATCHED", label: "匹配中/待接单" },
  { key: "IN_PROGRESS", label: "施工服务中" },
  { key: "COMPLETED", label: "已顺利完工" },
];

export default function RequestsHallPage() {
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedArea, setSelectedArea] = useState("全城");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "全部") params.set("category", selectedCategory);
      if (selectedArea !== "全城") params.set("area", selectedArea);
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/info/requests?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items);
        setTotal(data.data.total);
      }
    } catch (e) {
      console.error("fetchRequests error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [selectedCategory, selectedArea, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_MATCH":
        return <span style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>🔍 匹配中</span>;
      case "MATCHED":
        return <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>⚡ 师傅已响应</span>;
      case "IN_PROGRESS":
        return <span style={{ backgroundColor: "#f0fdf4", color: "#166534", padding: "3px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>🛠️ 上门施工中</span>;
      case "COMPLETED":
        return <span style={{ backgroundColor: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>✓ 已完工</span>;
      case "CANCELLED":
        return <span style={{ backgroundColor: "#f8fafc", color: "#94a3b8", padding: "3px 8px", borderRadius: "6px", fontSize: "0.75rem" }}>已取消</span>;
      default:
        return null;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    if (urgency === "URGENT") {
      return <span style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>加急</span>;
    }
    return null;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", paddingBottom: "80px" }}>
      {/* 顶部主横幅 */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
          color: "#ffffff",
          padding: "24px 16px",
        }}
      >
        <div style={{ maxWidth: "1024px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <Link
              href="/info"
              style={{ color: "#93c5fd", textDecoration: "none", fontSize: "0.85rem" }}
            >
              ‹ 返回便民信息大厅
            </Link>
            <div style={{ display: "flex", gap: "10px" }}>
              <Link
                href="/provider/center"
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  backdropFilter: "blur(4px)",
                }}
              >
                🛠️ 师傅接单中心
              </Link>
              <Link
                href="/info/request/new"
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  backgroundColor: "#f59e0b",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              >
                + 发布我的需求
              </Link>
            </div>
          </div>

          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 6px 0" }}>
            杨林本地服务需求大厅
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#bfdbfe", margin: 0 }}>
            居民需求即时发布 · 本地靠谱师傅急速匹配响应 · 真实履约可信评价
          </p>

          {/* 实时统计 KPI */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              marginTop: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              padding: "12px 16px",
              backdropFilter: "blur(6px)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "#bfdbfe" }}>累计需求单量</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>{total + 18} 单</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#bfdbfe" }}>入驻认证师傅</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>46 位</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#bfdbfe" }}>平均响应速度</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fef08a" }}>&lt; 15分钟</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1024px", margin: "16px auto", padding: "0 16px" }}>
        {/* 筛选与搜索 */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid #e2e8f0",
            marginBottom: "16px",
          }}
        >
          {/* 搜索框 */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索需求：如 水龙头漏水、空调清洗、通马桶、搬家..."
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "0.9rem",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "8px 18px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              搜索
            </button>
          </form>

          {/* 分类标签横滑 */}
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "6px" }}>分类筛选：</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "6px",
                    border: selectedCategory === cat ? "1px solid #2563eb" : "1px solid #e2e8f0",
                    backgroundColor: selectedCategory === cat ? "#eff6ff" : "#ffffff",
                    color: selectedCategory === cat ? "#1d4ed8" : "#475569",
                    fontWeight: selectedCategory === cat ? 600 : 400,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 片区筛选 */}
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "6px" }}>区域片区：</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {AREAS.map((a) => (
                <button
                  key={a}
                  onClick={() => setSelectedArea(a)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: selectedArea === a ? "1px solid #2563eb" : "1px solid #e2e8f0",
                    backgroundColor: selectedArea === a ? "#eff6ff" : "#ffffff",
                    color: selectedArea === a ? "#1d4ed8" : "#64748b",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* 状态筛选 */}
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "6px" }}>履约状态：</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSelectedStatus(s.key)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: selectedStatus === s.key ? "1px solid #0f172a" : "1px solid #e2e8f0",
                    backgroundColor: selectedStatus === s.key ? "#0f172a" : "#ffffff",
                    color: selectedStatus === s.key ? "#ffffff" : "#64748b",
                    fontSize: "0.8rem",
                    fontWeight: selectedStatus === s.key ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 需求列表卡片流 */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>正在载入本地需求...</div>
        ) : items.length === 0 ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "40px 20px",
              textAlign: "center",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔍</div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
              暂未找到符合条件的需求
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "6px 0 20px 0" }}>
              您可以立即发布找师傅需求，杨林本地靠谱师傅将主动联系您！
            </p>
            <Link
              href="/info/request/new"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              + 免费发布生活服务需求
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/info/requests/${item.id}`}
                style={{
                  display: "block",
                  textDecoration: "none",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "16px",
                  border: "1px solid #e2e8f0",
                  transition: "box-shadow 0.15s, transform 0.15s",
                }}
              >
                {/* 顶部标签行 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        backgroundColor: "#eff6ff",
                        color: "#1d4ed8",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {item.category}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>📍 {item.area}</span>
                    {getUrgencyBadge(item.urgency)}
                  </div>
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                {/* 标题 */}
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: "0 0 8px 0",
                    lineHeight: 1.4,
                  }}
                >
                  {item.title}
                </h3>

                {/* 描述摘要 */}
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#475569",
                    margin: "0 0 12px 0",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.description}
                </p>

                {/* 底部信息与动作 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px dashed #f1f5f9",
                    paddingTop: "10px",
                    fontSize: "0.8rem",
                    color: "#64748b",
                  }}
                >
                  <div>
                    <span>⏰ 期望时间：<strong style={{ color: "#334155" }}>{item.preferredTime}</strong></span>
                    {item.budgetMin || item.budgetMax ? (
                      <span style={{ marginLeft: "12px", color: "#d97706", fontWeight: 600 }}>
                        预算 ¥{(item.budgetMin || 0) / 100} - ¥{(item.budgetMax || 0) / 100}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#2563eb", fontWeight: 600 }}>
                      查看详情 / 师傅接单 ›
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 手机端吸底快捷发布按钮 */}
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 40,
        }}
      >
        <Link
          href="/info/request/new"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "9999px",
            textDecoration: "none",
            fontSize: "0.95rem",
            fontWeight: 700,
            boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.4)",
          }}
        >
          ⚡ 发布找师傅需求
        </Link>
      </div>
    </div>
  );
}
