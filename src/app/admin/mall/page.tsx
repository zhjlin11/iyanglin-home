"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function MallDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [pickupCode, setPickupCode] = useState("");
  const [pickupResult, setPickupResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/mall/stats");
      if (res.ok) {
        const json = await res.json();
        setStats(json.data || json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleVerifyPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupCode.trim() || pickupCode.trim().length !== 6) {
      setPickupResult({ success: false, message: "请输入完整的6位自提核销码" });
      return;
    }
    setVerifying(true);
    setPickupResult(null);
    try {
      const res = await fetch("/api/admin/mall/orders/verify-pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupCode: pickupCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setPickupResult({
          success: true,
          message: `核销成功！订单号：${data.order.orderNo}，提货人：${data.order.receiverName} (${data.order.receiverPhone})`,
        });
        setPickupCode("");
        loadStats();
      } else {
        setPickupResult({ success: false, message: data.error || "核销失败" });
      }
    } catch (err: any) {
      setPickupResult({ success: false, message: err.message || "网络请求失败" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AdminLayout
      title="🏪 自营便利店 · 经营大盘"
      subtitle="杨林生活网自营即时零售便利店管理中枢：订单流转、到店核销、库存预警与履约监控。"
      actionButton={
        <div style={{ display: "flex", gap: "8px" }}>
          <Link
            href="/admin/mall/products"
            style={{
              padding: "6px 14px",
              background: "#0B7A75",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            + 录入商品
          </Link>
          <Link
            href="/mall"
            target="_blank"
            style={{
              padding: "6px 14px",
              background: "#F3F4F6",
              color: "#374151",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "600",
              border: "1px solid #D1D5DB",
            }}
          >
            🏪 预览前台
          </Link>
        </div>
      }
    >
      {/* 快捷自提码核销卡片 */}
      <div
        style={{
          background: "linear-gradient(135deg, #0B7A75 0%, #065F46 100%)",
          color: "#fff",
          padding: "20px 24px",
          borderRadius: "16px",
          marginBottom: "24px",
          boxShadow: "0 10px 25px -5px rgba(11, 122, 117, 0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "900",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>⚡</span> 顾客到店 · 6位提货码快速核销
            </div>
            <div style={{ fontSize: "13px", opacity: 0.85, marginTop: "4px" }}>
              输入顾客在订单详情出示的6位纯数字自提码，系统自动核验商品并完成订单结转。
            </div>
          </div>
          <form
            onSubmit={handleVerifyPickup}
            style={{ display: "flex", gap: "10px", alignItems: "center" }}
          >
            <input
              type="text"
              maxLength={6}
              value={pickupCode}
              onChange={(e) => setPickupCode(e.target.value.replace(/\D/g, ""))}
              placeholder="请输入6位提货码"
              style={{
                fontSize: "18px",
                fontWeight: "900",
                letterSpacing: "4px",
                textAlign: "center",
                padding: "8px 16px",
                borderRadius: "10px",
                border: "2px solid #FDE68A",
                outline: "none",
                width: "200px",
                color: "#111827",
                background: "#fff",
              }}
            />
            <button
              type="submit"
              disabled={verifying || pickupCode.length !== 6}
              style={{
                padding: "10px 22px",
                background: pickupCode.length === 6 ? "#FBBF24" : "#9CA3AF",
                color: "#78350F",
                border: "none",
                borderRadius: "10px",
                fontWeight: "900",
                fontSize: "15px",
                cursor: pickupCode.length === 6 ? "pointer" : "not-allowed",
                boxShadow: "0 4px 12px rgba(251, 191, 36, 0.4)",
              }}
            >
              {verifying ? "核验中..." : "确认提货"}
            </button>
          </form>
        </div>
        {pickupResult && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              borderRadius: "8px",
              background: pickupResult.success ? "#DCFCE7" : "#FEE2E2",
              color: pickupResult.success ? "#166534" : "#991B1B",
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
            {pickupResult.success ? "✅ " : "❌ "}
            {pickupResult.message}
          </div>
        )}
      </div>

      {/* KPI 核心指标大卡 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "18px",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: "600" }}>今日实收营业额</div>
          <div style={{ fontSize: "24px", fontWeight: "900", color: "#111827", marginTop: "8px" }}>
            ¥{stats ? (((stats.todayRevenueCents ?? stats.todaySalesCents) || 0) / 100).toFixed(2) : "0.00"}
          </div>
          <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
            待配货: {stats?.pendingPicking ?? 0} 单 | 配送中: {stats?.pendingDelivery ?? 0} 单
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "18px",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: "600" }}>今日有效订单</div>
          <div style={{ fontSize: "24px", fontWeight: "900", color: "#0B7A75", marginTop: "8px" }}>
            {stats?.todayOrders ?? stats?.todayOrdersCount ?? 0} <span style={{ fontSize: "14px", fontWeight: "normal" }}>单</span>
          </div>
          <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
            待自提: {stats?.readyPickup ?? 0} 单
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "18px",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: "600" }}>待配货 / 待出库</div>
          <div style={{ fontSize: "24px", fontWeight: "900", color: "#F59E0B", marginTop: "8px" }}>
            {stats?.pendingPicking ?? stats?.pendingPickingCount ?? 0} <span style={{ fontSize: "14px", fontWeight: "normal" }}>单</span>
          </div>
          <div style={{ fontSize: "12px", color: "#D97706", marginTop: "4px" }}>
            <Link href="/admin/mall/orders?status=PAID" style={{ color: "#D97706", textDecoration: "none" }}>
              立即处理配货 &gt;
            </Link>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "18px",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: "600" }}>配送中 / 待自提</div>
          <div style={{ fontSize: "24px", fontWeight: "900", color: "#2563EB", marginTop: "8px" }}>
            {(stats?.pendingDelivery ?? stats?.deliveringCount ?? 0) + (stats?.readyPickup ?? stats?.readyPickupCount ?? 0)}{" "}
            <span style={{ fontSize: "14px", fontWeight: "normal" }}>单</span>
          </div>
          <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
            在途: {stats?.pendingDelivery ?? stats?.deliveringCount ?? 0} | 待提: {stats?.readyPickup ?? stats?.readyPickupCount ?? 0}
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "18px",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: "600" }}>⚠️ 库存告急商品</div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "900",
              color: stats?.lowStockCount ? "#DC2626" : "#10B981",
              marginTop: "8px",
            }}
          >
            {stats?.lowStockCount ?? 0} <span style={{ fontSize: "14px", fontWeight: "normal" }}>款</span>
          </div>
          <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
            <Link href="/admin/mall/products?status=SOLD_OUT" style={{ color: "#DC2626", textDecoration: "none" }}>查看告急清单 &gt;</Link>
          </div>
        </div>
      </div>

      {/* 快捷导航与运营中心 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
          <div
            style={{
              fontSize: "15px",
              fontWeight: "800",
              color: "#111827",
              marginBottom: "14px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>📦 待履约订单快速通道</span>
            <Link href="/admin/mall/orders" style={{ fontSize: "13px", color: "#0B7A75", textDecoration: "none" }}>
              全部订单 &gt;
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link
              href="/admin/mall/orders?status=PAID"
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "#F9FAFB",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#1F2937",
                border: "1px solid #E5E7EB",
              }}
            >
              <span style={{ fontWeight: "600" }}>🔴 待店内配货 (已付款)</span>
              <span style={{ fontWeight: "900", color: "#F59E0B" }}>{stats?.pendingPicking ?? stats?.pendingPickingCount ?? 0} 笔</span>
            </Link>
            <Link
              href="/admin/mall/orders?status=DELIVERING"
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "#F9FAFB",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#1F2937",
                border: "1px solid #E5E7EB",
              }}
            >
              <span style={{ fontWeight: "600" }}>🚴 配送员派送中</span>
              <span style={{ fontWeight: "900", color: "#2563EB" }}>{stats?.pendingDelivery ?? stats?.deliveringCount ?? 0} 笔</span>
            </Link>
            <Link
              href="/admin/mall/orders?status=READY_FOR_PICKUP"
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "#F9FAFB",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#1F2937",
                border: "1px solid #E5E7EB",
              }}
            >
              <span style={{ fontWeight: "600" }}>🏪 待客户到店自提</span>
              <span style={{ fontWeight: "900", color: "#059669" }}>{stats?.readyPickup ?? stats?.readyPickupCount ?? 0} 笔</span>
            </Link>
            <Link
              href="/admin/mall/aftersales?status=PENDING"
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "#F9FAFB",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#1F2937",
                border: "1px solid #E5E7EB",
              }}
            >
              <span style={{ fontWeight: "600" }}>🔄 待审核售后申请</span>
              <span style={{ fontWeight: "900", color: "#DC2626" }}>{stats?.pendingAfterSale ?? stats?.pendingAftersalesCount ?? 0} 笔</span>
            </Link>
          </div>
        </div>

        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
          <div style={{ fontSize: "15px", fontWeight: "800", color: "#111827", marginBottom: "14px" }}>
            ⚙️ 履约与基础配置快捷入口
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Link
              href="/admin/mall/products"
              style={{
                padding: "14px",
                background: "#F0FDF4",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#065F46",
                border: "1px solid #DCFCE7",
                display: "block",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: "900" }}>🥫 商品管理</div>
              <div style={{ fontSize: "12px", color: "#059669", marginTop: "4px" }}>价格/库存/上下架</div>
            </Link>
            <Link
              href="/admin/mall/delivery"
              style={{
                padding: "14px",
                background: "#EFF6FF",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#1E40AF",
                border: "1px solid #DBEAFE",
                display: "block",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: "900" }}>🚴 骑手与配送</div>
              <div style={{ fontSize: "12px", color: "#2563EB", marginTop: "4px" }}>配送员口令/跑腿登记</div>
            </Link>
            <Link
              href="/admin/mall/zones"
              style={{
                padding: "14px",
                background: "#FEF3C7",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#92400E",
                border: "1px solid #FDE68A",
                display: "block",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: "900" }}>🗺️ 配送范围</div>
              <div style={{ fontSize: "12px", color: "#D97706", marginTop: "4px" }}>运费梯度/满减免运</div>
            </Link>
            <Link
              href="/admin/mall/categories"
              style={{
                padding: "14px",
                background: "#FAF5FF",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#6B21A8",
                border: "1px solid #F3E8FF",
                display: "block",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: "900" }}>📑 分类体系</div>
              <div style={{ fontSize: "12px", color: "#7C3AED", marginTop: "4px" }}>排序与图标管理</div>
            </Link>
          </div>
          <div
            style={{
              marginTop: "14px",
              padding: "12px",
              background: "#F9FAFB",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#6B7280",
              lineHeight: "1.6",
            }}
          >
            💡 <strong>即时零售合规提醒：</strong>杨林生活网自营便利店禁止销售卷烟及电子烟产品；所有商品价格须以标价为准，保证店内真实库存与及时配送。
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
