"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface ShowcaseCategory {
  id: string;
  name: string;
  icon?: string | null;
}

export interface ShowcaseProduct {
  id: string;
  name: string;
  subtitle?: string | null;
  specification?: string | null;
  unit: string;
  priceCents: number;
  originalPriceCents?: number | null;
  stock: number;
  lowStockThreshold: number;
  coverImage?: string | null;
  images: string[];
  isFeatured: boolean;
  isHot: boolean;
  isNew: boolean;
  isSelfOperated: boolean;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    icon?: string | null;
  } | null;
}

export interface ShowcaseDeliveryZone {
  id: string;
  name: string;
  feeCents: number;
  estimatedMinutes?: string | null;
  freeShippingThresholdCents: number;
}

interface HomeMallShowcaseProps {
  products: ShowcaseProduct[];
  categories?: ShowcaseCategory[];
  deliveryZones?: ShowcaseDeliveryZone[];
}

// 默认占位图，防止坏链
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80";

export default function HomeMallShowcase({
  products = [],
  categories = [],
  deliveryZones = [],
}: HomeMallShowcaseProps) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [selectedZone, setSelectedZone] = useState<ShowcaseDeliveryZone | null>(null);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // 初始化配送区域
  useEffect(() => {
    try {
      const savedZoneId = localStorage.getItem("yl_mall_zone_id");
      if (savedZoneId && deliveryZones.length > 0) {
        const matched = deliveryZones.find((z) => z.id === savedZoneId);
        if (matched) setSelectedZone(matched);
      } else if (deliveryZones.length > 0) {
        const defaultZone =
          deliveryZones.find((z) => z.name.includes("大学城")) || deliveryZones[0];
        setSelectedZone(defaultZone);
      }
    } catch {}
  }, [deliveryZones]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2200);
  };

  // 选择配送片区
  const handleSelectZone = (zone: ShowcaseDeliveryZone) => {
    setSelectedZone(zone);
    try {
      localStorage.setItem("yl_mall_zone_id", zone.id);
      localStorage.setItem("yl_mall_delivery_method", "DELIVERY");
    } catch {}
    setShowZoneModal(false);
    showToast(`已切换配送区域至：${zone.name}`);
  };

  // 加入购物车（与 /mall 共用 yl_mall_cart）
  const handleAddToCart = (product: ShowcaseProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) {
      showToast("该商品已售罄");
      return;
    }

    try {
      const saved = localStorage.getItem("yl_mall_cart");
      const cart = saved ? JSON.parse(saved) : {};
      const currentQty = cart[product.id] || 0;
      cart[product.id] = currentQty + 1;
      localStorage.setItem("yl_mall_cart", JSON.stringify(cart));

      // 派发全局事件同步全站角标
      window.dispatchEvent(
        new CustomEvent("cart-updated", { detail: { cart, addedId: product.id } })
      );

      showToast(`已加入购物车：${product.name.slice(0, 10)}…`);
    } catch {
      showToast("加购失败，请稍后重试");
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  // 提取短卖点（最多8~12字）
  const getSellingPoint = (p: ShowcaseProduct) => {
    if (p.subtitle && p.subtitle.trim().length > 0) {
      const cleaned = p.subtitle.trim();
      const firstSegment = cleaned.split(/[,， ·\s]/)[0];
      if (firstSegment && firstSegment.length >= 3) {
        return firstSegment.slice(0, 12);
      }
      return cleaned.slice(0, 12);
    }
    const catName = p.category?.name || "";
    if (catName.includes("饮料")) return "冰爽解渴 · 经典畅饮";
    if (catName.includes("零食")) return "美味解馋 · 宿舍必备";
    if (catName.includes("速食")) return "夜宵加餐 · 快速饱腹";
    if (catName.includes("牛奶")) return "优质蛋白 · 醇厚口感";
    if (catName.includes("百货")) return "亲肤实用 · 居家常备";
    if (catName.includes("文具")) return "顺滑书写 · 考试办公";
    if (catName.includes("特产")) return "非遗古法 · 地道杨林";
    return "本地现货 · 闪电送达";
  };

  // 动态属性标签
  const getSecondBadge = (p: ShowcaseProduct, isMain = false) => {
    if (isMain || p.isFeatured) {
      return { text: "爆款", bg: "linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)", color: "#FFFFFF" };
    }
    if (p.isHot) {
      return { text: "热销", bg: "#DC2626", color: "#FFFFFF" };
    }
    if (p.isNew) {
      return { text: "新品", bg: "#2563EB", color: "#FFFFFF" };
    }
    return { text: "精选", bg: "#7C3AED", color: "#FFFFFF" };
  };

  // 根据当前选中分类过滤商品
  const displayProducts = useMemo(() => {
    if (selectedCategoryId === "ALL") {
      return products;
    }
    return products.filter(
      (p) => p.category?.id === selectedCategoryId || p.categoryId === selectedCategoryId
    );
  }, [products, selectedCategoryId]);

  // 左侧 2 款主推爆款卡，右侧 4 款精选普通卡 (2x2 网格)
  const mainProduct1 = displayProducts[0] || null;
  const mainProduct2 = displayProducts[1] || null;
  const subProducts = displayProducts.slice(2, 6);

  return (
    <div style={{ width: "100%" }}>
      {/* ═══════════════ 1. 楼层头部（强品牌与电商楼层感） ═══════════════ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          paddingBottom: "16px",
          borderBottom: "1px solid #F1F5F9",
        }}
      >
        {/* 左侧：楼层标杆与副说明 */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div
            style={{
              width: "4px",
              height: "22px",
              background: "linear-gradient(180deg, #FF6B00 0%, #EA580C 100%)",
              borderRadius: "2px",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "22px" }}>🛍️</span>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "900",
                color: "#0F172A",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              杨林生活网自营便利店
            </h2>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontSize: "11px",
              fontWeight: "700",
              color: "#D97706",
              background: "#FEF3C7",
              padding: "3px 8px",
              borderRadius: "6px",
              border: "1px solid #FDE68A",
            }}
          >
            本地现货 · 闪电送达
          </span>
          <span style={{ fontSize: "12px", color: "#64748B", marginLeft: "2px" }}>
            本地现货 · 支持配送 / 到店自提 / 统一售后
          </span>
        </div>

        {/* 右侧：进入自营商城楼层入口按钮 */}
        <div>
          <Link
            href="/mall"
            prefetch={false}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13.5px",
              fontWeight: "700",
              color: "#2563EB",
              textDecoration: "none",
              background: "#EFF6FF",
              padding: "8px 18px",
              borderRadius: "20px",
              border: "1px solid #BFDBFE",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#DBEAFE";
              e.currentTarget.style.transform = "translateX(2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#EFF6FF";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <span>进入自营商城</span>
            <span style={{ fontSize: "15px", fontWeight: "900" }}>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* ═══════════════ 2. 配送与服务信息条 ═══════════════ */}
      <div
        style={{
          background: "#F8FAFC",
          border: "1px solid #F1F5F9",
          borderRadius: "10px",
          padding: "9px 16px",
          margin: "14px 0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          fontSize: "12px",
          color: "#475569",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            onClick={() => setShowZoneModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              color: "#334155",
            }}
          >
            <span style={{ color: "#EA580C" }}>📍</span>
            <span>
              当前配送：
              <strong style={{ color: "#0F172A", fontWeight: "700" }}>
                {selectedZone?.name || "杨林大学城"}
              </strong>
            </span>
            <span style={{ color: "#64748B" }}>
              · 约{selectedZone?.estimatedMinutes || "25-35分钟"}送达
            </span>
            <span
              style={{
                color: "#2563EB",
                fontWeight: "700",
                marginLeft: "2px",
                textDecoration: "underline",
              }}
            >
              [切换]
            </span>
          </div>

          <span style={{ color: "#CBD5E1" }}>|</span>
          <span>🚚 支持即时配送 · 到店自提</span>
          <span style={{ color: "#CBD5E1" }}>|</span>
          <span>⚡ 现货直发 · 闪电履约</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669", fontWeight: "600" }}>
          <span>🛡️</span>
          <span>100% 正品自营保障</span>
        </div>
      </div>

      {/* ═══════════════ 3. 分类快捷入口（圆角胶囊导航） ═══════════════ */}
      <div
        className="yl-no-scrollbar"
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "14px",
          marginBottom: "16px",
          borderBottom: "1px dashed #E2E8F0",
        }}
      >
        {/* 全部精选胶囊 */}
        <button
          onClick={() => setSelectedCategoryId("ALL")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "12.5px",
            fontWeight: selectedCategoryId === "ALL" ? "700" : "600",
            cursor: "pointer",
            border: selectedCategoryId === "ALL" ? "1px solid #EA580C" : "1px solid #E2E8F0",
            background: selectedCategoryId === "ALL" ? "#EA580C" : "#F8FAFC",
            color: selectedCategoryId === "ALL" ? "#FFFFFF" : "#475569",
            boxShadow:
              selectedCategoryId === "ALL" ? "0 2px 8px rgba(234, 88, 12, 0.25)" : "none",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <span>🔥</span>
          <span>全部精选</span>
        </button>

        {/* 动态分类胶囊 */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12.5px",
                fontWeight: isSelected ? "700" : "600",
                cursor: "pointer",
                border: isSelected ? "1px solid #EA580C" : "1px solid #E2E8F0",
                background: isSelected ? "#EA580C" : "#F8FAFC",
                color: isSelected ? "#FFFFFF" : "#475569",
                boxShadow: isSelected ? "0 2px 8px rgba(234, 88, 12, 0.25)" : "none",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <span>{cat.icon || "📦"}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════ 4. 精选商品展示区（左侧 2 款爆款推荐 + 右侧 4 款精选网格） ═══════════════ */}
      {!mainProduct1 ? (
        /* 空状态 */
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#64748B",
          }}
        >
          <div style={{ fontSize: "42px", marginBottom: "12px" }}>🏪</div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#1E293B" }}>
            该分类商品正在加速补货中
          </div>
          <p style={{ fontSize: "13px", marginTop: "6px", color: "#94A3B8" }}>
            杨林本地冷链、新鲜零食与百货正在上新，去自营商城看看其他好物吧
          </p>
          <Link
            href="/mall"
            prefetch={false}
            style={{
              display: "inline-block",
              marginTop: "16px",
              background: "#EA580C",
              color: "#fff",
              padding: "8px 20px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
            进入自营商城选购
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            gap: "14px",
            alignItems: "stretch",
            flexWrap: "wrap",
          }}
        >
          {/* ────────────────── 左侧：2 款主推爆款商品卡 ────────────────── */}
          <div
            style={{
              flex: "0 0 320px",
              maxWidth: "320px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* ─── 爆款商品 1 (TOP 1) ─── */}
            <div
              onClick={() => router.push(`/mall/${mainProduct1.id}`)}
              style={{
                flex: 1,
                background: "#FFFFFF",
                border: "1px solid #FED7AA",
                borderRadius: "12px",
                boxShadow: "0 2px 10px rgba(234, 88, 12, 0.06)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: "pointer",
                overflow: "hidden",
                transition: "all 0.22s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.borderColor = "#FB923C";
                e.currentTarget.style.boxShadow = "0 10px 22px rgba(234, 88, 12, 0.14)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#FED7AA";
                e.currentTarget.style.boxShadow = "0 2px 10px rgba(234, 88, 12, 0.06)";
              }}
            >
              {/* 顶部主推标识栏 */}
              <div
                style={{
                  background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #FED7AA",
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#C2410C" }}>
                  👑 今日爆款推荐 · TOP 1
                </span>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#EA580C" }}>
                  超值热卖 ›
                </span>
              </div>

              <div style={{ padding: "12px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                {/* 商品实拍图 */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    paddingTop: "68%",
                    background: "#F8FAFC",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={
                      mainProduct1.coverImage ||
                      (mainProduct1.images && mainProduct1.images[0]) ||
                      FALLBACK_IMG
                    }
                    alt={mainProduct1.name}
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {/* 双标签 */}
                  <div
                    style={{
                      position: "absolute",
                      top: "6px",
                      left: "6px",
                      display: "flex",
                      gap: "4px",
                      zIndex: 2,
                    }}
                  >
                    <span
                      style={{
                        background: "#EA580C",
                        color: "#fff",
                        fontSize: "10px",
                        fontWeight: "800",
                        padding: "1px 5px",
                        borderRadius: "3px",
                      }}
                    >
                      自营
                    </span>
                    <span
                      style={{
                        background: "linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)",
                        color: "#FFFFFF",
                        fontSize: "10px",
                        fontWeight: "800",
                        padding: "1px 5px",
                        borderRadius: "3px",
                      }}
                    >
                      爆款
                    </span>
                  </div>

                  {mainProduct1.stock <= 0 && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: "13px",
                        zIndex: 3,
                      }}
                    >
                      已售罄
                    </div>
                  )}
                </div>

                {/* 标题 */}
                <h3
                  style={{
                    fontSize: "13.5px",
                    fontWeight: "800",
                    color: "#0F172A",
                    lineHeight: "1.35",
                    margin: "9px 0 3px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    height: "36px",
                  }}
                >
                  {mainProduct1.name}
                </h3>

                {/* 规格与卖点 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#64748B",
                    marginBottom: "8px",
                  }}
                >
                  <span>{mainProduct1.specification || mainProduct1.unit || "件"}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#DC2626",
                      background: "#FEF2F2",
                      padding: "1px 6px",
                      borderRadius: "3px",
                      border: "1px solid #FEE2E2",
                    }}
                  >
                    🔥 {getSellingPoint(mainProduct1)}
                  </span>
                </div>

                {/* 价格与加购 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "auto",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#DC2626" }}>¥</span>
                    <span style={{ fontSize: "20px", fontWeight: "900", color: "#DC2626" }}>
                      {formatPrice(mainProduct1.priceCents)}
                    </span>
                    {mainProduct1.originalPriceCents &&
                      mainProduct1.originalPriceCents > mainProduct1.priceCents && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#94A3B8",
                            textDecoration: "line-through",
                            marginLeft: "2px",
                          }}
                        >
                          ¥{formatPrice(mainProduct1.originalPriceCents)}
                        </span>
                      )}
                  </div>

                  {/* 加购按钮 */}
                  <button
                    onClick={(e) => handleAddToCart(mainProduct1, e)}
                    disabled={mainProduct1.stock <= 0}
                    style={{
                      background:
                        mainProduct1.stock <= 0
                          ? "#E2E8F0"
                          : "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                      color: mainProduct1.stock <= 0 ? "#94A3B8" : "#FFFFFF",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: mainProduct1.stock <= 0 ? "not-allowed" : "pointer",
                      boxShadow:
                        mainProduct1.stock <= 0 ? "none" : "0 2px 6px rgba(234, 88, 12, 0.25)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      transition: "all 0.15s ease",
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
                    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <span>🛒</span>
                    <span>{mainProduct1.stock <= 0 ? "售罄" : "加入"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ─── 爆款商品 2 (TOP 2) ─── */}
            {mainProduct2 ? (
              <div
                onClick={() => router.push(`/mall/${mainProduct2.id}`)}
                style={{
                  flex: 1,
                  background: "#FFFFFF",
                  border: "1px solid #FED7AA",
                  borderRadius: "12px",
                  boxShadow: "0 2px 10px rgba(234, 88, 12, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  overflow: "hidden",
                  transition: "all 0.22s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.borderColor = "#FB923C";
                  e.currentTarget.style.boxShadow = "0 10px 22px rgba(234, 88, 12, 0.14)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "#FED7AA";
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(234, 88, 12, 0.06)";
                }}
              >
                {/* 顶部主推标识栏 */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #FED7AA",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#C2410C" }}>
                    🔥 今日爆款推荐 · TOP 2
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#EA580C" }}>
                    人气热推 ›
                  </span>
                </div>

                <div style={{ padding: "12px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                  {/* 商品实拍图 */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingTop: "68%",
                      background: "#F8FAFC",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={
                        mainProduct2.coverImage ||
                        (mainProduct2.images && mainProduct2.images[0]) ||
                        FALLBACK_IMG
                      }
                      alt={mainProduct2.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {/* 双标签 */}
                    <div
                      style={{
                        position: "absolute",
                        top: "6px",
                        left: "6px",
                        display: "flex",
                        gap: "4px",
                        zIndex: 2,
                      }}
                    >
                      <span
                        style={{
                          background: "#EA580C",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: "800",
                          padding: "1px 5px",
                          borderRadius: "3px",
                        }}
                      >
                        自营
                      </span>
                      <span
                        style={{
                          background: "linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)",
                          color: "#FFFFFF",
                          fontSize: "10px",
                          fontWeight: "800",
                          padding: "1px 5px",
                          borderRadius: "3px",
                        }}
                      >
                        热卖
                      </span>
                    </div>

                    {mainProduct2.stock <= 0 && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(15, 23, 42, 0.45)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: "13px",
                          zIndex: 3,
                        }}
                      >
                        已售罄
                      </div>
                    )}
                  </div>

                  {/* 标题 */}
                  <h3
                    style={{
                      fontSize: "13.5px",
                      fontWeight: "800",
                      color: "#0F172A",
                      lineHeight: "1.35",
                      margin: "9px 0 3px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      height: "36px",
                    }}
                  >
                    {mainProduct2.name}
                  </h3>

                  {/* 规格与卖点 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      color: "#64748B",
                      marginBottom: "8px",
                    }}
                  >
                    <span>{mainProduct2.specification || mainProduct2.unit || "件"}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#DC2626",
                        background: "#FEF2F2",
                        padding: "1px 6px",
                        borderRadius: "3px",
                        border: "1px solid #FEE2E2",
                      }}
                    >
                      🔥 {getSellingPoint(mainProduct2)}
                    </span>
                  </div>

                  {/* 价格与加购 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "auto",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#DC2626" }}>¥</span>
                      <span style={{ fontSize: "20px", fontWeight: "900", color: "#DC2626" }}>
                        {formatPrice(mainProduct2.priceCents)}
                      </span>
                      {mainProduct2.originalPriceCents &&
                        mainProduct2.originalPriceCents > mainProduct2.priceCents && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#94A3B8",
                              textDecoration: "line-through",
                              marginLeft: "2px",
                            }}
                          >
                            ¥{formatPrice(mainProduct2.originalPriceCents)}
                          </span>
                        )}
                    </div>

                    {/* 加购按钮 */}
                    <button
                      onClick={(e) => handleAddToCart(mainProduct2, e)}
                      disabled={mainProduct2.stock <= 0}
                      style={{
                        background:
                          mainProduct2.stock <= 0
                            ? "#E2E8F0"
                            : "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                        color: mainProduct2.stock <= 0 ? "#94A3B8" : "#FFFFFF",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: mainProduct2.stock <= 0 ? "not-allowed" : "pointer",
                        boxShadow:
                          mainProduct2.stock <= 0 ? "none" : "0 2px 6px rgba(234, 88, 12, 0.25)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
                      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <span>🛒</span>
                      <span>{mainProduct2.stock <= 0 ? "售罄" : "加入"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* 只有一个商品时的友好占位 */
              <div
                onClick={() => router.push("/mall")}
                style={{
                  flex: 1,
                  background: "#F8FAFC",
                  border: "1px dashed #CBD5E1",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px",
                  cursor: "pointer",
                  textAlign: "center",
                  color: "#64748B",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#EA580C";
                  e.currentTarget.style.background = "#FFF7ED";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#CBD5E1";
                  e.currentTarget.style.background = "#F8FAFC";
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>📦</div>
                <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#1E293B" }}>更多爆款上新中</div>
                <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "4px" }}>去自营商城逛逛更多现货 ›</div>
              </div>
            )}
          </div>

          {/* ────────────────── 右侧：4 张精选普通商品卡 (2x2 网格) ────────────────── */}
          <div
            style={{
              flex: "1 1 500px",
              minWidth: "300px",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "14px",
            }}
          >
            {subProducts.map((p) => {
              const img =
                p.coverImage ||
                (p.images && p.images[0]) ||
                FALLBACK_IMG;
              const isSoldOut = p.stock <= 0;
              const badge = getSecondBadge(p, false);
              const sellingPoint = getSellingPoint(p);

              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/mall/${p.id}`)}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #F1F5F9",
                    borderRadius: "12px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.borderColor = "#CBD5E1";
                    e.currentTarget.style.boxShadow = "0 8px 18px rgba(15, 23, 42, 0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "#F1F5F9";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                  }}
                >
                  {/* 商品图片 1:1 / 68% */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingTop: "68%",
                      background: "#F8FAFC",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={img}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />

                    {/* 双标签 */}
                    <div
                      style={{
                        position: "absolute",
                        top: "6px",
                        left: "6px",
                        display: "flex",
                        gap: "4px",
                        zIndex: 2,
                      }}
                    >
                      <span
                        style={{
                          background: "#EA580C",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: "800",
                          padding: "1px 5px",
                          borderRadius: "3px",
                        }}
                      >
                        自营
                      </span>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          fontSize: "10px",
                          fontWeight: "800",
                          padding: "1px 5px",
                          borderRadius: "3px",
                        }}
                      >
                        {badge.text}
                      </span>
                    </div>

                    {isSoldOut && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(15, 23, 42, 0.45)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: "13px",
                          zIndex: 3,
                        }}
                      >
                        已售罄
                      </div>
                    )}
                  </div>

                  {/* 标题 */}
                  <h4
                    style={{
                      fontSize: "13.5px",
                      fontWeight: "700",
                      color: "#1E293B",
                      lineHeight: "1.35",
                      margin: "9px 0 3px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      height: "36px",
                    }}
                  >
                    {p.name}
                  </h4>

                  {/* 规格与卖点 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      color: "#64748B",
                      marginBottom: "8px",
                    }}
                  >
                    <span>{p.specification || p.unit || "件"}</span>
                    <span style={{ color: "#EA580C", fontWeight: "600" }}>{sellingPoint}</span>
                  </div>

                  {/* 价格与加购按钮 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "auto",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#DC2626" }}>
                        ¥
                      </span>
                      <span style={{ fontSize: "19px", fontWeight: "900", color: "#DC2626" }}>
                        {formatPrice(p.priceCents)}
                      </span>
                      {p.originalPriceCents && p.originalPriceCents > p.priceCents && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#94A3B8",
                            textDecoration: "line-through",
                            marginLeft: "2px",
                          }}
                        >
                          ¥{formatPrice(p.originalPriceCents)}
                        </span>
                      )}
                    </div>

                    {/* 电商加购胶囊按钮 */}
                    <button
                      onClick={(e) => handleAddToCart(p, e)}
                      disabled={isSoldOut}
                      style={{
                        background: isSoldOut
                          ? "#E2E8F0"
                          : "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                        color: isSoldOut ? "#94A3B8" : "#FFFFFF",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: isSoldOut ? "not-allowed" : "pointer",
                        boxShadow: isSoldOut
                          ? "none"
                          : "0 2px 6px rgba(234, 88, 12, 0.25)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
                      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <span>+</span>
                      <span>加入</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════ 5. 底部导流入口 ═══════════════ */}
      <div
        style={{
          marginTop: "20px",
          paddingTop: "14px",
          borderTop: "1px solid #F1F5F9",
          textAlign: "center",
        }}
      >
        <Link
          href="/mall"
          prefetch={false}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            maxWidth: "600px",
            padding: "11px 20px",
            borderRadius: "10px",
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            color: "#334155",
            fontSize: "13px",
            fontWeight: "700",
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#FFF7ED";
            e.currentTarget.style.borderColor = "#FDBA74";
            e.currentTarget.style.color = "#EA580C";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#F8FAFC";
            e.currentTarget.style.borderColor = "#E2E8F0";
            e.currentTarget.style.color = "#334155";
          }}
        >
          <span>查看更多自营生鲜、零食、百货商品（共 {products.length} 款热销现货）</span>
          <span style={{ fontSize: "14px", fontWeight: "900" }}>&rarr;</span>
        </Link>
      </div>

      {/* ═══════════════ 配送区域切换弹窗 ═══════════════ */}
      {showZoneModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => setShowZoneModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "460px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>📍</span>
                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                  选择当前配送区域
                </h3>
              </div>
              <button
                onClick={() => setShowZoneModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: "12.5px", color: "#64748B", margin: "0 0 16px" }}>
              选择您所在的片区，自营便利店将就近调配本地仓储，极速闪电履约送达。
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {deliveryZones.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                return (
                  <div
                    key={zone.id}
                    onClick={() => handleSelectZone(zone)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: isSelected ? "2px solid #EA580C" : "1px solid #E2E8F0",
                      background: isSelected ? "#FFF7ED" : "#FFFFFF",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "700",
                          color: isSelected ? "#C2410C" : "#0F172A",
                        }}
                      >
                        {zone.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                        预计 {zone.estimatedMinutes || "30-45分钟"} 送达 · 配送费 ¥
                        {(zone.feeCents / 100).toFixed(2)} (满 ¥
                        {(zone.freeShippingThresholdCents / 100).toFixed(0)} 包邮)
                      </div>
                    </div>
                    {isSelected && (
                      <span
                        style={{
                          color: "#EA580C",
                          fontWeight: "800",
                          fontSize: "18px",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ Toast 提示 ═══════════════ */}
      {toastVisible && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.92)",
            backdropFilter: "blur(8px)",
            color: "#ffffff",
            padding: "10px 22px",
            borderRadius: "30px",
            fontSize: "13px",
            fontWeight: "600",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <span>🛒</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
