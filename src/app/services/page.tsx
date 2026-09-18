"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Wrench,
  Laptop,
  Sparkles,
  Truck,
  Hammer,
  Dog,
  GraduationCap,
  Briefcase,
  Search,
  ShieldCheck,
  Clock,
  Coins,
  Scale,
  Star,
  ChevronRight,
  CheckCircle2,
  Package,
} from "lucide-react";

const CATEGORIES = [
  { key: "ALL", label: "全部服务", icon: Sparkles },
  { key: "家电维修", label: "家电维修", icon: Wrench },
  { key: "电脑维修", label: "电脑数码", icon: Laptop },
  { key: "家政保洁", label: "保洁家政", icon: Sparkles },
  { key: "搬家运输", label: "同城搬家", icon: Truck },
  { key: "上门安装", label: "上门安装", icon: Hammer },
  { key: "宠物基础服务", label: "宠物服务", icon: Dog },
  { key: "技能培训体验课", label: "培训体验", icon: GraduationCap },
  { key: "企业简单服务", label: "企业服务", icon: Briefcase },
];

export default function ServicesMallPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("recommended");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (sort) params.set("sort", sort);

      const res = await fetch(`/api/services/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
      }
    } catch (err) {
      console.error("fetch products error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Hero Banner with Guarantee Highlights */}
      <section
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #0f766e 60%, #115e59 100%)",
          color: "#ffffff",
          padding: "36px 16px 28px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, marginBottom: "10px" }}>
                <ShieldCheck size={16} color="#34d399" />
                <span>杨林生活网 · 官方交易担保体系</span>
              </div>
              <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.5px", margin: "0 0 8px 0" }}>
                标准化便民服务选购商城
              </h1>
              <p style={{ fontSize: "0.95rem", color: "#ccfbf1", margin: 0, maxWidth: "600px", lineHeight: "1.5" }}>
                明码标价无隐性加价 · 平台资金托管履约 · 完工核验满意后放款 · 官方客服争议仲裁
              </p>
            </div>

            {/* Quick links to My Orders */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href="/orders"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#ffffff",
                  color: "#0f766e",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  padding: "10px 18px",
                  borderRadius: "24px",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                }}
              >
                <Package size={16} />
                <span>我的服务订单</span>
                <ChevronRight size={14} />
              </Link>
              <Link
                href="/provider/center"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "rgba(255,255,255,0.18)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  padding: "10px 16px",
                  borderRadius: "24px",
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                <span>师傅商家工作台</span>
              </Link>
            </div>
          </div>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            style={{
              marginTop: "24px",
              display: "flex",
              maxWidth: "680px",
              backgroundColor: "#ffffff",
              borderRadius: "32px",
              padding: "4px 6px 4px 18px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            <Search size={20} color="#0f766e" style={{ alignSelf: "center", marginRight: "10px" }} />
            <input
              type="text"
              placeholder="搜服务：如 空调清洗、重装系统、水管维修、搬家..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "0.95rem",
                color: "#1e293b",
                padding: "8px 0",
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: "#0f766e",
                color: "#ffffff",
                border: "none",
                borderRadius: "24px",
                padding: "8px 20px",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              搜索
            </button>
          </form>

          {/* Trust Guarantees Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={18} color="#fde047" />
              <span style={{ fontSize: "0.85rem", color: "#f0fdf4" }}>平台担保：完工核验满意再付款</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Coins size={18} color="#fde047" />
              <span style={{ fontSize: "0.85rem", color: "#f0fdf4" }}>透明收费：标准标价无隐性加价</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color="#fde047" />
              <span style={{ fontSize: "0.85rem", color: "#f0fdf4" }}>准时到达：超时赔付与履约追踪</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Scale size={18} color="#fde047" />
              <span style={{ fontSize: "0.85rem", color: "#f0fdf4" }}>纠纷仲裁：官方客服全流程调解</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div style={{ maxWidth: "1200px", width: "100%", margin: "0 auto", padding: "20px 16px", flex: 1 }}>
        {/* Category Pills */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "8px",
            marginBottom: "16px",
            scrollbarWidth: "none",
          }}
        >
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const isSelected = selectedCategory === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedCategory(c.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: isSelected ? "1.5px solid #0f766e" : "1px solid #e2e8f0",
                  backgroundColor: isSelected ? "#0f766e" : "#ffffff",
                  color: isSelected ? "#ffffff" : "#475569",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 2px 8px rgba(15,118,110,0.25)" : "none",
                }}
              >
                <Icon size={14} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter / Sort bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            fontSize: "0.85rem",
            color: "#64748b",
          }}
        >
          <div>
            已为您筛选出 <strong style={{ color: "#0f766e" }}>{products.length}</strong> 项标准化服务
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>排序：</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontSize: "0.85rem",
                outline: "none",
              }}
            >
              <option value="recommended">综合推荐</option>
              <option value="sales">销量最高</option>
              <option value="price_asc">价格从低到高</option>
              <option value="price_desc">价格从高到低</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>⏳</div>
            <div>正在加载标准化服务...</div>
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px dashed #cbd5e1",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔍</div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>
              暂未找到符合条件的服务商品
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px 0" }}>
              您可以更换搜索词，或前往需求大厅发布您的定制化服务需求
            </p>
            <Link
              href="/info/request/new"
              style={{
                display: "inline-block",
                backgroundColor: "#0f766e",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.85rem",
                padding: "8px 20px",
                borderRadius: "20px",
                textDecoration: "none",
              }}
            >
              ⚡ 免费发布个性化需求
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
              gap: "20px",
            }}
          >
            {products.map((item) => {
              const coverImg =
                item.coverImage ||
                (item.images && item.images.length > 0
                  ? item.images[0]
                  : "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80");
              const priceNum = item.priceCents ?? item.price ?? 0;
              const subText = item.subtitle || item.description || "";

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Image container */}
                  <Link href={`/services/${item.id}`} style={{ position: "relative", display: "block", aspectRatio: "16/10", overflow: "hidden", backgroundColor: "#f1f5f9" }}>
                    <img
                      src={coverImg}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        backgroundColor: "rgba(15, 118, 110, 0.9)",
                        color: "#ffffff",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {item.category}
                    </span>
                  </Link>

                  {/* Body Content */}
                  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <Link
                      href={`/services/${item.id}`}
                      style={{
                        textDecoration: "none",
                        color: "#0f172a",
                        fontSize: "1rem",
                        fontWeight: 700,
                        lineHeight: 1.4,
                        marginBottom: "6px",
                      }}
                    >
                      {item.title}
                    </Link>

                    {subText && (
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#64748b",
                          lineHeight: 1.4,
                          marginBottom: "10px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {subText}
                      </div>
                    )}

                    {/* Provider Info */}
                    {item.provider && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", fontSize: "0.75rem", color: "#64748b" }}>
                        <span style={{ fontWeight: 600, color: "#334155" }}>{item.provider.name}</span>
                        {item.provider.verificationType && (
                          <span style={{ color: "#16a34a", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                            <CheckCircle2 size={12} />
                            认证
                          </span>
                        )}
                        <span style={{ marginLeft: "auto", color: "#d97706", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                          <Star size={12} fill="#d97706" color="#d97706" />
                          {item.provider.ratingAvg > 0 ? item.provider.ratingAvg.toFixed(1) : "5.0"}
                        </span>
                      </div>
                    )}

                    {/* Price and CTA */}
                    <div
                      style={{
                        marginTop: "auto",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "10px",
                        borderTop: "1px solid #f1f5f9",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 700 }}>¥</span>
                        <span style={{ fontSize: "1.35rem", color: "#ef4444", fontWeight: 900, marginRight: "4px" }}>
                          {(priceNum / 100).toFixed(0)}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>/ {item.unit || "次"}</span>
                      </div>

                      <Link
                        href={`/services/${item.id}`}
                        style={{
                          backgroundColor: "#0f766e",
                          color: "#ffffff",
                          padding: "6px 14px",
                          borderRadius: "18px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>预订服务</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
