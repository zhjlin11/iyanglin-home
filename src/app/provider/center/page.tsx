"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  Coins,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  Camera,
  X,
  RefreshCw,
} from "lucide-react";

export default function ProviderCenterPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"leads" | "pool" | "reviews" | "products" | "orders" | "wallet" | "crm" | "marketing" | "copilot">("orders");

  // P6 经营 Copilot 状态
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotInsight, setCopilotInsight] = useState<string | null>(null);
  const [copilotQuestion, setCopilotQuestion] = useState("");
  const [copilotAnswering, setCopilotAnswering] = useState(false);
  const [copilotAnswer, setCopilotAnswer] = useState<string | null>(null);

  const handleGenerateCopilotInsight = async () => {
    setCopilotLoading(true);
    setCopilotInsight(null);
    try {
      const res = await fetch("/api/ai/provider-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        setCopilotInsight(json.insight);
      } else {
        alert(json.error || "获取经营分析失败");
      }
    } catch {
      alert("网络异常，无法获取经营分析");
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleAskCopilot = async () => {
    if (!copilotQuestion.trim() || copilotAnswering) return;
    setCopilotAnswering(true);
    setCopilotAnswer(null);
    try {
      const res = await fetch("/api/ai/provider-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: copilotQuestion.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setCopilotAnswer(json.insight);
      } else {
        alert(json.error || "获取建议失败");
      }
    } catch {
      alert("网络异常，获取建议失败");
    } finally {
      setCopilotAnswering(false);
    }
  };

  // 回复评价表单状态
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // 更改营业状态
  const [changingStatus, setChangingStatus] = useState(false);

  // P3 扩展数据状态
  const [products, setProducts] = useState<any[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState("ALL");
  const [wallet, setWallet] = useState<any>(null);
  const [loadingP3, setLoadingP3] = useState(false);

  // P4 CRM 客户管理与营销活动状态
  const [crmData, setCrmData] = useState<any>(null);
  const [loadingCrm, setLoadingCrm] = useState(false);
  const [crmFilter, setCrmFilter] = useState<"ALL" | "REPEAT" | "FOLLOWERS" | "DUE">("ALL");
  const [activeCrmCustomer, setActiveCrmCustomer] = useState<any>(null);
  const [crmEditNotes, setCrmEditNotes] = useState("");
  const [crmEditTags, setCrmEditTags] = useState<string[]>([]);
  const [crmNextFollowUp, setCrmNextFollowUp] = useState("");
  const [savingCrmNote, setSavingCrmNote] = useState(false);

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [marketingCoupons, setMarketingCoupons] = useState<any[]>([]);
  const [loadingMarketing, setLoadingMarketing] = useState(false);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [newCampaignForm, setNewCampaignForm] = useState({
    title: "",
    subtitle: "",
    badgeText: "限时特惠",
    discountRate: "",
    discountYuan: "",
    startAt: "",
    endAt: "",
  });
  const [showNewCouponModal, setShowNewCouponModal] = useState(false);
  const [newCouponForm, setNewCouponForm] = useState({
    title: "",
    couponType: "FIXED",
    valueYuan: "10",
    discountRate: "9",
    minSpendYuan: "50",
    totalQuantity: "100",
    perUserLimit: "1",
  });
  const [showQrPosterModal, setShowQrPosterModal] = useState(false);

  // 弹窗状态
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    title: "",
    subtitle: "",
    category: "家电维修",
    priceYuan: "",
    unit: "次",
    content: "",
    included: "",
    excluded: "",
  });

  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionImageUrl, setCompletionImageUrl] = useState("");

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmountYuan, setPayoutAmountYuan] = useState("");
  const [payoutAccount, setPayoutAccount] = useState("");

  const fetchCenterData = async () => {
    try {
      const res = await fetch("/api/provider/center");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error("fetchCenterData error:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchP3Data = async () => {
    setLoadingP3(true);
    try {
      const pRes = await fetch("/api/services/products");
      const pJson = await pRes.json();
      if (pJson.success) {
        setProducts(pJson.data || []);
      }

      const oRes = await fetch("/api/provider/orders");
      const oJson = await oRes.json();
      if (oJson.success) {
        setServiceOrders(oJson.data || []);
      }

      const wRes = await fetch("/api/provider/settlement");
      const wJson = await wRes.json();
      if (wJson.success) {
        setWallet(wJson.data);
      }
    } catch (e) {
      console.error("fetchP3Data error:", e);
    } finally {
      setLoadingP3(false);
    }
  };

  const fetchCrmData = async () => {
    setLoadingCrm(true);
    try {
      const res = await fetch("/api/provider/crm/customers");
      const json = await res.json();
      if (json.success) {
        setCrmData(json.data);
      }
    } catch (e) {
      console.error("fetchCrmData error:", e);
    } finally {
      setLoadingCrm(false);
    }
  };

  const fetchMarketingData = async () => {
    setLoadingMarketing(true);
    try {
      const [cRes, mRes] = await Promise.all([
        fetch("/api/provider/marketing/campaigns").then((r) => r.json()).catch(() => ({})),
        fetch("/api/provider/marketing/coupons").then((r) => r.json()).catch(() => ({})),
      ]);
      if (cRes.success) setCampaigns(cRes.data || []);
      if (mRes.success) setMarketingCoupons(mRes.data || []);
    } catch (e) {
      console.error("fetchMarketingData error:", e);
    } finally {
      setLoadingMarketing(false);
    }
  };

  useEffect(() => {
    fetchCenterData();
    fetchP3Data();
    fetchCrmData();
    fetchMarketingData();
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      const res = await fetch("/api/provider/center", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatingStatus: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchCenterData();
      } else {
        alert(json.message || "更新状态失败");
      }
    } catch (err: any) {
      alert(err.message || "网络异常");
    } finally {
      setChangingStatus(false);
    }
  };

  const handleUpdateLead = async (leadId: string, status: string) => {
    try {
      const res = await fetch("/api/provider/center/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, status }),
      });
      const json = await res.json();
      if (json.success) {
        alert("线索状态已更新！");
        fetchCenterData();
      } else {
        alert(json.message || "更新失败");
      }
    } catch (err: any) {
      alert(err.message || "网络异常");
    }
  };

  const handleReplyReview = async (reviewId: string) => {
    if (!replyContent.trim()) {
      alert("请输入回复内容");
      return;
    }
    setSubmittingReply(true);
    try {
      const res = await fetch("/api/provider/center/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, replyContent: replyContent.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        alert("回复成功！已展示在评价卡片");
        setReplyingReviewId(null);
        setReplyContent("");
        fetchCenterData();
      } else {
        alert(json.message || "回复失败");
      }
    } catch (err: any) {
      alert(err.message || "网络异常");
    } finally {
      setSubmittingReply(false);
    }
  };

  // 师傅履约流转操作
  const handleOrderAction = async (orderId: string, action: string, extra: any = {}) => {
    try {
      const res = await fetch(`/api/service-orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message || "操作成功！");
        fetchP3Data();
      } else {
        alert(json.error || "操作失败");
      }
    } catch (err: any) {
      alert(err.message || "网络异常");
    }
  };

  // 提交完工凭证
  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingOrderId) return;
    const images = completionImageUrl.trim() ? [completionImageUrl.trim()] : [];
    await handleOrderAction(completingOrderId, "COMPLETE", {
      completionNotes: completionNotes.trim(),
      completionImages: images,
    });
    setCompletingOrderId(null);
    setCompletionNotes("");
    setCompletionImageUrl("");
  };

  // 创建标准化服务商品
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(newProductForm.priceYuan) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      alert("请输入有效的服务价格");
      return;
    }

    try {
      const res = await fetch("/api/services/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newProductForm.title.trim(),
          subtitle: newProductForm.subtitle.trim(),
          category: newProductForm.category,
          price: priceCents,
          unit: newProductForm.unit.trim() || "次",
          content: newProductForm.content.trim(),
          included: newProductForm.included.split("\n").filter((s) => s.trim()),
          excluded: newProductForm.excluded.split("\n").filter((s) => s.trim()),
          images: [
            "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80",
          ],
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert("服务商品发布成功并已上架！");
        setShowNewProductModal(false);
        setNewProductForm({
          title: "",
          subtitle: "",
          category: "家电维修",
          priceYuan: "",
          unit: "次",
          content: "",
          included: "",
          excluded: "",
        });
        fetchP3Data();
      } else {
        alert(json.error || "发布失败");
      }
    } catch (err: any) {
      alert(err.message || "网络异常");
    }
  };

  // 申请提现
  const handleApplyPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtCent = Math.round(parseFloat(payoutAmountYuan) * 100);
    if (isNaN(amtCent) || amtCent <= 0) {
      alert("请输入有效的提现金额");
      return;
    }

    try {
      const res = await fetch("/api/provider/settlement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amtCent,
          channel: "WECHAT",
          account: payoutAccount.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert("提现申请已提交！财务审核后将在1-2个工作日内打款。");
        setShowPayoutModal(false);
        setPayoutAmountYuan("");
        setPayoutAccount("");
        fetchP3Data();
      } else {
        alert(json.error || "提现申请失败");
      }
    } catch (err: any) {
      alert(err.message || "网络异常");
    }
  };

  // 保存客户 CRM 客情备注与标签
  const handleSaveCrmNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCrmCustomer) return;
    setSavingCrmNote(true);
    try {
      const res = await fetch("/api/provider/crm/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: activeCrmCustomer.customerId,
          tags: crmEditTags,
          notes: crmEditNotes,
          nextFollowUpAt: crmNextFollowUp || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert("客户客情备注已更新！");
        setActiveCrmCustomer(null);
        fetchCrmData();
      } else {
        alert(json.error || "更新失败");
      }
    } catch {
      alert("网络异常");
    } finally {
      setSavingCrmNote(false);
    }
  };

  // 创建店铺活动
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/provider/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCampaignForm),
      });
      const json = await res.json();
      if (json.success) {
        alert("店铺营销活动创建成功！已提交平台审核并生效");
        setShowNewCampaignModal(false);
        setNewCampaignForm({
          title: "",
          subtitle: "",
          badgeText: "限时特惠",
          discountRate: "",
          discountYuan: "",
          startAt: "",
          endAt: "",
        });
        fetchMarketingData();
      } else {
        alert(json.error || "创建失败");
      }
    } catch {
      alert("网络异常");
    }
  };

  // 切换店铺活动状态
  const handleToggleCampaign = async (campaignId: string, status: string) => {
    try {
      const res = await fetch("/api/provider/marketing/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, status }),
      });
      const json = await res.json();
      if (json.success) {
        fetchMarketingData();
      } else {
        alert(json.error || "操作失败");
      }
    } catch {
      alert("网络异常");
    }
  };

  // 创建商户优惠券
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/provider/marketing/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCouponForm.title,
          couponType: newCouponForm.couponType,
          valueYuan: newCouponForm.valueYuan,
          discountRate: newCouponForm.discountRate,
          minSpendYuan: newCouponForm.minSpendYuan,
          totalQuantity: parseInt(newCouponForm.totalQuantity, 10) || 100,
          perUserLimit: parseInt(newCouponForm.perUserLimit, 10) || 1,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert("店铺专享优惠券创建成功！用户可在您的主页免费领取");
        setShowNewCouponModal(false);
        setNewCouponForm({
          title: "",
          couponType: "FIXED",
          valueYuan: "10",
          discountRate: "9",
          minSpendYuan: "50",
          totalQuantity: "100",
          perUserLimit: "1",
        });
        fetchMarketingData();
      } else {
        alert(json.error || "创建失败");
      }
    } catch {
      alert("网络异常");
    }
  };

  // 切换优惠券开启/暂停
  const handleToggleCoupon = async (couponId: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/provider/marketing/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId, enabled }),
      });
      const json = await res.json();
      if (json.success) {
        fetchMarketingData();
      } else {
        alert(json.error || "操作失败");
      }
    } catch {
      alert("网络异常");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
        正在载入商家运营工作台...
      </div>
    );
  }

  if (!data?.isProvider) {
    return (
      <div style={{ maxWidth: "600px", margin: "60px auto", padding: "32px 20px", textAlign: "center", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🛠️</div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
          杨林生活网 · 服务商运营中心
        </h2>
        <p style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.6, marginBottom: "24px" }}>
          您当前尚未认证成为服务商或师傅。入驻认证后，您将获得：标准服务商品发布在线收款、本地需求优先撮合、平台担保资金钱包、客户真实评价沉淀等经营权益！
        </p>
        <Link
          href="/provider/apply"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            backgroundColor: "#0f766e",
            color: "#ffffff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.95rem",
          }}
        >
          🛡️ 立即申请入驻成为认证师傅/商家
        </Link>
      </div>
    );
  }

  const { provider, stats, myLeads = [], nearbyRequests = [], reviews = [] } = data;

  const filteredServiceOrders = serviceOrders.filter((o) => {
    if (orderFilter === "ALL") return true;
    if (orderFilter === "PENDING_ACCEPT") return o.status === "PAID";
    if (orderFilter === "IN_PROGRESS") return ["ACCEPTED", "IN_SERVICE"].includes(o.status);
    if (orderFilter === "COMPLETED") return o.status === "COMPLETED";
    if (orderFilter === "CONFIRMED") return o.status === "CONFIRMED";
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", paddingBottom: "60px" }}>
      {/* 顶部工作台抬头 */}
      <div style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "20px 16px" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <Link href="/info" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.85rem" }}>
              ‹ 返回生活大厅
            </Link>
            <div style={{ display: "flex", gap: "10px" }}>
              <Link
                href="/services"
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  backgroundColor: "#0f766e",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                🏪 浏览服务商城
              </Link>
              <Link
                href={`/provider/${provider.id}`}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "0.8rem",
                }}
              >
                预览我的服务主页 ›
              </Link>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            {/* 头像 */}
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                backgroundColor: "#1e293b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.8rem",
                border: "2px solid #0f766e",
              }}
            >
              {provider.avatar ? (
                <img src={provider.avatar} alt={provider.name} style={{ width: "100%", height: "100%", borderRadius: "12px", objectFit: "cover" }} />
              ) : (
                "👨‍🔧"
              )}
            </div>

            {/* 商家名称与标牌 */}
            <div style={{ flex: 1, minWidth: "220px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>{provider.name}</h1>
                <span style={{ backgroundColor: "#15803d", color: "#ffffff", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                  ✓ 认证通过
                </span>
                {provider.isMember && (
                  <span style={{ backgroundColor: "#f59e0b", color: "#ffffff", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                    ⭐ 金牌会员
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "4px" }}>
                主营分类：<span style={{ color: "#e2e8f0" }}>{provider.serviceCategory}</span> | 覆盖片区：{provider.serviceAreas?.join("、") || "杨林全区"}
              </div>
            </div>

            {/* 营业接单状态切换器 */}
            <div style={{ backgroundColor: "#1e293b", borderRadius: "10px", padding: "8px 12px", border: "1px solid #334155" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "6px" }}>当前接单状态：</div>
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  { key: "OPEN", label: "🟢 接单中" },
                  { key: "BUSY", label: "🟡 稍忙" },
                  { key: "PAUSED", label: "🔴 休息中" },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    disabled={changingStatus}
                    onClick={() => handleStatusChange(st.key)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid",
                      borderColor: provider.operatingStatus === st.key ? "#0f766e" : "#334155",
                      backgroundColor: provider.operatingStatus === st.key ? "rgba(15,118,110,0.3)" : "transparent",
                      color: provider.operatingStatus === st.key ? "#ffffff" : "#94a3b8",
                      fontSize: "0.8rem",
                      fontWeight: provider.operatingStatus === st.key ? 700 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1080px", margin: "16px auto", padding: "0 16px" }}>
        {/* 近7天经营数据速览 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "20px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", padding: "14px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>在售标准服务</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f766e", marginTop: "4px" }}>{products.length} 款</div>
          </div>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", padding: "14px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>平台担保订单</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#2563eb", marginTop: "4px" }}>{serviceOrders.length} 单</div>
          </div>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", padding: "14px", border: "1.5px solid #10b981", boxShadow: "0 2px 8px rgba(16,185,129,0.08)" }}>
            <div style={{ fontSize: "0.75rem", color: "#047857", fontWeight: "bold" }}>真实客户复购率</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#047857", marginTop: "4px" }}>
              {crmData?.stats?.repeatCustomerRate ?? 0}%
            </div>
          </div>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", padding: "14px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>累计服务客户</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {crmData?.stats?.totalCompletedCustomers ?? 0} 位
            </div>
          </div>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", padding: "14px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>可提现余额</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>
              ¥{wallet?.provider ? (wallet.provider.availableBalance / 100).toFixed(2) : "0.00"}
            </div>
          </div>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", padding: "14px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>待结算担保池</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
              ¥{wallet?.provider ? (wallet.provider.pendingBalance / 100).toFixed(2) : "0.00"}
            </div>
          </div>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", padding: "14px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>好评口碑</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#b45309", marginTop: "4px" }}>
              {stats.ratingCount >= 3 ? `${stats.ratingAvg.toFixed(1)}分` : "积累中"}
            </div>
          </div>
        </div>

        {/* Tab 导航切换 */}
        <div
          style={{
            display: "flex",
            borderBottom: "2px solid #e2e8f0",
            marginBottom: "16px",
            backgroundColor: "#ffffff",
            borderRadius: "8px 8px 0 0",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {[
            { key: "orders", label: `⚡ 履约订单 (${serviceOrders.length})` },
            { key: "crm", label: `👥 客户与复购 (${crmData?.customers?.length || 0})` },
            { key: "marketing", label: `🎯 营销与券 (${campaigns.length + marketingCoupons.length})` },
            { key: "products", label: `📦 服务商品 (${products.length})` },
            { key: "wallet", label: `💰 资金钱包与提现` },
            { key: "leads", label: `📬 专属线索 (${myLeads.length})` },
            { key: "pool", label: `📍 同城待抢池 (${nearbyRequests.length})` },
            { key: "reviews", label: `⭐ 客户评价 (${reviews.length})` },
            { key: "copilot", label: `🤖 经营 Copilot` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              style={{
                padding: "12px 18px",
                border: "none",
                borderBottom: activeTab === t.key ? "3px solid #0f766e" : "3px solid transparent",
                backgroundColor: "transparent",
                color: activeTab === t.key ? "#0f766e" : "#64748b",
                fontWeight: activeTab === t.key ? 700 : 500,
                fontSize: "0.9rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ================= Tab: 履约工作台 ================= */}
        {activeTab === "orders" && (
          <div>
            {/* Filter tags */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", overflowX: "auto" }}>
              {[
                { key: "ALL", label: "全部订单" },
                { key: "PENDING_ACCEPT", label: "待我接单" },
                { key: "IN_PROGRESS", label: "履约中" },
                { key: "COMPLETED", label: "待客户核验" },
                { key: "CONFIRMED", label: "已完工结算" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setOrderFilter(f.key)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "16px",
                    border: "1px solid",
                    borderColor: orderFilter === f.key ? "#0f766e" : "#cbd5e1",
                    backgroundColor: orderFilter === f.key ? "#0f766e" : "#ffffff",
                    color: orderFilter === f.key ? "#ffffff" : "#475569",
                    fontSize: "0.8rem",
                    fontWeight: orderFilter === f.key ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredServiceOrders.length === 0 ? (
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "40px", textAlign: "center", border: "1px solid #e2e8f0", color: "#64748b" }}>
                暂无符合条件的交易订单。用户在商城下单支付后，订单将第一时间在此显示并推送通知！
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {filteredServiceOrders.map((o) => (
                  <div key={o.id} style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", fontSize: "0.8rem", color: "#64748b" }}>
                      <div>
                        订单号: <strong style={{ color: "#334155" }}>{o.orderNo}</strong>
                        <span style={{ margin: "0 6px" }}>|</span>
                        <span>{new Date(o.createdAt).toLocaleString()}</span>
                      </div>
                      <span
                        style={{
                          backgroundColor:
                            o.status === "PAID"
                              ? "#dbeafe"
                              : o.status === "ACCEPTED"
                              ? "#e0f2fe"
                              : o.status === "IN_SERVICE"
                              ? "#ede9fe"
                              : o.status === "COMPLETED"
                              ? "#ccfbf1"
                              : o.status === "CONFIRMED"
                              ? "#dcfce7"
                              : "#f1f5f9",
                          color:
                            o.status === "PAID"
                              ? "#1e40af"
                              : o.status === "ACCEPTED"
                              ? "#0369a1"
                              : o.status === "IN_SERVICE"
                              ? "#6d28d9"
                              : o.status === "COMPLETED"
                              ? "#0f766e"
                              : o.status === "CONFIRMED"
                              ? "#15803d"
                              : "#475569",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: 700,
                        }}
                      >
                        {o.status === "PAID" && "🟢 待师傅接单"}
                        {o.status === "ACCEPTED" && "🔵 已接单待上门"}
                        {o.status === "IN_SERVICE" && "🟣 上门履约中"}
                        {o.status === "COMPLETED" && "🟡 师傅已完工待核验"}
                        {o.status === "CONFIRMED" && "✅ 客户已验收结款"}
                        {o.status === "CANCELLED" && "⚪ 已取消"}
                        {o.status === "REFUNDED" && "🔴 已退款"}
                      </span>
                    </div>

                    {/* Middle Content */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                          {o.product?.title || o.productTitle || "本地上门服务"}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "4px" }}>
                          预约时间：<strong style={{ color: "#0f766e" }}>{o.appointmentDate ? `${o.appointmentDate} ${o.appointmentTimeSlot || ""}` : (o.bookedTime || "尽快上门")}</strong>
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "2px" }}>
                          服务地点：[{o.district || o.serviceArea || "嵩明杨林"}] {o.addressDetail || o.serviceAddress || ""}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "2px" }}>
                          联系客户：{o.contactName} ({o.contactPhone})
                        </div>
                        {(o.userRemarks || o.remarks) && (
                          <div style={{ fontSize: "0.8rem", color: "#d97706", marginTop: "4px" }}>
                            客户备注：{o.userRemarks || o.remarks}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#dc2626" }}>
                          ¥{(((o.payAmountCents ?? o.totalAmountCents ?? o.amount ?? 0)) / 100).toFixed(2)}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                          预计到手分润: ¥{(((o.providerIncomeCents ?? o.providerAmount ?? 0)) / 100).toFixed(2)} (平台佣金 ¥{(((o.platformFeeCents ?? o.platformCommission ?? 0)) / 100).toFixed(2)})
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                      {o.status === "PAID" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOrderAction(o.id, "REJECT", { rejectReason: "师傅日程已满" })}
                            style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#64748b", fontSize: "0.8rem", cursor: "pointer" }}
                          >
                            婉拒订单
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOrderAction(o.id, "ACCEPT")}
                            style={{ padding: "6px 16px", borderRadius: "6px", border: "none", backgroundColor: "#0f766e", color: "#ffffff", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                          >
                            ✓ 确认接单
                          </button>
                        </>
                      )}

                      {o.status === "ACCEPTED" && (
                        <button
                          type="button"
                          onClick={() => handleOrderAction(o.id, "START")}
                          style={{ padding: "6px 16px", borderRadius: "6px", border: "none", backgroundColor: "#7c3aed", color: "#ffffff", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                        >
                          🚗 出发上门开始服务
                        </button>
                      )}

                      {o.status === "IN_SERVICE" && (
                        <button
                          type="button"
                          onClick={() => setCompletingOrderId(o.id)}
                          style={{ padding: "6px 16px", borderRadius: "6px", border: "none", backgroundColor: "#0f766e", color: "#ffffff", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                        >
                          📸 拍照上传凭证并完工
                        </button>
                      )}

                      {o.status === "COMPLETED" && (
                        <span style={{ fontSize: "0.8rem", color: "#0f766e", fontWeight: 600 }}>
                          已提交完工，等待客户核验放款（72小时超时自动放款）
                        </span>
                      )}

                      {o.status === "CONFIRMED" && (
                        <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 700 }}>
                          已结算到账，款项已划入可提现钱包
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= Tab: 客户CRM与复购中心 ================= */}
        {activeTab === "crm" && (
          <div>
            {/* 顶层经营与复购指标看板 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              <div style={{ background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>👥 累计服务客户</div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
                  {crmData?.stats?.totalCompletedCustomers || 0} <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "normal" }}>人</span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>在杨林生活网下单完工的真实用户</div>
              </div>
              <div style={{ background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>🔁 产生复购老客</div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#047857", marginTop: "4px" }}>
                  {crmData?.stats?.repeatCustomers || 0} <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "normal" }}>人</span>
                </div>
                <div style={{ fontSize: "11px", color: "#047857", marginTop: "2px" }}>≥2次下单履约的老客</div>
              </div>
              <div style={{ background: "white", padding: "16px", borderRadius: "12px", border: "1.5px solid #10b981", boxShadow: "0 2px 8px rgba(16,185,129,0.1)" }}>
                <div style={{ fontSize: "12px", color: "#047857", fontWeight: "bold" }}>📈 真实客户复购率</div>
                <div style={{ fontSize: "24px", fontWeight: "900", color: "#047857", marginTop: "4px" }}>
                  {crmData?.stats?.repeatCustomerRate || 0}%
                </div>
                <div style={{ fontSize: "11px", color: "#047857", marginTop: "2px" }}>复购客数 ÷ 完工客数 (同城核心指标)</div>
              </div>
              <div style={{ background: "white", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>⏰ 待跟进/回访</div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: (crmData?.stats?.dueFollowUpsCount || 0) > 0 ? "#dc2626" : "#64748b", marginTop: "4px" }}>
                  {crmData?.stats?.dueFollowUpsCount || 0} <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "normal" }}>人</span>
                </div>
                <div style={{ fontSize: "11px", color: (crmData?.stats?.dueFollowUpsCount || 0) > 0 ? "#dc2626" : "#64748b", marginTop: "2px" }}>
                  {(crmData?.stats?.dueFollowUpsCount || 0) > 0 ? "⚠️ 存在今日到期需回访客户" : "当前无超期回访提醒"}
                </div>
              </div>
            </div>

            {/* 到期回访紧急提醒条 */}
            {(crmData?.dueFollowUps?.length || 0) > 0 && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>🔔</span>
                  <div>
                    <span style={{ fontWeight: "bold", color: "#991b1b", fontSize: "13.5px" }}>
                      回访提醒：有 {crmData.dueFollowUps.length} 位客户已到达预约回访时间！
                    </span>
                    <span style={{ fontSize: "12px", color: "#b91c1c", marginLeft: "6px" }}>
                      （主动回访与定期维护可显著提升同城老客复购转介绍率）
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setCrmFilter("DUE")}
                  style={{ padding: "4px 12px", background: "#dc2626", color: "white", borderRadius: "6px", border: "none", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                >
                  查看待跟进客户
                </button>
              </div>
            )}

            {/* 客户列表与过滤 */}
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { key: "ALL", label: `全部客户 (${crmData?.customers?.length || 0})` },
                    { key: "REPEAT", label: `已复购老客 (${crmData?.stats?.repeatCustomers || 0})` },
                    { key: "FOLLOWERS", label: "关注粉丝" },
                    { key: "DUE", label: `待回访 (${crmData?.stats?.dueFollowUpsCount || 0})` },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setCrmFilter(f.key as any)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: crmFilter === f.key ? "bold" : "normal",
                        background: crmFilter === f.key ? "#0f766e" : "#f1f5f9",
                        color: crmFilter === f.key ? "white" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  🔒 严格数据安全隔离 · 电话号码脱敏保护
                </div>
              </div>

              {(!crmData?.customers || crmData.customers.length === 0) ? (
                <div style={{ padding: "50px 20px", textAlign: "center", color: "#94a3b8" }}>
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>👥</div>
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>暂无客户记录</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                    当用户在便民商城下单、发布线索指派或电话咨询后，将在此自动沉淀为您的私域客户档案
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", color: "#64748b", textAlign: "left" }}>
                        <th style={{ padding: "12px 16px" }}>客户姓名/脱敏电话</th>
                        <th style={{ padding: "12px 16px" }}>客情身份</th>
                        <th style={{ padding: "12px 16px" }}>订单频次与总额</th>
                        <th style={{ padding: "12px 16px" }}>最近服务时间</th>
                        <th style={{ padding: "12px 16px" }}>商家内部标签与备忘</th>
                        <th style={{ padding: "12px 16px" }}>回访提醒</th>
                        <th style={{ padding: "12px 16px", textAlign: "right" }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crmData.customers
                        .filter((c: any) => {
                          if (crmFilter === "REPEAT") return c.isRepeatCustomer;
                          if (crmFilter === "FOLLOWERS") return c.isFollower;
                          if (crmFilter === "DUE") return c.nextFollowUpAt && new Date(c.nextFollowUpAt) <= new Date() && !c.followUpCompleted;
                          return true;
                        })
                        .map((c: any) => (
                          <tr key={c.customerId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "14px 16px" }}>
                              <div style={{ fontWeight: "bold", color: "#0f172a" }}>{c.name}</div>
                              <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px", fontFamily: "monospace" }}>
                                📱 {c.phone}
                              </div>
                            </td>
                            <td style={{ padding: "14px 16px" }}>
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                {c.isRepeatCustomer && (
                                  <span style={{ fontSize: "10.5px", background: "#ecfdf5", color: "#047857", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>
                                    🔁 复购老客
                                  </span>
                                )}
                                {c.isFollower && (
                                  <span style={{ fontSize: "10.5px", background: "#fef3c7", color: "#b45309", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>
                                    ⭐ 粉丝关注
                                  </span>
                                )}
                                {!c.isRepeatCustomer && (
                                  <span style={{ fontSize: "10.5px", background: "#f1f5f9", color: "#64748b", padding: "2px 6px", borderRadius: "4px" }}>
                                    首单新客
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: "14px 16px" }}>
                              <div style={{ fontWeight: "bold", color: "#0f172a" }}>
                                {c.completedOrders} 完工 / {c.totalOrders} 预约
                              </div>
                              <div style={{ fontSize: "11.5px", color: "#dc2626", marginTop: "2px", fontWeight: "bold" }}>
                                ¥{((c.totalSpendCents || 0) / 100).toFixed(2)}
                              </div>
                            </td>
                            <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "12px" }}>
                              {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("zh-CN") : "近期"}
                            </td>
                            <td style={{ padding: "14px 16px" }}>
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "4px" }}>
                                {c.tags?.map((t: string, i: number) => (
                                  <span key={i} style={{ fontSize: "10.5px", background: "#e0f2fe", color: "#0369a1", padding: "1px 6px", borderRadius: "4px" }}>
                                    {t}
                                  </span>
                                ))}
                              </div>
                              <div style={{ fontSize: "12px", color: "#475569", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {c.notes || <span style={{ color: "#94a3b8" }}>无内部备忘</span>}
                              </div>
                            </td>
                            <td style={{ padding: "14px 16px" }}>
                              {c.nextFollowUpAt ? (
                                <div style={{ fontSize: "11.5px" }}>
                                  <span style={{ color: new Date(c.nextFollowUpAt) <= new Date() ? "#dc2626" : "#047857", fontWeight: "bold" }}>
                                    {new Date(c.nextFollowUpAt).toLocaleDateString("zh-CN")}
                                  </span>
                                  <div style={{ fontSize: "10.5px", color: "#94a3b8" }}>
                                    {c.followUpCompleted ? "已完成" : new Date(c.nextFollowUpAt) <= new Date() ? "⚠️ 今日到期" : "计划中"}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: "11px", color: "#cbd5e1" }}>未设置</span>
                              )}
                            </td>
                            <td style={{ padding: "14px 16px", textAlign: "right" }}>
                              <button
                                onClick={() => {
                                  setActiveCrmCustomer(c);
                                  setCrmEditTags(c.tags || []);
                                  setCrmEditNotes(c.notes || "");
                                  setCrmNextFollowUp(c.nextFollowUpAt ? c.nextFollowUpAt.slice(0, 10) : "");
                                }}
                                style={{
                                  padding: "5px 10px",
                                  background: "#f1f5f9",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  color: "#0f766e",
                                  cursor: "pointer",
                                }}
                              >
                                📝 编辑客情
                              </button>
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

        {/* ================= Tab: 营销活动与优惠券 ================= */}
        {activeTab === "marketing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* 顶栏操作区与线下海报生成入口 */}
            <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #0f766e 100%)", color: "white", padding: "18px 20px", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: "0 0 4px 0" }}>🎯 商家营销增长与老客召回中心</h3>
                <p style={{ fontSize: "12.5px", opacity: 0.9, margin: 0 }}>
                  自主配置店铺专享优惠券、开展限时促销，并通过专属物料二维码快速吸引同城老客复购！
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setShowQrPosterModal(true)}
                  style={{ padding: "8px 14px", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
                >
                  🪧 生成店铺立减海报
                </button>
                <button
                  onClick={() => setShowNewCouponModal(true)}
                  style={{ padding: "8px 14px", background: "white", color: "#065f46", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}
                >
                  + 新建店铺券
                </button>
                <button
                  onClick={() => setShowNewCampaignModal(true)}
                  style={{ padding: "8px 14px", background: "#f59e0b", color: "#78350f", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
                >
                  + 发起限时活动
                </button>
              </div>
            </div>

            {/* 板块 1: 店铺优惠券管理 */}
            <div style={{ background: "white", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>🎟️ 店铺专享优惠券 ({marketingCoupons.length})</h4>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>领取后可在下单时直接抵扣，成本由商家自主承担，利于提高转化率</p>
                </div>
                <button
                  onClick={() => setShowNewCouponModal(true)}
                  style={{ padding: "5px 12px", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                >
                  + 新建代金券
                </button>
              </div>

              {marketingCoupons.length === 0 ? (
                <div style={{ padding: "40px 10px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "8px" }}>
                  <div style={{ fontSize: "30px", marginBottom: "6px" }}>🎫</div>
                  <div style={{ fontSize: "13px" }}>暂无店铺代金券</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>创建一张满50减10元专享券，吸引周边老客与新客立即预约！</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
                  {marketingCoupons.map((c) => (
                    <div key={c.id} style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "16px", fontWeight: "800", color: "#047857" }}>
                            {c.couponType === "DISCOUNT" ? `${c.discountRate}折` : `¥${((c.valueCents || c.discountCents || 0) / 100)}`}
                          </span>
                          <span style={{ fontSize: "13.5px", fontWeight: "bold", color: "#0f172a" }}>{c.title}</span>
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>
                          {(c.minSpendCents || 0) > 0 ? `满 ¥${(c.minSpendCents / 100)} 可用` : "无门槛"} · 限领 {c.perUserLimit || 1} 张/人
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                          已领: {c.receivedQuantity || 0} / 已核销: {c.usedQuantity || 0}
                        </div>
                      </div>
                      <div>
                        <button
                          onClick={() => handleToggleCoupon(c.id, !c.enabled)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "none",
                            fontSize: "12px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            background: c.enabled ? "#fef2f2" : "#ecfdf5",
                            color: c.enabled ? "#dc2626" : "#047857",
                          }}
                        >
                          {c.enabled ? "暂停领取" : "恢复开启"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 板块 2: 限时营销活动 */}
            <div style={{ background: "white", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>📢 店铺营销活动 ({campaigns.length})</h4>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>展示于您的服务商主页与商城顶部推荐卡片</p>
                </div>
                <button
                  onClick={() => setShowNewCampaignModal(true)}
                  style={{ padding: "5px 12px", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                >
                  + 发起活动
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div style={{ padding: "40px 10px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "8px" }}>
                  <div style={{ fontSize: "30px", marginBottom: "6px" }}>🎯</div>
                  <div style={{ fontSize: "13px" }}>暂无发起的营销活动</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
                  {campaigns.map((camp) => (
                    <div key={camp.id} style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "10.5px", background: "#fef2f2", color: "#dc2626", padding: "1px 6px", borderRadius: "4px", fontWeight: "bold" }}>
                              {camp.badgeText || "特惠"}
                            </span>
                            <span style={{ fontWeight: "bold", fontSize: "14px", color: "#0f172a" }}>{camp.title}</span>
                          </div>
                          {camp.subtitle && <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{camp.subtitle}</div>}
                        </div>
                        <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold", background: camp.status === "ACTIVE" ? "#ecfdf5" : "#f1f5f9", color: camp.status === "ACTIVE" ? "#047857" : "#64748b" }}>
                          {camp.status === "ACTIVE" ? "进行中" : camp.status === "PENDING_REVIEW" ? "审核中" : "已下线"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid #f1f5f9", fontSize: "12px" }}>
                        <span style={{ color: "#dc2626", fontWeight: "bold" }}>
                          {camp.discountRate ? `${camp.discountRate}折优惠` : camp.discountCents ? `直降 ¥${(camp.discountCents/100)}` : "限时让利"}
                        </span>
                        <button
                          onClick={() => handleToggleCampaign(camp.id, camp.status === "ACTIVE" ? "OFFLINE" : "ACTIVE")}
                          style={{ padding: "3px 8px", background: "white", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "11.5px", cursor: "pointer" }}
                        >
                          {camp.status === "ACTIVE" ? "下线" : "上线"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= Tab: 服务商品管理 ================= */}
        {activeTab === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                管理您在服务商城公开展示并供用户直接在线下单的标准化服务项目
              </div>
              <button
                type="button"
                onClick={() => setShowNewProductModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  backgroundColor: "#0f766e",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Plus size={16} />
                <span>发布新标准化服务</span>
              </button>
            </div>

            {products.length === 0 ? (
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "40px", textAlign: "center", border: "1px dashed #cbd5e1" }}>
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📦</div>
                <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>暂未发布标准化服务商品</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "14px" }}>
                  发布明码标价服务，用户可直接在线下单支付，提升 3 倍成单效率！
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(true)}
                  style={{ padding: "8px 20px", borderRadius: "20px", backgroundColor: "#0f766e", color: "#ffffff", border: "none", fontWeight: 700, cursor: "pointer" }}
                >
                  立即发布
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
                {products.map((p) => (
                  <div key={p.id} style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <span style={{ backgroundColor: "#f0fdf4", color: "#15803d", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>
                        {p.category}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: p.status === "ONLINE" ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
                        {p.status === "ONLINE" ? "● 在架可购" : "○ 已下架"}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 6px 0", color: "#0f172a" }}>{p.title}</h3>
                    {p.subtitle && (
                      <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "10px", lineHeight: 1.4 }}>
                        {p.subtitle}
                      </div>
                    )}

                    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                      <div>
                        <span style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: 700 }}>¥</span>
                        <span style={{ fontSize: "1.3rem", color: "#dc2626", fontWeight: 900 }}>{(p.price / 100).toFixed(0)}</span>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>/{p.unit || "次"}</span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>已售 {p.salesCount || 0} 件</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= Tab: 资金钱包与提现 ================= */}
        {activeTab === "wallet" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "20px" }}>
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>可提现到账余额</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#16a34a", margin: "6px 0" }}>
                  ¥{wallet?.provider ? (wallet.provider.availableBalance / 100).toFixed(2) : "0.00"}
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(true)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "16px",
                    backgroundColor: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  申请提现 ›
                </button>
              </div>

              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>待结算平台担保金额</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#d97706", margin: "6px 0" }}>
                  ¥{wallet?.provider ? (wallet.provider.pendingBalance / 100).toFixed(2) : "0.00"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  买家核验完工或超时72小时后自动转入可提现余额
                </div>
              </div>

              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>累计已结算提现</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0f172a", margin: "6px 0" }}>
                  ¥{wallet?.provider ? (wallet.provider.settledAmount / 100).toFixed(2) : "0.00"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  当前商户抽佣费率: {wallet?.provider?.commissionRate ? `${(wallet.provider.commissionRate * 100).toFixed(1)}%` : "5.0% (首发优惠)"}
                </div>
              </div>
            </div>

            {/* Settlements History */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 14px 0" }}>
                📜 结算与资金划拨流水
              </h3>

              {wallet?.settlements && wallet.settlements.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {wallet.settlements.map((s: any) => (
                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "8px", backgroundColor: "#f8fafc", fontSize: "0.85rem" }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>结算编号: {s.settlementNo}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                          关联订单: {s.order?.orderNo} · {new Date(s.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#16a34a" }}>
                          +¥{(s.amount / 100).toFixed(2)}
                        </div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: s.status === "SETTLED" ? "#16a34a" : s.status === "READY" ? "#0f766e" : "#d97706",
                          }}
                        >
                          {s.status === "SETTLED" ? "✓ 已划款出账" : s.status === "READY" ? "● 可打款核销" : "⏳ 担保待核验"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: "0.85rem" }}>
                  暂无资金结算记录
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= Tab: 匹配给我的专属线索 ================= */}
        {activeTab === "leads" && (
          <div>
            {myLeads.length === 0 ? (
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "40px", textAlign: "center", border: "1px solid #e2e8f0", color: "#64748b" }}>
                暂无新匹配线索，请保持营业状态为【接单中】，新需求发布时系统将自动匹配并给您推送！
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {myLeads.map((item: any) => {
                  const req = item.request;
                  return (
                    <div key={item.id} style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>
                            {req.category}
                          </span>
                          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>📍 {req.area}</span>
                        </div>
                        <span style={{ fontSize: "0.8rem", color: item.status === "MATCHED" ? "#f59e0b" : "#16a34a", fontWeight: 600 }}>
                          {item.status === "MATCHED" ? "待联系" : "已跟进"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.95rem", color: "#1e293b", fontWeight: 600, marginBottom: "8px" }}>{req.title}</div>
                      <div style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "12px" }}>{req.description}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                        <a
                          href={`tel:${req.contactPhone}`}
                          onClick={() => handleUpdateLead(item.id, "CONTACTED")}
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", backgroundColor: "#0f766e", color: "#ffffff", padding: "6px 14px", borderRadius: "16px", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}
                        >
                          <Phone size={14} />
                          <span>拨打客户电话</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= Tab: 同城待抢池 ================= */}
        {activeTab === "pool" && (
          <div>
            {nearbyRequests.length === 0 ? (
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "40px", textAlign: "center", border: "1px solid #e2e8f0", color: "#64748b" }}>
                当前暂无等待接单的同城需求，系统将在出现新需求时实时为您推荐！
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {nearbyRequests.map((req: any) => (
                  <div key={req.id} style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>
                        {req.category}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>📍 {req.area}</span>
                    </div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>{req.title}</div>
                    <div style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "10px" }}>{req.description}</div>
                    <Link
                      href={`/info/requests/${req.id}`}
                      style={{ fontSize: "0.8rem", color: "#0f766e", fontWeight: 600, textDecoration: "none" }}
                    >
                      查看需求详情抢单 ›
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= Tab: 客户评价 ================= */}
        {activeTab === "reviews" && (
          <div>
            {reviews.length === 0 ? (
              <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "40px", textAlign: "center", border: "1px solid #e2e8f0", color: "#64748b" }}>
                暂无客户评价。完成服务后请引导客户在订单详情中给予好评，真实口碑将大大提高系统派单权重！
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {reviews.map((rev: any) => (
                  <div key={rev.id} style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>{rev.authorName || "杨林街坊"}</span>
                      <span style={{ color: "#d97706", fontWeight: 700 }}>{rev.rating} ★</span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#334155", lineHeight: 1.5, marginBottom: "8px" }}>
                      {rev.content}
                    </div>
                    {rev.replyContent && (
                      <div style={{ backgroundColor: "#f8fafc", padding: "8px 12px", borderRadius: "6px", fontSize: "0.8rem", color: "#475569", marginTop: "6px" }}>
                        <strong style={{ color: "#0f766e" }}>您的回复：</strong> {rev.replyContent}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= Tab: 经营 Copilot ================= */}
        {activeTab === "copilot" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px" }}>🤖</span>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      商家经营智能 Copilot 顾问
                    </h3>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 0 0" }}>
                    基于您店铺真实完成单量、近7天线上营收、客户拨打与评价指标生成的量化经营诊断
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateCopilotInsight}
                  disabled={copilotLoading}
                  style={{
                    backgroundColor: "#0f766e",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    opacity: copilotLoading ? 0.6 : 1,
                  }}
                >
                  <span>{copilotLoading ? "正在诊断分析中..." : "🚀 诊断本周经营状态"}</span>
                </button>
              </div>

              {copilotInsight ? (
                <div style={{ backgroundColor: "#f8fafc", borderRadius: "10px", padding: "18px", border: "1px solid #e2e8f0", fontSize: "0.88rem", lineHeight: "1.7", color: "#334155", whiteSpace: "pre-wrap" }}>
                  {copilotInsight}
                </div>
              ) : (
                <div style={{ backgroundColor: "#f8fafc", borderRadius: "10px", padding: "32px", textAlign: "center", border: "1px dashed #cbd5e1", color: "#64748b", fontSize: "0.88rem" }}>
                  点击右上角「诊断本周经营状态」，AI 将结合店铺数据生成量身定制的拓客、定价与服务改进建议。
                </div>
              )}

              {/* Ask Question to Copilot */}
              <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f1f5f9" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                  💬 向经营顾问提问
                </h4>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={copilotQuestion}
                    onChange={(e) => setCopilotQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAskCopilot()}
                    placeholder="例如：“我想多接大学城片区的订单，商品标题应该怎么写？”..."
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAskCopilot}
                    disabled={copilotAnswering || !copilotQuestion.trim()}
                    style={{
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0 18px",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      opacity: copilotAnswering || !copilotQuestion.trim() ? 0.6 : 1,
                    }}
                  >
                    {copilotAnswering ? "思考中..." : "咨询建议"}
                  </button>
                </div>

                {copilotAnswer && (
                  <div style={{ marginTop: "14px", backgroundColor: "#f0fdfa", borderRadius: "10px", padding: "16px", border: "1px solid #ccfbf1", fontSize: "0.88rem", lineHeight: "1.6", color: "#0f766e", whiteSpace: "pre-wrap" }}>
                    {copilotAnswer}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Complete Order Modal */}
      {completingOrderId && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "420px", width: "100%" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 12px 0" }}>提交完工凭证与验收说明</h3>
            <form onSubmit={handleCompleteOrder}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>完工说明</label>
                <textarea
                  rows={2}
                  required
                  placeholder="如：空调内外机已深度高温蒸汽消毒清洗，排水试机正常..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>现场完工照片 URL（选填）</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={completionImageUrl}
                  onChange={(e) => setCompletionImageUrl(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setCompletingOrderId(null)} style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}>
                  取消
                </button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: "6px", border: "none", backgroundColor: "#0f766e", color: "#ffffff", fontWeight: 700 }}>
                  确认完工并提请验收
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Service Product Modal */}
      {showNewProductModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "520px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>发布标准化服务商品</h3>
              <button onClick={() => setShowNewProductModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>
                  服务标题 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="如：挂式空调深度拆洗除菌保养"
                  value={newProductForm.title}
                  onChange={(e) => setNewProductForm({ ...newProductForm, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>
                  简明卖点/副标题
                </label>
                <input
                  type="text"
                  placeholder="如：140度高温蒸汽杀菌 · 30分钟极速上门"
                  value={newProductForm.subtitle}
                  onChange={(e) => setNewProductForm({ ...newProductForm, subtitle: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>服务类目</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="家电维修">家电维修</option>
                    <option value="电脑维修">电脑维修</option>
                    <option value="家政保洁">家政保洁</option>
                    <option value="搬家运输">搬家运输</option>
                    <option value="上门安装">上门安装</option>
                    <option value="宠物基础服务">宠物服务</option>
                    <option value="技能培训体验课">技能体验</option>
                    <option value="企业简单服务">企业服务</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>价格 (元) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="88.00"
                    value={newProductForm.priceYuan}
                    onChange={(e) => setNewProductForm({ ...newProductForm, priceYuan: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>计费单位</label>
                  <input
                    type="text"
                    placeholder="台 / 次 / 户"
                    value={newProductForm.unit}
                    onChange={(e) => setNewProductForm({ ...newProductForm, unit: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>
                  包含服务范围（每行一项）
                </label>
                <textarea
                  rows={2}
                  placeholder="专业工具作业&#10;拆装清洗与除菌&#10;试运行通电检验"
                  value={newProductForm.included}
                  onChange={(e) => setNewProductForm({ ...newProductForm, included: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>
                  不包含服务内容（每行一项）
                </label>
                <textarea
                  rows={2}
                  placeholder="核心压缩机配件更换&#10;高空特种施工费"
                  value={newProductForm.excluded}
                  onChange={(e) => setNewProductForm({ ...newProductForm, excluded: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: "20px",
                  border: "none",
                  backgroundColor: "#0f766e",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                确认并立即上架
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "400px", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>申请资金提现</h3>
              <button onClick={() => setShowPayoutModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyPayout}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>提现金额 (元) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder={`最多可提 ¥${((wallet?.provider?.availableBalance ?? 0) / 100).toFixed(2)}`}
                  value={payoutAmountYuan}
                  onChange={(e) => setPayoutAmountYuan(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>微信到账手机号 / 微信号</label>
                <input
                  type="text"
                  required
                  placeholder="用于核销打款的微信绑定手机号"
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: "20px",
                  border: "none",
                  backgroundColor: "#16a34a",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                确认提交提现
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CRM 编辑客情与回访弹窗 */}
      {activeCrmCustomer && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "480px", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>📝 客户客情备注与回访安排</h3>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  客户：{activeCrmCustomer.name} (📱 {activeCrmCustomer.phone})
                </div>
              </div>
              <button onClick={() => setActiveCrmCustomer(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCrmNote}>
              {/* 快捷标签选取 */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", color: "#475569", marginBottom: "6px" }}>
                  商户内部客情标签 (点击添加/移除)
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                  {["高频老客", "大额客户", "待定期回访", "优质口碑", "定期保洁", "家电检修", "急需师傅"].map((tag) => {
                    const isSelected = crmEditTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => {
                          if (isSelected) {
                            setCrmEditTags(crmEditTags.filter((t) => t !== tag));
                          } else {
                            setCrmEditTags([...crmEditTags, tag]);
                          }
                        }}
                        style={{
                          padding: "3px 10px",
                          borderRadius: "14px",
                          border: isSelected ? "1.5px solid #0f766e" : "1px solid #cbd5e1",
                          background: isSelected ? "#ecfdf5" : "#f8fafc",
                          color: isSelected ? "#065f46" : "#475569",
                          fontSize: "12px",
                          fontWeight: isSelected ? "bold" : "normal",
                          cursor: "pointer",
                        }}
                      >
                        {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 内部备忘笔记 */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", color: "#475569", marginBottom: "4px" }}>
                  客户习惯 / 房屋设备备忘 (仅自己可见)
                </label>
                <textarea
                  rows={3}
                  value={crmEditNotes}
                  onChange={(e) => setCrmEditNotes(e.target.value)}
                  placeholder="例如：家里有两只金毛；老房子水管老化建议半年复查；偏好周末上午服务..."
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              {/* 下次主动回访日期 */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", color: "#475569", marginBottom: "4px" }}>
                  📅 设置下次建议回访/保养提醒日期
                </label>
                <input
                  type="date"
                  value={crmNextFollowUp}
                  onChange={(e) => setCrmNextFollowUp(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                />
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                  到达该日期时，工作台顶部将亮起回访红点提醒，方便您主动问候或赠送老客券
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setActiveCrmCustomer(null)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", color: "#64748b", fontWeight: "bold", cursor: "pointer" }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={savingCrmNote}
                  style={{ flex: 1, padding: "10px 0", borderRadius: "8px", border: "none", background: "#0f766e", color: "white", fontWeight: "bold", cursor: "pointer" }}
                >
                  {savingCrmNote ? "保存中..." : "保存客情记录"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 创建店铺专享券弹窗 */}
      {showNewCouponModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "440px", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>🎟️ 创建店铺专享优惠券</h3>
              <button onClick={() => setShowNewCouponModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>优惠券名称 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：师傅专享满减券 / 老客回馈券"
                  value={newCouponForm.title}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>减免金额 (元) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="10"
                    value={newCouponForm.valueYuan}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, valueYuan: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>使用门槛 (元) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="50 (0为无门槛)"
                    value={newCouponForm.minSpendYuan}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, minSpendYuan: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>发放总量 (张)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newCouponForm.totalQuantity}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, totalQuantity: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>每人限领 (张)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newCouponForm.perUserLimit}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, perUserLimit: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{ width: "100%", padding: "10px 0", borderRadius: "20px", border: "none", backgroundColor: "#0f766e", color: "white", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}
              >
                确认创建代金券
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 创建营销活动弹窗 */}
      {showNewCampaignModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "440px", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>📢 发起店铺营销活动</h3>
              <button onClick={() => setShowNewCampaignModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>活动主标题 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：春季家政大促 / 空调清洗专享8.8折"
                  value={newCampaignForm.title}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>副标题 / 优惠说明</label>
                <input
                  type="text"
                  placeholder="例如：预约即赠精美抹布一组，限时立享"
                  value={newCampaignForm.subtitle}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, subtitle: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>折扣率 (折, 可选)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="9.9"
                    placeholder="8.8"
                    value={newCampaignForm.discountRate}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, discountRate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "4px" }}>角标标签</label>
                  <input
                    type="text"
                    value={newCampaignForm.badgeText}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, badgeText: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{ width: "100%", padding: "10px 0", borderRadius: "20px", border: "none", backgroundColor: "#f59e0b", color: "#78350f", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}
              >
                确认并提交审核发布
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 线下海报与二维码弹窗 */}
      {showQrPosterModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", maxWidth: "380px", width: "100%", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>🪧 店铺名片与扫码立减海报</h3>
              <button onClick={() => setShowQrPosterModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            {/* 打印卡片预览 */}
            <div style={{ border: "2px solid #0f766e", borderRadius: "14px", padding: "20px", background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", color: "#0f766e", fontWeight: "bold", letterSpacing: "1px" }}>杨林生活网 · 认证服务商</div>
              <div style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", marginTop: "6px" }}>{provider.name}</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>主营：{provider.serviceCategory}</div>

              {/* 二维码 */}
              <div style={{ margin: "16px auto", width: "160px", height: "160px", background: "white", padding: "8px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://iyanglin.com/provider/${provider.id}`}
                  alt="店铺二维码"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>

              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#047857" }}>
                📱 微信扫码一键预约 / 领立减券
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                📞 预约电话：{provider.phone || "在线咨询"}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowQrPosterModal(false)}
                style={{ flex: 1, padding: "10px 0", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", color: "#64748b", fontWeight: "bold", cursor: "pointer" }}
              >
                关闭
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ flex: 1, padding: "10px 0", borderRadius: "8px", border: "none", background: "#0f766e", color: "white", fontWeight: "bold", cursor: "pointer" }}
              >
                🖨️ 打印 / 保存海报
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
