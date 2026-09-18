"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  PhoneCall,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const STATUS_TABS = [
  { key: "ALL", label: "全部" },
  { key: "PENDING_PAYMENT", label: "待付款" },
  { key: "PAID", label: "待接单" },
  { key: "IN_PROGRESS", label: "履约中" },
  { key: "COMPLETED", label: "待验收" },
  { key: "CONFIRMED", label: "已完工" },
  { key: "REFUND", label: "退款/售后" },
];

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/service-orders");
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
      }
    } catch (err) {
      console.error("fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PENDING_PAYMENT") return o.status === "PENDING_PAYMENT";
    if (activeTab === "PAID") return o.status === "PAID";
    if (activeTab === "IN_PROGRESS") return ["ACCEPTED", "IN_SERVICE"].includes(o.status);
    if (activeTab === "COMPLETED") return o.status === "COMPLETED";
    if (activeTab === "CONFIRMED") return o.status === "CONFIRMED";
    if (activeTab === "REFUND")
      return ["REFUNDED", "CANCELLED"].includes(o.status) || o.refundStatus || o.afterSales?.length > 0;
    return true;
  });

  const getStatusBadge = (status: string, refundStatus?: string) => {
    if (refundStatus === "PROCESSING") {
      return { label: "退款审核中", color: "#f59e0b", bg: "#fef3c7" };
    }
    if (status === "PENDING_PAYMENT") {
      return { label: "待付款", color: "#ea580c", bg: "#ffedd5" };
    }
    if (status === "PAID") {
      return { label: "待师傅接单", color: "#2563eb", bg: "#dbeafe" };
    }
    if (status === "ACCEPTED") {
      return { label: "师傅已接单", color: "#0284c7", bg: "#e0f2fe" };
    }
    if (status === "IN_SERVICE") {
      return { label: "上门服务中", color: "#7c3aed", bg: "#ede9fe" };
    }
    if (status === "COMPLETED") {
      return { label: "已完工·待验收", color: "#0d9488", bg: "#ccfbf1" };
    }
    if (status === "CONFIRMED") {
      return { label: "已完工核验", color: "#16a34a", bg: "#dcfce7" };
    }
    if (status === "CANCELLED") {
      return { label: "已取消", color: "#64748b", bg: "#f1f5f9" };
    }
    if (status === "REFUNDED") {
      return { label: "已全额退款", color: "#dc2626", bg: "#fee2e2" };
    }
    return { label: status, color: "#64748b", bg: "#f1f5f9" };
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ maxWidth: "960px", width: "100%", margin: "20px auto", padding: "0 16px 60px", flex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>我的服务订单</h1>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
              平台资金全程托管，完工满意核验后再向师傅放款
            </div>
          </div>
          <Link
            href="/services"
            style={{
              backgroundColor: "#0f766e",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            + 预订新服务
          </Link>
        </div>

        {/* Status Tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            backgroundColor: "#ffffff",
            padding: "8px 12px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
            scrollbarWidth: "none",
          }}
        >
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: isActive ? "#0f766e" : "transparent",
                  color: isActive ? "#ffffff" : "#475569",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⏳</div>
            <div>正在加载订单列表...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "60px 20px",
              textAlign: "center",
              border: "1px dashed #cbd5e1",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📦</div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>
              暂无对应状态的服务订单
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px 0" }}>
              去服务商城逛逛，家电清洗、保洁、维修随时可预订
            </p>
            <Link
              href="/services"
              style={{
                display: "inline-block",
                backgroundColor: "#0f766e",
                color: "#ffffff",
                padding: "8px 20px",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              浏览服务商城
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status, order.refundStatus);
              const coverImg =
                order.product?.images && order.product?.images.length > 0
                  ? order.product.images[0]
                  : "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300";

              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    padding: "16px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  }}
                >
                  {/* Top Bar: OrderNo, Time & Status */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: "12px",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: "0.8rem",
                      color: "#64748b",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div>
                      订单号: <strong style={{ color: "#334155" }}>{order.orderNo}</strong>
                      <span style={{ margin: "0 6px", color: "#cbd5e1" }}>|</span>
                      <span>{new Date(order.createdAt).toLocaleString()}</span>
                    </div>

                    <span
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.color,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Middle Content: Product info */}
                  <Link
                    href={`/orders/${order.id}`}
                    style={{
                      display: "flex",
                      gap: "14px",
                      padding: "14px 0",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div style={{ width: "72px", height: "72px", borderRadius: "10px", overflow: "hidden", backgroundColor: "#f1f5f9", flexShrink: 0 }}>
                      <img src={coverImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.4 }}>
                        {order.productTitle}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                        服务师傅: {order.provider?.name} · 预约上门: {order.bookedTime}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                        服务地点: [{order.serviceArea}] {order.serviceAddress}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#dc2626" }}>
                        ¥{(order.amount / 100).toFixed(2)}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                        共 {order.quantity} 件
                      </div>
                    </div>
                  </Link>

                  {/* Bottom Action Buttons */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: "10px",
                      paddingTop: "12px",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <Link
                      href={`/orders/${order.id}`}
                      style={{
                        fontSize: "0.8rem",
                        color: "#475569",
                        backgroundColor: "#f1f5f9",
                        padding: "6px 14px",
                        borderRadius: "16px",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      查看详情
                    </Link>

                    {order.status === "PENDING_PAYMENT" && (
                      <Link
                        href={`/orders/${order.id}`}
                        style={{
                          fontSize: "0.8rem",
                          color: "#ffffff",
                          backgroundColor: "#07c160",
                          padding: "6px 16px",
                          borderRadius: "16px",
                          textDecoration: "none",
                          fontWeight: 700,
                        }}
                      >
                        立即支付
                      </Link>
                    )}

                    {order.status === "COMPLETED" && (
                      <Link
                        href={`/orders/${order.id}`}
                        style={{
                          fontSize: "0.8rem",
                          color: "#ffffff",
                          backgroundColor: "#0f766e",
                          padding: "6px 16px",
                          borderRadius: "16px",
                          textDecoration: "none",
                          fontWeight: 700,
                        }}
                      >
                        验收完工 & 放款
                      </Link>
                    )}

                    {order.status === "CONFIRMED" && !order.review && (
                      <Link
                        href={`/orders/${order.id}`}
                        style={{
                          fontSize: "0.8rem",
                          color: "#0f766e",
                          border: "1px solid #0f766e",
                          padding: "5px 14px",
                          borderRadius: "16px",
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                      >
                        ⭐ 评价服务
                      </Link>
                    )}

                    {["COMPLETED", "CONFIRMED", "CLOSED"].includes(order.status) && (
                      <Link
                        href={`/services/${order.productId}/checkout?reorderFrom=${order.id}`}
                        style={{
                          fontSize: "0.8rem",
                          color: "#ffffff",
                          backgroundColor: "#0f766e",
                          padding: "6px 14px",
                          borderRadius: "16px",
                          textDecoration: "none",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>🔄 再次购买</span>
                      </Link>
                    )}
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
