"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ShoppingBag,
  Search,
  MapPin,
  Clock,
  ShieldCheck,
  Plus,
  Minus,
  CheckCircle2,
  ChevronDown,
  Flame,
  Sparkles,
  Truck,
  Store,
  ArrowRight,
  AlertCircle,
  X,
  Package,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface Product {
  id: string;
  name: string;
  subtitle?: string;
  brand?: string;
  unit: string;
  specification?: string;
  priceCents: number;
  originalPriceCents?: number;
  stock: number;
  salesCount: number;
  status: string;
  isFeatured: boolean;
  isHot: boolean;
  isNew: boolean;
  coverImage?: string;
  category?: { id: string; name: string };
}

interface DeliveryZone {
  id: string;
  name: string;
  feeCents: number;
  freeShippingThresholdCents: number;
  estimatedMinutes?: string;
}

export default function MallHomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"ALL" | "HOT" | "NEW">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // 分类下拉“更多”浮层
  const [moreCategoryOpen, setMoreCategoryOpen] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // 配送区域切换弹窗
  const [zoneModalOpen, setZoneModalOpen] = useState(false);

  // 轻量 Toast 提示
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 资质与说明弹窗
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [activeGuideModal, setActiveGuideModal] = useState<"DELIVERY" | "PICKUP" | "AFTERSALE" | null>(null);

  // 本地购物车状态
  const [cart, setCart] = useState<Record<string, number>>({});

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 1100);
  };

  useEffect(() => {
    // 1. 获取分类
    fetch("/api/mall/categories")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setCategories(res.data);
      })
      .catch(() => {});

    // 2. 获取配送区域
    fetch("/api/mall/zones")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setZones(res.data);
          const savedZoneId = localStorage.getItem("yl_mall_zone_id");
          const matched = res.data.find((z: DeliveryZone) => z.id === savedZoneId);
          setSelectedZone(matched || res.data[0]);
        }
      })
      .catch(() => {});

    // 读取配送模式
    const savedMethod = localStorage.getItem("yl_mall_delivery_method");
    if (savedMethod === "PICKUP" || savedMethod === "DELIVERY") {
      setDeliveryMethod(savedMethod);
    }

    // 3. 读取本地持久化购物车
    try {
      const savedCart = localStorage.getItem("yl_mall_cart");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch {}
  }, []);

  // 点击外部关闭“更多”分类下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
        setMoreCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 根据分类、搜索与筛选加载商品
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "ALL") params.set("categoryId", activeCategory);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (activeTab === "HOT") params.set("tag", "hot");
    else if (activeTab === "NEW") params.set("tag", "new");

    fetch(`/api/mall/products?${params.toString()}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setProducts(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory, activeTab, searchQuery]);

  // 修改购物车数量
  const updateCartQuantity = (productId: string, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart((prev) => {
      const next = { ...prev };
      const current = next[productId] || 0;
      const target = current + delta;
      if (target <= 0) {
        delete next[productId];
      } else {
        next[productId] = target;
      }
      try {
        localStorage.setItem("yl_mall_cart", JSON.stringify(next));
      } catch {}
      return next;
    });

    if (delta > 0) {
      showToast("已加入购物车");
    }
  };

  // 切换配送区域与方式
  const handleSelectZone = (zone: DeliveryZone) => {
    setSelectedZone(zone);
    setDeliveryMethod("DELIVERY");
    localStorage.setItem("yl_mall_zone_id", zone.id);
    localStorage.setItem("yl_mall_delivery_method", "DELIVERY");
    setZoneModalOpen(false);
    showToast(`已切换至: ${zone.name}`);
  };

  const handleSelectPickup = () => {
    setDeliveryMethod("PICKUP");
    localStorage.setItem("yl_mall_delivery_method", "PICKUP");
    setZoneModalOpen(false);
    showToast("已切换为「到店自提」模式 (免运费)");
  };

  // 计算购物车合计
  const cartSummary = useMemo(() => {
    let count = 0;
    let totalCents = 0;
    const items: { product: Product; quantity: number }[] = [];

    for (const [prodId, qty] of Object.entries(cart)) {
      const p = products.find((x) => x.id === prodId);
      if (p && qty > 0) {
        count += qty;
        totalCents += p.priceCents * qty;
        items.push({ product: p, quantity: qty });
      }
    }

    const freeThreshold = deliveryMethod === "PICKUP" ? 0 : selectedZone?.freeShippingThresholdCents || 2900;
    const isFreeShipping = deliveryMethod === "PICKUP" || totalCents >= freeThreshold;
    const diffToFree = Math.max(0, freeThreshold - totalCents);

    return { count, totalCents, items, isFreeShipping, diffToFree, freeThreshold };
  }, [cart, products, selectedZone, deliveryMethod]);

  // 分类收敛：PC 前 6 个主分类常驻，其余放入“更多”
  const PRIMARY_CATEGORY_LIMIT = 6;
  const primaryCategories = categories.slice(0, PRIMARY_CATEGORY_LIMIT);
  const moreCategories = categories.slice(PRIMARY_CATEGORY_LIMIT);
  const isMoreCategoryActive = moreCategories.some((c) => c.id === activeCategory);
  const activeMoreCategoryName = moreCategories.find((c) => c.id === activeCategory)?.name;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* 轻量全局 Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.92)",
            color: "#ffffff",
            padding: "8px 20px",
            borderRadius: "24px",
            fontSize: "13px",
            fontWeight: "700",
            zIndex: 9999,
            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            pointerEvents: "none",
            backdropFilter: "blur(6px)",
          }}
        >
          <CheckCircle2 size={16} style={{ color: "#34D399" }} />
          <span>{toast}</span>
        </div>
      )}

      {/* =========================================================================
          一、顶部 Hero 区域 (紧凑压缩 25%~30%，去除冗余宣传，专注转化)
          ========================================================================= */}
      <div
        style={{
          background: "linear-gradient(135deg, #0B7A75 0%, #075E5A 100%)",
          color: "#ffffff",
          padding: "12px 16px 14px",
          position: "relative",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {/* 左侧：品牌标题 + 模式与现货说明 */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    background: "#F97316",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: "900",
                    padding: "2px 5px",
                    borderRadius: "4px",
                    letterSpacing: "0.5px",
                  }}
                >
                  自营
                </span>
                <h1 style={{ fontSize: "18px", fontWeight: "900", margin: 0, letterSpacing: "-0.3px" }}>
                  杨林生活网自营便利店
                </h1>
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#D1FAE5",
                  background: "rgba(255,255,255,0.12)",
                  padding: "2px 8px",
                  borderRadius: "12px",
                }}
              >
                本地现货 · 支持配送 / 到店自提
              </div>
            </div>

            {/* 右侧：配送区域切换徽章 + 搜索输入框 */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 auto", justifyContent: "flex-end", maxWidth: "600px" }}>
              {/* 二、配送信息与切换按钮 */}
              <button
                type="button"
                onClick={() => setZoneModalOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "rgba(255, 255, 255, 0.18)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#ffffff",
                  padding: "5px 12px",
                  borderRadius: "18px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 0.15s",
                }}
                title="点击切换配送网格或到店自提"
              >
                {deliveryMethod === "PICKUP" ? (
                  <>
                    <Store size={13} style={{ color: "#FBBF24" }} />
                    <span>到店自提 (免运费)</span>
                  </>
                ) : (
                  <>
                    <MapPin size={13} style={{ color: "#FBBF24" }} />
                    <span>{selectedZone ? (selectedZone.name === "杨林老街" ? "杨林镇" : selectedZone.name) : "杨林大学城"}</span>
                    <span style={{ opacity: 0.85, fontSize: "11px" }}>
                      (满¥{selectedZone ? (selectedZone.freeShippingThresholdCents / 100).toFixed(0) : "29"}包邮)
                    </span>
                  </>
                )}
                <ChevronDown size={12} style={{ opacity: 0.8 }} />
              </button>

              {/* 预计送达时间 (PC 专属显示) */}
              <div
                className="desktop-only"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11.5px",
                  color: "#E2E8F0",
                  whiteSpace: "nowrap",
                }}
              >
                <Clock size={12} style={{ color: "#34D399" }} />
                <span>约 {selectedZone?.estimatedMinutes || "25-35分钟"} 达</span>
              </div>

              {/* 搜索框 */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "240px",
                  minWidth: "150px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#ffffff",
                    borderRadius: "18px",
                    padding: "3px 8px 3px 12px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  <Search size={13} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="搜索可乐、方便面、零食..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      padding: "4px 6px",
                      fontSize: "12px",
                      color: "#1F2937",
                      width: "100%",
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: "2px" }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* 我的订单入口 */}
              <Link
                href="/mall/orders"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 11px",
                  borderRadius: "18px",
                  background: "rgba(255, 255, 255, 0.18)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "700",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                }}
              >
                <Package size={13} />
                <span>我的订单</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          核心内容区
          ========================================================================= */}
      <div style={{ maxWidth: "1240px", margin: "12px auto 0", padding: "0 12px", width: "100%", flex: 1, boxSizing: "border-box" }}>
        {/* =========================================================================
            三、商品分类收敛 (PC 前6主分类常驻 + 更多下拉收纳；手机端横向顺滑滑动)
            ========================================================================= */}
        <div style={{ paddingBottom: "8px", borderBottom: "1px solid #E2E8F0" }}>
          {/* PC 桌面端分类：全部商品 + 前 6 个主分类 + 更多分类下拉 */}
          <div className="desktop-only mall-category-row">
            <button
              type="button"
              onClick={() => setActiveCategory("ALL")}
              style={{
                padding: "6px 14px",
                borderRadius: "16px",
                fontSize: "13px",
                fontWeight: activeCategory === "ALL" ? "800" : "600",
                background: activeCategory === "ALL" ? "#0B7A75" : "#ffffff",
                color: activeCategory === "ALL" ? "#ffffff" : "#475569",
                border: "1px solid",
                borderColor: activeCategory === "ALL" ? "#0B7A75" : "#E2E8F0",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              全部商品
            </button>

            {primaryCategories.map((c) => {
              const isActive = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 14px",
                    borderRadius: "16px",
                    fontSize: "13px",
                    fontWeight: isActive ? "800" : "600",
                    background: isActive ? "#0B7A75" : "#ffffff",
                    color: isActive ? "#ffffff" : "#475569",
                    border: "1px solid",
                    borderColor: isActive ? "#0B7A75" : "#E2E8F0",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  <span>{c.icon || "📦"}</span>
                  <span>{c.name}</span>
                </button>
              );
            })}

            {/* “更多分类”下拉按钮 */}
            {moreCategories.length > 0 && (
              <div ref={moreDropdownRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setMoreCategoryOpen(!moreCategoryOpen)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 14px",
                    borderRadius: "16px",
                    fontSize: "13px",
                    fontWeight: isMoreCategoryActive ? "800" : "600",
                    background: isMoreCategoryActive ? "#0B7A75" : "#ffffff",
                    color: isMoreCategoryActive ? "#ffffff" : "#475569",
                    border: "1px solid",
                    borderColor: isMoreCategoryActive ? "#0B7A75" : "#E2E8F0",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{isMoreCategoryActive ? `更多: ${activeMoreCategoryName}` : "更多"}</span>
                  <ChevronDown size={13} style={{ transform: moreCategoryOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </button>

                {moreCategoryOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      background: "#ffffff",
                      borderRadius: "10px",
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                      padding: "6px",
                      zIndex: 40,
                      minWidth: "150px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    {moreCategories.map((mc) => {
                      const isSelected = activeCategory === mc.id;
                      return (
                        <button
                          key={mc.id}
                          onClick={() => {
                            setActiveCategory(mc.id);
                            setMoreCategoryOpen(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "none",
                            background: isSelected ? "#F0FDFA" : "transparent",
                            color: isSelected ? "#0B7A75" : "#334155",
                            fontWeight: isSelected ? "800" : "500",
                            fontSize: "13px",
                            textAlign: "left",
                            cursor: "pointer",
                            width: "100%",
                          }}
                        >
                          <span>{mc.icon || "📦"}</span>
                          <span>{mc.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 手机移动端分类：单行横滑 */}
          <div className="mobile-only mall-category-mobile-scroll">
            <button
              type="button"
              onClick={() => setActiveCategory("ALL")}
              style={{
                padding: "5px 12px",
                borderRadius: "14px",
                fontSize: "12px",
                fontWeight: activeCategory === "ALL" ? "800" : "600",
                background: activeCategory === "ALL" ? "#0B7A75" : "#ffffff",
                color: activeCategory === "ALL" ? "#ffffff" : "#475569",
                border: "1px solid",
                borderColor: activeCategory === "ALL" ? "#0B7A75" : "#E2E8F0",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              全部商品
            </button>

            {categories.map((c) => {
              const isActive = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "5px 12px",
                    borderRadius: "14px",
                    fontSize: "12px",
                    fontWeight: isActive ? "800" : "600",
                    background: isActive ? "#0B7A75" : "#ffffff",
                    color: isActive ? "#ffffff" : "#475569",
                    border: "1px solid",
                    borderColor: isActive ? "#0B7A75" : "#E2E8F0",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  <span>{c.icon || "📦"}</span>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            八 & 九、商品 Tab 切换与现货数量统计 (强化选中态，间距规范)
            ========================================================================= */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "10px 0 12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setActiveTab("ALL")}
              style={{
                background: activeTab === "ALL" ? "#F0FDFA" : "transparent",
                border: "none",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "13.5px",
                fontWeight: activeTab === "ALL" ? "800" : "600",
                color: activeTab === "ALL" ? "#0B7A75" : "#64748B",
                cursor: "pointer",
                borderBottom: activeTab === "ALL" ? "2.5px solid #0B7A75" : "2.5px solid transparent",
                transition: "all 0.15s",
              }}
            >
              全部在售
            </button>

            <button
              onClick={() => setActiveTab("HOT")}
              style={{
                background: activeTab === "HOT" ? "#FEF2F2" : "transparent",
                border: "none",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "13.5px",
                fontWeight: activeTab === "HOT" ? "800" : "600",
                color: activeTab === "HOT" ? "#EF4444" : "#64748B",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                borderBottom: activeTab === "HOT" ? "2.5px solid #EF4444" : "2.5px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <Flame size={14} style={{ color: "#EF4444" }} />
              <span>热销爆款</span>
            </button>

            <button
              onClick={() => setActiveTab("NEW")}
              style={{
                background: activeTab === "NEW" ? "#EFF6FF" : "transparent",
                border: "none",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "13.5px",
                fontWeight: activeTab === "NEW" ? "800" : "600",
                color: activeTab === "NEW" ? "#2563EB" : "#64748B",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                borderBottom: activeTab === "NEW" ? "2.5px solid #2563EB" : "2.5px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <Sparkles size={13} style={{ color: "#2563EB" }} />
              <span>新品上架</span>
            </button>
          </div>

          {/* 九、实时现货数量统计 */}
          <div style={{ fontSize: "12px", color: "#64748B" }}>
            共 <strong style={{ color: "#0B7A75", fontWeight: "800" }}>{products.length}</strong> 件现货商品
          </div>
        </div>

        {/* =========================================================================
            四、五、六、七、十四、二十：统一商品卡网格 (使用专有 mall-product-grid 保证全视口高度对齐)
            ========================================================================= */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>
            正在加载自营便利店现货数据...
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "48px 24px",
              textAlign: "center",
              border: "1px solid #E2E8F0",
              margin: "20px 0",
            }}
          >
            <ShoppingBag size={42} style={{ color: "#CBD5E1", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#334155", margin: 0 }}>暂无匹配的在售商品</h3>
            <p style={{ fontSize: "12.5px", color: "#94A3B8", margin: "6px 0 16px" }}>请尝试更换搜索关键词或选择其它分类</p>
            <button
              onClick={() => {
                setActiveCategory("ALL");
                setActiveTab("ALL");
                setSearchQuery("");
              }}
              style={{
                background: "#0B7A75",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 16px",
                fontSize: "12.5px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              查看全部商品
            </button>
          </div>
        ) : (
          <div className="mall-product-grid">
            {products.map((p) => {
              const qtyInCart = cart[p.id] || 0;
              const isSoldOut = p.status === "SOLD_OUT" || p.stock <= 0;
              const isLowStock = !isSoldOut && p.stock <= 5;

              return (
                <div
                  key={p.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #E2E8F0",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    position: "relative",
                  }}
                >
                  {/* 五、商品图片：统一 1:1 正方形比例、统一浅灰底色、避免高度不齐 */}
                  <Link href={`/mall/${p.id}`} style={{ textDecoration: "none", position: "relative", display: "block" }}>
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        position: "relative",
                        background: "#F8FAFC",
                        overflow: "hidden",
                      }}
                    >
                      {p.coverImage ? (
                        <img
                          src={p.coverImage}
                          alt={p.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#CBD5E1",
                          }}
                        >
                          <ShoppingBag size={36} />
                        </div>
                      )}

                      {/* 四、自营标签缩小，优雅不突兀 */}
                      <div
                        style={{
                          position: "absolute",
                          top: "6px",
                          left: "6px",
                          background: "rgba(249, 115, 22, 0.92)",
                          color: "#ffffff",
                          fontSize: "10px",
                          fontWeight: "800",
                          padding: "1px 5px",
                          borderRadius: "3px",
                          backdropFilter: "blur(2px)",
                          zIndex: 2,
                        }}
                      >
                        自营
                      </div>

                      {/* 十四、售罄遮罩 */}
                      {isSoldOut && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0, 0, 0, 0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            fontWeight: "800",
                            fontSize: "13px",
                            zIndex: 3,
                          }}
                        >
                          已售罄
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* 四、信息详情区 (标题最多2行，规格一行，保证卡片高度一致) */}
                  <div
                    style={{
                      padding: "8px 10px 10px",
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    {/* 商品名：固定最多 2 行 */}
                    <Link
                      href={`/mall/${p.id}`}
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#1E293B",
                        textDecoration: "none",
                        lineHeight: 1.35,
                        height: "36px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        marginBottom: "3px",
                      }}
                      title={p.name}
                    >
                      {p.name}
                    </Link>

                    {/* 规格与库存预警：固定单行 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        height: "18px",
                        lineHeight: "18px",
                        marginBottom: "4px",
                        overflow: "hidden",
                      }}
                    >
                      {p.specification ? (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#94A3B8",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {p.specification}
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#CBD5E1" }}>标准装</span>
                      )}

                      {/* 十四、库存告急提示 */}
                      {isLowStock && (
                        <span
                          style={{
                            color: "#EF4444",
                            background: "#FEF2F2",
                            fontSize: "10px",
                            padding: "0 4px",
                            borderRadius: "3px",
                            fontWeight: "700",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          仅剩{p.stock}件
                        </span>
                      )}
                    </div>

                    {/* 七、底部价格与加购按钮：绝对水平对齐 */}
                    <div
                      style={{
                        marginTop: "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "4px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", columnGap: "3px" }}>
                        <span style={{ fontSize: "11px", color: "#EF4444", fontWeight: "800" }}>¥</span>
                        <span style={{ fontSize: "16px", color: "#EF4444", fontWeight: "900", letterSpacing: "-0.5px" }}>
                          {(p.priceCents / 100).toFixed(2)}
                        </span>
                        {p.originalPriceCents && p.originalPriceCents > p.priceCents && (
                          <span style={{ fontSize: "10.5px", color: "#94A3B8", textDecoration: "line-through" }}>
                            ¥{(p.originalPriceCents / 100).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* 六、加购按钮 */}
                      {isSoldOut ? (
                        <button
                          disabled
                          style={{
                            background: "#F1F5F9",
                            color: "#94A3B8",
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "3px 8px",
                            borderRadius: "14px",
                            border: "none",
                            cursor: "not-allowed",
                          }}
                        >
                          已售罄
                        </button>
                      ) : qtyInCart > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <button
                            type="button"
                            onClick={(e) => updateCartQuantity(p.id, -1, e)}
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              border: "1px solid #CBD5E1",
                              background: "#ffffff",
                              color: "#475569",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            <Minus size={11} />
                          </button>
                          <span style={{ fontSize: "12px", fontWeight: "800", minWidth: "14px", textAlign: "center" }}>
                            {qtyInCart}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => updateCartQuantity(p.id, 1, e)}
                            disabled={qtyInCart >= p.stock}
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              border: "none",
                              background: qtyInCart >= p.stock ? "#E2E8F0" : "#0B7A75",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: qtyInCart >= p.stock ? "not-allowed" : "pointer",
                              padding: 0,
                            }}
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* PC端显示 "+ 加入" */}
                          <button
                            type="button"
                            className="desktop-only"
                            onClick={(e) => updateCartQuantity(p.id, 1, e)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                              background: "#0B7A75",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "14px",
                              padding: "4px 9px",
                              fontSize: "11.5px",
                              fontWeight: "700",
                              cursor: "pointer",
                              transition: "background 0.1s",
                            }}
                          >
                            <Plus size={12} />
                            <span>加入</span>
                          </button>

                          {/* 手机端显示 "+" 圆钮 */}
                          <button
                            type="button"
                            className="mobile-only"
                            onClick={(e) => updateCartQuantity(p.id, 1, e)}
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: "#0B7A75",
                              color: "#ffffff",
                              border: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              boxShadow: "0 2px 5px rgba(11,122,117,0.3)",
                              padding: 0,
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================================
            十五、商品列表结束区 (避免突兀大段空白)
            ========================================================================= */}
        {!loading && products.length > 0 && (
          <div style={{ textAlign: "center", padding: "20px 0 12px", color: "#94A3B8", fontSize: "12px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "36px", height: "1px", background: "#E2E8F0" }} />
              <span>没有更多商品了 · 商品持续补货更新中</span>
              <span style={{ width: "36px", height: "1px", background: "#E2E8F0" }} />
            </div>
          </div>
        )}

        {/* =========================================================================
            十七、配送与售后说明 (三个轻入口)
            ========================================================================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "10px",
            margin: "12px 0 10px",
          }}
        >
          <div
            onClick={() => setActiveGuideModal("DELIVERY")}
            style={{
              background: "#ffffff",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#F0FDFA", display: "flex", alignItems: "center", justifyContent: "center", color: "#0B7A75", flexShrink: 0 }}>
              <Truck size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#334155" }}>🛵 配送说明</div>
              <div style={{ fontSize: "11px", color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                杨林大学城/经开区最快30分钟送达
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveGuideModal("PICKUP")}
            style={{
              background: "#ffffff",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", color: "#D97706", flexShrink: 0 }}>
              <Store size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#334155" }}>🏬 自提说明</div>
              <div style={{ fontSize: "11px", color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                支持在线下单，到店凭码即提 · 免运费
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveGuideModal("AFTERSALE")}
            style={{
              background: "#ffffff",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", flexShrink: 0 }}>
              <ShieldCheck size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#334155" }}>🛡️ 售后规则</div>
              <div style={{ fontSize: "11px", color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                坏果/破损现货即时退换 · 实体执照保障
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            十六、资质说明区 (视觉大幅弱化，中性灰底，不抢商品本身风头；缩短与Footer距离)
            ========================================================================= */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "11.5px",
            color: "#64748B",
            lineHeight: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            margin: "0 0 12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={14} style={{ color: "#0B7A75", flexShrink: 0 }} />
            <span>杨林生活网自营便利店 · 营业资质与食品相关许可/备案合规公示</span>
            <span style={{ color: "#94A3B8" }}>（全网严禁销售香烟及烟草制品）</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/mall/license"
              style={{
                color: "#0B7A75",
                fontSize: "11.5px",
                fontWeight: "700",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              <span>查看经营资质</span>
              <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          十、十一、十二：购物车入口与结算条强化 (空购物车仅小图标；有商品显示结算条)
          ========================================================================= */}
      {cartSummary.count === 0 ? (
        /* 十二、空购物车时：轻量小入口 */
        <Link
          href="/mall/cart"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "20px",
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "#0F172A",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
            zIndex: 40,
            textDecoration: "none",
          }}
          title="查看购物车"
        >
          <ShoppingBag size={20} />
        </Link>
      ) : (
        <>
          {/* 十、PC 端悬浮购物车条 (右下角精致胶囊) */}
          <div
            className="desktop-only"
            style={{
              position: "fixed",
              bottom: "20px",
              right: "24px",
              background: "#0F172A",
              color: "#ffffff",
              borderRadius: "28px",
              padding: "6px 8px 6px 16px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              zIndex: 50,
              border: "1px solid #334155",
            }}
          >
            <Link
              href="/mall/cart"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                color: "#ffffff",
              }}
            >
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#0B7A75",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShoppingBag size={18} />
                </div>
                <span
                  style={{
                    position: "absolute",
                    top: "-3px",
                    right: "-3px",
                    background: "#EF4444",
                    color: "#ffffff",
                    fontSize: "10.5px",
                    fontWeight: "900",
                    padding: "0 5px",
                    borderRadius: "10px",
                    border: "1.5px solid #0F172A",
                  }}
                >
                  {cartSummary.count}
                </span>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#E2E8F0" }}>{cartSummary.count}件商品</span>
                  <span style={{ fontSize: "16px", fontWeight: "900", color: "#FBBF24" }}>
                    ¥{(cartSummary.totalCents / 100).toFixed(2)}
                  </span>
                </div>
                <div style={{ fontSize: "10.5px", color: "#94A3B8" }}>
                  {deliveryMethod === "PICKUP" ? (
                    <span style={{ color: "#34D399" }}>🏬 门店自提免运费</span>
                  ) : cartSummary.isFreeShipping ? (
                    <span style={{ color: "#34D399" }}>🎉 已免基础运费</span>
                  ) : (
                    <span>还差 ¥{(cartSummary.diffToFree / 100).toFixed(2)} 包邮</span>
                  )}
                </div>
              </div>
            </Link>

            <Link
              href="/mall/checkout"
              style={{
                background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                color: "#ffffff",
                fontWeight: "900",
                fontSize: "13.5px",
                padding: "8px 18px",
                borderRadius: "20px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: "0 2px 8px rgba(249, 115, 22, 0.4)",
              }}
            >
              <span>去结算</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* 十一、手机版固定底部购物车条 (兼容 safe-area-inset-bottom 与微信端手势条) */}
          <div
            className="mobile-only"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "#0F172A",
              color: "#ffffff",
              borderTop: "1px solid #334155",
              padding: "8px 12px calc(8px + env(safe-area-inset-bottom, 10px))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              zIndex: 50,
              boxShadow: "0 -4px 16px rgba(0,0,0,0.2)",
            }}
          >
            <Link
              href="/mall/cart"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                color: "#ffffff",
              }}
            >
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: "#0B7A75",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShoppingBag size={18} />
                </div>
                <span
                  style={{
                    position: "absolute",
                    top: "-3px",
                    right: "-3px",
                    background: "#EF4444",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: "900",
                    padding: "0 5px",
                    borderRadius: "10px",
                    border: "1.5px solid #0F172A",
                  }}
                >
                  {cartSummary.count}
                </span>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#E2E8F0" }}>{cartSummary.count}件</span>
                  <span style={{ fontSize: "16px", fontWeight: "900", color: "#FBBF24" }}>
                    ¥{(cartSummary.totalCents / 100).toFixed(2)}
                  </span>
                </div>
                <div style={{ fontSize: "10px", color: "#94A3B8" }}>
                  {deliveryMethod === "PICKUP" ? (
                    <span style={{ color: "#34D399" }}>到店自提免运费</span>
                  ) : cartSummary.isFreeShipping ? (
                    <span style={{ color: "#34D399" }}>已免配送费</span>
                  ) : (
                    <span>差¥{(cartSummary.diffToFree / 100).toFixed(1)}免运费</span>
                  )}
                </div>
              </div>
            </Link>

            <Link
              href="/mall/checkout"
              style={{
                background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                color: "#ffffff",
                fontWeight: "900",
                fontSize: "13px",
                padding: "8px 18px",
                borderRadius: "18px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <span>去结算</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </>
      )}

      {/* =========================================================================
          二、配送区域与自提切换弹窗 (Switcher Modal)
          ========================================================================= */}
      {zoneModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setZoneModalOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "460px",
              padding: "20px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={20} style={{ color: "#0B7A75" }} />
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1E293B", margin: 0 }}>
                  选择履约模式与配送区域
                </h3>
              </div>
              <button
                onClick={() => setZoneModalOpen(false)}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {/* 到店自提项 */}
              <div
                onClick={handleSelectPickup}
                style={{
                  border: "1.5px solid",
                  borderColor: deliveryMethod === "PICKUP" ? "#0B7A75" : "#E2E8F0",
                  background: deliveryMethod === "PICKUP" ? "#F0FDFA" : "#ffffff",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Store size={20} style={{ color: "#F59E0B" }} />
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "800", color: "#1E293B" }}>
                      🏬 到店自提 (免配送费)
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748B" }}>
                      凭订单6位自提码随时到店核销取货 · 营业时间 08:30-22:30
                    </div>
                  </div>
                </div>
                {deliveryMethod === "PICKUP" && (
                  <CheckCircle2 size={18} style={{ color: "#0B7A75", flexShrink: 0 }} />
                )}
              </div>

              {/* 各配送网格 */}
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748B", margin: "6px 0 2px" }}>
                🛵 自营专人本地配送范围:
              </div>

              {zones.map((z) => {
                const isSelected = deliveryMethod === "DELIVERY" && selectedZone?.id === z.id;
                return (
                  <div
                    key={z.id}
                    onClick={() => handleSelectZone(z)}
                    style={{
                      border: "1.5px solid",
                      borderColor: isSelected ? "#0B7A75" : "#E2E8F0",
                      background: isSelected ? "#F0FDFA" : "#ffffff",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "800", color: "#1E293B" }}>
                          {z.name === "杨林老街" ? "杨林镇 (老街)" : z.name}
                        </span>
                        <span style={{ background: "#ECFDF5", color: "#059669", fontSize: "11px", fontWeight: "700", padding: "1px 5px", borderRadius: "3px" }}>
                          满¥{(z.freeShippingThresholdCents / 100).toFixed(0)}包邮
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                        基础运费 ¥{(z.feeCents / 100).toFixed(0)} · 最快约 {z.estimatedMinutes || "30分钟"} 送达
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 size={18} style={{ color: "#0B7A75", flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>

            {/* 超出范围明确提示 */}
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FEE2E2",
                borderRadius: "8px",
                padding: "10px 12px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                fontSize: "12px",
                color: "#991B1B",
                lineHeight: 1.4,
              }}
            >
              <AlertCircle size={15} style={{ color: "#EF4444", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>超范围提示：</strong>
                如果您的收货地址超出上述 4 大配送区域，专人无法直接送达，建议您在上方直接选择<strong>「到店自提」</strong>模式下单，全天候凭提货码取件。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          经营资质详情弹窗
          ========================================================================= */}
      {licenseModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setLicenseModalOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "500px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={22} style={{ color: "#0B7A75" }} />
                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#1E293B", margin: 0 }}>
                  实体便利店营业资质与合规公示
                </h3>
              </div>
              <button
                onClick={() => setLicenseModalOpen(false)}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: "13px", color: "#334155", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div><strong>运营主体：</strong>杨林生活网自营便利店</div>
                <div><strong>营业执照类型：</strong>实体个体工商户/企业营业执照（已核验入库）</div>
                <div><strong>经营许可范围：</strong>预包装食品销售、散装食品销售、日用百货零售、文体办公用品</div>
                <div><strong>实体仓储地址：</strong>云南省昆明市嵩明县杨林职教园区/杨林镇中心商业区</div>
                <div><strong>官方服务专线：</strong>138-8800-1001</div>
              </div>

              <div style={{ background: "#FEF2F2", padding: "10px 12px", borderRadius: "8px", border: "1px solid #FEE2E2", color: "#991B1B", fontSize: "12.5px" }}>
                <strong>【国家烟草专卖合规红线声明】</strong><br />
                根据《中华人民共和国烟草专卖法》及相关规定，杨林生活网自营便利店全平台<strong>严禁网络销售香烟、雪茄、电子烟及一切烟草制品</strong>，禁止在线结算与派送。
              </div>

              <div style={{ textAlign: "right", marginTop: "8px" }}>
                <button
                  onClick={() => setLicenseModalOpen(false)}
                  style={{
                    background: "#0B7A75",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 20px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  已阅读并了解
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          配送/自提/售后规则详情弹窗
          ========================================================================= */}
      {activeGuideModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setActiveGuideModal(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "460px",
              padding: "20px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1E293B", margin: 0 }}>
                {activeGuideModal === "DELIVERY" && "🛵 专人直配服务说明"}
                {activeGuideModal === "PICKUP" && "🏬 门店自提服务说明"}
                {activeGuideModal === "AFTERSALE" && "🛡️ 自营售后保障规则"}
              </h3>
              <button
                onClick={() => setActiveGuideModal(null)}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: "8px" }}>
              {activeGuideModal === "DELIVERY" && (
                <>
                  <p>1. <strong>配送范围：</strong>覆盖杨林大学城、经开区智能制造园、杨林老街及周边主要社区。</p>
                  <p>2. <strong>满额包邮：</strong>大学城满¥29包邮，经开区满¥39包邮，老街满¥20包邮。</p>
                  <p>3. <strong>时效承诺：</strong>店内专人接单后立即配货，本地配送员直发，最快约25-35分钟送达。</p>
                </>
              )}

              {activeGuideModal === "PICKUP" && (
                <>
                  <p>1. <strong>自提流程：</strong>在线下单结算 $ightarrow$ 订单详情生成 6 位纯数字自提码 $ightarrow$ 前往店内出示自提码直接提货。</p>
                  <p>2. <strong>自提营业时间：</strong>每天 08:30 至 22:30。</p>
                  <p>3. <strong>免收运费：</strong>选择自提免收任何基础配送费。</p>
                </>
              )}

              {activeGuideModal === "AFTERSALE" && (
                <>
                  <p>1. <strong>官方直保：</strong>所有商品均为官方自营本地现货，统一由杨林生活网提供售后保障。</p>
                  <p>2. <strong>少件破损快速退款：</strong>收货时如发现包装破损或少件漏发，进入「订单详情 $ightarrow$ 申请售后」上传照片，店内核实后原路退款。</p>
                  <p>3. <strong>保质期保证：</strong>食品类商品严控临期，确保新鲜现货。</p>
                </>
              )}

              <div style={{ textAlign: "right", marginTop: "12px" }}>
                <button
                  onClick={() => setActiveGuideModal(null)}
                  style={{
                    background: "#0B7A75",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 16px",
                    fontSize: "12.5px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
