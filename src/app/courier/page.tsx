"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  RefreshCw,
  LogOut,
  AlertCircle,
} from "lucide-react";

export default function CourierWorkbenchPage() {
  const router = useRouter();
  const [courier, setCourier] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [tab, setTab] = useState<"ACTIVE" | "DELIVERED">("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [operatingId, setOperatingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/courier/orders");
      const data = await res.json();
      if (!res.ok || !data.success) {
        router.push("/courier/login");
        return;
      }
      setCourier(data.courier);
      setOrders(data.data || []);
    } catch {
      router.push("/courier/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, action: "START_DELIVERY" | "DELIVERED") => {
    const confirmText = action === "START_DELIVERY" ? "确认已取货，开始前往配送？" : "确认已送达客户并完成交付？";
    if (!confirm(confirmText)) return;

    setOperatingId(orderId);
    try {
      const res = await fetch(`/api/courier/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        loadOrders();
      } else {
        alert(data.error || "操作失败");
      }
    } catch {
      alert("网络异常");
    } finally {
      setOperatingId(null);
    }
  };

  const handleLogout = () => {
    document.cookie = "courier_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/courier/login");
  };

  const activeOrders = orders.filter((o) => ["READY", "DELIVERING", "PICKING"].includes(o.status));
  const deliveredOrders = orders.filter((o) => ["DELIVERED", "COMPLETED"].includes(o.status));
  const displayedOrders = tab === "ACTIVE" ? activeOrders : deliveredOrders;

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", color: "#F8FAFC", paddingBottom: "40px" }}>
      {/* 顶部状态栏 */}
      <div style={{ background: "#1E293B", borderBottom: "1px solid #334155", padding: "14px 16px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#0B7A75", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Truck size={20} />
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: "900" }}>{courier?.name || "配送员"}</div>
              <div style={{ fontSize: "11.5px", color: "#94A3B8" }}>{courier?.phone} · 专人配送中</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={loadOrders}
              style={{ background: "#334155", border: "none", color: "#ffffff", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <RefreshCw size={13} />
              <span>刷新</span>
            </button>
            <button
              onClick={handleLogout}
              style={{ background: "none", border: "none", color: "#EF4444", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}
            >
              <LogOut size={13} />
              <span>退出</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "16px auto", padding: "0 14px" }}>
        {/* 统计指标卡 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          <div style={{ background: "#1E293B", borderRadius: "12px", padding: "12px", border: "1px solid #334155" }}>
            <div style={{ fontSize: "12px", color: "#94A3B8" }}>待送达任务</div>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#F59E0B" }}>{activeOrders.length}</div>
          </div>
          <div style={{ background: "#1E293B", borderRadius: "12px", padding: "12px", border: "1px solid #334155" }}>
            <div style={{ fontSize: "12px", color: "#94A3B8" }}>已送达完成</div>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#10B981" }}>{deliveredOrders.length}</div>
          </div>
        </div>

        {/* Tab 选项卡 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "#1E293B", borderRadius: "10px", padding: "4px", marginBottom: "14px" }}>
          <button
            onClick={() => setTab("ACTIVE")}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: tab === "ACTIVE" ? "#0B7A75" : "transparent",
              color: "#ffffff",
              fontWeight: "800",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            待送达 ({activeOrders.length})
          </button>
          <button
            onClick={() => setTab("DELIVERED")}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: tab === "DELIVERED" ? "#0B7A75" : "transparent",
              color: "#ffffff",
              fontWeight: "800",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            历史送达 ({deliveredOrders.length})
          </button>
        </div>

        {/* 任务列表 */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>加载派送单中...</div>
        ) : displayedOrders.length === 0 ? (
          <div style={{ background: "#1E293B", borderRadius: "12px", padding: "40px 16px", textAlign: "center", color: "#94A3B8" }}>
            <CheckCircle2 size={40} style={{ color: "#334155", margin: "0 auto 10px" }} />
            <div>暂无相关配送任务</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {displayedOrders.map((ord) => {
              const isDelivering = ord.status === "DELIVERING";
              const isDelivered = ["DELIVERED", "COMPLETED"].includes(ord.status);

              return (
                <div
                  key={ord.id}
                  style={{
                    background: "#1E293B",
                    borderRadius: "14px",
                    border: "1px solid #334155",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#94A3B8" }}>{ord.orderNo}</span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "800",
                        color: isDelivering ? "#F59E0B" : isDelivered ? "#10B981" : "#38BDF8",
                        background: "rgba(255,255,255,0.06)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {isDelivering ? "🛵 正在配送" : isDelivered ? "✅ 已送达" : "📦 待取货出发"}
                    </span>
                  </div>

                  {/* 送达地址 (超大粗体突出) */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                    <MapPin size={18} style={{ color: "#F97316", flexShrink: 0, marginTop: "2px" }} />
                    <div style={{ fontSize: "15.5px", fontWeight: "900", color: "#F8FAFC", lineHeight: 1.4 }}>
                      {ord.addressDetail || ord.deliveryZoneName}
                    </div>
                  </div>

                  {/* 客户姓名与一键拨打按钮 */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0F172A", padding: "10px 14px", borderRadius: "10px", margin: "10px 0" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: "#F1F5F9" }}>{ord.contactName}</div>
                      <div style={{ fontSize: "12px", color: "#94A3B8" }}>{ord.contactPhone}</div>
                    </div>
                    <a
                      href={`tel:${ord.contactPhone}`}
                      style={{
                        background: "#059669",
                        color: "#ffffff",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: "800",
                        fontSize: "13px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Phone size={14} />
                      <span>一键呼叫</span>
                    </a>
                  </div>

                  {/* 商品清单 */}
                  <div style={{ fontSize: "12.5px", color: "#94A3B8", marginBottom: "12px", lineHeight: 1.5 }}>
                    <div>商品包含：{ord.items?.map((i: any) => `${i.productName} x${i.quantity}`).join("、")}</div>
                    {ord.userRemark && (
                      <div style={{ color: "#FBBF24", marginTop: "4px" }}>客户备注：{ord.userRemark}</div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  {!isDelivered && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      {!isDelivering ? (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, "START_DELIVERY")}
                          disabled={operatingId === ord.id}
                          style={{
                            flex: 1,
                            padding: "12px",
                            background: "#0B7A75",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "14.5px",
                            cursor: "pointer",
                          }}
                        >
                          开始配送出发 🛵
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, "DELIVERED")}
                          disabled={operatingId === ord.id}
                          style={{
                            flex: 1,
                            padding: "12px",
                            background: "#059669",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "14.5px",
                            cursor: "pointer",
                          }}
                        >
                          确认已送达 ✅
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
