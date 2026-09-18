"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import WechatPayCashierModal from "@/components/WechatPayCashierModal";
import {
  ShoppingBag,
  Clock,
  Truck,
  Store,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Package,
  RotateCcw,
  Sparkles,
  Search,
} from "lucide-react";

const TABS = [
  { key: "ALL", label: "全部订单" },
  { key: "UNPAID", label: "待付款" },
  { key: "DELIVERING", label: "待配送" },
  { key: "PICKUP", label: "待自提" },
  { key: "COMPLETED", label: "已完成" },
  { key: "REFUND", label: "售后/退款" },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  WAITING_PAYMENT: { label: "待付款", color: "#D97706", bg: "#FEF3C7" },
  PAID: { label: "已付款 · 待备货", color: "#0B7A75", bg: "#E6F4F3" },
  PICKING: { label: "店内配货中", color: "#0B7A75", bg: "#E6F4F3" },
  READY: { label: "待专人配送", color: "#2563EB", bg: "#EFF6FF" },
  READY_FOR_PICKUP: { label: "待到店自提", color: "#D97706", bg: "#FEF3C7" },
  DELIVERING: { label: "专人派送中", color: "#2563EB", bg: "#EFF6FF" },
  DELIVERED: { label: "已送达待确认", color: "#16A34A", bg: "#DCFCE7" },
  PICKED_UP: { label: "已自提完成", color: "#16A34A", bg: "#DCFCE7" },
  COMPLETED: { label: "订单已完成", color: "#16A34A", bg: "#DCFCE7" },
  CANCELLED: { label: "已取消", color: "#94A3B8", bg: "#F1F5F9" },
  REFUNDING: { label: "售后处理中", color: "#EF4444", bg: "#FEE2E2" },
  REFUNDED: { label: "已全额退款", color: "#DC2626", bg: "#FEE2E2" },
};

export default function MallOrdersListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [payingOrder, setPayingOrder] = useState<any | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mall/orders?status=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: "80px" }}>
      <Navbar />

      <div style={{ maxWidth: "880px", margin: "16px auto", padding: "0 16px" }}>
        {/* 面包屑导航与返回 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#64748B" }}>
            <Link href="/mall" style={{ color: "#64748B", textDecoration: "none" }}>自营便利店</Link>
            <ChevronRight size={12} />
            <span style={{ color: "#1E293B", fontWeight: "700" }}>我的便利店订单</span>
          </div>

          <Link
            href="/mall"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 12px",
              borderRadius: "20px",
              background: "#E6F4F3",
              color: "#0B7A75",
              fontSize: "12.5px",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            <ShoppingBag size={14} />
            <span>继续逛便利店</span>
          </Link>
        </div>

        {/* 分类 Tab 切换栏 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            display: "flex",
            overflowX: "auto",
            padding: "4px",
            marginBottom: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  minWidth: "70px",
                  padding: "10px 8px",
                  border: "none",
                  borderRadius: "10px",
                  background: active ? "#0B7A75" : "transparent",
                  color: active ? "#ffffff" : "#64748B",
                  fontSize: "13.5px",
                  fontWeight: active ? "700" : "500",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 订单列表展示 */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94A3B8" }}>
            <div style={{ fontSize: "28px", marginBottom: "10px" }}>⏳</div>
            <div>正在加载便利店订单...</div>
          </div>
        ) : orders.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              textAlign: "center",
              padding: "60px 20px",
            }}
          >
            <Package size={52} color="#CBD5E1" style={{ margin: "0 auto 14px" }} />
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
              暂无对应自营订单
            </div>
            <div style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "20px" }}>
              杨林自营便利店提供饮料水饮、零食乳品与本地特产，最快30分钟专人送达
            </div>
            <Link
              href="/mall"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                borderRadius: "10px",
                background: "#0B7A75",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "700",
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(11, 122, 117, 0.25)",
              }}
            >
              进店选购商品
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {orders.map((order) => {
              const statusCfg = STATUS_MAP[order.status] || {
                label: order.status,
                color: "#64748B",
                bg: "#F1F5F9",
              };
              const isPickup = order.deliveryMethod === "PICKUP";
              const itemsCount = order.items?.reduce((acc: number, cur: any) => acc + cur.quantity, 0) || 0;

              return (
                <div
                  key={order.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #E2E8F0",
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    transition: "box-shadow 0.15s",
                  }}
                >
                  {/* 订单卡片头部 */}
                  <div
                    style={{
                      padding: "12px 18px",
                      background: "#FAFDFD",
                      borderBottom: "1px solid #F1F5F9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#64748B" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: isPickup ? "#FEF3C7" : "#EFF6FF",
                          color: isPickup ? "#B45309" : "#1D4ED8",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        {isPickup ? <Store size={12} /> : <Truck size={12} />}
                        {isPickup ? "到店自提" : "本地专配"}
                      </span>
                      <span>单号：<strong style={{ color: "#1E293B" }}>{order.orderNo}</strong></span>
                      <span style={{ color: "#CBD5E1" }}>|</span>
                      <span>{new Date(order.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>

                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        background: statusCfg.bg,
                        color: statusCfg.color,
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* 商品列表明细 */}
                  <div
                    onClick={() => router.push(`/mall/orders/${order.id}`)}
                    style={{ padding: "14px 18px", cursor: "pointer" }}
                  >
                    {order.items?.map((item: any) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "10px",
                        }}
                      >
                        <img
                          src={item.productCover}
                          alt={item.productName}
                          style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "8px",
                            objectFit: "cover",
                            background: "#F1F5F9",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#1E293B",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              marginBottom: "3px",
                            }}
                          >
                            {item.productName}
                          </div>
                          <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                            {item.specification || item.unit} × {item.quantity}
                          </div>
                        </div>

                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>
                            ¥{(item.priceCents / 100).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 自提单显眼自提码（退款单不显示） */}
                    {order.pickupCode && order.status !== "REFUNDED" && (
                      <div
                        style={{
                          background: "#FFFBEB",
                          border: "1px dashed #FDE68A",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "8px",
                        }}
                      >
                        <span style={{ fontSize: "12.5px", color: "#B45309", fontWeight: "600" }}>
                          🏬 门店自提核销码
                        </span>
                        <span style={{ fontSize: "17px", fontWeight: "900", color: "#D97706", letterSpacing: "2px" }}>
                          {order.pickupCode}
                        </span>
                      </div>
                    )}

                    {/* 退款成功醒目提示条 */}
                    {order.status === "REFUNDED" && (
                      <div
                        style={{
                          background: "#FEF2F2",
                          border: "1px solid #FECACA",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          marginTop: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#B91C1C", fontSize: "13px", fontWeight: "700" }}>
                          <span style={{ fontSize: "15px" }}>↩️</span>
                          <span>已全额退款 · 退回微信 ¥{(order.payAmountCents / 100).toFixed(2)}</span>
                        </div>
                        <span style={{ fontSize: "12px", color: "#DC2626", fontWeight: "500" }}>
                          资金已原路退回您的微信账户（零钱/付款卡）
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 订单卡片底部汇总与快捷操作 */}
                  <div
                    style={{
                      padding: "12px 18px",
                      background: "#ffffff",
                      borderTop: "1px solid #F1F5F9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ fontSize: "13px", color: "#64748B" }}>
                      共 <strong style={{ color: "#0F172A" }}>{itemsCount}</strong> 件商品，
                      实付款: <strong style={{ color: order.status === "REFUNDED" ? "#94A3B8" : "#EF4444", fontSize: "16px", textDecoration: order.status === "REFUNDED" ? "line-through" : "none" }}>¥{(order.payAmountCents / 100).toFixed(2)}</strong>
                      {order.deliveryFeeCents > 0 && <span style={{ fontSize: "11.5px", color: "#94A3B8" }}> (含配送费¥{(order.deliveryFeeCents / 100).toFixed(2)})</span>}
                      {order.status === "REFUNDED" && (
                        <span style={{ marginLeft: "8px", fontSize: "13px", color: "#DC2626", fontWeight: "700" }}>
                          (已全额退款 ¥{(order.payAmountCents / 100).toFixed(2)})
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {order.status === "REFUNDED" && (
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: "#FEE2E2",
                            color: "#DC2626",
                            fontSize: "12px",
                            fontWeight: "700",
                          }}
                        >
                          已原路退款
                        </span>
                      )}

                      <Link
                        href={`/mall/orders/${order.id}`}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "8px",
                          border: "1px solid #CBD5E1",
                          color: "#475569",
                          fontSize: "12.5px",
                          fontWeight: "600",
                          textDecoration: "none",
                        }}
                      >
                        查看详情
                      </Link>

                      {order.status === "WAITING_PAYMENT" && (
                        <button
                          type="button"
                          onClick={() => setPayingOrder(order)}
                          style={{
                            padding: "6px 16px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#059669",
                            color: "#ffffff",
                            fontSize: "12.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)",
                          }}
                        >
                          立即付款
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 补款调起微信收银台 */}
      {payingOrder && (
        <WechatPayCashierModal
          isOpen={!!payingOrder}
          orderNo={payingOrder.orderNo}
          amountYuan={(payingOrder.payAmountCents / 100).toFixed(2)}
          orderTitle={`自营便利店订单-${payingOrder.orderNo}`}
          onClose={() => setPayingOrder(null)}
          onSuccess={() => {
            setPayingOrder(null);
            loadOrders();
          }}
        />
      )}
    </div>
  );
}
