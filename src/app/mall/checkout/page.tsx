"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import WechatPayCashierModal from "@/components/WechatPayCashierModal";
import {
  Truck,
  Store,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  ShoppingBag,
  CreditCard,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const [deliveryMethod, setDeliveryMethod] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // 联系人与地址字段
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [expectedTime, setExpectedTime] = useState("尽快送达 (约30分钟)");
  const [userRemark, setUserRemark] = useState("");

  // 购物车与计算
  const [calculation, setCalculation] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [payModal, setPayModal] = useState<{
    show: boolean;
    orderId: string;
    orderNo: string;
    amountYuan: string;
  } | null>(null);

  // 1. 初始化读取购物车与区域、地址列表
  useEffect(() => {
    // 读取区域
    fetch("/api/mall/zones")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setZones(res.data);
          setSelectedZoneId(res.data[0].id);
        }
      })
      .catch(() => {});

    // 读取用户常用地址
    fetch("/api/user/addresses")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setAddresses(res.data);
          const defaultAddr = res.data.find((a: any) => a.isDefault) || res.data[0];
          setSelectedAddressId(defaultAddr.id);
          setContactName(defaultAddr.contactName);
          setContactPhone(defaultAddr.phone);
          setAddressDetail(defaultAddr.addressDetail);
        }
      })
      .catch(() => {});
  }, []);

  // 2. 重新向服务端计算金额
  useEffect(() => {
    try {
      const saved = localStorage.getItem("yl_mall_cart");
      const cart = saved ? JSON.parse(saved) : {};
      const items = Object.entries(cart)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([productId, quantity]) => ({ productId, quantity }));

      if (items.length === 0) {
        router.push("/mall");
        return;
      }

      fetch("/api/mall/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          deliveryMethod,
          zoneId: selectedZoneId || undefined,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            setCalculation(res.data);
          }
        });
    } catch {}
  }, [deliveryMethod, selectedZoneId, router]);

  // 选择已有地址时同步回填
  const handleAddressSelect = (addrId: string) => {
    setSelectedAddressId(addrId);
    const a = addresses.find((x) => x.id === addrId);
    if (a) {
      setContactName(a.contactName);
      setContactPhone(a.phone);
      setAddressDetail(a.addressDetail);
    }
  };

  // 提交订单并调起支付
  const handleSubmitOrder = async () => {
    setError("");
    if (!contactName.trim() || !contactPhone.trim()) {
      setError("请填写收件人/自提人姓名与联系电话");
      return;
    }

    if (deliveryMethod === "DELIVERY" && !addressDetail.trim()) {
      setError("本地配送订单请填写详细送达地址");
      return;
    }

    const saved = localStorage.getItem("yl_mall_cart");
    const cart = saved ? JSON.parse(saved) : {};
    const items = Object.entries(cart)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      setError("结算商品不能为空");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/mall/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          deliveryMethod,
          zoneId: selectedZoneId || undefined,
          contactName,
          contactPhone,
          addressDetail,
          expectedDeliveryTime: expectedTime,
          userRemark,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "提交订单失败，请检查商品库存");
        setSubmitting(false);
        return;
      }

      const orderId = data.data.id;
      const orderNo = data.data.orderNo;
      const amountYuan = ((data.data.payAmountCents || calculation?.payAmountCents || 0) / 100).toFixed(2);

      // 清空本地购物车
      localStorage.removeItem("yl_mall_cart");

      // 调起真实微信支付官方安全收银台
      setPayModal({
        show: true,
        orderId,
        orderNo,
        amountYuan,
      });
      setSubmitting(false);
    } catch (err: any) {
      setError(err.message || "提交订单发生异常");
      setSubmitting(false);
    }
  };

  const items = calculation?.items || [];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: "80px" }}>
      <Navbar />

      <div style={{ maxWidth: "800px", margin: "16px auto", padding: "0 16px" }}>
        {/* 面包屑 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#64748B", marginBottom: "16px" }}>
          <Link href="/mall" style={{ color: "#64748B", textDecoration: "none" }}>自营便利店</Link>
          <ChevronRight size={12} />
          <Link href="/mall/cart" style={{ color: "#64748B", textDecoration: "none" }}>购物车</Link>
          <ChevronRight size={12} />
          <span style={{ color: "#1E293B", fontWeight: "600" }}>确认订单并结算</span>
        </div>

        {/* 配送方式双模式分段切换 (本地配送 vs 到店自提) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <button
            type="button"
            onClick={() => setDeliveryMethod("DELIVERY")}
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              border: "2px solid",
              borderColor: deliveryMethod === "DELIVERY" ? "#0B7A75" : "#E2E8F0",
              background: deliveryMethod === "DELIVERY" ? "#E6F4F3" : "#ffffff",
              color: deliveryMethod === "DELIVERY" ? "#0B7A75" : "#475569",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: "800",
              fontSize: "15px",
              transition: "all 0.15s",
            }}
          >
            <Truck size={18} />
            <span>🚚 本地专人配送</span>
          </button>

          <button
            type="button"
            onClick={() => setDeliveryMethod("PICKUP")}
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              border: "2px solid",
              borderColor: deliveryMethod === "PICKUP" ? "#F59E0B" : "#E2E8F0",
              background: deliveryMethod === "PICKUP" ? "#FEF3C7" : "#ffffff",
              color: deliveryMethod === "PICKUP" ? "#B45309" : "#475569",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: "800",
              fontSize: "15px",
              transition: "all 0.15s",
            }}
          >
            <Store size={18} />
            <span>🏬 到店自提 (免运费)</span>
          </button>
        </div>

        {/* 收件信息 / 自提门店卡片 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "20px",
            marginBottom: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          {deliveryMethod === "DELIVERY" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "800", fontSize: "15px", color: "#0F172A" }}>
                  <MapPin size={16} style={{ color: "#0B7A75" }} />
                  <span>配送信息与送达地址</span>
                </div>

                {/* 配送区域切换 */}
                <div style={{ fontSize: "12.5px" }}>
                  <span style={{ color: "#64748B" }}>配送区域: </span>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    style={{
                      border: "1px solid #CBD5E1",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "12.5px",
                      color: "#1E293B",
                      fontWeight: "600",
                    }}
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} (满¥{(z.freeShippingThresholdCents / 100).toFixed(0)}包邮)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 常用地址快捷选择 */}
              {addresses.length > 0 && (
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", marginBottom: "12px" }}>
                  {addresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleAddressSelect(a.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "1px solid",
                        borderColor: selectedAddressId === a.id ? "#0B7A75" : "#E2E8F0",
                        background: selectedAddressId === a.id ? "#E6F4F3" : "#F8FAFC",
                        color: selectedAddressId === a.id ? "#0B7A75" : "#475569",
                        fontSize: "12px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        fontWeight: selectedAddressId === a.id ? "700" : "500",
                      }}
                    >
                      {a.contactName} ({a.phone.slice(-4)}) · {a.addressDetail}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", color: "#475569", fontWeight: "600", marginBottom: "4px" }}>
                    收件人姓名 *
                  </label>
                  <input
                    type="text"
                    placeholder="如：张同学 / 李先生"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13.5px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", color: "#475569", fontWeight: "600", marginBottom: "4px" }}>
                    收件人手机号 *
                  </label>
                  <input
                    type="text"
                    placeholder="用于接收配送通知"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13.5px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12.5px", color: "#475569", fontWeight: "600", marginBottom: "4px" }}>
                  详细送达地址 (小区/宿舍/车间门牌) *
                </label>
                <input
                  type="text"
                  placeholder="如：文理学院5栋402室 / 经开区标准厂房A区3号车间"
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13.5px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", color: "#475569", fontWeight: "600", marginBottom: "4px" }}>
                  期望送达时间
                </label>
                <select
                  value={expectedTime}
                  onChange={(e) => setExpectedTime(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13.5px", background: "#ffffff" }}
                >
                  <option value="尽快送达 (约30分钟)">尽快送达 (约30分钟内)</option>
                  <option value="今日中午 11:30 - 12:30">今日中午 11:30 - 12:30</option>
                  <option value="今日下午 17:30 - 18:30">今日下午 17:30 - 18:30</option>
                  <option value="今日晚间 20:00 - 21:00">今日晚间 20:00 - 21:00</option>
                </select>
              </div>
            </>
          ) : (
            <>
              {/* 到店自提门店信息展示 */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "800", fontSize: "15px", color: "#B45309", marginBottom: "12px" }}>
                <Store size={18} />
                <span>自营便利店自提门店信息</span>
              </div>

              <div style={{ background: "#FEF3C7", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px", fontSize: "13px", color: "#78350F", lineHeight: 1.6 }}>
                <div><strong>提货门店：</strong>杨林生活网自营便利店（经开区总仓店）</div>
                <div><strong>门店地址：</strong>嵩明县杨林经开区管委会旁生活服务中心大楼1层</div>
                <div><strong>营业时间：</strong>每天 08:00 - 22:30 · 全年无休</div>
                <div><strong>服务电话：</strong>138-8800-1000</div>
                <div style={{ color: "#D97706", fontWeight: "700", marginTop: "4px" }}>
                  💡 支付后将生成专属【6位取货码】，请凭码到店核销领取商品。
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", color: "#475569", fontWeight: "600", marginBottom: "4px" }}>
                    提货人姓名 *
                  </label>
                  <input
                    type="text"
                    placeholder="您的姓名"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13.5px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", color: "#475569", fontWeight: "600", marginBottom: "4px" }}>
                    提货人手机号 *
                  </label>
                  <input
                    type="text"
                    placeholder="接收核销通知短信"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13.5px" }}
                  />
                </div>
              </div>
            </>
          )}

          {/* 订单备注 */}
          <div style={{ marginTop: "14px" }}>
            <label style={{ display: "block", fontSize: "12.5px", color: "#475569", fontWeight: "600", marginBottom: "4px" }}>
              订单备注 (可选)
            </label>
            <input
              type="text"
              placeholder="如：放门卫室/放宿舍楼下/多放点辣椒等"
              value={userRemark}
              onChange={(e) => setUserRemark(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13.5px" }}
            />
          </div>
        </div>

        {/* 商品清单快照 */}
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
            商品清单 ({items.length} 种商品)
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {items.map((item: any) => (
              <div key={item.productId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13.5px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "#334155", fontWeight: "600" }}>{item.productName}</span>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>x {item.quantity}</span>
                </div>
                <div style={{ fontWeight: "700", color: "#0F172A" }}>
                  ¥{(item.totalCents / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 支付与金额明细卡片 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "800", fontSize: "14px", color: "#1E293B", marginBottom: "14px" }}>
            <CreditCard size={16} style={{ color: "#059669" }} />
            <span>支付方式：微信支付 (官方通道)</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13.5px", color: "#64748B" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>商品金额</span>
              <span>¥{((calculation?.goodsTotalCents || 0) / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>本地配送费</span>
              <span>
                {deliveryMethod === "PICKUP"
                  ? "到店自提 ¥0.00"
                  : calculation?.freeShippingApplied
                  ? "已享满额免运费 ¥0.00"
                  : `¥${((calculation?.deliveryFeeCents || 0) / 100).toFixed(2)}`}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "10px",
                borderTop: "1px solid #F1F5F9",
                fontSize: "16px",
                fontWeight: "900",
                color: "#0F172A",
              }}
            >
              <span>应付总金额</span>
              <span style={{ color: "#EF4444", fontSize: "22px" }}>
                ¥{((calculation?.payAmountCents || 0) / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "#FEF2F2",
              color: "#EF4444",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 提交支付按钮 */}
        <button
          type="button"
          onClick={handleSubmitOrder}
          disabled={submitting || !calculation?.isValid}
          style={{
            width: "100%",
            padding: "14px",
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            fontWeight: "900",
            fontSize: "16px",
            cursor: submitting ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(5, 150, 105, 0.4)",
          }}
        >
          {submitting ? "正在创建订单并调起支付..." : `微信支付 ¥${((calculation?.payAmountCents || 0) / 100).toFixed(2)} 立即下单`}
        </button>

        {/* 微信支付官方安全收银台弹层 */}
        {payModal && (
          <WechatPayCashierModal
            isOpen={payModal.show}
            orderNo={payModal.orderNo}
            amountYuan={payModal.amountYuan}
            orderTitle={`自营便利店订单-${payModal.orderNo}`}
            onClose={() => {
              // 用户点击稍后支付或关闭，跳转至订单详情（处于待付款状态）
              router.push(`/mall/orders/${payModal.orderId}`);
            }}
            onSuccess={() => {
              // 微信支付成功跳转至订单详情（处于已付款待配货状态）
              router.push(`/mall/orders/${payModal.orderId}`);
            }}
          />
        )}
      </div>
    </div>
  );
}
