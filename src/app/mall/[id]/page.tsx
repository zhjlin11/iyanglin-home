"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Store,
  CheckCircle2,
  Plus,
  Minus,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/mall/products/${id}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setProduct(res.data);
          setRelated(res.related || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = () => {
    if (!product) return;
    try {
      const saved = localStorage.getItem("yl_mall_cart");
      const cart = saved ? JSON.parse(saved) : {};
      cart[product.id] = (cart[product.id] || 0) + quantity;
      localStorage.setItem("yl_mall_cart", JSON.stringify(cart));
      setToast(`已成功将 ${quantity} 件商品加入购物车！`);
      setTimeout(() => setToast(""), 2500);
    } catch {}
  };

  const buyNow = () => {
    addToCart();
    router.push("/mall/checkout");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "80px 0", color: "#94A3B8" }}>正在加载商品详情...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
        <Navbar />
        <div style={{ maxWidth: "600px", margin: "60px auto", textAlign: "center", padding: "0 16px" }}>
          <h2>未找到商品或已下架</h2>
          <Link href="/mall" style={{ color: "#0B7A75", fontWeight: "700" }}>
            返回自营便利店首页
          </Link>
        </div>
      </div>
    );
  }

  const isSoldOut = product.status === "SOLD_OUT" || product.stock <= 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: "60px" }}>
      <Navbar />

      {/* 面包屑导航 */}
      <div style={{ maxWidth: "1000px", margin: "16px auto", padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#64748B" }}>
          <Link href="/mall" style={{ color: "#64748B", textDecoration: "none" }}>自营便利店</Link>
          <ChevronRight size={12} />
          <span>{product.category?.name || "现货商品"}</span>
          <ChevronRight size={12} />
          <span style={{ color: "#1E293B", fontWeight: "600" }}>{product.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 16px" }}>
        {/* 核心详情卡片 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            padding: "24px",
          }}
        >
          {/* 左侧商品图 */}
          <div style={{ borderRadius: "12px", overflow: "hidden", background: "#F1F5F9", position: "relative" }}>
            <img
              src={product.coverImage || "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80"}
              alt={product.name}
              style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                background: "#F97316",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: "900",
                padding: "3px 8px",
                borderRadius: "4px",
              }}
            >
              🟧 杨林生活网自营
            </div>
            {isSoldOut && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0, 0, 0, 0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "20px",
                  fontWeight: "900",
                }}
              >
                已售罄
              </div>
            )}
          </div>

          {/* 右侧信息与购买控制 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1 style={{ fontSize: "20px", fontWeight: "900", color: "#0F172A", margin: "0 0 6px" }}>
              {product.name}
            </h1>

            {product.subtitle && (
              <p style={{ fontSize: "13.5px", color: "#64748B", margin: "0 0 12px" }}>
                {product.subtitle}
              </p>
            )}

            {/* 价格区域 */}
            <div
              style={{
                background: "#FEF2F2",
                padding: "12px 16px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "14px", color: "#EF4444", fontWeight: "700" }}>¥</span>
              <span style={{ fontSize: "26px", color: "#EF4444", fontWeight: "900" }}>
                {(product.priceCents / 100).toFixed(2)}
              </span>
              {product.originalPriceCents && (
                <span style={{ fontSize: "13px", color: "#94A3B8", textDecoration: "line-through" }}>
                  划线价: ¥{(product.originalPriceCents / 100).toFixed(2)}
                </span>
              )}
            </div>

            {/* 属性列表 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px", color: "#475569", marginBottom: "16px" }}>
              <div>品牌：<strong>{product.brand || "精选直供"}</strong></div>
              <div>规格：<strong>{product.specification || "标准规格"}</strong></div>
              <div>计价单位：<strong>{product.unit || "件"}</strong></div>
              <div>真实库存：<strong>{product.stock} 件</strong></div>
              <div>累计销量：<strong>{product.salesCount} 件</strong></div>
              <div>条形码：<strong>{product.barcode || "-"}</strong></div>
            </div>

            {/* 自营保障标牌 */}
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "12px",
                color: "#475569",
                lineHeight: 1.5,
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", color: "#0B7A75", marginBottom: "4px" }}>
                <ShieldCheck size={15} />
                <span>杨林生活网自营便利店 · 官方直售保障</span>
              </div>
              <div>• 本地现货仓库直发，支持到店自提与同城即时配送</div>
              <div>• 统一微信收款，质量问题7天无理由退换，破损包赔</div>
            </div>

            {/* 数量调整与按钮 */}
            {!isSoldOut && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#334155" }}>选购数量:</span>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #CBD5E1", borderRadius: "6px", overflow: "hidden" }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ width: "32px", height: "32px", border: "none", background: "#F1F5F9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Minus size={13} />
                  </button>
                  <span style={{ width: "40px", textAlign: "center", fontWeight: "700", fontSize: "14px" }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    style={{ width: "32px", height: "32px", border: "none", background: "#F1F5F9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>(限购 {product.stock} 件)</span>
              </div>
            )}

            {toast && (
              <div style={{ background: "#ECFDF5", color: "#059669", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>
                {toast}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
              {isSoldOut ? (
                <button
                  disabled
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#E2E8F0",
                    color: "#94A3B8",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "800",
                    fontSize: "15px",
                    cursor: "not-allowed",
                  }}
                >
                  已售罄 · 补货中
                </button>
              ) : (
                <>
                  <button
                    onClick={addToCart}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "#E6F4F3",
                      color: "#0B7A75",
                      border: "1px solid #0B7A75",
                      borderRadius: "8px",
                      fontWeight: "800",
                      fontSize: "15px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <ShoppingBag size={17} />
                    <span>加入购物车</span>
                  </button>
                  <button
                    onClick={buyNow}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "800",
                      fontSize: "15px",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
                    }}
                  >
                    立即购买
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
