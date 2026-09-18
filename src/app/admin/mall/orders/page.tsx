"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT: { label: "待付款", color: "#6B7280", bg: "#F3F4F6" },
  PAID: { label: "已付款待配货", color: "#B45309", bg: "#FEF3C7" },
  PICKING: { label: "配货中", color: "#D97706", bg: "#FDE68A" },
  DELIVERING: { label: "配送派送中", color: "#1D4ED8", bg: "#DBEAFE" },
  READY_FOR_PICKUP: { label: "待到店自提", color: "#047857", bg: "#D1FAE5" },
  COMPLETED: { label: "已送达完成", color: "#15803D", bg: "#DCFCE7" },
  REFUNDING: { label: "售后申请中", color: "#B91C1C", bg: "#FEE2E2" },
  REFUNDED: { label: "已退款完成", color: "#991B1B", bg: "#FEE2E2" },
  CANCELLED: { label: "已取消关闭", color: "#9CA3AF", bg: "#F3F4F6" },
};

export default function AdminMallOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [search, setSearch] = useState("");

  // 自提码快速核销
  const [quickPickupCode, setQuickPickupCode] = useState("");
  const [verifyMsg, setVerifyMsg] = useState<{ success?: boolean; text?: string } | null>(null);

  // 派单弹窗 Modal
  const [dispatchOrder, setDispatchOrder] = useState<any | null>(null);
  const [dispatchType, setDispatchType] = useState<"internal" | "third_party">("internal");
  const [selectedCourierId, setSelectedCourierId] = useState("");
  const [runnerPlatform, setRunnerPlatform] = useState("美团跑腿");
  const [runnerName, setRunnerName] = useState("");
  const [runnerPhone, setRunnerPhone] = useState("");
  const [runnerTrackingNo, setRunnerTrackingNo] = useState("");
  const [dispatching, setDispatching] = useState(false);

  // 订单详情弹窗
  const [detailOrder, setDetailOrder] = useState<any | null>(null);

  // 实时接单与新订单提示音
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastPaidCount, setLastPaidCount] = useState<number | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  };

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [orderRes, courierRes] = await Promise.all([
        fetch(`/api/admin/mall/orders?status=${statusFilter}&fulfillmentType=${fulfillmentFilter}&search=${encodeURIComponent(search)}`),
        fetch("/api/admin/mall/couriers"),
      ]);
      if (orderRes.ok) {
        const d = await orderRes.json();
        const list = d.orders || d.data || [];
        const currentPaid = list.filter((o: any) => o.status === "PAID").length;
        if (lastPaidCount !== null && currentPaid > lastPaidCount) {
          playChime();
          setNewOrderAlert(`🔔 叮咚！自营便利店收到 ${currentPaid - lastPaidCount} 笔新付款待配货订单，请及时处理！`);
        }
        setLastPaidCount(currentPaid);
        setOrders(list);
      }
      if (courierRes.ok) {
        const cd = await courierRes.json();
        setCouriers(cd.couriers || cd.data || []);
        if ((cd.couriers || cd.data)?.length > 0 && !selectedCourierId) {
          setSelectedCourierId((cd.couriers || cd.data)[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [statusFilter, fulfillmentFilter]);

  // 定时自动拉取新订单并播报
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      loadData(false);
    }, 10000);
    return () => clearInterval(timer);
  }, [autoRefresh, statusFilter, fulfillmentFilter, lastPaidCount, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleVerifyPickup = async (codeToVerify?: string) => {
    const code = codeToVerify || quickPickupCode;
    if (!code.trim() || code.trim().length !== 6) {
      setVerifyMsg({ success: false, text: "请输入完整的6位自提码" });
      return;
    }
    setVerifyMsg(null);
    try {
      const res = await fetch("/api/admin/mall/orders/verify-pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupCode: code.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerifyMsg({ success: true, text: `核销成功！订单 ${data.order.orderNo} 已结转完成` });
        setQuickPickupCode("");
        loadData();
      } else {
        setVerifyMsg({ success: false, text: data.error || "核销失败" });
      }
    } catch (e: any) {
      setVerifyMsg({ success: false, text: e.message || "请求失败" });
    }
  };

  // 切换订单状态（配货完成、送达、取消等）
  const handleTransition = async (orderId: string, nextStatus: string, note?: string) => {
    try {
      const res = await fetch(`/api/admin/mall/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, note }),
      });
      if (res.ok) {
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || "操作失败");
      }
    } catch (e: any) {
      alert(e.message || "请求失败");
    }
  };

  // 提交指派配送
  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchOrder) return;
    setDispatching(true);
    try {
      const payload: any = {
        status: "DELIVERING",
        note: `指派配送: ${dispatchType === "internal" ? "内部自营骑手" : runnerPlatform}`,
      };

      if (dispatchType === "internal") {
        payload.courierId = selectedCourierId;
      } else {
        payload.thirdPartyRunner = runnerPlatform;
        payload.runnerName = runnerName;
        payload.runnerPhone = runnerPhone;
        payload.runnerTrackingNo = runnerTrackingNo;
      }

      const res = await fetch(`/api/admin/mall/orders/${dispatchOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDispatchOrder(null);
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "派单失败");
      }
    } catch (e: any) {
      alert(e.message || "网络请求失败");
    } finally {
      setDispatching(false);
    }
  };

  return (
    <AdminLayout
      title="📦 自营便利店 · 订单履约中枢"
      subtitle="集中处理店内配货、骑手与跑腿指派、自提码快速核销与售后流程。"
      actionButton={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              background: autoRefresh ? "#DCFCE7" : "#F1F5F9",
              color: autoRefresh ? "#166534" : "#64748B",
              border: "1px solid",
              borderColor: autoRefresh ? "#86EFAC" : "#CBD5E1",
              fontSize: "12.5px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: autoRefresh ? "#16A34A" : "#94A3B8",
                boxShadow: autoRefresh ? "0 0 8px #16A34A" : "none",
              }}
            />
            <span>{autoRefresh ? "实时接单监听中 (10s)" : "接单监听已暂停"}</span>
          </button>
        </div>
      }
    >
      {/* 新订单提示横幅 */}
      {newOrderAlert && (
        <div
          style={{
            background: "#ECFDF5",
            border: "1px solid #10B981",
            borderRadius: "12px",
            padding: "12px 18px",
            marginBottom: "16px",
            color: "#065F46",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
          }}
        >
          <span>{newOrderAlert}</span>
          <button
            onClick={() => setNewOrderAlert(null)}
            style={{ border: "none", background: "none", color: "#065F46", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 顶部自提快速核销 Bar */}
      <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "12px", padding: "14px 20px", marginBottom: "16px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>⚡</span>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "800", color: "#166534" }}>前台顾客自提 · 快捷核销</div>
            <div style={{ fontSize: "12px", color: "#15803D" }}>顾客出示订单详情中的6位提货码，输入后直接核销出库。</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            maxLength={6}
            value={quickPickupCode}
            onChange={(e) => setQuickPickupCode(e.target.value.replace(/\D/g, ""))}
            placeholder="6位自提码"
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid #86EFAC",
              fontSize: "15px",
              fontWeight: "900",
              letterSpacing: "2px",
              textAlign: "center",
              width: "120px",
              outline: "none",
            }}
          />
          <button
            onClick={() => handleVerifyPickup()}
            style={{
              padding: "7px 16px",
              background: "#16A34A",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            快速核销
          </button>
        </div>
        {verifyMsg && (
          <div style={{ width: "100%", fontSize: "12px", fontWeight: "700", color: verifyMsg.success ? "#166534" : "#DC2626" }}>
            {verifyMsg.success ? "✅ " : "❌ "} {verifyMsg.text}
          </div>
        )}
      </div>

      {/* 状态过滤 Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "14px" }}>
        {[
          { key: "all", label: "全部订单" },
          { key: "PAID", label: "待配货" },
          { key: "DELIVERING", label: "配送中" },
          { key: "READY_FOR_PICKUP", label: "待自提" },
          { key: "COMPLETED", label: "已完成" },
          { key: "PENDING_PAYMENT", label: "待付款" },
          { key: "REFUNDING", label: "售后中" },
          { key: "REFUNDED", label: "已退款" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setStatusFilter(t.key)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "none",
              background: statusFilter === t.key ? "#0B7A75" : "#E5E7EB",
              color: statusFilter === t.key ? "#fff" : "#4B5563",
              fontWeight: statusFilter === t.key ? "800" : "500",
              fontSize: "13px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 搜索过滤工具栏 */}
      <div style={{ background: "#fff", padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", justifyContent: "space-between" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", flex: 1, minWidth: "260px" }}>
          <input
            type="text"
            placeholder="搜索订单号、收货人姓名、手机号..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", flex: 1, outline: "none" }}
          />
          <button type="submit" style={{ padding: "8px 16px", background: "#1F2937", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>
            搜索
          </button>
        </form>

        <select
          value={fulfillmentFilter}
          onChange={(e) => setFulfillmentFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", outline: "none", background: "#fff" }}
        >
          <option value="all">全部配送方式</option>
          <option value="DELIVERY">🛵 本地配送</option>
          <option value="PICKUP">🏪 到店自提</option>
        </select>
      </div>

      {/* 订单列表表格 */}
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", color: "#4B5563", fontWeight: "700" }}>
              <th style={{ padding: "12px 16px" }}>订单信息</th>
              <th style={{ padding: "12px 16px" }}>收货人 / 地址</th>
              <th style={{ padding: "12px 16px" }}>订购明细</th>
              <th style={{ padding: "12px 16px", width: "110px" }}>实付金额</th>
              <th style={{ padding: "12px 16px", width: "110px" }}>履约状态</th>
              <th style={{ padding: "12px 16px", width: "180px", textAlign: "right" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#9CA3AF" }}>
                  订单数据加载中...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#9CA3AF" }}>
                  暂无匹配的订单记录
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const statusMeta = STATUS_LABELS[o.status] || { label: o.status, color: "#6B7280", bg: "#F3F4F6" };
                const isPickup = (o.deliveryMethod || o.fulfillmentType) === "PICKUP";

                return (
                  <tr key={o.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: "700", color: "#111827", fontFamily: "monospace" }}>{o.orderNo}</div>
                      <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>
                        {new Date(o.createdAt).toLocaleString("zh-CN")}
                      </div>
                      <div style={{ marginTop: "4px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: isPickup ? "#EFF6FF" : "#FEF3C7",
                            color: isPickup ? "#1E40AF" : "#92400E",
                            fontWeight: "700",
                          }}
                        >
                          {isPickup ? "🏪 到店自提" : "🛵 本地配送"}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: "700", color: "#111827" }}>
                        {o.contactName || o.receiverName} ({o.contactPhone || o.receiverPhone})
                      </div>
                      <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>
                        {isPickup ? `自提点: ${o.addressDetail || o.pickupStation || "杨林生活网自营便利店总店"}` : (o.addressDetail || o.deliveryAddress)}
                      </div>
                      {isPickup && o.pickupCode && (
                        <div style={{ fontSize: "11px", color: "#0B7A75", fontWeight: "800", marginTop: "2px" }}>
                          提货码: {o.pickupCode}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {o.items?.map((it: any) => (
                          <div key={it.id} style={{ fontSize: "12px", color: "#374151" }}>
                            {it.productName || it.name} <span style={{ color: "#9CA3AF" }}>x{it.quantity}</span> (¥{(it.priceCents / 100).toFixed(2)})
                          </div>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: "800", color: "#111827", fontSize: "14px" }}>
                        ¥{(((o.payAmountCents ?? o.actualPayCents) || 0) / 100).toFixed(2)}
                      </div>
                      {o.deliveryFeeCents > 0 && (
                        <div style={{ fontSize: "11px", color: "#6B7280" }}>
                          含运费 ¥{(o.deliveryFeeCents / 100).toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: statusMeta.bg,
                          color: statusMeta.color,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                      {o.courier && (
                        <div style={{ fontSize: "11px", color: "#2563EB", marginTop: "4px" }}>
                          🚴 {o.courier.name}
                        </div>
                      )}
                      {o.thirdPartyRunner && (
                        <div style={{ fontSize: "11px", color: "#D97706", marginTop: "4px" }}>
                          🏃 {o.thirdPartyRunner}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                        {/* 操作根据状态与履约类型动态展示 */}
                        {o.status === "PAID" && isPickup && (
                          <button
                            onClick={() => handleTransition(o.id, "READY_FOR_PICKUP", "配货完成，等待客户来店自提")}
                            style={{ padding: "4px 10px", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                          >
                            配好通知自提
                          </button>
                        )}

                        {o.status === "PAID" && !isPickup && (
                          <button
                            onClick={() => setDispatchOrder(o)}
                            style={{ padding: "4px 10px", background: "#2563EB", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                          >
                            指派骑手/跑腿
                          </button>
                        )}

                        {o.status === "READY_FOR_PICKUP" && (
                          <button
                            onClick={() => handleVerifyPickup(o.pickupCode)}
                            style={{ padding: "4px 10px", background: "#16A34A", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                          >
                            一键核销提货
                          </button>
                        )}

                        {o.status === "DELIVERING" && (
                          <button
                            onClick={() => handleTransition(o.id, "COMPLETED", "店主/配送员确认已送达")}
                            style={{ padding: "4px 10px", background: "#0B7A75", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                          >
                            标记送达完成
                          </button>
                        )}

                        <button
                          onClick={() => setDetailOrder(o)}
                          style={{ padding: "3px 8px", background: "#F3F4F6", color: "#374151", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}
                        >
                          订单详情 &gt;
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 派单弹窗 Modal */}
      {dispatchOrder && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDispatchOrder(null);
          }}
        >
          <div style={{ background: "#fff", borderRadius: "14px", width: "100%", maxWidth: "460px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "900", margin: 0 }}>🚴 指派订单配送</h3>
              <button onClick={() => setDispatchOrder(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: "10px", background: "#F9FAFB", borderRadius: "8px", fontSize: "12px", color: "#374151", marginBottom: "14px" }}>
              <div><strong>收货人：</strong>{dispatchOrder.receiverName} ({dispatchOrder.receiverPhone})</div>
              <div style={{ marginTop: "3px" }}><strong>送货地址：</strong>{dispatchOrder.deliveryAddress}</div>
            </div>

            <form onSubmit={handleConfirmDispatch} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <label style={{ flex: 1, padding: "8px", border: "1px solid " + (dispatchType === "internal" ? "#0B7A75" : "#D1D5DB"), borderRadius: "8px", background: dispatchType === "internal" ? "#F0FDF4" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                  <input type="radio" name="dispatchType" checked={dispatchType === "internal"} onChange={() => setDispatchType("internal")} />
                  <span>内部专送骑手</span>
                </label>
                <label style={{ flex: 1, padding: "8px", border: "1px solid " + (dispatchType === "third_party" ? "#0B7A75" : "#D1D5DB"), borderRadius: "8px", background: dispatchType === "third_party" ? "#F0FDF4" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                  <input type="radio" name="dispatchType" checked={dispatchType === "third_party"} onChange={() => setDispatchType("third_party")} />
                  <span>第三方跑腿 / 店员</span>
                </label>
              </div>

              {dispatchType === "internal" ? (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>选择便利店配送员</label>
                  <select
                    value={selectedCourierId}
                    onChange={(e) => setSelectedCourierId(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", marginTop: "4px", background: "#fff" }}
                  >
                    {couriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - {c.status === "ACTIVE" ? "🟢 在岗" : "⚪ 休息"}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700" }}>跑腿平台 / 配送方式</label>
                    <select
                      value={runnerPlatform}
                      onChange={(e) => setRunnerPlatform(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", marginTop: "4px", background: "#fff" }}
                    >
                      <option value="美团跑腿">美团跑腿</option>
                      <option value="蜂鸟即配">蜂鸟即配 / 饿了么</option>
                      <option value="顺丰同城">顺丰同城</option>
                      <option value="闪送">闪送</option>
                      <option value="店员自送">店员自送</option>
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700" }}>骑手姓名</label>
                      <input
                        type="text"
                        placeholder="例如：王师傅"
                        value={runnerName}
                        onChange={(e) => setRunnerName(e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12px", marginTop: "4px", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700" }}>骑手电话</label>
                      <input
                        type="text"
                        placeholder="11位手机号"
                        value={runnerPhone}
                        onChange={(e) => setRunnerPhone(e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12px", marginTop: "4px", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700" }}>跑腿运单号 (选填)</label>
                    <input
                      type="text"
                      placeholder="美团/蜂鸟跑腿单号"
                      value={runnerTrackingNo}
                      onChange={(e) => setRunnerTrackingNo(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12px", marginTop: "4px", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button type="button" onClick={() => setDispatchOrder(null)} style={{ padding: "8px 14px", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "8px", cursor: "pointer" }}>
                  取消
                </button>
                <button type="submit" disabled={dispatching} style={{ padding: "8px 20px", background: "#0B7A75", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
                  {dispatching ? "派单中..." : "确认派单"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 订单详情弹窗 Modal */}
      {detailOrder && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailOrder(null);
          }}
        >
          <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "85vh", overflowY: "auto", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: "900", margin: 0 }}>订单详情 #{detailOrder.orderNo}</h3>
                <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>创建时间: {new Date(detailOrder.createdAt).toLocaleString("zh-CN")}</div>
              </div>
              <button onClick={() => setDetailOrder(null)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
              <div style={{ padding: "12px", background: "#F9FAFB", borderRadius: "8px" }}>
                <div style={{ fontWeight: "700", color: "#111827", marginBottom: "6px" }}>👤 收货与履约信息</div>
                <div>收货人：{detailOrder.receiverName} ({detailOrder.receiverPhone})</div>
                <div style={{ marginTop: "4px" }}>履约方式：{detailOrder.fulfillmentType === "PICKUP" ? "🏪 到店自提" : "🛵 本地配送"}</div>
                {detailOrder.fulfillmentType === "PICKUP" ? (
                  <>
                    <div style={{ marginTop: "4px" }}>自提点：{detailOrder.pickupStation || "杨林生活网自营便利店总店"}</div>
                    <div style={{ marginTop: "4px", color: "#0B7A75", fontWeight: "800" }}>自提核销码：{detailOrder.pickupCode}</div>
                  </>
                ) : (
                  <div style={{ marginTop: "4px" }}>送达地址：{detailOrder.deliveryAddress}</div>
                )}
                {detailOrder.buyerRemark && <div style={{ marginTop: "4px", color: "#D97706" }}>买家备注：{detailOrder.buyerRemark}</div>}
              </div>

              <div>
                <div style={{ fontWeight: "700", color: "#111827", marginBottom: "8px" }}>🛒 购买商品清单</div>
                <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
                  {detailOrder.items?.map((it: any) => (
                    <div key={it.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #F3F4F6" }}>
                      <div>
                        <div style={{ fontWeight: "600" }}>{it.name}</div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF" }}>规格: {it.spec || "标准"} | 数量: x{it.quantity}</div>
                      </div>
                      <div style={{ fontWeight: "700", color: "#111827" }}>
                        ¥{((it.priceCents * it.quantity) / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: "10px 14px", background: "#F9FAFB", display: "flex", justifyContent: "space-between", fontWeight: "800" }}>
                    <span>实付结算金额</span>
                    <span style={{ color: "#EF4444", fontSize: "15px" }}>¥{(detailOrder.actualPayCents / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {detailOrder.logs?.length > 0 && (
                <div>
                  <div style={{ fontWeight: "700", color: "#111827", marginBottom: "8px" }}>⏱️ 状态流转记录</div>
                  <div style={{ borderLeft: "2px solid #E5E7EB", marginLeft: "8px", paddingLeft: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {detailOrder.logs.map((log: any) => (
                      <div key={log.id} style={{ fontSize: "12px" }}>
                        <span style={{ color: "#9CA3AF" }}>{new Date(log.createdAt).toLocaleTimeString("zh-CN")}</span>{" "}
                        <strong style={{ color: "#0B7A75" }}>{log.toStatus}</strong>
                        {log.note && <span style={{ color: "#4B5563" }}> ({log.note})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
