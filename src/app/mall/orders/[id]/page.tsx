"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import WechatPayCashierModal from "@/components/WechatPayCashierModal";
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  Store,
  MapPin,
  Phone,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);

  const loadOrder = () => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/mall/orders/${id}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setOrder(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  // 取消订单
  const handleCancel = async () => {
    if (!confirm("确定要取消该未支付订单吗？")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/mall/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("订单已成功取消");
        loadOrder();
      } else {
        alert(data.error || "取消失败");
      }
    } catch {
      alert("操作失败");
    } finally {
      setActionLoading(false);
    }
  };

  // 确认收货
  const handleConfirmReceived = async () => {
    if (!confirm("确认您已收到自营便利店配送的商品？")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/mall/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CONFIRM_RECEIVED" }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("确认收货成功！感谢支持杨林生活网自营便利店！");
        loadOrder();
      } else {
        alert(data.error || "确认失败");
      }
    } catch {
      alert("操作失败");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "80px 0", color: "#94A3B8" }}>正在加载订单状态...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
        <Navbar />
        <div style={{ maxWidth: "600px", margin: "60px auto", textAlign: "center" }}>未找到对应订单</div>
      </div>
    );
  }

  const isPickup = order.deliveryMethod === "PICKUP";

  const STATUS_MAP: Record<string, { label: string; color: string; desc: string }> = {
    WAITING_PAYMENT: { label: "待付款", color: "#F59E0B", desc: "请尽快完成微信支付，超时将自动释放商品库存" },
    PAID: { label: "已付款 · 待配货", color: "#0B7A75", desc: "支付成功，便利店已接单，店内正在拣货打包" },
    PICKING: { label: "店内配货中", color: "#0B7A75", desc: "店员正在核对商品与数量打包" },
    READY: { label: "待配送", color: "#2563EB", desc: "商品已配齐，正在调度派送人员" },
    READY_FOR_PICKUP: { label: "待自提 (已备齐)", color: "#D97706", desc: "商品已在便利店备齐，请凭下方取货码到店领取" },
    DELIVERING: { label: "配送中", color: "#2563EB", desc: "专人正在派送途中，请留意保持电话畅通" },
    DELIVERED: { label: "已送达", color: "#10B981", desc: "商品已送达指定地点，请检查确认" },
    PICKED_UP: { label: "已提货", color: "#10B981", desc: "已在门店完成核销提货" },
    COMPLETED: { label: "已完成", color: "#10B981", desc: "交易顺利完成，感谢支持杨林生活网自营便利店！" },
    CANCELLED: { label: "已取消", color: "#94A3B8", desc: "订单已取消关闭" },
    REFUNDING: { label: "退款售后处理中", color: "#EF4444", desc: "售后申请已提交，店内客服正在核实处理" },
    REFUNDED: { label: "已全额退款", color: "#DC2626", desc: "本订单已全额办理原路退款，退款资金已原路返回您的微信账户（零钱或原付款银行卡）。" },
  };

  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "#475569", desc: "" };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: "60px" }}>
      <Navbar />

      <div style={{ maxWidth: "800px", margin: "16px auto", padding: "0 16px" }}>
        {/* 面包屑 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#64748B", marginBottom: "16px" }}>
          <Link href="/mall" style={{ color: "#64748B", textDecoration: "none" }}>自营便利店</Link>
          <ChevronRight size={12} />
          <Link href="/mall/orders" style={{ color: "#64748B", textDecoration: "none" }}>我的订单</Link>
          <ChevronRight size={12} />
          <span style={{ color: "#1E293B", fontWeight: "600" }}>订单详情 ({order.orderNo})</span>
        </div>

        {/* 状态大卡片 */}
        <div
          style={{
            background: order.status === "REFUNDED"
              ? "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)"
              : "linear-gradient(135deg, #0B7A75 0%, #075E5A 100%)",
            color: "#ffffff",
            borderRadius: "16px",
            padding: "24px 20px",
            marginBottom: "16px",
            boxShadow: order.status === "REFUNDED"
              ? "0 4px 14px rgba(220,38,38,0.25)"
              : "0 4px 14px rgba(11,122,117,0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span
              style={{
                background: order.status === "REFUNDED" ? "#FFFFFF" : statusInfo.color,
                color: order.status === "REFUNDED" ? "#DC2626" : "#ffffff",
                fontSize: "12px",
                fontWeight: "900",
                padding: "3px 8px",
                borderRadius: "4px",
              }}
            >
              {statusInfo.label}
            </span>
            <span style={{ fontSize: "12px", color: order.status === "REFUNDED" ? "#FECACA" : "#A7F3D0" }}>{order.orderNo}</span>
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: "900", margin: "0 0 6px" }}>{statusInfo.label}</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#E2E8F0" }}>{statusInfo.desc}</p>
        </div>

        {/* 退款已到账详细凭证卡片 */}
        {order.status === "REFUNDED" && (
          <div
            style={{
              background: "#FEF2F2",
              borderRadius: "16px",
              border: "1px solid #FECACA",
              padding: "20px",
              marginBottom: "16px",
              boxShadow: "0 2px 8px rgba(220,38,38,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#991B1B", fontWeight: "800", fontSize: "15px", marginBottom: "12px" }}>
              <span style={{ fontSize: "18px" }}>↩️</span>
              <span>微信支付原路退款已处理完结</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", fontSize: "13px" }}>
              <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #FEE2E2" }}>
                <span style={{ color: "#64748B", fontSize: "12px" }}>退款总金额</span>
                <div style={{ color: "#DC2626", fontWeight: "900", fontSize: "18px", marginTop: "2px" }}>
                  ¥{(order.payAmountCents / 100).toFixed(2)}
                </div>
              </div>
              <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #FEE2E2" }}>
                <span style={{ color: "#64748B", fontSize: "12px" }}>退款方式</span>
                <div style={{ color: "#1E293B", fontWeight: "700", marginTop: "4px" }}>微信支付原路退回</div>
              </div>
              <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #FEE2E2" }}>
                <span style={{ color: "#64748B", fontSize: "12px" }}>资金去向</span>
                <div style={{ color: "#1E293B", fontWeight: "700", marginTop: "4px" }}>微信零钱 / 付款银行卡</div>
              </div>
              <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #FEE2E2" }}>
                <span style={{ color: "#64748B", fontSize: "12px" }}>商品库存状态</span>
                <div style={{ color: "#059669", fontWeight: "700", marginTop: "4px" }}>已释放回便利店</div>
              </div>
            </div>
            {order.cancelReason && (
              <div style={{ marginTop: "12px", fontSize: "12.5px", color: "#991B1B", background: "#ffffff", padding: "10px 14px", borderRadius: "8px", border: "1px dashed #FCA5A5" }}>
                <strong>退款说明：</strong>{order.cancelReason}
              </div>
            )}
          </div>
        )}

        {/* 自提专属 6 位取货码大卡片（退款订单不显示） */}
        {isPickup && order.pickupCode && order.status !== "REFUNDED" && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "2px dashed #F59E0B",
              padding: "24px",
              textAlign: "center",
              marginBottom: "16px",
              boxShadow: "0 2px 8px rgba(245,158,11,0.1)",
            }}
          >
            <div style={{ fontSize: "13px", color: "#B45309", fontWeight: "700", marginBottom: "6px" }}>
              到店自提专属取货码 (请向店员出示)
            </div>
            <div
              style={{
                fontSize: "36px",
                fontWeight: "900",
                letterSpacing: "8px",
                color: "#D97706",
                margin: "8px 0",
                fontFamily: "monospace",
              }}
            >
              {order.pickupCode}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B" }}>
              提货地址：嵩明县杨林经开区管委会旁生活服务中心大楼1层 · 自营便利店
            </div>
          </div>
        )}

        {/* 配送信息卡片 */}
        {!isPickup && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              padding: "16px 20px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "800", fontSize: "14px", color: "#0F172A", marginBottom: "10px" }}>
              <Truck size={16} style={{ color: "#0B7A75" }} />
              <span>本地配送执行详情</span>
            </div>
            <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6 }}>
              <div>收件人：<strong>{order.contactName}</strong> ({order.contactPhone})</div>
              <div>送达地址：<strong>{order.addressDetail}</strong></div>
              <div>配送范围：{order.deliveryZoneName || "杨林本地"}</div>
              {order.courier && (
                <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "10px", background: "#F1F5F9", padding: "6px 12px", borderRadius: "6px" }}>
                  <span>配送员：<strong>{order.courier.name}</strong></span>
                  <a
                    href={`tel:${order.courier.phone}`}
                    style={{ color: "#0B7A75", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px" }}
                  >
                    <Phone size={13} />
                    <span>拨打电话 ({order.courier.phone})</span>
                  </a>
                </div>
              )}
              {order.thirdPartyPlatform && (
                <div style={{ marginTop: "6px", color: "#2563EB", fontWeight: "600" }}>
                  由第三方跑腿【{order.thirdPartyPlatform}】安排配送 · 骑手: {order.thirdPartyRiderName || "平台骑手"} ({order.thirdPartyRiderPhone || "-"})
                </div>
              )}
            </div>
          </div>
        )}

        {/* 商品清单 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "16px 20px",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: "800", color: "#1E293B", marginBottom: "12px" }}>
            商品明细
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {order.items?.map((item: any) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#1E293B" }}>{item.productName}</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>{item.specification || "标准规格"} · 单价 ¥{(item.priceCents / 100).toFixed(2)} x {item.quantity}</div>
                </div>
                <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "14px" }}>
                  ¥{(item.totalCents / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #F1F5F9", marginTop: "14px", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#64748B" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>商品金额</span>
              <span>¥{(order.goodsTotalCents / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>配送费</span>
              <span>¥{(order.deliveryFeeCents / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "900", color: "#0F172A", paddingTop: "6px" }}>
              <span>实付金额</span>
              <span style={{ color: "#EF4444" }}>¥{(order.payAmountCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 底部操作区 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          {/* 申请售后入口 */}
          {["PAID", "PICKING", "READY", "DELIVERING", "DELIVERED", "PICKED_UP", "COMPLETED"].includes(order.status) && (
            <Link
              href={`/mall/orders/${order.id}/aftersale`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: "#64748B",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              <HelpCircle size={14} />
              <span>申请售后/退款</span>
            </Link>
          )}

          <div style={{ display: "flex", gap: "10px", marginLeft: "auto" }}>
            {order.status === "WAITING_PAYMENT" && (
              <>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  取消订单
                </button>
                <button
                  onClick={() => setShowPayModal(true)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#059669",
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  立即付款
                </button>
              </>
            )}

            {["DELIVERING", "DELIVERED"].includes(order.status) && (
              <button
                onClick={handleConfirmReceived}
                disabled={actionLoading}
                style={{
                  padding: "9px 22px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#0B7A75",
                  color: "#ffffff",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                确认收货
              </button>
            )}

            {order.status === "REFUNDED" && (
              <span
                style={{
                  padding: "7px 16px",
                  borderRadius: "6px",
                  background: "#FEE2E2",
                  color: "#DC2626",
                  fontSize: "13px",
                  fontWeight: "700",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>↩️</span>
                <span>已全额退款</span>
              </span>
            )}

            <Link
              href="/mall"
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #0B7A75",
                background: "#ffffff",
                color: "#0B7A75",
                fontWeight: "700",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              继续逛便利店
            </Link>
          </div>
        </div>
      </div>

      {/* 微信支付官方安全收银台弹窗 */}
      {order && (
        <WechatPayCashierModal
          isOpen={showPayModal}
          orderNo={order.orderNo}
          amountYuan={(order.payAmountCents / 100).toFixed(2)}
          orderTitle={`自营便利店订单-${order.orderNo}`}
          onClose={() => setShowPayModal(false)}
          onSuccess={() => {
            setShowPayModal(false);
            loadOrder();
          }}
        />
      )}
    </div>
  );
}
