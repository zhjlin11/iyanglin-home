"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  CreditCard,
  ChevronRight,
  AlertCircle,
  Plus,
  CheckCircle2,
  X,
  Sparkles,
  Ticket,
} from "lucide-react";

export default function ServiceCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = params?.id as string;
  const initialQty = parseInt(searchParams?.get("quantity") || "1", 10) || 1;
  const reorderFrom = searchParams?.get("reorderFrom");

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Addresses
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Form Fields
  const [quantity, setQuantity] = useState(initialQty);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [area, setArea] = useState("杨林大学城");
  const [detailedAddress, setDetailedAddress] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentSlot, setAppointmentSlot] = useState("09:00 - 12:00 (上午)");
  const [userRemarks, setUserRemarks] = useState("");

  // P4 优惠券与再次购买状态
  const [reorderOriginalOrder, setReorderOriginalOrder] = useState<any>(null);
  const [userCoupons, setUserCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Payment Modal State
  const [paymentModal, setPaymentModal] = useState<{
    show: boolean;
    orderId: string;
    orderNo: string;
    amount: number;
    billingOrderNo?: string;
  } | null>(null);

  useEffect(() => {
    // 默认预约日期为明天
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setAppointmentDate(tomorrow.toISOString().split("T")[0]);

    // 加载商品、地址、优惠券与复购历史
    const loadData = async () => {
      try {
        const pRes = await fetch(`/api/services/products/${productId}`);
        const pJson = await pRes.json();
        let loadedProduct = null;
        if (pJson.success && pJson.data) {
          loadedProduct = pJson.data;
          setProduct(loadedProduct);
        }

        // 1. 如果是从历史订单点击「再次购买」进入，自动加载并回显原订单常用信息
        let reorderLoaded = false;
        if (reorderFrom) {
          try {
            const roRes = await fetch(`/api/service-orders/${reorderFrom}`);
            const roJson = await roRes.json();
            if (roJson.success && roJson.data) {
              const ro = roJson.data;
              setReorderOriginalOrder(ro);
              if (ro.contactName) setContactName(ro.contactName);
              if (ro.contactPhone) setContactPhone(ro.contactPhone);
              if (ro.serviceArea) setArea(ro.serviceArea);
              if (ro.addressDetail) setDetailedAddress(ro.addressDetail);
              if (ro.userRemark) setUserRemarks(ro.userRemark);
              reorderLoaded = true;
            }
          } catch (roErr) {
            console.warn("load reorder order error:", roErr);
          }
        }

        // 2. 加载保存的地址
        const aRes = await fetch("/api/user/addresses");
        const aJson = await aRes.json();
        if (aJson.success && aJson.data && aJson.data.length > 0) {
          setSavedAddresses(aJson.data);
          if (!reorderLoaded) {
            const defaultAddr = aJson.data.find((a: any) => a.isDefault) || aJson.data[0];
            setSelectedAddressId(defaultAddr.id);
            setContactName(defaultAddr.contactName);
            setContactPhone(defaultAddr.phone);
            setArea(defaultAddr.area);
            setDetailedAddress(defaultAddr.detailedAddress);
          }
        } else if (!reorderLoaded) {
          setShowNewAddressForm(true);
        }

        // 3. 加载当前用户卡券并自动匹配最优可用券
        if (loadedProduct) {
          const productPriceCents = loadedProduct.priceCents || loadedProduct.price || 0;
          const orderTotalCents = productPriceCents * quantity;
          const cRes = await fetch(
            `/api/user/coupons?providerId=${loadedProduct.providerId}&productId=${loadedProduct.id}&category=${encodeURIComponent(
              loadedProduct.category
            )}&amount=${orderTotalCents}`
          );
          const cJson = await cRes.json();
          if (cJson.success && cJson.data?.all) {
            setUserCoupons(cJson.data.all);
            const bestCoupon = cJson.data.all.find((c: any) => c.isUsable);
            if (bestCoupon) {
              setSelectedCoupon(bestCoupon);
            }
          }
        }
      } catch (err) {
        console.error("load checkout data error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadData();
    }
  }, [productId, quantity, reorderFrom]);

  const handleSelectSavedAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setContactName(addr.contactName);
    setContactPhone(addr.phone);
    setArea(addr.area);
    setDetailedAddress(addr.detailedAddress);
    setShowNewAddressForm(false);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactName.trim()) {
      alert("请填写服务联系人姓名");
      return;
    }
    if (!contactPhone.trim() || !/^1\d{10}$/.test(contactPhone.trim())) {
      alert("请填写有效的11位手机号码");
      return;
    }
    if (!detailedAddress.trim()) {
      alert("请填写上门服务详细地址（小区/门牌号）");
      return;
    }
    if (!appointmentDate) {
      alert("请选择预约服务日期");
      return;
    }

    setSubmitting(true);
    try {
      let effectiveAddressId = selectedAddressId;
      if (!effectiveAddressId) {
        const addrRes = await fetch("/api/user/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactName: contactName.trim(),
            phone: contactPhone.trim(),
            area,
            addressDetail: detailedAddress.trim(),
            isDefault: true,
          }),
        });
        const addrJson = await addrRes.json();
        if (addrJson.success && addrJson.data?.id) {
          effectiveAddressId = addrJson.data.id;
          setSelectedAddressId(effectiveAddressId);
        } else {
          alert(addrJson.error || "保存服务地址失败");
          setSubmitting(false);
          return;
        }
      }

      const bookedTime = `${appointmentDate} ${appointmentSlot}`;
      const payload = {
        productId: product.id,
        quantity,
        addressId: effectiveAddressId,
        appointmentAt: `${appointmentDate}T10:00:00.000Z`,
        userRemark: userRemarks.trim(),
        userCouponId: selectedCoupon ? selectedCoupon.id : undefined,
        reorderFromId: reorderFrom || undefined,
        source: reorderFrom ? "REPURCHASE" : selectedCoupon ? "COUPON" : "DIRECT",
      };

      const res = await fetch("/api/service-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        // 打开支付收银确认弹层
        setPaymentModal({
          show: true,
          orderId: json.data.orderId,
          orderNo: json.data.orderNo,
          amount: json.data.payAmountCents || json.data.amount,
          billingOrderNo: json.data.orderNo,
        });
      } else {
        alert(json.error || "下单失败，请稍后重试");
      }
    } catch (err: any) {
      alert(err.message || "网络异常");
    } finally {
      setSubmitting(false);
    }
  };

  // 模拟支付成功确认（开发与测试环境一键核销，生产环境自动走微信支付回调）
  const handleSimulatePayment = async () => {
    if (!paymentModal) return;
    try {
      // 触发后端支付通知模拟
      const notifyRes = await fetch("/api/payment/wechat/notify", {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: `<xml>
          <out_trade_no>${paymentModal.billingOrderNo || paymentModal.orderNo}</out_trade_no>
          <result_code>SUCCESS</result_code>
          <return_code>SUCCESS</return_code>
          <total_fee>${paymentModal.amount}</total_fee>
          <transaction_id>wx_test_${Date.now()}</transaction_id>
        </xml>`,
      });
      alert("支付成功！资金已进入平台担保账户，已为您通知师傅接单。");
      router.push(`/orders/${paymentModal.orderId}`);
    } catch (err) {
      router.push(`/orders/${paymentModal.orderId}`);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "100px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>
          <div>正在加载结算信息...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <h2>未找到商品信息</h2>
          <Link href="/services">返回商城</Link>
        </div>
      </div>
    );
  }

  const rawPrice = product.priceCents ?? product.price ?? 0;
  const grossCents = rawPrice * quantity;
  const discountCents = selectedCoupon ? selectedCoupon.calculatedDiscountCents || 0 : 0;
  const finalPayCents = Math.max(1, grossCents - discountCents);
  const totalPrice = finalPayCents / 100;
  const grossPrice = grossCents / 100;
  const discountPrice = discountCents / 100;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ maxWidth: "860px", width: "100%", margin: "20px auto", padding: "0 16px 80px", flex: 1 }}>
        {/* Reorder Shortcut Banner (P4) */}
        {reorderOriginalOrder && (
          <div
            style={{
              backgroundColor: "#eff6ff",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "16px",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Sparkles size={20} color="#2563eb" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: "0.85rem", color: "#1e40af" }}>
              <strong>🔄 再次购买极速通道</strong>：已自动带入上次预约【{reorderOriginalOrder.productTitle}】的常用联系人与地址，确认预约时间即可一键再约！
            </div>
          </div>
        )}

        {/* Header Reassurance */}
        <div
          style={{
            backgroundColor: "#f0fdfa",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "20px",
            border: "1px solid #ccfbf1",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <ShieldCheck size={22} color="#0f766e" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: "0.85rem", color: "#115e59" }}>
            <strong>杨林生活网资金担保</strong>：您的付款将由平台专户托管，在师傅完成服务且您核验满意前，款项不会结算给师傅。
          </div>
        </div>

        <form onSubmit={handleSubmitOrder}>
          {/* Service Product Card */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 16px 0" }}>
              📦 服务信息确认
            </h2>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "10px", overflow: "hidden", backgroundColor: "#f1f5f9", flexShrink: 0 }}>
                <img
                  src={product.images && product.images.length > 0 ? product.images[0] : (product.coverImage || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200")}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>{product.title}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                  服务商: {product.provider?.name} · 分类: {product.category}
                </div>
                <div style={{ fontSize: "0.95rem", color: "#dc2626", fontWeight: 700, marginTop: "6px" }}>
                  ¥{(rawPrice / 100).toFixed(2)} <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>/ {product.unit || "次"}</span>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", cursor: "pointer" }}
                >
                  -
                </button>
                <span style={{ width: "28px", textAlign: "center", fontWeight: 700, fontSize: "0.9rem" }}>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", cursor: "pointer" }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Service Time Selection */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={18} color="#0f766e" />
              <span>预约上门时间</span>
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                  预约服务日期 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                  上门时间段 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={appointmentSlot}
                  onChange={(e) => setAppointmentSlot(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="09:00 - 12:00 (上午)">09:00 - 12:00 (上午)</option>
                  <option value="12:00 - 14:00 (中午)">12:00 - 14:00 (中午)</option>
                  <option value="14:00 - 17:00 (下午)">14:00 - 17:00 (下午)</option>
                  <option value="17:00 - 20:00 (傍晚)">17:00 - 20:00 (傍晚)</option>
                  <option value="全天任意时间均可">全天任意时间均可</option>
                </select>
              </div>
            </div>
          </div>

          {/* Service Address Selection */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={18} color="#0f766e" />
                <span>服务地址与联系人</span>
              </h2>
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                  style={{
                    fontSize: "0.8rem",
                    color: "#0f766e",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {showNewAddressForm ? "选择已有地址" : "+ 新增地址"}
                </button>
              )}
            </div>

            {/* Saved Addresses List */}
            {!showNewAddressForm && savedAddresses.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {savedAddresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: isSelected ? "1.5px solid #0f766e" : "1px solid #e2e8f0",
                        backgroundColor: isSelected ? "#f0fdfa" : "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>{addr.contactName}</strong>
                          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{addr.phone}</span>
                          {addr.isDefault && (
                            <span style={{ backgroundColor: "#e2e8f0", color: "#475569", padding: "1px 6px", borderRadius: "4px", fontSize: "0.7rem" }}>
                              默认
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                          [{addr.area}] {addr.detailedAddress}
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 size={18} color="#0f766e" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Address Input Form */}
            {(showNewAddressForm || savedAddresses.length === 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                    联系人姓名 <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="如：张先生 / 李女士"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                    联系电话 <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="11位手机号"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                    所属片区 <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", backgroundColor: "#ffffff" }}
                  >
                    <option value="杨林大学城">杨林大学城</option>
                    <option value="嵩明杨林经开区">嵩明杨林经开区</option>
                    <option value="嵩明职教园区">嵩明职教园区</option>
                    <option value="嵩明县城城区">嵩明县城城区</option>
                    <option value="长水机场辐射圈">长水机场辐射圈</option>
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                    详细地址（小区、单元号、门牌） <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="如：文苑小区 3 栋 2 单元 601 室"
                    value={detailedAddress}
                    onChange={(e) => setDetailedAddress(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                </div>
              </div>
            )}

            {/* Privacy Protection Banner */}
            <div
              style={{
                marginTop: "14px",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
                fontSize: "0.75rem",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ShieldCheck size={14} color="#0f766e" />
              <span>🛡️ 隐私保护机制：详细门牌号仅在师傅确认接单后才向其展示，防止信息泄露。</span>
            </div>
          </div>

          {/* User Remarks */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 12px 0" }}>
              📝 订单备注（选填）
            </h2>
            <textarea
              rows={2}
              placeholder="如有特殊需求请填写（如：需带梯子、家中有人上夜班请轻声等）"
              value={userRemarks}
              onChange={(e) => setUserRemarks(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Coupon Selector Card (P4) */}
          <div
            onClick={() => setShowCouponModal(true)}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "16px 20px",
              marginBottom: "20px",
              border: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#fef2f2",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ticket size={18} />
              </div>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                  店铺与平台优惠券
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                  {selectedCoupon
                    ? selectedCoupon.title
                    : userCoupons.some((c) => c.isUsable)
                    ? `有 ${userCoupons.filter((c) => c.isUsable).length} 张可用券`
                    : "暂无适用优惠券"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {selectedCoupon ? (
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#dc2626" }}>
                  -¥{(selectedCoupon.calculatedDiscountCents / 100).toFixed(2)}
                </span>
              ) : (
                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  {userCoupons.some((c) => c.isUsable) ? "去选择" : "不可用"}
                </span>
              )}
              <ChevronRight size={18} color="#94a3b8" />
            </div>
          </div>

          {/* Pricing Settlement Box */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", marginBottom: "24px", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 14px 0" }}>
              💰 结算明细
            </h2>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#64748b", marginBottom: "8px" }}>
              <span>服务费原价小计</span>
              <span>¥{grossPrice.toFixed(2)}</span>
            </div>

            {selectedCoupon && discountPrice > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#dc2626", marginBottom: "8px", fontWeight: 600 }}>
                <span>优惠券减免 ({selectedCoupon.title})</span>
                <span>-¥{discountPrice.toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#64748b", marginBottom: "8px" }}>
              <span>平台履约担保服务费</span>
              <span style={{ color: "#16a34a" }}>¥0.00 (首发限免)</span>
            </div>

            <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "12px", marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>实付款</span>
              <div>
                <span style={{ fontSize: "0.9rem", color: "#dc2626", fontWeight: 700 }}>¥</span>
                <span style={{ fontSize: "1.6rem", color: "#dc2626", fontWeight: 900 }}>{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              backgroundColor: "#0f766e",
              color: "#ffffff",
              padding: "14px 0",
              borderRadius: "28px",
              fontSize: "1rem",
              fontWeight: 700,
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(15,118,110,0.3)",
            }}
          >
            {submitting ? "正在创建订单..." : `提交订单并支付 ¥${totalPrice.toFixed(2)}`}
          </button>
        </form>
      </div>

      {/* Payment Cashier Modal */}
      {paymentModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              maxWidth: "420px",
              width: "100%",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setPaymentModal(null);
                router.push(`/orders/${paymentModal.orderId}`);
              }}
              style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
            >
              <X size={20} />
            </button>

            <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🟢</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 6px 0", color: "#0f172a" }}>
              微信担保支付
            </h3>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "16px" }}>
              订单号：{paymentModal.orderNo}
            </div>

            <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>支付金额</div>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: "#dc2626", marginTop: "4px" }}>
                ¥{(paymentModal.amount / 100).toFixed(2)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#0f766e", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <ShieldCheck size={14} />
                <span>平台资金托管保障中</span>
              </div>
            </div>

            {/* Quick simulate / confirm button for staging & local test */}
            <button
              type="button"
              onClick={handleSimulatePayment}
              style={{
                width: "100%",
                backgroundColor: "#07c160",
                color: "#ffffff",
                padding: "12px 0",
                borderRadius: "24px",
                fontSize: "0.95rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              <span>模拟微信支付成功 (测试环境核销)</span>
            </button>

            <button
              type="button"
              onClick={() => router.push(`/orders/${paymentModal.orderId}`)}
              style={{
                width: "100%",
                backgroundColor: "#f1f5f9",
                color: "#475569",
                padding: "10px 0",
                borderRadius: "24px",
                fontSize: "0.85rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              稍后支付，前往我的订单
            </button>
          </div>
        </div>
      )}

      {/* Coupon Selection Modal / BottomSheet (P4) */}
      {showCouponModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              maxWidth: "460px",
              width: "100%",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                🎟️ 选择可用优惠券
              </div>
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Coupons List */}
            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Option: Do not use coupon */}
              <div
                onClick={() => {
                  setSelectedCoupon(null);
                  setShowCouponModal(false);
                }}
                style={{
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: !selectedCoupon ? "1.5px solid #0f766e" : "1px solid #e2e8f0",
                  backgroundColor: !selectedCoupon ? "#f0fdfa" : "#ffffff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "0.9rem", color: "#475569" }}>不使用任何优惠券</span>
                {!selectedCoupon && <CheckCircle2 size={18} color="#0f766e" />}
              </div>

              {userCoupons.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: "0.85rem" }}>
                  您当前暂无已领取的优惠券
                </div>
              ) : (
                userCoupons.map((c) => {
                  const isSelected = selectedCoupon?.id === c.id;
                  const isUsable = c.isUsable;

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        if (!isUsable) return;
                        setSelectedCoupon(c);
                        setShowCouponModal(false);
                      }}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "12px",
                        border: isSelected ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                        backgroundColor: isSelected ? "#fef2f2" : isUsable ? "#ffffff" : "#f8fafc",
                        opacity: isUsable ? 1 : 0.6,
                        cursor: isUsable ? "pointer" : "not-allowed",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <strong style={{ fontSize: "0.95rem", color: isUsable ? "#0f172a" : "#94a3b8" }}>
                            {c.title}
                          </strong>
                          <span
                            style={{
                              backgroundColor: c.issuerType === "PLATFORM" ? "#dbeafe" : "#ffedd5",
                              color: c.issuerType === "PLATFORM" ? "#1e40af" : "#c2410c",
                              fontSize: "0.7rem",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              fontWeight: 600,
                            }}
                          >
                            {c.issuerType === "PLATFORM" ? "平台通用" : "店铺券"}
                          </span>
                        </div>

                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                          满 ¥{(c.minSpendCents / 100).toFixed(2)} 可用 · {c.providerName}
                        </div>

                        <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>
                          有效期至：{new Date(c.expiresAt).toLocaleDateString()}
                        </div>

                        {!isUsable && c.unusableReason && (
                          <div style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "4px" }}>
                            ⚠️ {c.unusableReason}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "1.3rem", fontWeight: 900, color: isUsable ? "#dc2626" : "#94a3b8" }}>
                          {c.couponType === "DISCOUNT" ? `${c.valueCents / 10}折` : `¥${(c.discountCents / 100).toFixed(0)}`}
                        </div>
                        {isSelected && <CheckCircle2 size={18} color="#ef4444" style={{ marginTop: "4px", marginLeft: "auto" }} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "20px",
                  backgroundColor: "#0f766e",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                完成选择
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
