"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Store,
  ChevronRight,
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [calculation, setCalculation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 加载本地购物车数据
  useEffect(() => {
    try {
      const saved = localStorage.getItem("yl_mall_cart");
      if (saved) {
        setCart(JSON.parse(saved));
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  // 向服务端请求实时验价验库存
  const syncCartWithServer = async (cartData: Record<string, number>) => {
    const items = Object.entries(cartData)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      setCalculation(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/mall/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, deliveryMethod: "DELIVERY" }),
      });
      const data = await res.json();
      if (data.success) {
        setCalculation(data.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncCartWithServer(cart);
  }, [cart]);

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const current = next[productId] || 0;
      const target = current + delta;
      if (target <= 0) delete next[productId];
      else next[productId] = target;
      try {
        localStorage.setItem("yl_mall_cart", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const removeItem = (productId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      try {
        localStorage.setItem("yl_mall_cart", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearCart = () => {
    setCart({});
    localStorage.removeItem("yl_mall_cart");
    setCalculation(null);
  };

  const items = calculation?.items || [];
  const hasItems = items.length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: "80px" }}>
      <Navbar />

      <div style={{ maxWidth: "900px", margin: "16px auto", padding: "0 16px" }}>
        {/* 面包屑 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#64748B", marginBottom: "16px" }}>
          <Link href="/mall" style={{ color: "#64748B", textDecoration: "none" }}>自营便利店</Link>
          <ChevronRight size={12} />
          <span style={{ color: "#1E293B", fontWeight: "600" }}>购物车</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "900", color: "#0F172A", margin: 0 }}>
            我的便利店购物车
          </h1>
          {hasItems && (
            <button
              onClick={clearCart}
              style={{
                background: "none",
                border: "none",
                color: "#94A3B8",
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Trash2 size={13} />
              <span>清空购物车</span>
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>
            正在核验购物车最新价格与库存...
          </div>
        ) : !hasItems ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              padding: "60px 24px",
              textAlign: "center",
            }}
          >
            <ShoppingBag size={54} style={{ color: "#CBD5E1", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#334155", margin: "0 0 6px" }}>
              购物车还是空的，去挑点商品吧
            </h3>
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: "0 0 20px" }}>
              饮料、零食、方便面、日用百货，本地现货极速送达
            </p>
            <Link
              href="/mall"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#0B7A75",
                color: "#ffffff",
                padding: "9px 22px",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              <span>去逛逛便利店</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
            {/* 包邮门槛提示条 */}
            <div
              style={{
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: "10px",
                padding: "10px 16px",
                fontSize: "13px",
                color: "#1E40AF",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Truck size={16} style={{ color: "#2563EB", flexShrink: 0 }} />
              <div>
                {calculation?.freeShippingApplied ? (
                  <span>
                    已达到 <strong>满¥{(calculation.freeShippingThresholdCents / 100).toFixed(0)}包邮</strong> 条件，本次配送免基础运费！
                  </span>
                ) : (
                  <span>
                    当前商品总额 ¥{(calculation.goodsTotalCents / 100).toFixed(2)}，还差{" "}
                    <strong style={{ color: "#DC2626" }}>
                      ¥{(calculation.amountNeededForFreeShippingCents / 100).toFixed(2)}
                    </strong>{" "}
                    即可享受满减包邮（自提全免运费）。
                  </span>
                )}
              </div>
            </div>

            {/* 商品明细卡片列表 */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #E2E8F0",
                overflow: "hidden",
              }}
            >
              {items.map((item: any) => {
                return (
                  <div
                    key={item.productId}
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid #F1F5F9",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "8px",
                        background: "#F1F5F9",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {item.productCover ? (
                        <img
                          src={item.productCover}
                          alt={item.productName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
                          <ShoppingBag size={24} />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#1E293B", marginBottom: "2px" }}>
                        {item.productName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>
                        {item.specification || "标准规格"} · 现货库存 {item.stock} 件
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                        <span style={{ fontSize: "12px", color: "#EF4444", fontWeight: "700" }}>¥</span>
                        <span style={{ fontSize: "16px", color: "#EF4444", fontWeight: "900" }}>
                          {(item.priceCents / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* 加减控件与删除 */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid #CBD5E1", borderRadius: "6px" }}>
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          style={{ width: "26px", height: "26px", border: "none", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ width: "32px", textAlign: "center", fontWeight: "700", fontSize: "13px" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          disabled={item.quantity >= item.stock}
                          style={{ width: "26px", height: "26px", border: "none", background: item.quantity >= item.stock ? "#E2E8F0" : "#F8FAFC", cursor: item.quantity >= item.stock ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId)}
                        style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 结算汇总统筹 */}
              <div style={{ padding: "16px", background: "#F8FAFC" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", color: "#475569", marginBottom: "6px" }}>
                  <span>商品小计</span>
                  <span>¥{(calculation.goodsTotalCents / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", color: "#475569", marginBottom: "6px" }}>
                  <span>配送费预估</span>
                  <span>{calculation.deliveryFeeCents === 0 ? "免费 (包邮/自提)" : `¥${(calculation.deliveryFeeCents / 100).toFixed(2)}`}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "16px",
                    fontWeight: "900",
                    color: "#0F172A",
                    paddingTop: "8px",
                    borderTop: "1px dashed #CBD5E1",
                  }}
                >
                  <span>预估应付</span>
                  <span style={{ color: "#EF4444", fontSize: "20px" }}>
                    ¥{(calculation.payAmountCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* 去结算主操作区 */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <Link
                href="/mall"
                style={{
                  padding: "11px 20px",
                  background: "#ffffff",
                  color: "#475569",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "700",
                  textDecoration: "none",
                }}
              >
                继续选购
              </Link>
              <Link
                href="/mall/checkout"
                style={{
                  padding: "11px 28px",
                  background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                  color: "#ffffff",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "900",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(249, 115, 22, 0.35)",
                }}
              >
                <span>前往结算</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
