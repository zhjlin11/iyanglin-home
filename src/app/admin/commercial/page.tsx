"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  DollarSign,
  Flame,
  Star,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Edit3,
  Gift,
  Award,
  Layers,
  ChevronRight,
  ExternalLink,
  PackageCheck,
  X,
  Plus,
  Eye,
  Building2,
  Phone,
  MessageSquare,
  MapPin,
  Check,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function AdminCommercialPage() {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "marketing"
    | "service_orders"
    | "settlements"
    | "reconciliation"
    | "requests"
    | "leads"
    | "reviews"
    | "orders"
    | "promotions"
    | "providers"
    | "pricing"
    | "admin_promote"
  >("overview");

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // P4 Marketing & Campaigns States
  const [marketingData, setMarketingData] = useState<any>(null);
  const [showPlatformCouponModal, setShowPlatformCouponModal] = useState(false);
  const [campaignStatusFilter, setCampaignStatusFilter] = useState("ALL");
  const [newPlatformCoupon, setNewPlatformCoupon] = useState({
    title: "",
    couponType: "FIXED",
    valueYuan: "15",
    discountRate: "8.5",
    minSpendYuan: "50",
    totalQuantity: "500",
    perUserLimit: "1",
    applicableCategory: "ALL",
  });
  const [submittingPlatformCoupon, setSubmittingPlatformCoupon] = useState(false);

  // Overview stats
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Orders tab
  const [orders, setOrders] = useState<any[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");

  // Promotions tab
  const [promotions, setPromotions] = useState<any[]>([]);
  const [promoStatusFilter, setPromoStatusFilter] = useState("ALL");

  // Providers tab
  const [providers, setProviders] = useState<any[]>([]);
  const [providerStatusFilter, setProviderStatusFilter] = useState("PENDING");
  const [activeProviderDetail, setActiveProviderDetail] = useState<any>(null);
  const [rejectModalProvider, setRejectModalProvider] = useState<any>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  // Pricing tab
  const [packages, setPackages] = useState<any[]>([]);
  const [editingPackage, setEditingPackage] = useState<any>(null);

  // Admin promote tab
  const [giftListingId, setGiftListingId] = useState("");
  const [giftType, setGiftType] = useState("TOP_7_DAYS");
  const [giftDays, setGiftDays] = useState(7);
  const [gifting, setGifting] = useState(false);

  // P2 Requests tab
  const [requests, setRequests] = useState<any[]>([]);
  const [requestStatusFilter, setRequestStatusFilter] = useState("ALL");

  // P2 Leads tab
  const [funnel, setFunnel] = useState<any>(null);
  const [recentContactEvents, setRecentContactEvents] = useState<any[]>([]);

  // P2 Reviews tab
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStatusFilter, setReviewStatusFilter] = useState("ALL");

  // P3 Service Orders & Financial States
  const [adminServiceOrders, setAdminServiceOrders] = useState<any[]>([]);
  const [adminServiceOrderStatus, setAdminServiceOrderStatus] = useState("ALL");
  const [adminSettlements, setAdminSettlements] = useState<any[]>([]);
  const [adminSettlementStatus, setAdminSettlementStatus] = useState("ALL");
  const [adminReconciliation, setAdminReconciliation] = useState<any>(null);
  const [reconcileDays, setReconcileDays] = useState(7);
  const [arbitrateModalOrder, setArbitrateModalOrder] = useState<any>(null);
  const [arbitrateReason, setArbitrateReason] = useState("");
  const [arbitrateAmountYuan, setArbitrateAmountYuan] = useState("");

  // Lightbox for license images
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 数据拉取
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "overview") {
        const res = await fetch("/api/admin/commercial?tab=overview");
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setRecentOrders(data.recentOrders || []);
        }
      } else if (activeTab === "orders") {
        const res = await fetch(`/api/admin/commercial?tab=orders&status=${orderStatusFilter}`);
        const data = await res.json();
        if (data.success) setOrders(data.orders || []);
      } else if (activeTab === "promotions") {
        const res = await fetch(`/api/admin/commercial?tab=promotions&status=${promoStatusFilter}`);
        const data = await res.json();
        if (data.success) setPromotions(data.promotions || []);
      } else if (activeTab === "providers") {
        const res = await fetch(`/api/admin/commercial?tab=providers&status=${providerStatusFilter}`);
        const data = await res.json();
        if (data.success) setProviders(data.providers || []);
      } else if (activeTab === "pricing") {
        const res = await fetch("/api/admin/commercial?tab=pricing");
        const data = await res.json();
        if (data.success) setPackages(data.packages || []);
      } else if (activeTab === "requests") {
        const res = await fetch(`/api/admin/commercial?tab=requests&status=${requestStatusFilter}`);
        const data = await res.json();
        if (data.success) setRequests(data.requests || []);
      } else if (activeTab === "leads") {
        const res = await fetch("/api/admin/commercial?tab=leads");
        const data = await res.json();
        if (data.success) {
          setFunnel(data.funnel);
          setRecentContactEvents(data.recentContactEvents || []);
        }
      } else if (activeTab === "reviews") {
        const res = await fetch(`/api/admin/commercial?tab=reviews&status=${reviewStatusFilter}`);
        const data = await res.json();
        if (data.success) setReviews(data.reviews || []);
      } else if (activeTab === "service_orders") {
        const res = await fetch(`/api/admin/service-orders?status=${adminServiceOrderStatus}`);
        const data = await res.json();
        if (data.success) setAdminServiceOrders(data.data || []);
      } else if (activeTab === "settlements") {
        const res = await fetch(`/api/admin/settlements?status=${adminSettlementStatus}`);
        const data = await res.json();
        if (data.success) setAdminSettlements(data.data || []);
      } else if (activeTab === "reconciliation") {
        const res = await fetch(`/api/admin/reconciliation?days=${reconcileDays}`);
        const data = await res.json();
        if (data.success) setAdminReconciliation(data.data);
      } else if (activeTab === "marketing") {
        const res = await fetch("/api/admin/commercial?tab=marketing");
        const data = await res.json();
        if (data.success) setMarketingData(data.marketing);
      }
    } catch (err: any) {
      showToast("数据加载异常: " + (err.message || "网络错误"));
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    orderStatusFilter,
    promoStatusFilter,
    providerStatusFilter,
    requestStatusFilter,
    reviewStatusFilter,
    adminServiceOrderStatus,
    adminSettlementStatus,
    reconcileDays,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 套餐价格修改提交
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    try {
      const res = await fetch("/api/admin/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PACKAGE",
          ...editingPackage,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "更新套餐失败");

      showToast(`套餐【${editingPackage.name}】价格配置已更新！`);
      setEditingPackage(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "更新失败");
    }
  };

  // 审核服务商
  const handleReviewProvider = async (providerId: string, status: "APPROVED" | "REJECTED", reason?: string) => {
    try {
      const res = await fetch("/api/admin/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVIEW_PROVIDER",
          providerId,
          verificationStatus: status,
          rejectReason: reason,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "审核操作失败");

      showToast(status === "APPROVED" ? "✅ 已审核通过该服务商认证！" : "已驳回该服务商申请");
      setRejectModalProvider(null);
      setRejectReasonInput("");
      setActiveProviderDetail(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "操作失败");
    }
  };

  // 人工赠送置顶
  const handleAdminPromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftListingId.trim()) {
      showToast("请输入便民信息 ID");
      return;
    }
    setGifting(true);
    try {
      const res = await fetch("/api/admin/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADMIN_PROMOTE",
          listingId: giftListingId.trim(),
          promotionType: giftType,
          durationDays: giftDays,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "人工推广赠送失败");

      showToast(`🎉 成功为信息 ${giftListingId} 开启 ${giftDays} 天 ${giftType} 推荐！`);
      setGiftListingId("");
      setActiveTab("promotions");
    } catch (err: any) {
      showToast(err.message || "赠送失败");
    } finally {
      setGifting(false);
    }
  };

  // 停推或恢复推广
  const handleTogglePromo = async (promoId: string, active: boolean) => {
    if (!confirm(active ? "确定恢复该推广权益吗？" : "确定提前终止该推广权益吗？")) return;
    try {
      const res = await fetch("/api/admin/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_PROMOTION",
          promoId,
          active,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "操作失败");

      showToast(active ? "已恢复推广状态" : "已停止推广状态");
      fetchData();
    } catch (err: any) {
      showToast(err.message || "操作失败");
    }
  };

  // 更新需求状态 (管理员人工协调/改派/关闭)
  const handleUpdateRequestStatus = async (requestId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_REQUEST_STATUS", requestId, status }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("需求状态已成功更新");
        fetchData();
      } else {
        showToast("操作失败: " + data.error);
      }
    } catch (e: any) {
      showToast("操作异常: " + e.message);
    }
  };

  // 治理真实评价 (隐藏/恢复)
  const handleModerateReview = async (reviewId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MODERATE_REVIEW", reviewId, status }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`评价已设置为【${status === "APPROVED" ? "公开展示" : "已隐藏"}】`);
        fetchData();
      } else {
        showToast("操作失败: " + data.error);
      }
    } catch (e: any) {
      showToast("操作异常: " + e.message);
    }
  };

  // P3 管理员订单仲裁与强制退款
  const handleArbitrateOrder = async (orderId: string, action: string, refundAmount?: number, reason?: string) => {
    try {
      const res = await fetch("/api/admin/service-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          action,
          refundAmount,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "仲裁处理成功");
        setArbitrateModalOrder(null);
        setArbitrateReason("");
        setArbitrateAmountYuan("");
        fetchData();
      } else {
        showToast("仲裁失败: " + data.error);
      }
    } catch (e: any) {
      showToast("操作异常: " + e.message);
    }
  };

  // P3 管理员商户提现审核与打款核销
  const handleSettlementAction = async (settlementId: string, action: string, notes?: string) => {
    try {
      const res = await fetch("/api/admin/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settlementId,
          action,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "结算状态更新成功");
        fetchData();
      } else {
        showToast("操作失败: " + data.error);
      }
    } catch (e: any) {
      showToast("操作异常: " + e.message);
    }
  };

  // P4 平台营销与活动管理操作
  const handleCreatePlatformCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPlatformCoupon(true);
    try {
      const res = await fetch("/api/admin/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_PLATFORM_COUPON",
          ...newPlatformCoupon,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "创建平台券失败");
      showToast("🎉 平台通用补贴券创建成功！");
      setShowPlatformCouponModal(false);
      setNewPlatformCoupon({
        title: "",
        couponType: "FIXED",
        valueYuan: "15",
        discountRate: "8.5",
        minSpendYuan: "50",
        totalQuantity: "500",
        perUserLimit: "1",
        applicableCategory: "ALL",
      });
      fetchData();
    } catch (err: any) {
      showToast(err.message || "创建失败");
    } finally {
      setSubmittingPlatformCoupon(false);
    }
  };

  const handleTogglePlatformCoupon = async (couponId: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/admin/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_COUPON",
          couponId,
          enabled,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "操作失败");
      showToast(enabled ? "已开启该优惠券发放" : "已停用该优惠券");
      fetchData();
    } catch (err: any) {
      showToast(err.message || "操作失败");
    }
  };

  const handleReviewCampaign = async (campaignId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVIEW_CAMPAIGN",
          campaignId,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "审核操作失败");
      showToast(`活动已更新为: ${status === "ACTIVE" ? "审核通过 (已上线)" : status === "REJECTED" ? "已驳回" : "已下线"}`);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "审核操作失败");
    }
  };

  return (
    <AdminLayout
      title="便民商业化与服务生态中心"
      subtitle="付费推广 · 黄金置顶 · 推荐位监控 · 服务商实名认证 · 价格动态配置"
      actionButton={
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>刷新数据</span>
          </button>
          <Link
            href="/info"
            target="_blank"
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
          >
            <span>预览便民大厅</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 顶部 Toast */}
        {toastMsg && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
            <span>{toastMsg}</span>
          </div>
        )}

      {/* 选项卡导航 */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { key: "overview", label: "📊 商业大盘", icon: Layers },
          { key: "marketing", label: "🎯 平台营销运营", icon: Gift },
          { key: "service_orders", label: "📦 服务交易订单", icon: PackageCheck },
          { key: "settlements", label: "💰 财务结算中心", icon: DollarSign },
          { key: "reconciliation", label: "📑 每日资金对账", icon: ShieldCheck },
          { key: "requests", label: "📋 需求管理", icon: Layers },
          { key: "leads", label: "📈 线索转化漏斗", icon: Zap },
          { key: "reviews", label: "⭐ 真实评价治理", icon: Star },
          { key: "orders", label: "🧾 推广订单", icon: PackageCheck },
          { key: "promotions", label: "🔥 推荐位监控", icon: Flame },
          { key: "providers", label: "🛡️ 服务商认证审核", icon: ShieldCheck },
          { key: "pricing", label: "⚙️ 套餐与价格配置", icon: DollarSign },
          { key: "admin_promote", label: "🎁 人工赠送/置顶", icon: Gift },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. 商业大盘 Tab */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 6 大指标卡片 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
              <div className="text-xs opacity-90">商业推广总营收</div>
              <div className="text-xl sm:text-2xl font-black mt-1">
                ¥{stats?.totalRevenueYuan || "0.00"}
              </div>
              <div className="text-[11px] opacity-80 mt-1">便民信息推广成交额</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">有效推广进行中</div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats?.activePromotionsCount ?? 0}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">正常享受排位加权</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">待审核服务商</div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {stats?.pendingProvidersCount ?? 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">需专员人工核验</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">已认证服务商</div>
              <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {stats?.approvedProvidersCount ?? 0}
              </div>
              <div className="text-[11px] text-blue-500 mt-1">点亮蓝V/专属主页</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">当前置顶信息</div>
              <div className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">
                {stats?.topListingsCount ?? 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">所属分类霸榜中</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">首页大厅精选</div>
              <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {stats?.homeFeaturedCount ?? 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">首页专属推荐横幅</div>
            </div>
          </div>

          {/* 快捷操作流转条 */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300">常用商业化快捷入口：</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setProviderStatusFilter("PENDING");
                  setActiveTab("providers");
                }}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-400 font-semibold"
              >
                👉 立即审核服务商申请 ({stats?.pendingProvidersCount || 0})
              </button>
              <button
                onClick={() => setActiveTab("pricing")}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-400 font-semibold"
              >
                ⚙️ 动态调整置顶套餐价格
              </button>
              <button
                onClick={() => setActiveTab("admin_promote")}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-400 font-semibold"
              >
                🎁 人工直开置顶/赠送推介
              </button>
            </div>
          </div>

          {/* 最近订单流水 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                最近推广交易流水
              </h3>
              <button
                onClick={() => setActiveTab("orders")}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                查看全部订单 →
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">暂无推广订单记录</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 font-medium">订单号</th>
                      <th className="py-2.5 font-medium">推广标的</th>
                      <th className="py-2.5 font-medium">金额</th>
                      <th className="py-2.5 font-medium">状态</th>
                      <th className="py-2.5 font-medium">创建时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 font-mono text-slate-500">{o.orderNo}</td>
                        <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                          {o.targetTitle || o.planName}
                        </td>
                        <td className="py-2.5 font-bold text-amber-600">
                          ¥{(o.amountCents / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.status === "PAID"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            }`}
                          >
                            {o.status === "PAID" ? "已支付核销" : "待付款"}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-400">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1.5 平台营销运营中心 Tab (P4) */}
      {/* ========================================================= */}
      {activeTab === "marketing" && (
        <div className="space-y-6">
          {/* 4 大核心营销复购指标 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20">
              <div className="text-xs opacity-90">全网客户真实复购率</div>
              <div className="text-2xl font-black mt-1">
                {marketingData?.metrics?.overallRepeatRate ?? 0}%
              </div>
              <div className="text-[11px] opacity-80 mt-1">
                复购客 {marketingData?.metrics?.repeatCustomersCount ?? 0} 人 / 完工客 {marketingData?.metrics?.totalUniqueCustomers ?? 0} 人
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">老客复购产生产值单</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {marketingData?.metrics?.repurchaseOrdersCount ?? 0} <span className="text-xs font-normal text-slate-400">单</span>
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">二次及以上履约订单</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">优惠券核销带动订单</div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {marketingData?.metrics?.couponDrivenOrdersCount ?? 0} <span className="text-xs font-normal text-slate-400">单</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">已核销 {marketingData?.metrics?.totalUserCouponsUsed ?? 0} 张卡券</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">平台优惠补贴总额</div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                ¥{marketingData?.metrics?.totalDiscountSubsidizedYuan || "0.00"}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">平台真金白银补贴让利</div>
            </div>
          </div>

          {/* 板块 1: 平台通用补贴优惠券管理 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-500" />
                  平台通用优惠券管理 ({marketingData?.platformCoupons?.length || 0})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  全平台服务通用的满减与折扣券，成本由平台补贴，用于首单拉新与老客回流
                </p>
              </div>

              <button
                onClick={() => setShowPlatformCouponModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 创建平台通用券</span>
              </button>
            </div>

            {(!marketingData?.platformCoupons || marketingData.platformCoupons.length === 0) ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                暂无平台优惠券记录，点击右上角创建平台首单满减券
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 font-medium">券名称</th>
                      <th className="py-2.5 font-medium">券类型与面额</th>
                      <th className="py-2.5 font-medium">使用门槛</th>
                      <th className="py-2.5 font-medium">适用范围</th>
                      <th className="py-2.5 font-medium">已领/已用/发行总量</th>
                      <th className="py-2.5 font-medium">状态</th>
                      <th className="py-2.5 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {marketingData.platformCoupons.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                          {c.title}
                        </td>
                        <td className="py-3 font-bold text-emerald-600">
                          {c.couponType === "DISCOUNT" ? `${c.discountRate} 折` : `¥${(c.valueCents / 100).toFixed(2)}`}
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">
                          {c.minSpendCents > 0 ? `满 ¥${(c.minSpendCents / 100).toFixed(2)} 可用` : "无门槛立减"}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            {c.applicableCategory || "全品类通用"}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300 font-mono">
                          {c.receivedQuantity || 0} 领 / {c.usedQuantity || 0} 用 / {c.totalQuantity} 总
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.enabled
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {c.enabled ? "正常开放领取" : "已暂停发放"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleTogglePlatformCoupon(c.id, !c.enabled)}
                            className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                          >
                            {c.enabled ? "停用" : "恢复"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 板块 2: 商户营销活动审核与监管 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  商户店铺活动审核与监管 ({marketingData?.merchantCampaigns?.length || 0})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  服务商提报的满减大促与降价折扣活动，审核通过后在前台商户主页及服务列表加权曝光
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span>状态筛选:</span>
                {["ALL", "PENDING_REVIEW", "ACTIVE", "REJECTED", "OFFLINE"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setCampaignStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      campaignStatusFilter === st
                        ? "bg-amber-600 text-white font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {st === "ALL" ? "全部" : st === "PENDING_REVIEW" ? "待审核" : st === "ACTIVE" ? "进行中" : st === "REJECTED" ? "已驳回" : "已下线"}
                  </button>
                ))}
              </div>
            </div>

            {(!marketingData?.merchantCampaigns || marketingData.merchantCampaigns.length === 0) ? (
              <div className="py-8 text-center text-slate-400 text-xs">暂无商户活动提报记录</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 font-medium">服务商/店铺</th>
                      <th className="py-2.5 font-medium">活动标题与角标</th>
                      <th className="py-2.5 font-medium">优惠让利力度</th>
                      <th className="py-2.5 font-medium">活动起止时间</th>
                      <th className="py-2.5 font-medium">审核状态</th>
                      <th className="py-2.5 font-medium text-right">审核操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {marketingData.merchantCampaigns
                      .filter((camp: any) => campaignStatusFilter === "ALL" || camp.status === campaignStatusFilter)
                      .map((camp: any) => (
                        <tr key={camp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {camp.provider?.name || "未知服务商"}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {camp.provider?.serviceCategory} · 📱 {camp.provider?.phone}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                {camp.badgeText || "限时特惠"}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {camp.title}
                              </span>
                            </div>
                            {camp.subtitle && (
                              <div className="text-[11px] text-slate-400 mt-0.5">{camp.subtitle}</div>
                            )}
                          </td>
                          <td className="py-3 font-bold text-rose-600">
                            {camp.discountRate ? `${camp.discountRate} 折` : camp.discountCents ? `直降 ¥${(camp.discountCents / 100).toFixed(2)}` : "限时让利"}
                          </td>
                          <td className="py-3 text-slate-500 text-[11px]">
                            {camp.startAt ? new Date(camp.startAt).toLocaleDateString("zh-CN") : "即日起"} ~ {camp.endAt ? new Date(camp.endAt).toLocaleDateString("zh-CN") : "长期有效"}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                camp.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : camp.status === "PENDING_REVIEW"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {camp.status === "ACTIVE" ? "正常进行中" : camp.status === "PENDING_REVIEW" ? "待平台审核" : camp.status === "REJECTED" ? "已驳回" : "已下线"}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {camp.status === "PENDING_REVIEW" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleReviewCampaign(camp.id, "ACTIVE")}
                                  className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 cursor-pointer"
                                >
                                  ✓ 通过
                                </button>
                                <button
                                  onClick={() => handleReviewCampaign(camp.id, "REJECTED")}
                                  className="px-2 py-1 rounded border border-rose-300 text-rose-600 text-[11px] hover:bg-rose-50 cursor-pointer"
                                >
                                  驳回
                                </button>
                              </div>
                            ) : camp.status === "ACTIVE" ? (
                              <button
                                onClick={() => handleReviewCampaign(camp.id, "OFFLINE")}
                                className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
                              >
                                强制下线
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReviewCampaign(camp.id, "ACTIVE")}
                                className="text-xs text-emerald-600 hover:underline font-medium cursor-pointer"
                              >
                                重新上线
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. 推广订单 Tab */}
      {/* ========================================================= */}
      {activeTab === "orders" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-blue-500" />
              便民推广订单列表 ({orders.length})
            </h3>

            <div className="flex items-center gap-2 text-xs">
              <span>状态筛选:</span>
              {["ALL", "PAID", "PENDING_PAYMENT", "REFUNDED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    orderStatusFilter === st
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {st === "ALL" ? "全部" : st === "PAID" ? "已付款" : st === "PENDING_PAYMENT" ? "待支付" : "已退款"}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 font-medium">订单编号</th>
                  <th className="py-2.5 font-medium">推广标的与套餐</th>
                  <th className="py-2.5 font-medium">下单用户</th>
                  <th className="py-2.5 font-medium">金额</th>
                  <th className="py-2.5 font-medium">状态</th>
                  <th className="py-2.5 font-medium">下单时间</th>
                  <th className="py-2.5 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-mono text-slate-500">{o.orderNo}</td>
                    <td className="py-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                        {o.targetTitle}
                      </div>
                      <div className="text-[11px] text-slate-400">{o.planName}</div>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      <div>{o.user?.nickname || o.user?.username || "游客"}</div>
                      <div className="text-[11px] text-slate-400">{o.user?.phone || "-"}</div>
                    </td>
                    <td className="py-3 font-bold text-amber-600">
                      ¥{(o.amountCents / 100).toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        {o.status === "PAID" ? "已付款生效" : "待付款"}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 text-right space-x-2">
                      {o.status === "PENDING_PAYMENT" && (
                        <button
                          onClick={async () => {
                            if (!confirm(`确认模拟支付订单【${o.orderNo}】并激活推广吗？`)) return;
                            await fetch("/api/billing/orders", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ orderNo: o.orderNo, action: "simulate_pay" }),
                            });
                            showToast("已模拟支付并激活推广！");
                            fetchData();
                          }}
                          className="px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-semibold"
                        >
                          模拟支付激活
                        </button>
                      )}
                      <Link
                        href={`/info/${o.targetId}`}
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        查看信息
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. 推荐位监控 Tab */}
      {/* ========================================================= */}
      {activeTab === "promotions" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                推荐位与置顶权益监控 ({promotions.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                支持区分用户自费购买 (`PAID`) 与管理员人工赠送 (`ADMIN`)，支持随时终止或延期
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span>状态筛选:</span>
              {["ALL", "ACTIVE", "EXPIRED", "CANCELLED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setPromoStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    promoStatusFilter === st
                      ? "bg-orange-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {st === "ALL" ? "全部" : st === "ACTIVE" ? "生效中" : st === "EXPIRED" ? "已过期" : "已终止"}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 font-medium">推广信息</th>
                  <th className="py-2.5 font-medium">推广类型</th>
                  <th className="py-2.5 font-medium">权益来源</th>
                  <th className="py-2.5 font-medium">起止时间</th>
                  <th className="py-2.5 font-medium">剩余时间</th>
                  <th className="py-2.5 font-medium">状态</th>
                  <th className="py-2.5 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3">
                      <Link
                        href={`/info/${p.resourceId}`}
                        target="_blank"
                        className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 truncate max-w-xs block"
                      >
                        {p.listing?.title || p.resourceId}
                      </Link>
                      <div className="text-[11px] text-slate-400">
                        {p.listing?.category} · {p.listing?.area || "杨林"}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                        {p.promotionType}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.source === "ADMIN"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        }`}
                      >
                        {p.source === "ADMIN" ? "🎁 人工赠送" : "💳 自费购买"}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">
                      <div>始: {p.startAt ? new Date(p.startAt).toLocaleDateString() : "-"}</div>
                      <div>止: {p.endAt ? new Date(p.endAt).toLocaleDateString() : "-"}</div>
                    </td>
                    <td className="py-3 font-semibold text-orange-600">
                      {p.isActive ? p.remainingText : "已结束"}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-2">
                      {p.isActive ? (
                        <button
                          onClick={() => handleTogglePromo(p.id, false)}
                          className="px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-[11px]"
                        >
                          终止推广
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTogglePromo(p.id, true)}
                          className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-semibold text-[11px]"
                        >
                          恢复生效
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. 服务商认证审核 Tab */}
      {/* ========================================================= */}
      {activeTab === "providers" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                服务者与商户实名认证审核 ({providers.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                严把本地商家与专业服务者资质，审核通过后点亮蓝V勋章并开通公开专属主页
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span>状态:</span>
              {["PENDING", "APPROVED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setProviderStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    providerStatusFilter === st
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {st === "PENDING" ? "待审核" : st === "APPROVED" ? "已认证" : "已驳回"}
                </button>
              ))}
            </div>
          </div>

          {providers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              暂无当前状态的服务商记录
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm overflow-hidden">
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{p.name.slice(0, 2)}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {p.name}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                            {p.serviceCategory}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          p.verificationStatus === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700"
                            : p.verificationStatus === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {p.verificationStatus === "APPROVED"
                          ? "✓ 认证通过"
                          : p.verificationStatus === "PENDING"
                          ? "待审核"
                          : "已驳回"}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        电话: <strong>{p.phone}</strong> {p.wechat && `· 微信: ${p.wechat}`}
                      </div>
                      {p.yearsOfService && <div>从业经验: {p.yearsOfService}</div>}
                      {p.address && <div className="truncate">地址: {p.address}</div>}
                      {p.serviceAreas && (
                        <div className="text-[11px] text-slate-400">
                          服务区域: {p.serviceAreas.join(" · ")}
                        </div>
                      )}
                    </div>

                    {/* 营业执照/资质材料缩略图 */}
                    {p.licenseImages && p.licenseImages.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] text-slate-400 block mb-1">
                          资质与营业执照实拍:
                        </span>
                        <div className="flex gap-2">
                          {p.licenseImages.map((img: string, i: number) => (
                            <img
                              key={i}
                              src={img}
                              alt="license"
                              onClick={() => setPreviewImage(img)}
                              className="w-14 h-14 rounded-lg object-cover cursor-pointer border hover:opacity-80 transition-opacity"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 审核操作区 */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <Link
                      href={`/provider/${p.id}`}
                      target="_blank"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      预览公开主页 →
                    </Link>

                    {p.verificationStatus === "PENDING" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setRejectModalProvider(p)}
                          className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold"
                        >
                          驳回
                        </button>
                        <button
                          onClick={() => handleReviewProvider(p.id, "APPROVED")}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold"
                        >
                          通过认证
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. 套餐与价格配置 Tab */}
      {/* ========================================================= */}
      {activeTab === "pricing" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-500" />
                商业化推广套餐与价格策略 (DB 动态优先)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                价格与权益实时保存在数据库 `PromotionPackage` 表中，修改后全站前台即刻生效，绝不硬编码
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400">{pkg.packageKey}</span>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        {pkg.name}
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        pkg.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {pkg.enabled ? "启用中" : "已禁用"}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-xs text-amber-600 font-semibold">¥</span>
                    <span className="text-2xl font-black text-amber-600">
                      {(pkg.priceCents / 100).toFixed(2)}
                    </span>
                    {pkg.originalPriceCents && (
                      <span className="text-xs text-slate-400 line-through ml-1.5">
                        ¥{(pkg.originalPriceCents / 100).toFixed(2)}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 ml-2">/ {pkg.durationDays} 天</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                    {pkg.description || "适合快速曝光与成交"}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      包含核心权益:
                    </span>
                    <ul className="text-xs text-slate-500 space-y-1">
                      {pkg.benefits?.map((b: string, i: number) => (
                        <li key={i} className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setEditingPackage({ ...pkg })}
                    className="w-full py-2 rounded-xl bg-slate-200 hover:bg-amber-500 hover:text-white text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>修改价格与权益</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. 人工赠送/置顶 Tab */}
      {/* ========================================================= */}
      {activeTab === "admin_promote" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-xl mx-auto space-y-5">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              管理员人工置顶 / 赠送推广
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              可为政企公告、合作客户或重要便民信息直接赋能黄金置顶或精选推荐，不扣除任何微信款项，操作将记入审计日志。
            </p>
          </div>

          <form onSubmit={handleAdminPromote} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                便民信息 ID (可在前台详情页 URL 中复制，如 cmtzlmwcx0001...)
              </label>
              <input
                type="text"
                required
                value={giftListingId}
                onChange={(e) => setGiftListingId(e.target.value)}
                placeholder="请输入 Listing ID"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                赠送推广位类型
              </label>
              <select
                value={giftType}
                onChange={(e) => setGiftType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="TOP_3_DAYS">3天分类置顶 (TOP_3_DAYS)</option>
                <option value="TOP_7_DAYS">7天黄金置顶 (TOP_7_DAYS)</option>
                <option value="CATEGORY_FEATURED">分类精选推荐 (CATEGORY_FEATURED)</option>
                <option value="HOME_FEATURED">首页大厅推荐大横幅 (HOME_FEATURED)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                赠送生效天数
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={giftDays}
                onChange={(e) => setGiftDays(parseInt(e.target.value, 10))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={gifting}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              <span>{gifting ? "正在赋能..." : "确认赠送并即时激活"}</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* 模态框: 修改套餐价格与配置 */}
      {/* ========================================================= */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingPackage(null)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                编辑套餐配置: {editingPackage.name}
              </h3>
              <button onClick={() => setEditingPackage(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">套餐名称</label>
                <input
                  type="text"
                  required
                  value={editingPackage.name}
                  onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">现价 (分, 例如 2800 即 28元)</label>
                  <input
                    type="number"
                    required
                    value={editingPackage.priceCents}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, priceCents: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-amber-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    折合 {(editingPackage.priceCents / 100).toFixed(2)} 元
                  </span>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">划线原价 (分, 可选)</label>
                  <input
                    type="number"
                    value={editingPackage.originalPriceCents || 0}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        originalPriceCents: parseInt(e.target.value, 10) || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">有效时长 (天)</label>
                  <input
                    type="number"
                    required
                    value={editingPackage.durationDays}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, durationDays: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">是否启用</label>
                  <select
                    value={editingPackage.enabled ? "true" : "false"}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, enabled: e.target.value === "true" })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
                  >
                    <option value="true">启用正常对外展示</option>
                    <option value="false">隐藏/禁用</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">套餐宣传说明</label>
                <input
                  type="text"
                  value={editingPackage.description || ""}
                  onChange={(e) =>
                    setEditingPackage({ ...editingPackage, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPackage(null)}
                  className="px-4 py-2 rounded-lg border text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md"
                >
                  保存配置并生效
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* P3-1. 服务交易订单管理 Tab */}
      {/* ========================================================= */}
      {activeTab === "service_orders" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">订单状态:</span>
              {[
                { key: "ALL", label: "全部订单" },
                { key: "PAID", label: "待师傅接单" },
                { key: "ACCEPTED", label: "已接单" },
                { key: "IN_SERVICE", label: "履约中" },
                { key: "COMPLETED", label: "待客户核验" },
                { key: "CONFIRMED", label: "已完工放款" },
                { key: "CANCELLED", label: "已取消" },
                { key: "REFUNDED", label: "已退款" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setAdminServiceOrderStatus(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    adminServiceOrderStatus === f.key
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-400">
              共查询到 <strong className="text-teal-600 font-bold">{adminServiceOrders.length}</strong> 笔订单
            </div>
          </div>

          {/* 订单表格 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold">
                    <th className="p-3">订单编号 / 时间</th>
                    <th className="p-3">服务项目 / 品类</th>
                    <th className="p-3">客户联系信息</th>
                    <th className="p-3">履约师傅 / 商家</th>
                    <th className="p-3">订单金额 / 平台抽佣</th>
                    <th className="p-3">订单履约状态</th>
                    <th className="p-3 text-right">后台仲裁与处理</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {adminServiceOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        暂无符合条件的服务交易订单
                      </td>
                    </tr>
                  ) : (
                    adminServiceOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">{o.orderNo}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(o.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{o.productTitle}</div>
                          <div className="text-[11px] text-teal-600 mt-0.5">
                            [{o.pricingType || "标准化服务"}] {o.quantity} 件
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-900 dark:text-white">{o.contactName}</div>
                          <div className="text-[11px] text-slate-400">{o.contactPhone}</div>
                          <div className="text-[11px] text-slate-400">
                            [{o.serviceArea || "嵩明杨林"}] {o.addressDetail || o.serviceAddress || ""}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-900 dark:text-white">{o.provider?.name || "未知"}</div>
                          <div className="text-[11px] text-slate-400">{o.provider?.phone}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-red-600">¥{(((o.payAmountCents ?? o.totalAmountCents ?? o.amount ?? 0)) / 100).toFixed(2)}</div>
                          <div className="text-[11px] text-slate-400">
                            平台佣金: ¥{(((o.platformFeeCents ?? o.platformCommission ?? 0)) / 100).toFixed(2)} | 师傅: ¥{(((o.providerIncomeCents ?? o.providerAmount ?? 0)) / 100).toFixed(2)}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              o.status === "PAID"
                                ? "bg-blue-100 text-blue-700"
                                : o.status === "ACCEPTED"
                                ? "bg-sky-100 text-sky-700"
                                : o.status === "IN_SERVICE"
                                ? "bg-purple-100 text-purple-700"
                                : o.status === "COMPLETED"
                                ? "bg-amber-100 text-amber-700"
                                : o.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-700"
                                : o.status === "REFUNDED"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {o.status === "PAID" && "待接单"}
                            {o.status === "ACCEPTED" && "已接单"}
                            {o.status === "IN_SERVICE" && "服务中"}
                            {o.status === "COMPLETED" && "完工待验"}
                            {o.status === "CONFIRMED" && "已结算放款"}
                            {o.status === "CANCELLED" && "已取消"}
                            {o.status === "REFUNDED" && "已退款"}
                            {o.status === "PENDING_PAYMENT" && "待支付"}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {["PAID", "ACCEPTED", "IN_SERVICE", "COMPLETED"].includes(o.status) && (
                            <button
                              onClick={() => {
                                setArbitrateModalOrder(o);
                                setArbitrateAmountYuan((o.amount / 100).toFixed(2));
                              }}
                              className="px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-semibold"
                            >
                              仲裁退款
                            </button>
                          )}
                          <Link
                            href={`/orders/${o.id}`}
                            target="_blank"
                            className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-[11px] font-semibold inline-block"
                          >
                            详情 ›
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* P3-2. 财务结算中心 Tab */}
      {/* ========================================================= */}
      {activeTab === "settlements" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">结算单状态:</span>
              {[
                { key: "ALL", label: "全部" },
                { key: "PENDING", label: "待完工履约" },
                { key: "READY", label: "已验收待打款" },
                { key: "SETTLED", label: "已打款核销" },
                { key: "FROZEN", label: "争议已冻结" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setAdminSettlementStatus(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    adminSettlementStatus === f.key
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-400">
              共 <strong className="text-teal-600 font-bold">{adminSettlements.length}</strong> 笔结算记录
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold">
                    <th className="p-3">结算单号 / 创建时间</th>
                    <th className="p-3">服务商户 / 师傅</th>
                    <th className="p-3">关联订单号 / 项目</th>
                    <th className="p-3">结算打款金额</th>
                    <th className="p-3">结算状态</th>
                    <th className="p-3 text-right">核销操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {adminSettlements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        暂无符合条件的商户结算单
                      </td>
                    </tr>
                  ) : (
                    adminSettlements.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">{s.settlementNo}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(s.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-900 dark:text-white">{s.provider?.name || "未知"}</div>
                          <div className="text-[11px] text-slate-400">{s.provider?.phone}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-slate-700 dark:text-slate-300">{s.order?.orderNo || "-"}</div>
                          <div className="text-[11px] text-slate-400">{s.order?.productTitle}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-emerald-600 text-sm">
                            ¥{(((s.netAmountCents ?? s.amount ?? 0)) / 100).toFixed(2)}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              s.status === "READY"
                                ? "bg-amber-100 text-amber-700"
                                : s.status === "SETTLED"
                                ? "bg-emerald-100 text-emerald-700"
                                : s.status === "FROZEN"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {s.status === "READY" && "● 可打款核销"}
                            {s.status === "SETTLED" && "✓ 已划拨出账"}
                            {s.status === "FROZEN" && "✕ 争议已冻结"}
                            {s.status === "PENDING" && "⏳ 履约待验收"}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {s.status === "READY" && (
                            <button
                              onClick={() => handleSettlementAction(s.id, "CONFIRM_PAYOUT", "管理员后台核销打款")}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                            >
                              ✓ 确认打款出账
                            </button>
                          )}
                          {s.status === "PENDING" && (
                            <button
                              onClick={() => handleSettlementAction(s.id, "APPROVE")}
                              className="px-2.5 py-1 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 text-[11px] font-semibold"
                            >
                              提前核验
                            </button>
                          )}
                          {s.status !== "FROZEN" && s.status !== "SETTLED" && (
                            <button
                              onClick={() => handleSettlementAction(s.id, "FREEZE", "商户或订单涉嫌纠纷")}
                              className="px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-semibold"
                            >
                              冻结资金
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* P3-3. 每日财务对账大盘 Tab */}
      {/* ========================================================= */}
      {activeTab === "reconciliation" && (
        <div className="space-y-6">
          {/* 大盘指标 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-lg">
              <div className="text-xs opacity-90">服务交易总流水 (GMV)</div>
              <div className="text-xl sm:text-2xl font-black mt-1">
                ¥{adminReconciliation ? (adminReconciliation.summary.totalGmv / 100).toFixed(2) : "0.00"}
              </div>
              <div className="text-[11px] opacity-80 mt-1">全平台已支付服务款项</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">平台累计抽佣净收入</div>
              <div className="text-xl sm:text-2xl font-black text-teal-600 mt-1">
                ¥{adminReconciliation ? (adminReconciliation.summary.totalCommission / 100).toFixed(2) : "0.00"}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">佣金资金沉淀</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">商户应得总分润</div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                ¥{adminReconciliation ? (adminReconciliation.summary.totalProviderAmount / 100).toFixed(2) : "0.00"}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">履约师傅劳务所得</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">平台托管担保资金池</div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
                ¥{adminReconciliation ? (adminReconciliation.summary.inEscrowAmount / 100).toFixed(2) : "0.00"}
              </div>
              <div className="text-[11px] text-amber-600 mt-1">在途履约/待核验资金</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">累计已结算打款出账</div>
              <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
                ¥{adminReconciliation ? (adminReconciliation.summary.settledAmount / 100).toFixed(2) : "0.00"}
              </div>
              <div className="text-[11px] text-blue-500 mt-1">已打款划转给师傅</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">平账安全状态</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                {adminReconciliation?.summary.discrepancyCount === 0 ? "✅ 完全平账" : "⚠️ 有异常"}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {adminReconciliation?.summary.discrepancyCount === 0 ? "无账目悬空不平" : "需财务人工介入"}
              </div>
            </div>
          </div>

          {/* 每日对账趋势明细表 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              📑 近 7 日逐日财务对账流水清单
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold">
                    <th className="p-3">对账日期</th>
                    <th className="p-3">成交单量</th>
                    <th className="p-3">当日流水 (GMV)</th>
                    <th className="p-3">平台抽佣</th>
                    <th className="p-3">退款金额</th>
                    <th className="p-3">资金平账校验</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {adminReconciliation?.dailyTrend?.map((row: any) => (
                    <tr key={row.date} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-medium">{row.date}</td>
                      <td className="p-3">{row.orderCount} 单</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">¥{(row.gmv / 100).toFixed(2)}</td>
                      <td className="p-3 font-bold text-teal-600">¥{(row.commission / 100).toFixed(2)}</td>
                      <td className="p-3 text-red-600">¥{(row.refund / 100).toFixed(2)}</td>
                      <td className="p-3 text-emerald-600 font-semibold">✓ 平账吻合</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. 需求管理 Tab (P2 新增) */}
      {/* ========================================================= */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">状态筛选:</span>
              {[
                { key: "ALL", label: "全部需求" },
                { key: "PENDING_MATCH", label: "待匹配" },
                { key: "MATCHED", label: "师傅已响应" },
                { key: "IN_PROGRESS", label: "服务中" },
                { key: "COMPLETED", label: "已完工" },
                { key: "CANCELLED", label: "已取消" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setRequestStatusFilter(f.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    requestStatusFilter === f.key
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">共 {requests.length} 条服务需求</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold">
                  <tr>
                    <th className="p-3">需求单号 / 分类片区</th>
                    <th className="p-3">需求标题与内容</th>
                    <th className="p-3">客户称呼与联系电话</th>
                    <th className="p-3">期望时间 / 预算</th>
                    <th className="p-3">承接师傅</th>
                    <th className="p-3">状态</th>
                    <th className="p-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        暂无符合条件的服务需求
                      </td>
                    </tr>
                  ) : (
                    requests.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <div className="font-mono text-[11px] text-slate-400">{r.requestNo}</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                            {r.category} · {r.area}
                          </div>
                        </td>
                        <td className="p-3 max-w-xs">
                          <Link
                            href={`/info/requests/${r.id}`}
                            target="_blank"
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 line-clamp-1"
                          >
                            {r.title}
                          </Link>
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{r.description}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{r.contactName}</div>
                          <div className="text-blue-600 dark:text-blue-400 font-mono mt-0.5">{r.contactPhone}</div>
                        </td>
                        <td className="p-3">
                          <div>⏰ {r.preferredTime}</div>
                          <div className="text-amber-600 font-bold mt-0.5">
                            {r.budgetMin || r.budgetMax ? `¥${(r.budgetMin || 0) / 100} - ¥${(r.budgetMax || 0) / 100}` : "面议"}
                          </div>
                        </td>
                        <td className="p-3">
                          {r.selectedProvider ? (
                            <span className="font-semibold text-emerald-600">
                              {r.selectedProvider.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">已分发 {r._count?.leads || 0} 位师傅</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              r.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-700"
                                : r.status === "IN_PROGRESS"
                                ? "bg-blue-100 text-blue-700"
                                : r.status === "CANCELLED"
                                ? "bg-slate-100 text-slate-400"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {r.status === "COMPLETED"
                              ? "已完工"
                              : r.status === "IN_PROGRESS"
                              ? "服务中"
                              : r.status === "CANCELLED"
                              ? "已取消"
                              : "匹配中"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.status !== "COMPLETED" && (
                              <button
                                onClick={() => handleUpdateRequestStatus(r.id, "COMPLETED")}
                                className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold"
                              >
                                完工
                              </button>
                            )}
                            {r.status !== "CANCELLED" && (
                              <button
                                onClick={() => handleUpdateRequestStatus(r.id, "CANCELLED")}
                                className="px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-[11px]"
                              >
                                取消
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. 线索转化漏斗与统计 Tab (P2 新增) */}
      {/* ========================================================= */}
      {activeTab === "leads" && (
        <div className="space-y-6">
          {/* 转化漏斗 6 大阶段 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">1. 需求发布总量</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {funnel?.totalRequests || 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">居民发起的原始需求</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">2. 成功匹配师傅</div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {funnel?.matchedRequests || 0}
              </div>
              <div className="text-[11px] text-blue-600 mt-1">
                匹配率 {funnel?.matchRate || 0}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">3. 拨号与微信联系</div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {funnel?.contactCount || 0}
              </div>
              <div className="text-[11px] text-indigo-600 mt-1">真实联系互动行为</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">4. 师傅接单服务中</div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {funnel?.inProgressRequests || 0}
              </div>
              <div className="text-[11px] text-amber-600 mt-1">施工履行进行中</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">5. 顺利完工交付</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {funnel?.completedRequests || 0}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">
                完工率 {funnel?.completeRate || 0}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400">6. 客户真实评价</div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {funnel?.reviewedCount || 0}
              </div>
              <div className="text-[11px] text-rose-600 mt-1">
                评价沉淀率 {funnel?.reviewRate || 0}%
              </div>
            </div>
          </div>

          {/* 实时联系行为打点流水表 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                📈 实时联系与转化行为日志 (最近 50 条)
              </h3>
              <span className="text-xs text-slate-400">拨号 · 复制微信 · 查看主页留痕</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold">
                  <tr>
                    <th className="p-3">时间</th>
                    <th className="p-3">动作行为</th>
                    <th className="p-3">关联师傅 / 商家</th>
                    <th className="p-3">关联需求 / 来源</th>
                    <th className="p-3">操作用户</th>
                    <th className="p-3">访问 IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentContactEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        暂无联系打点记录
                      </td>
                    </tr>
                  ) : (
                    recentContactEvents.map((evt: any) => (
                      <tr key={evt.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-3 text-slate-500 font-mono text-[11px]">
                          {new Date(evt.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              evt.action === "CALL"
                                ? "bg-emerald-100 text-emerald-800"
                                : evt.action === "COPY_WECHAT"
                                ? "bg-blue-100 text-blue-800"
                                : evt.action === "VIEW_PHONE"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {evt.action === "CALL"
                              ? "📞 拨打电话"
                              : evt.action === "COPY_WECHAT"
                              ? "💬 复制微信"
                              : evt.action === "VIEW_PHONE"
                              ? "🔓 解锁号码"
                              : "👁️ 查看主页"}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {evt.provider ? evt.provider.name : "—"}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {evt.request ? evt.request.title : evt.source}
                        </td>
                        <td className="p-3 text-slate-500">
                          {evt.user ? evt.user.nickname || evt.user.username : "访客"}
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">
                          {evt.ip || "127.0.0.1"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. 真实评价治理 Tab (P2 新增) */}
      {/* ========================================================= */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">状态筛选:</span>
              {[
                { key: "ALL", label: "全部评价" },
                { key: "APPROVED", label: "正常公开展示" },
                { key: "HIDDEN", label: "已隐藏/违规下线" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setReviewStatusFilter(f.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    reviewStatusFilter === f.key
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">共 {reviews.length} 条客户评价</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold">
                  <tr>
                    <th className="p-3">星级 / 时间</th>
                    <th className="p-3">关联需求 / 被评师傅</th>
                    <th className="p-3">评价居民</th>
                    <th className="p-3">印象标签</th>
                    <th className="p-3">评价内容与师傅回复</th>
                    <th className="p-3">状态</th>
                    <th className="p-3 text-right">治理操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        暂无符合条件的真实评价
                      </td>
                    </tr>
                  ) : (
                    reviews.map((rev: any) => (
                      <tr key={rev.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <div className="text-amber-500 font-bold text-sm">
                            {"★".repeat(rev.rating)}
                            {"☆".repeat(5 - rev.rating)}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                            {rev.request?.title || "服务需求"}
                          </div>
                          <div className="text-blue-600 dark:text-blue-400 text-[11px] mt-0.5">
                            👨‍🔧 {rev.provider?.name}
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                          {rev.user?.nickname || rev.user?.username}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {rev.tags?.map((t: string) => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px]">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 max-w-sm">
                          <p className="text-slate-800 dark:text-slate-200 line-clamp-2">“{rev.content}”</p>
                          {rev.replyContent && (
                            <div className="text-[11px] text-slate-400 mt-1 bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded">
                              <span className="font-semibold text-blue-600">师傅回复：</span>
                              {rev.replyContent}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              rev.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {rev.status === "APPROVED" ? "公开展示" : "已隐藏"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {rev.status === "APPROVED" ? (
                            <button
                              onClick={() => handleModerateReview(rev.id, "HIDDEN")}
                              className="px-2.5 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 text-[11px] font-semibold"
                            >
                              隐藏评价
                            </button>
                          ) : (
                            <button
                              onClick={() => handleModerateReview(rev.id, "APPROVED")}
                              className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold"
                            >
                              恢复公开
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 模态框: 驳回服务商申请理由 */}
      {/* ========================================================= */}
      {rejectModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setRejectModalProvider(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 z-10 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              驳回服务商认证申请: {rejectModalProvider.name}
            </h3>
            <p className="text-xs text-slate-400">
              请填写驳回原因，该原因将通知用户以便其修改补充材料。
            </p>

            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="例: 上传的营业执照模糊无法识别，请重新拍照上传清晰原件。"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalProvider(null)}
                className="px-3.5 py-1.5 rounded-lg border text-xs text-slate-600"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleReviewProvider(rejectModalProvider.id, "REJECTED", rejectReasonInput)}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 模态框: 订单后台仲裁与强制退款 */}
      {/* ========================================================= */}
      {arbitrateModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setArbitrateModalOrder(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 z-10 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              后台仲裁与退款: {arbitrateModalOrder.orderNo}
            </h3>
            <p className="text-xs text-slate-400">
              项目: {arbitrateModalOrder.productTitle} · 实付: ¥{(arbitrateModalOrder.amount / 100).toFixed(2)}
            </p>

            <div>
              <label className="block text-xs text-slate-500 mb-1">退款金额 (元)</label>
              <input
                type="number"
                step="0.01"
                value={arbitrateAmountYuan}
                onChange={(e) => setArbitrateAmountYuan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">仲裁原因说明</label>
              <textarea
                rows={3}
                value={arbitrateReason}
                onChange={(e) => setArbitrateReason(e.target.value)}
                placeholder="例: 师傅未按时到场，且客户出具凭证有效，经核实执行全额退款。"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setArbitrateModalOrder(null)}
                className="px-3.5 py-1.5 rounded-lg border text-xs text-slate-600"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const amtCent = Math.round(parseFloat(arbitrateAmountYuan) * 100);
                  handleArbitrateOrder(arbitrateModalOrder.id, "FORCE_REFUND", amtCent, arbitrateReason);
                }}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
              >
                执行仲裁退款
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 资质材料 Lightbox 放大预览 */}
      {/* ========================================================= */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img src={previewImage} alt="license full preview" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 平台通用优惠券创建弹窗 */}
      {showPlatformCouponModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-500" />
                新建平台通用补贴券 (PLATFORM)
              </h3>
              <button
                onClick={() => setShowPlatformCouponModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlatformCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  优惠券标题 *
                </label>
                <input
                  required
                  type="text"
                  placeholder="例如：平台新客立减券 / 嵩明杨林生活满减券"
                  value={newPlatformCoupon.title}
                  onChange={(e) => setNewPlatformCoupon({ ...newPlatformCoupon, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    优惠券类型
                  </label>
                  <select
                    value={newPlatformCoupon.couponType}
                    onChange={(e) => setNewPlatformCoupon({ ...newPlatformCoupon, couponType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="FIXED">立减面额 (元)</option>
                    <option value="DISCOUNT">折扣 (折)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {newPlatformCoupon.couponType === "FIXED" ? "面额 (元) *" : "折扣率 (例如8.5折) *"}
                  </label>
                  <input
                    required
                    type="number"
                    step={newPlatformCoupon.couponType === "FIXED" ? "1" : "0.1"}
                    value={newPlatformCoupon.couponType === "FIXED" ? newPlatformCoupon.valueYuan : newPlatformCoupon.discountRate}
                    onChange={(e) => {
                      if (newPlatformCoupon.couponType === "FIXED") {
                        setNewPlatformCoupon({ ...newPlatformCoupon, valueYuan: e.target.value });
                      } else {
                        setNewPlatformCoupon({ ...newPlatformCoupon, discountRate: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    最低消费门槛 (元)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 为无门槛"
                    value={newPlatformCoupon.minSpendYuan}
                    onChange={(e) => setNewPlatformCoupon({ ...newPlatformCoupon, minSpendYuan: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    发行总量 (张)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newPlatformCoupon.totalQuantity}
                    onChange={(e) => setNewPlatformCoupon({ ...newPlatformCoupon, totalQuantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  适用类目
                </label>
                <select
                  value={newPlatformCoupon.applicableCategory}
                  onChange={(e) => setNewPlatformCoupon({ ...newPlatformCoupon, applicableCategory: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="ALL">全品类通用</option>
                  <option value="家电维修">家电维修</option>
                  <option value="家政保洁">家政保洁</option>
                  <option value="管道疏通">管道疏通</option>
                  <option value="开锁修锁">开锁修锁</option>
                  <option value="水电维修">水电维修</option>
                  <option value="同城跑腿">同城跑腿</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingPlatformCoupon}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer"
                >
                  {submittingPlatformCoupon ? "正在提交发行..." : "确认发布平台通用券"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
