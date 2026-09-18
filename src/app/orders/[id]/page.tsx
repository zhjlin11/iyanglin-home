"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  ChevronRight,
  ArrowLeft,
  X,
  Star,
  Coins,
  Scale,
  Camera,
} from "lucide-react";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showAfterSaleModal, setShowAfterSaleModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Form Inputs
  const [refundReason, setRefundReason] = useState("");
  const [refundAmountYuan, setRefundAmountYuan] = useState("");
  const [afterSaleType, setAfterSaleType] = useState("SERVICE_QUALITY");
  const [afterSaleDesc, setAfterSaleDesc] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");

  const fetchOrderDetail = async () => {
    try {
      const res = await fetch(`/api/service-orders/${orderId}`);
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
      }
    } catch (err) {
      console.error("fetch order detail error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  // 1. 用户确认完工放款
  const handleConfirmCompletion = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/service-orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CONFIRM" }),
      });
      const json = await res.json();
      if (json.success) {
        alert("完工确认成功！平台担保资金已为师傅完成结算。");
        setShowConfirmModal(false);
        fetchOrderDetail();
      } else {
        alert(json.error || "确认失败");
      }
    } catch (err: any) {
      alert(err.message || "网络异常");
    } finally {
      setActionLoading(false);
    }
  };

  // 2. 取消订单
  const handleCancelOrder = async () => {
    if (!confirm("确定要取消此订单吗？")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/service-orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL", cancelReason: "用户主动取消" }),
      });
      const json = await res.json();
      if (json.success) {
        alert("订单已取消");
        fetchOrderDetail();
      } else {
        alert(json.error || "取消失败");
      }
    } catch (err: any) {
      alert(err.message || "网络异常");
    } finally {
      setActionLoading(false);
    }
  };

  // 3. 申请退款
  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundReason.trim()) {
      alert("请填写退款原因");
      return;
    }

    const amtCent = refundAmountYuan ? Math.round(parseFloat(refundAmountYuan) * 100) : order.amount;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/service-orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amtCent,
          reason: refundReason.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message || "退款申请已提交并处理！");
        setShowRefundModal(false);
        fetchOrderDetail();
      } else {
        alert(json.error || "退款失败");
      }
    } catch (err: any) {
      alert(err.message || "网络异常");
    } finally {
      setActionLoading(false);
    }
  };

  // 4. 提交售后纠纷
  const handleSubmitAfterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!afterSaleDesc.trim()) {
      alert("请描述售后问题或纠纷原因");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/service-orders/${orderId}/aftersale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType: afterSaleType,
          description: afterSaleDesc.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert("售后争议申请已提交！对应商户资金已冻结，平台官方专员将在24小时内核验调解。");
        setShowAfterSaleModal(false);
        fetchOrderDetail();
      } else {
        alert(json.error || "提交失败");
      }
    } catch (err: any) {
      alert(err.message || "网络异常");
    } finally {
      setActionLoading(false);
    }
  };

  // 5. 评价服务
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContent.trim()) {
      alert("请填写评价内容");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          providerId: order.providerId,
          rating: reviewRating,
          content: reviewContent.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert("感谢您的真实评价！");
        setShowReviewModal(false);
        fetchOrderDetail();
      } else {
        alert(json.error || "提交评价失败");
      }
    } catch (err: any) {
      alert(err.message || "网络异常");
    } finally {
      setActionLoading(false);
    }
  };

  // 模拟支付（针对待付款订单）
  const handleSimulatePayment = async () => {
    try {
      const res = await fetch("/api/payment/wechat/notify", {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: `<xml>
          <out_trade_no>${order.orderNo}</out_trade_no>
          <result_code>SUCCESS</result_code>
          <return_code>SUCCESS</return_code>
          <total_fee>${order.amount}</total_fee>
          <transaction_id>wx_test_${Date.now()}</transaction_id>
        </xml>`,
      });
      alert("支付成功！");
      fetchOrderDetail();
    } catch (err) {
      fetchOrderDetail();
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "100px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⏳</div>
          <div>正在加载订单信息...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <h2>未找到订单信息</h2>
          <Link href="/orders">返回订单中心</Link>
        </div>
      </div>
    );
  }

  // 履约时间轴节点定义
  const steps = [
    { title: "提交订单", time: order.createdAt, done: true },
    { title: "支付托管", time: order.paidAt, done: !!order.paidAt },
    { title: "师傅接单", time: order.acceptedAt, done: !!order.acceptedAt },
    { title: "上门服务", time: order.startedAt, done: !!order.startedAt },
    { title: "完工待验", time: order.completedAt, done: !!order.completedAt },
    { title: "核验结算", time: order.confirmedAt, done: !!order.confirmedAt },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ maxWidth: "860px", width: "100%", margin: "20px auto", padding: "0 16px 80px", flex: 1 }}>
        {/* Back Link */}
        <Link
          href="/orders"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            color: "#64748b",
            fontSize: "0.85rem",
            textDecoration: "none",
            marginBottom: "16px",
          }}
        >
          <ArrowLeft size={16} />
          <span>返回我的服务订单</span>
        </Link>

        {/* State Banner */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ display: "inline-block", backgroundColor: "#f0fdf4", color: "#15803d", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", fontWeight: 700, marginBottom: "6px" }}>
                平台资金担保履约单
              </div>
              <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
                {order.status === "PENDING_PAYMENT" && "等待买家付款"}
                {order.status === "PAID" && "支付成功，等待师傅接单"}
                {order.status === "ACCEPTED" && "师傅已接单，准备上门"}
                {order.status === "IN_SERVICE" && "师傅正在上门履约服务中"}
                {order.status === "COMPLETED" && "师傅已完工，请核验服务"}
                {order.status === "CONFIRMED" && "服务已核验完工，放款完成"}
                {order.status === "CANCELLED" && "订单已取消"}
                {order.status === "REFUNDED" && "订单已退款"}
              </h1>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                订单编号：{order.orderNo}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>实付金额</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#dc2626" }}>
                ¥{(order.amount / 100).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Alert messages according to status */}
          {order.status === "COMPLETED" && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderRadius: "10px",
                backgroundColor: "#fef3c7",
                border: "1px solid #fde68a",
                color: "#92400e",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>验收提醒</strong>：师傅已拍照上传完工凭证。请您仔细检查服务质量，确认无误后点击下方【确认完工放款】。若 72 小时内未确认且无售后争议，系统将自动核销放款。
              </div>
            </div>
          )}
        </div>

        {/* Fulfillment Timeline */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 16px 0" }}>
            ⏱️ 履约全流程进度
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: "8px",
            }}
          >
            {steps.map((st, idx) => (
              <div key={idx} style={{ textAlign: "center", position: "relative" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: st.done ? "#0f766e" : "#f1f5f9",
                    color: st.done ? "#ffffff" : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  }}
                >
                  {st.done ? "✓" : idx + 1}
                </div>
                <div style={{ fontSize: "0.8rem", fontWeight: st.done ? 700 : 500, color: st.done ? "#0f172a" : "#94a3b8" }}>
                  {st.title}
                </div>
                {st.time && (
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>
                    {new Date(st.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Completion Proof Section */}
        {order.completedAt && (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid #e2e8f0",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <Camera size={18} color="#0f766e" />
              <span>师傅完工凭证</span>
            </h2>

            {order.completionNotes && (
              <div style={{ fontSize: "0.85rem", color: "#475569", backgroundColor: "#f8fafc", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px" }}>
                完工说明: {order.completionNotes}
              </div>
            )}

            {order.completionImages && order.completionImages.length > 0 ? (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {order.completionImages.map((img: string, i: number) => (
                  <a key={i} href={img} target="_blank" rel="noreferrer" style={{ width: "90px", height: "90px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>暂无图片凭证</div>
            )}
          </div>
        )}

        {/* Order Details & Address */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 14px 0" }}>
            📦 服务项目与地址
          </h2>

          <div style={{ display: "flex", gap: "14px", marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#f1f5f9", flexShrink: 0 }}>
              <img
                src={order.product?.images?.[0] || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200"}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>{order.productTitle}</div>
              <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                单价: ¥{(order.productPrice / 100).toFixed(2)} / {order.product?.unit || "次"} · 数量: {order.quantity}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem", color: "#475569" }}>
            <div>
              <strong style={{ color: "#0f172a" }}>预约时间：</strong>{order.bookedTime}
            </div>
            <div>
              <strong style={{ color: "#0f172a" }}>服务地址：</strong>[{order.serviceArea}] {order.serviceAddress}
            </div>
            <div>
              <strong style={{ color: "#0f172a" }}>联系人：</strong>{order.contactName} ({order.contactPhone})
            </div>
            {order.userRemarks && (
              <div>
                <strong style={{ color: "#0f172a" }}>用户备注：</strong>{order.userRemarks}
              </div>
            )}
          </div>
        </div>

        {/* Price & Settlement Card (P4) */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 12px 0" }}>
            💰 支付与优惠明细
          </h2>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#64748b", marginBottom: "8px" }}>
            <span>订单原价</span>
            <span>¥{((order.totalAmountCents || order.amount) / 100).toFixed(2)}</span>
          </div>
          {order.discountCents > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#dc2626", marginBottom: "8px", fontWeight: 600 }}>
              <span>优惠券抵扣</span>
              <span>-¥{(order.discountCents / 100).toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#64748b", marginBottom: "8px" }}>
            <span>平台履约担保服务</span>
            <span style={{ color: "#16a34a" }}>¥0.00 (限免保障)</span>
          </div>
          <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "10px", marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>实付款</span>
            <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "#dc2626" }}>
              ¥{((order.payAmountCents || order.amount) / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Provider Contact Card */}
        {order.provider && (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "16px 20px",
              border: "1px solid #e2e8f0",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>服务提供商 / 师傅</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                {order.provider.name}
              </div>
            </div>

            <a
              href={`tel:${order.provider.phone}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#0f766e",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Phone size={14} />
              <span>电话联系师傅</span>
            </a>
          </div>
        )}

        {/* Actions Bar */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "16px 20px",
            border: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {/* 取消订单 */}
          {["PENDING_PAYMENT", "PAID"].includes(order.status) && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleCancelOrder}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#475569",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              取消订单
            </button>
          )}

          {/* 申请退款 */}
          {["PAID", "ACCEPTED", "IN_SERVICE", "COMPLETED"].includes(order.status) && (
            <button
              type="button"
              onClick={() => {
                setRefundAmountYuan((order.amount / 100).toFixed(2));
                setShowRefundModal(true);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid #fecaca",
                backgroundColor: "#fff1f2",
                color: "#e11d48",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              申请退款
            </button>
          )}

          {/* 售后纠纷 */}
          {["COMPLETED", "CONFIRMED"].includes(order.status) && (
            <button
              type="button"
              onClick={() => setShowAfterSaleModal(true)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid #fed7aa",
                backgroundColor: "#fff7ed",
                color: "#c2410c",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              争议/申请售后
            </button>
          )}

          {/* 再次购买 / 一键再约 (P4) */}
          {["COMPLETED", "CONFIRMED", "CLOSED"].includes(order.status) && (
            <Link
              href={`/services/${order.productId}/checkout?reorderFrom=${order.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 18px",
                borderRadius: "20px",
                backgroundColor: "#0f766e",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(15,118,110,0.25)",
              }}
            >
              <span>🔄 再次购买 (一键再约)</span>
            </Link>
          )}

          {/* 立即支付（针对未付单） */}
          {order.status === "PENDING_PAYMENT" && (
            <button
              type="button"
              onClick={handleSimulatePayment}
              style={{
                padding: "8px 20px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: "#07c160",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              模拟微信支付
            </button>
          )}

          {/* 确认完工放款 */}
          {order.status === "COMPLETED" && (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              style={{
                padding: "8px 24px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: "#0f766e",
                color: "#ffffff",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(15,118,110,0.3)",
              }}
            >
              ✓ 确认完工放款
            </button>
          )}

          {/* 评价服务 */}
          {order.status === "CONFIRMED" && !order.review && (
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              style={{
                padding: "8px 20px",
                borderRadius: "20px",
                border: "1px solid #0f766e",
                backgroundColor: "#ffffff",
                color: "#0f766e",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ⭐ 评价服务
            </button>
          )}
        </div>
      </div>

      {/* Confirm Completion Modal */}
      {showConfirmModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "420px", width: "100%" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>
              确认完工并结算放款？
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              点击确认后，平台担保托管的资金将自动清算并计入师傅的可提现账户。请确保现场服务已全部达标满意。
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              >
                再检查一下
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmCompletion}
                style={{ padding: "8px 20px", borderRadius: "8px", border: "none", backgroundColor: "#0f766e", color: "#ffffff", fontWeight: 700 }}
              >
                {actionLoading ? "处理中..." : "确认放款"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Application Modal */}
      {showRefundModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "440px", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>申请订单退款</h3>
              <button onClick={() => setShowRefundModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitRefund}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                  退款金额 (元) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={refundAmountYuan}
                  onChange={(e) => setRefundAmountYuan(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>
                  最多可退 ¥{(order.amount / 100).toFixed(2)}
                </div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                  退款原因说明 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="如：师傅未能准时履约 / 协商一致退款"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                style={{ width: "100%", padding: "10px 0", borderRadius: "20px", border: "none", backgroundColor: "#e11d48", color: "#ffffff", fontWeight: 700 }}
              >
                {actionLoading ? "正在提交..." : "确认提交退款"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AfterSale Dispute Modal */}
      {showAfterSaleModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "440px", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>提起售后 / 争议调解</h3>
              <button onClick={() => setShowAfterSaleModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitAfterSale}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                  争议问题类型
                </label>
                <select
                  value={afterSaleType}
                  onChange={(e) => setAfterSaleType(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                >
                  <option value="SERVICE_QUALITY">服务质量不满意 / 未达标准</option>
                  <option value="PRICING_DISPUTE">存在隐性加价或费用争议</option>
                  <option value="ATTITUDE_ISSUE">师傅服务态度差 / 辱骂威胁</option>
                  <option value="DAMAGE_CLAIM">作业造成财产损坏需索赔</option>
                  <option value="OTHER">其他原因</option>
                </select>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                  争议详情描述 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="请详细客观描述争议情况，以便官方客服仲裁..."
                  value={afterSaleDesc}
                  onChange={(e) => setAfterSaleDesc(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                style={{ width: "100%", padding: "10px 0", borderRadius: "20px", border: "none", backgroundColor: "#c2410c", color: "#ffffff", fontWeight: 700 }}
              >
                {actionLoading ? "提交中..." : "提交争议调解"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "420px", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>评价本次服务</h3>
              <button onClick={() => setShowReviewModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview}>
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setReviewRating(st)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      <Star size={28} fill={st <= reviewRating ? "#f59e0b" : "none"} color={st <= reviewRating ? "#f59e0b" : "#cbd5e1"} />
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "6px" }}>
                  {reviewRating === 5 ? "非常满意，强烈推荐！" : `${reviewRating} 星评价`}
                </div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <textarea
                  required
                  rows={3}
                  placeholder="写下您的真实体验，帮助更多街坊邻居做出选择..."
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                style={{ width: "100%", padding: "10px 0", borderRadius: "20px", border: "none", backgroundColor: "#0f766e", color: "#ffffff", fontWeight: 700 }}
              >
                {actionLoading ? "提交中..." : "发表真实评价"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
