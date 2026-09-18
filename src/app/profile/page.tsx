"use client";

import { useEffect, useState, useRef } from "react";
import { detectPaymentScene, invokeWeixinPay } from "@/lib/payment-utils";
import { createPortal } from "react-dom";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { PromotionSheet } from "@/components/info/PromotionSheet";

type UserProfile = {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  wechatAvatar?: string;
  wechatNickname?: string;
  role: string;
  status: string;
  createdAt: string;
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  content: string;
  link?: string;
  readAt?: string;
  createdAt: string;
};

type FavoriteItem = {
  id: string;
  resourceType: string;
  resourceId: string;
  title: string;
  link: string;
  createdAt: string;
};

type PublishedItem = {
  id: string;
  module: string;
  title: string;
  status: string;
  link: string;
  createdAt: string;
};

type ShopItem = {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  hours: string;
  intro: string;
  status: string;
  createdAt: string;
};

type JobItem = {
  id: string;
  title: string;
  company: string;
  salary: string;
  area: string;
  jobType: string;
  status: string;
  createdAt: string;
};

type HouseItem = {
  id: string;
  title: string;
  houseType: string;
  price: string;
  layout: string;
  location: string;
  contact: string;
  status: string;
  createdAt: string;
};

type DatingItem = {
  id: string;
  nickname: string;
  gender: string;
  occupation: string;
  income: string;
  location: string;
  intro: string;
  contact: string;
  status: string;
  createdAt: string;
};

type PointAccount = {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  lastCheckin: string | null;
  checkedInToday: boolean;
};

type PointTransaction = {
  id: string;
  amount: number;
  type: string;
  remark: string;
  createdAt: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [counts, setCounts] = useState({ published: 0, favorites: 0, comments: 0, signups: 0, unreadNotifications: 0 });
  const [publishedList, setPublishedList] = useState<PublishedItem[]>([]);
  const [favoritesList, setFavoritesList] = useState<FavoriteItem[]>([]);
  const [favoriteCategory, setFavoriteCategory] = useState<string>("ALL");
  const [favRemovingId, setFavRemovingId] = useState<string | null>(null);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"published" | "favorites" | "notifications" | "security" | "shops" | "jobs" | "houses" | "dating" | "points" | "coins" | "membership" | "follows" | "coupons" | "services" | "verification">("published");
  const [shopsList, setShopsList] = useState<ShopItem[]>([]);
  const [jobsList, setJobsList] = useState<JobItem[]>([]);
  const [housesList, setHousesList] = useState<HouseItem[]>([]);
  const [datingList, setDatingList] = useState<DatingItem[]>([]);

  // P5 Verification Center & Identity States
  const [verificationRecords, setVerificationRecords] = useState<any[]>([]);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    verifyType: "REAL_NAME",
    idCardName: "",
    idCardNoMasked: "",
    companyName: "",
    licenseNo: "",
  });
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");

  // P5 Points Redemption States
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState("");

  // P5 Notifications Category & Read All
  const [notifCategory, setNotifCategory] = useState<string>("ALL");
  const [readAllLoading, setReadAllLoading] = useState(false);

  // P5 Unified Published Filter
  const [allPublishedChannel, setAllPublishedChannel] = useState<string>("ALL");

  // P4 Follows, Coupons & Services states
  const [followsList, setFollowsList] = useState<any[]>([]);
  const [userCouponsList, setUserCouponsList] = useState<any[]>([]);
  const [couponStats, setCouponStats] = useState<{ available: number; used: number; expired: number }>({ available: 0, used: 0, expired: 0 });
  const [couponFilterTab, setCouponFilterTab] = useState<"AVAILABLE" | "USED" | "EXPIRED">("AVAILABLE");
  const [commonServicesList, setCommonServicesList] = useState<any[]>([]);

  // Coins & Membership states
  const [coinBalance, setCoinBalance] = useState(0);
  const [coinPackages, setCoinPackages] = useState<any[]>([]);
  const [coinTransactions, setCoinTransactions] = useState<any[]>([]);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeMsg, setRechargeMsg] = useState("");
  const [membershipPackages, setMembershipPackages] = useState<any[]>([]);
  const [activeMembership, setActiveMembership] = useState<any>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberMsg, setMemberMsg] = useState("");

  // 微信安全支付收银台状态
  const [cashierModal, setCashierModal] = useState<{
    open: boolean;
    title: string;
    targetTitle: string;
    amountYuan: string;
    amountCents: number;
    orderNo: string | null;
    codeUrl: string | null;
    paymentScene: "JSAPI" | "H5" | "NATIVE";
    jsapiParams: any;
    loading: boolean;
    checking: boolean;
    success: boolean;
    error: string;
  }>({
    open: false,
    title: "",
    targetTitle: "",
    amountYuan: "0.00",
    amountCents: 0,
    orderNo: null,
    codeUrl: null,
    paymentScene: "NATIVE",
    jsapiParams: null,
    loading: false,
    checking: false,
    success: false,
    error: "",
  });
  const cashierPollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [promoteListing, setPromoteListing] = useState<{ id: string; title: string } | null>(null);

  // Points states
  const [pointAccount, setPointAccount] = useState<PointAccount | null>(null);
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([]);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinMsg, setCheckinMsg] = useState("");

  // Modals & Form states
  const [editOpen, setEditOpen] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editUploading, setEditUploading] = useState(false);
  const [editMsg, setEditMsg] = useState("");
  const [editErr, setEditErr] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [secMsg, setSecMsg] = useState("");
  const [secErr, setSecErr] = useState("");

  const [shopEditOpen, setShopEditOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<ShopItem | null>(null);
  const [shopForm, setShopForm] = useState({ name: "", phone: "", address: "", hours: "", intro: "" });

  const [jobEditOpen, setJobEditOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobItem | null>(null);
  const [jobForm, setJobForm] = useState({ title: "", company: "", salary: "", area: "", body: "" });

  const [houseEditOpen, setHouseEditOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<HouseItem | null>(null);
  const [houseForm, setHouseForm] = useState({ title: "", price: "", layout: "", location: "", contact: "" });

  const [datingEditOpen, setDatingEditOpen] = useState(false);
  const [editingDating, setEditingDating] = useState<DatingItem | null>(null);
  const [datingForm, setDatingForm] = useState({ nickname: "", occupation: "", income: "", location: "", intro: "", contact: "" });
  const [imgError, setImgError] = useState(false);
  const [mobileView, setMobileView] = useState<"dashboard" | "detail">("dashboard");

  
  const handleRemoveFavorite = async (e: React.MouseEvent, favId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (favRemovingId) return;
    setFavRemovingId(favId);
    try {
      const res = await fetch(`/api/favorites?id=${favId}`, { method: "DELETE" });
      if (res.ok) {
        setFavoritesList((prev) => prev.filter((f) => f.id !== favId));
      }
    } catch {
      // ignore
    } finally {
      setFavRemovingId(null);
    }
  };

  const handleRefreshListing = async (listingId: string) => {
    try {
      const res = await fetch(`/api/info/${listingId}/refresh`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "信息已成功刷新排位，重新提升至首页前列！");
        loadData();
      } else {
        alert(data.error || "刷新失败，请稍后再试");
      }
    } catch {
      alert("网络异常，刷新失败");
    }
  };

  const getResourceTypeBadge = (type: string) => {
    const t = String(type || "").toUpperCase();
    switch (t) {
      case "JOB": return { label: "招聘", bg: "#EFF6FF", color: "#2563EB" };
      case "HOUSE": return { label: "房产", bg: "#FEF3C7", color: "#D97706" };
      case "INDUSTRIAL": return { label: "招商", bg: "#EEF2FF", color: "#4F46E5" };
      case "COMMUNITY_POST":
      case "POST": return { label: "社区", bg: "#ECFDF5", color: "#059669" };
      case "MERCHANT":
      case "SHOP": return { label: "商家", bg: "#FEF2F2", color: "#DC2626" };
      case "ARTICLE": return { label: "资讯", bg: "#F0F9FF", color: "#0284C7" };
      case "PRODUCT":
      case "LISTING": return { label: "商品", bg: "#FFF1F2", color: "#E11D48" };
      case "DATING": return { label: "相亲", bg: "#FDF2F8", color: "#DB2777" };
      case "EVENT": return { label: "活动", bg: "#F5F3FF", color: "#7C3AED" };
      default: return { label: "便民", bg: "#F1F5F9", color: "#64748B" };
    }
  };

  const filteredFavorites = favoritesList.filter((fav) => {
    if (favoriteCategory === "ALL") return true;
    const t = String(fav.resourceType || "").toUpperCase();
    if (favoriteCategory === "JOB") return t === "JOB";
    if (favoriteCategory === "HOUSE") return t === "HOUSE";
    if (favoriteCategory === "INDUSTRIAL") return t === "INDUSTRIAL";
    if (favoriteCategory === "COMMUNITY") return t === "COMMUNITY_POST" || t === "POST";
    if (favoriteCategory === "MERCHANT") return t === "MERCHANT" || t === "SHOP";
    if (favoriteCategory === "PRODUCT") return t === "PRODUCT" || t === "LISTING";
    return true;
  });

  const loadData = async () => {
    try {
      const resMe = await fetch("/api/user/profile");
      if (!resMe.ok) {
        window.location.href = "/login";
        return;
      }
      const dataMe = await resMe.json();
      setUser(dataMe.user);
      setCounts(dataMe.counts);

      const [
        resPub,
        resFav,
        resNotif,
        resShops,
        resJobs,
        resHouses,
        resDating,
        resPoints,
        resCoins,
        resMemb,
        resFollows,
        resCoupons,
        resPrefs,
        resVerif,
        resAllPub,
      ] = await Promise.all([
        fetch("/api/user/published").then((r) => r.json()).catch(() => ({})),
        fetch("/api/user/favorites").then((r) => r.json()).catch(() => ({})),
        fetch("/api/notifications").then((r) => r.json()).catch(() => ({})),
        fetch("/api/user/shops").then((r) => r.json()).catch(() => ({})),
        fetch("/api/user/jobs").then((r) => r.json()).catch(() => ({})),
        fetch("/api/user/houses").then((r) => r.json()).catch(() => ({})),
        fetch("/api/user/dating").then((r) => r.json()).catch(() => ({})),
        fetch("/api/user/points").then((r) => r.json()).catch(() => ({})),
        fetch("/api/wallet/coins").then((r) => r.json()).catch(() => ({})),
        fetch("/api/membership").then((r) => r.json()).catch(() => ({})),
        fetch("/api/provider/follow").then((r) => r.json()).catch(() => ({})),
        fetch("/api/user/coupons").then((r) => r.json()).catch(() => ({})),
        fetch("/api/user/preferences").then((r) => r.json()).catch(() => ({})),
        fetch("/api/user/verification").then((r) => r.json()).catch(() => ({})),
        fetch("/api/user/all-published").then((r) => r.json()).catch(() => ({})),
      ]);

      setPublishedList(resPub.items || []);
      setFavoritesList(resFav.favorites || []);
      setNotificationsList(resNotif.notifications || []);
      setShopsList(resShops.shops || []);
      setJobsList(resJobs.jobs || []);
      setHousesList(resHouses.houses || []);
      setDatingList(resDating.profiles || []);
      setFollowsList(resFollows?.follows || []);
      setUserCouponsList(resCoupons?.coupons || []);
      if (resCoupons?.stats) setCouponStats(resCoupons.stats);
      setCommonServicesList(resPrefs?.frequentServices || []);
      setVerificationRecords(resVerif?.records || []);

      if (resPoints.account) {
        setPointAccount(resPoints.account);
        setPointTransactions(resPoints.transactions || []);
      }
      if (resCoins.balance !== undefined) {
        setCoinBalance(resCoins.balance);
        setCoinPackages(resCoins.packages || []);
        setCoinTransactions(resCoins.transactions || []);
      }
      if (resMemb.packages) {
        setMembershipPackages(resMemb.packages || []);
        setActiveMembership(resMemb.activeMembership || null);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleReadAllNotifications = async () => {
    if (readAllLoading) return;
    setReadAllLoading(true);
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (res.ok) {
        setNotificationsList((prev) =>
          prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
        );
        setCounts((prev) => ({ ...prev, unreadNotifications: 0 }));
      }
    } catch (err) {
      console.error("Read all notifications failed:", err);
    } finally {
      setReadAllLoading(false);
    }
  };

  const handleRedeemPoints = async (type: "COUPON_10" | "TOPPING_3D" | "PLUS_15D") => {
    if (redeemLoading) return;
    setRedeemLoading(true);
    setRedeemMsg("");
    try {
      const res = await fetch("/api/user/points/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redemptionType: type }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRedeemMsg(`🎉 ${data.message}`);
        loadData();
      } else {
        alert(data.error || "兑换失败，请稍后重试");
      }
    } catch {
      alert("网络异常，兑换失败");
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifySubmitting) return;
    setVerifySubmitting(true);
    setVerifyMsg("");
    try {
      const res = await fetch("/api/user/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifyMsg("✅ 认证申请已提交，平台工作人员将在 1 个工作日内完成审核！");
        setVerifyModalOpen(false);
        loadData();
      } else {
        alert(data.error || "提交失败");
      }
    } catch {
      alert("网络异常，提交失败");
    } finally {
      setVerifySubmitting(false);
    }
  };

  const handleUnfollow = async (e: React.MouseEvent, providerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("确定取消关注该师傅/商户吗？")) return;
    try {
      const res = await fetch(`/api/provider/${providerId}/follow`, { method: "POST" });
      if (res.ok) {
        setFollowsList((prev) => prev.filter((f) => f.provider?.id !== providerId && f.providerId !== providerId));
      }
    } catch {
      alert("网络异常，请稍后再试");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam) {
      setActiveTab(tabParam as any);
    }
    loadData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const handleLogoutAll = async () => {
    if (!window.confirm("确定要强行注销并退出全平台所有设备（包括手机、平板与其他电脑）的登录状态吗？")) return;
    const res = await fetch("/api/auth/logout-all", { method: "POST" });
    if (res.ok) {
      alert("所有设备已成功注销退出，请重新登录！");
      window.location.href = "/login";
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecMsg("");
    setSecErr("");
    if (newPassword.length < 6) {
      setSecErr("新密码至少 6 位");
      return;
    }
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSecMsg("密码修改成功！");
        setOldPassword("");
        setNewPassword("");
      } else {
        setSecErr(data.error || "修改失败，请检查原密码");
      }
    } catch {
      setSecErr("网络错误，请稍后重试");
    }
  };

  const handleCheckin = async () => {
    if (checkinLoading || pointAccount?.checkedInToday) return;
    setCheckinLoading(true);
    setCheckinMsg("");
    try {
      const res = await fetch("/api/user/points/checkin", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setCheckinMsg(`🎉 签到成功！获得 +${data.earned} 积分！`);
        loadData();
      } else {
        setCheckinMsg(data.error || "今日已签到");
      }
    } catch {
      setCheckinMsg("签到请求失败，请稍后再试");
    } finally {
      setCheckinLoading(false);
    }
  };

  // 停止收银台轮询
  const stopCashierPolling = () => {
    if (cashierPollTimer.current) {
      clearInterval(cashierPollTimer.current);
      cashierPollTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCashierPolling();
    };
  }, []);

  // 启动轮询检查支付状态
  const startCashierPolling = (orderNo: string) => {
    stopCashierPolling();
    cashierPollTimer.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?orderNo=${encodeURIComponent(orderNo)}`);
        const data = await res.json();
        if (data.paid) {
          stopCashierPolling();
          setCashierModal((prev) => ({ ...prev, success: true, checking: false }));
          loadData();
          setTimeout(() => {
            setCashierModal((prev) => ({ ...prev, open: false, success: false }));
          }, 1800);
        }
      } catch {
        // ignore error during polling
      }
    }, 2500);
  };

  // 1. 金币充值套餐 -> 唤起微信收银台
  const handleOpenCoinCashier = async (pkg: any) => {
    stopCashierPolling();
    const amountCents = pkg.priceCents || (pkg.price ? Math.round(pkg.price * 100) : 1000);
    const amountYuan = (amountCents / 100).toFixed(2);

    setCashierModal({
      open: true,
      title: "杨林金币钱包 · 在线充值",
      targetTitle: `充值 ${pkg.coins} 金币套餐`,
      amountYuan,
      amountCents,
      orderNo: null,
      codeUrl: null,
      paymentScene: "NATIVE",
      jsapiParams: null,
      loading: true,
      checking: false,
      success: false,
      error: "",
    });

    try {
      // 创建充值订单
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKind: "coin",
          targetId: user?.id || "current_user",
          targetTitle: `金币充值 - ${pkg.coins}金币`,
          planName: pkg.name || `${pkg.coins}金币套餐`,
          amountCents,
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.orderNo) {
        setCashierModal((prev) => ({
          ...prev,
          loading: false,
          error: orderData.error || "创建微信支付订单失败，请重试",
        }));
        return;
      }

      setCashierModal((prev) => ({ ...prev, orderNo: orderData.orderNo }));
      // 检测支付场景
      const scene = detectPaymentScene();
      setCashierModal((prev) => ({ ...prev, paymentScene: scene }));

      // 获取微信支付参数
      try {
        const payRes = await fetch("/api/payment/wechat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNo: orderData.orderNo, paymentScene: scene }),
        });
        const payData = await payRes.json();

        if (payData.needOAuth && payData.oauthUrl) {
          // 需要微信授权
          window.location.href = payData.oauthUrl;
          return;
        }

        if (scene === "JSAPI" && payData.jsapiParams) {
          setCashierModal((prev) => ({ ...prev, jsapiParams: payData.jsapiParams, loading: false }));
          // 直接拉起微信支付
          try {
            const payResult = await invokeWeixinPay(payData.jsapiParams);
            if (payResult === "success") {
              startCashierPolling(orderData.orderNo);
            } else if (payResult === "cancel") {
              setCashierModal((prev) => ({ ...prev, error: "您已取消支付" }));
            } else {
              setCashierModal((prev) => ({ ...prev, error: "支付未完成，请重试" }));
            }
          } catch (e) {
            setCashierModal((prev) => ({ ...prev, error: "拉起微信支付失败，请重试" }));
          }
          return;
        }

        if (scene === "H5" && payData.mwebUrl) {
          window.location.href = payData.mwebUrl;
          return;
        }

        if (payData.codeUrl) {
          setCashierModal((prev) => ({ ...prev, codeUrl: payData.codeUrl }));
        }
      } catch {
        // fallback
      }

      setCashierModal((prev) => ({ ...prev, loading: false }));

      // 启动轮询检查到账
      startCashierPolling(orderData.orderNo);
    } catch {
      setCashierModal((prev) => ({
        ...prev,
        loading: false,
        error: "发起微信支付异常，请检查网络后重试",
      }));
    }
  };

  // 2. 会员套餐开通 -> 唤起微信收银台
  const handleOpenMemberCashier = async (pkg: any) => {
    stopCashierPolling();
    const amountCents = pkg.priceCents || 9800;
    const amountYuan = (amountCents / 100).toFixed(2);

    setCashierModal({
      open: true,
      title: "杨林生活网 · 会员VIP特权开通",
      targetTitle: `开通 ${pkg.name}`,
      amountYuan,
      amountCents,
      orderNo: null,
      codeUrl: null,
      paymentScene: "NATIVE",
      jsapiParams: null,
      loading: true,
      checking: false,
      success: false,
      error: "",
    });

    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKind: "membership",
          targetId: user?.id || "current_user",
          targetTitle: pkg.name,
          planName: pkg.name,
          amountCents,
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.orderNo) {
        setCashierModal((prev) => ({
          ...prev,
          loading: false,
          error: orderData.error || "创建会员支付订单失败，请重试",
        }));
        return;
      }

      setCashierModal((prev) => ({ ...prev, orderNo: orderData.orderNo }));
      const scene2 = detectPaymentScene();
      setCashierModal((prev) => ({ ...prev, paymentScene: scene2 }));

      try {
        const payRes = await fetch("/api/payment/wechat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNo: orderData.orderNo, paymentScene: scene2 }),
        });
        const payData = await payRes.json();

        if (payData.needOAuth && payData.oauthUrl) {
          window.location.href = payData.oauthUrl;
          return;
        }

        if (scene2 === "JSAPI" && payData.jsapiParams) {
          setCashierModal((prev) => ({ ...prev, jsapiParams: payData.jsapiParams, loading: false }));
          try {
            const payResult = await invokeWeixinPay(payData.jsapiParams);
            if (payResult === "success") {
              startCashierPolling(orderData.orderNo);
            } else if (payResult === "cancel") {
              setCashierModal((prev) => ({ ...prev, error: "您已取消支付" }));
            } else {
              setCashierModal((prev) => ({ ...prev, error: "支付未完成，请重试" }));
            }
          } catch (e) {
            setCashierModal((prev) => ({ ...prev, error: "拉起微信支付失败，请重试" }));
          }
          return;
        }

        if (scene2 === "H5" && payData.mwebUrl) {
          window.location.href = payData.mwebUrl;
          return;
        }

        if (payData.codeUrl) {
          setCashierModal((prev) => ({ ...prev, codeUrl: payData.codeUrl }));
        }
      } catch {
        // fallback
      }

      setCashierModal((prev) => ({ ...prev, loading: false }));
      startCashierPolling(orderData.orderNo);
    } catch {
      setCashierModal((prev) => ({
        ...prev,
        loading: false,
        error: "发起微信支付异常，请稍后重试",
      }));
    }
  };

  // 手动核验完成支付
  const handleVerifyCashier = async () => {
    if (!cashierModal.orderNo) return;
    setCashierModal((prev) => ({ ...prev, checking: true, error: "" }));

    try {
      // 先检查本地状态
      const res = await fetch(`/api/payment/status?orderNo=${encodeURIComponent(cashierModal.orderNo)}`);
      const data = await res.json();
      if (data.paid) {
        stopCashierPolling();
        setCashierModal((prev) => ({ ...prev, success: true, checking: false }));
        loadData();
        setTimeout(() => {
          setCashierModal((prev) => ({ ...prev, open: false, success: false }));
        }, 1800);
        return;
      }

      // 主动向微信查询确认
      const verifyRes = await fetch("/api/payment/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo: cashierModal.orderNo }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.paid) {
        stopCashierPolling();
        setCashierModal((prev) => ({ ...prev, success: true, checking: false }));
        loadData();
        setTimeout(() => {
          setCashierModal((prev) => ({ ...prev, open: false, success: false }));
        }, 1800);
      } else {
        setCashierModal((prev) => ({
          ...prev,
          checking: false,
          error: verifyData.message || "未检测到微信支付到账，请确认微信已完成付款后再点击核验",
        }));
      }
    } catch {
      setCashierModal((prev) => ({ ...prev, checking: false, error: "核验请求异常，请重试" }));
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditMsg("");
    setEditErr("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: editNickname, avatar: editAvatar }),
      });
      if (res.ok) {
        setEditMsg("资料保存成功！");
        setTimeout(() => {
          setEditOpen(false);
          loadData();
        }, 1000);
      } else {
        const d = await res.json();
        setEditErr(d.error || "保存失败");
      }
    } catch {
      setEditErr("网络请求异常");
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setEditUploading(true);
    setEditErr("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setEditAvatar(data.url);
      } else {
        setEditErr(data.error || "头像上传失败");
      }
    } catch {
      setEditErr("上传失败，请稍后再试");
    } finally {
      setEditUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <style>{`@media(max-width:767px){.p-loading-nav{display:none!important}}`}</style>
        <div className="p-loading-nav"><Navbar /></div>
        <div style={{ padding: "5rem 1rem", textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: "28px", marginBottom: "1rem" }}>⏳</div>
          <div style={{ fontWeight: "bold" }}>正在载入您的个人中心...</div>
        </div>
      </div>
    );
  }

  const displayName = user?.nickname || user?.username || "尊敬的会员";
  const isVip = !!activeMembership;

  // 模块和状态的中文映射（移动端前台不允许出现英文枚举）
  const modLabel = (m: string): string => ({ house: "房产", job: "招聘", shop: "商家", dating: "相亲", article: "资讯", community: "帖子", info: "二手", active: "活动" }[m?.toLowerCase()] || m);
  const staLabel = (s: string): string => ({ ACTIVE: "已发布", active: "已发布", approved: "已发布", PENDING: "审核中", pending: "审核中", REJECTED: "已拒绝", rejected: "已拒绝", OFFLINE: "已下架", offline: "已下架", EXPIRED: "已过期", expired: "已过期" }[s] || s);
  const staColor = (s: string): string => ({ ACTIVE: "#16a34a", active: "#16a34a", approved: "#16a34a", PENDING: "#d97706", pending: "#d97706", REJECTED: "#dc2626", rejected: "#dc2626", OFFLINE: "#94a3b8", offline: "#94a3b8", EXPIRED: "#94a3b8", expired: "#94a3b8" }[s] || "#64748b");
  const goDetail = (tab: string) => { setActiveTab(tab as any); setMobileView("detail"); };

  const renderCouponsTab = () => {
    const filteredCoupons = userCouponsList.filter((uc) => {
      const isExpired = uc.status === "EXPIRED" || (uc.status === "AVAILABLE" && new Date(uc.expiresAt) < new Date());
      if (couponFilterTab === "EXPIRED") return isExpired;
      if (couponFilterTab === "USED") return uc.status === "USED";
      return uc.status === "AVAILABLE" && !isExpired;
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 4px 0", color: "#0f172a" }}>🎟️ 我的优惠券与消费卡包</h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>立减、折扣与专享复购券，下单时自动匹配立省！</p>
          </div>
          <Link href="/services" style={{ padding: "6px 14px", background: "#047857", color: "white", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", textDecoration: "none" }}>
            去逛便民商城 🛒
          </Link>
        </div>

        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
          {[
            { key: "AVAILABLE", label: `可使用 (${couponStats.available})` },
            { key: "USED", label: `已使用 (${couponStats.used})` },
            { key: "EXPIRED", label: `已失效 (${couponStats.expired})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCouponFilterTab(tab.key as any)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: "none",
                fontSize: "13px",
                fontWeight: couponFilterTab === tab.key ? "bold" : "normal",
                background: couponFilterTab === tab.key ? "#047857" : "#f1f5f9",
                color: couponFilterTab === tab.key ? "white" : "#475569",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredCoupons.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#94a3b8", background: "white", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>🎫</div>
            <div style={{ fontSize: "14px", fontWeight: "600" }}>暂无此类优惠券</div>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>前往商户主页或服务详情页即可免费领取代金券</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {filteredCoupons.map((uc) => {
              const c = uc.coupon || {};
              const isAvailable = couponFilterTab === "AVAILABLE";
              const isPlatform = c.issuerType === "PLATFORM";

              return (
                <div
                  key={uc.id}
                  style={{
                    background: "white",
                    borderRadius: "14px",
                    border: isAvailable ? (isPlatform ? "1.5px solid #f59e0b" : "1.5px solid #10b981") : "1px solid #e2e8f0",
                    boxShadow: isAvailable ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                    opacity: isAvailable ? 1 : 0.65,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ display: "flex", flex: 1 }}>
                    <div
                      style={{
                        width: "90px",
                        background: isAvailable
                          ? (isPlatform ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #059669, #047857)")
                          : "#94a3b8",
                        color: "white",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "12px 6px",
                        textAlign: "center",
                      }}
                    >
                      {c.couponType === "DISCOUNT" ? (
                        <div style={{ fontSize: "22px", fontWeight: "900" }}>
                          {c.discountRate || 9}<span style={{ fontSize: "12px" }}>折</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: "22px", fontWeight: "900" }}>
                          <span style={{ fontSize: "13px" }}>¥</span>{Math.floor((c.valueCents || 0) / 100)}
                        </div>
                      )}
                      <div style={{ fontSize: "10.5px", opacity: 0.9, marginTop: "2px" }}>
                        {(c.minSpendCents || 0) > 0 ? `满¥${Math.floor(c.minSpendCents / 100)}可用` : "无门槛"}
                      </div>
                    </div>

                    <div style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              fontWeight: "bold",
                              background: isPlatform ? "#fef3c7" : "#ecfdf5",
                              color: isPlatform ? "#b45309" : "#065f46",
                            }}
                          >
                            {isPlatform ? "平台通用券" : "商户专享券"}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.provider?.name || "杨林生活网自营/认证"}
                          </span>
                        </div>
                        <div style={{ fontSize: "13.5px", fontWeight: "bold", color: "#1e293b", lineHeight: "1.4" }}>
                          {c.title || "优惠抵扣券"}
                        </div>
                      </div>

                      <div style={{ marginTop: "8px", paddingTop: "6px", borderTop: "1px dashed #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>
                          至 {new Date(uc.expiresAt).toLocaleDateString("zh-CN")}
                        </span>
                        {isAvailable ? (
                          <Link
                            href={c.providerId ? `/provider/${c.providerId}` : "/services"}
                            style={{
                              padding: "3px 8px",
                              background: isPlatform ? "#f59e0b" : "#047857",
                              color: "white",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              textDecoration: "none",
                            }}
                          >
                            去使用 →
                          </Link>
                        ) : uc.status === "USED" ? (
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "bold" }}>已使用 ✓</span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>已过期</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderFollowsTab = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 4px 0", color: "#0f172a" }}>⭐ 我关注的师傅与本地好店</h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>常驻收藏的可靠服务者，随时找Ta上门、复购或咨询</p>
          </div>
          <Link href="/haodian" style={{ padding: "6px 14px", background: "#047857", color: "white", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", textDecoration: "none" }}>
            发现更多好店 🔍
          </Link>
        </div>

        {followsList.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#94a3b8", background: "white", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>🏪</div>
            <div style={{ fontSize: "14px", fontWeight: "600" }}>暂未关注任何师傅或店铺</div>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>在师傅主页或好店详情点击「⭐ 关注」，即可在此常驻收藏随时联系</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
            {followsList.map((item) => {
              const p = item.provider;
              if (!p) return null;
              return (
                <div
                  key={item.followId}
                  style={{
                    background: "white",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    padding: "16px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <img
                      src={p.avatar || "/default-avatar.png"}
                      alt={p.name}
                      style={{ width: "50px", height: "50px", borderRadius: "10px", objectFit: "cover", border: "1px solid #f1f5f9" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ fontSize: "15px", fontWeight: "bold", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}
                        </div>
                        {p.isMember && (
                          <span style={{ fontSize: "10px", background: "#fef3c7", color: "#b45309", padding: "1px 5px", borderRadius: "4px", fontWeight: "bold" }}>
                            VIP
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", fontSize: "12px", color: "#64748b" }}>
                        <span style={{ background: "#f1f5f9", padding: "1px 6px", borderRadius: "4px", color: "#475569" }}>{p.serviceCategory || "本地服务"}</span>
                        <span>⭐ {p.ratingAvg || "5.0"}</span>
                        <span>· 已服务 {p.completedOrders || 0} 单</span>
                      </div>
                    </div>
                  </div>

                  {(p.campaigns?.length > 0 || p.coupons?.length > 0) && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "8px", padding: "6px 10px", fontSize: "11.5px", color: "#dc2626", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🔥</span>
                      <span style={{ fontWeight: "bold" }}>
                        {p.campaigns?.[0]?.title || (p.coupons?.[0] ? `领券满${Math.floor(p.coupons[0].minSpendCents/100)}立减${Math.floor(p.coupons[0].discountCents/100)}元` : "限时活动中")}
                      </span>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid #f8fafc" }}>
                    <Link
                      href={`/provider/${p.id}`}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        background: "#047857",
                        color: "white",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        textAlign: "center",
                        textDecoration: "none",
                      }}
                    >
                      进入主页 / 找Ta 🚀
                    </Link>
                    <button
                      onClick={(e) => handleUnfollow(e, p.id)}
                      style={{
                        padding: "8px 12px",
                        background: "transparent",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        color: "#94a3b8",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      取消关注
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderServicesTab = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 4px 0", color: "#0f172a" }}>🔄 常用服务与一键再约</h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>记录您曾经享受过的优质家政、开锁、维修等服务，一键带入地址联系人再次预约！</p>
          </div>
          <Link href="/orders" style={{ padding: "6px 14px", background: "#047857", color: "white", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", textDecoration: "none" }}>
            查看服务订单 📦
          </Link>
        </div>

        {commonServicesList.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#94a3b8", background: "white", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>🧹</div>
            <div style={{ fontSize: "14px", fontWeight: "600" }}>暂无常用服务记录</div>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>当您在杨林生活网完成家政保洁、管道疏通、开锁等服务后，常约项目将在此沉淀支持一键秒约！</p>
            <Link href="/services" style={{ display: "inline-block", marginTop: "12px", padding: "6px 16px", background: "#047857", color: "white", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", textDecoration: "none" }}>
              前往便民商城体验 →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
            {commonServicesList.map((item) => {
              const p = item.provider;
              return (
                <div
                  key={item.productId}
                  style={{
                    background: "white",
                    borderRadius: "14px",
                    border: "1.5px solid #e2e8f0",
                    padding: "16px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px" }}>
                    <img
                      src={item.coverImage || "/placeholder.jpg"}
                      alt={item.productTitle}
                      style={{ width: "64px", height: "64px", borderRadius: "10px", objectFit: "cover", border: "1px solid #f1f5f9" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "11px", color: "#047857", fontWeight: "bold", background: "#ecfdf5", padding: "1px 6px", borderRadius: "4px", display: "inline-block", marginBottom: "4px" }}>
                        {item.category || "本地便民"}
                      </div>
                      <div style={{ fontSize: "14.5px", fontWeight: "bold", color: "#0f172a", lineHeight: "1.4", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {item.productTitle}
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: "800", color: "#dc2626", marginTop: "4px" }}>
                        ¥{(item.priceCents / 100).toFixed(2)}
                        {item.unit && <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "normal" }}> /{item.unit}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "10px 12px", fontSize: "12px", color: "#64748b", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "bold", color: "#334155" }}>👨‍🔧 {p?.name || "专业师傅"}</span>
                      <span style={{ color: "#16a34a", fontWeight: "bold" }}>已约 {item.orderCount} 次</span>
                    </div>
                    {item.lastAddress?.addressDetail && (
                      <div style={{ fontSize: "11px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        📍 常用: {item.lastAddress.serviceArea} {item.lastAddress.addressDetail} ({item.lastAddress.contactName})
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/services/${item.productId}/checkout?reorderFrom=${item.latestOrderId}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "10px 0",
                      background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      color: "white",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      fontWeight: "bold",
                      textDecoration: "none",
                      boxShadow: "0 2px 8px rgba(4,120,87,0.25)",
                    }}
                  >
                    <span>🔄</span> 一键再约 (再次购买)
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderVerificationTab = () => {
    const verifiedTypes = new Set(
      verificationRecords
        .filter((r) => r.status === "APPROVED")
        .map((r) => r.verifyType)
    );

    const typeConfigs = [
      {
        key: "REAL_NAME",
        title: "个人实名认证",
        icon: "👤",
        desc: "绑定真实姓名与证件，点亮实名徽章，首认赠送 15 积分",
        verified: verifiedTypes.has("REAL_NAME"),
      },
      {
        key: "ENTERPRISE",
        title: "企业雇主认证",
        icon: "🏢",
        desc: "经开区/大学城用人企业，点亮雇主蓝标，解锁企业直聘权限",
        verified: verifiedTypes.has("ENTERPRISE"),
      },
      {
        key: "MERCHANT",
        title: "本地好店认证",
        icon: "🏪",
        desc: "实体门面营业执照认证，点亮金牌好店，支持电话直拨与预约",
        verified: verifiedTypes.has("MERCHANT"),
      },
      {
        key: "PROVIDER",
        title: "专业师傅认证",
        icon: "👨‍🔧",
        desc: "技工师傅与家政开荒，资质核验，同城抢单撮合优先派发",
        verified: verifiedTypes.has("PROVIDER"),
      },
      {
        key: "LANDLORD",
        title: "真实房东认证",
        icon: "🏠",
        desc: "房东自持房源绿标直供，免中介费标签，获得更高真实曝光",
        verified: verifiedTypes.has("LANDLORD"),
      },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 4px 0", color: "#0f172a" }}>🛡️ 平台统一认证中心</h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>完成多维身份核验，解锁专属权益与信任标牌</p>
          </div>
          <button
            onClick={() => {
              setVerifyForm({ verifyType: "REAL_NAME", idCardName: "", idCardNoMasked: "", companyName: "", licenseNo: "" });
              setVerifyModalOpen(true);
            }}
            style={{ padding: "8px 16px", background: "#047857", color: "white", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
          >
            + 申请身份认证
          </button>
        </div>

        {verifyMsg && (
          <div style={{ padding: "10px 14px", background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", borderRadius: "8px", fontSize: "13px", fontWeight: "bold" }}>
            {verifyMsg}
          </div>
        )}

        {/* 5大认证能力卡片 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          {typeConfigs.map((tc) => (
            <div
              key={tc.key}
              style={{
                background: "white",
                borderRadius: "14px",
                border: tc.verified ? "1.5px solid #10b981" : "1px solid #e2e8f0",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: tc.verified ? "0 4px 12px rgba(16,185,129,0.08)" : "none",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "24px" }}>{tc.icon}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      background: tc.verified ? "#dcfce7" : "#f1f5f9",
                      color: tc.verified ? "#15803d" : "#64748b",
                    }}
                  >
                    {tc.verified ? "✓ 已认证" : "未认证"}
                  </span>
                </div>
                <div style={{ fontSize: "15px", fontWeight: "bold", color: "#0f172a", marginBottom: "4px" }}>
                  {tc.title}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                  {tc.desc}
                </div>
              </div>

              {!tc.verified && (
                <button
                  onClick={() => {
                    setVerifyForm({ verifyType: tc.key, idCardName: "", idCardNoMasked: "", companyName: "", licenseNo: "" });
                    setVerifyModalOpen(true);
                  }}
                  style={{
                    marginTop: "12px",
                    padding: "6px 0",
                    background: "#f0fdf4",
                    color: "#15803d",
                    border: "1px solid #bbf7d0",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  去办理认证
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 申请记录列表 */}
        <div style={{ marginTop: "12px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#0f172a", marginBottom: "10px" }}>
            📋 我的认证申请记录
          </h3>
          {verificationRecords.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", background: "white", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
              暂未提交过任何认证申请，立即申请点亮专属身份标牌
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {verificationRecords.map((r) => {
                const sMap: any = { PENDING: { text: "审核中", color: "#d97706", bg: "#fef3c7" }, APPROVED: { text: "已通过", color: "#16a34a", bg: "#dcfce7" }, REJECTED: { text: "已驳回", color: "#dc2626", bg: "#fee2e2" } };
                const curS = sMap[r.status] || { text: r.status, color: "#64748b", bg: "#f1f5f9" };
                return (
                  <div key={r.id} style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: "bold", color: "#0f172a", fontSize: "14px" }}>
                          {r.verifyType === "REAL_NAME" ? "实名认证" : r.verifyType === "ENTERPRISE" ? "企业认证" : r.verifyType === "MERCHANT" ? "好店商户认证" : r.verifyType === "PROVIDER" ? "师傅服务者认证" : "房东认证"}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "4px", background: curS.bg, color: curS.color }}>
                          {curS.text}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                        {r.companyName || r.idCardName || "申请信息"} · 提交时间: {new Date(r.createdAt).toLocaleDateString("zh-CN")}
                      </div>
                      {r.reviewerNote && (
                        <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px" }}>
                          审核反馈: {r.reviewerNote}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const navTabs = [
    { id: "published", label: "我的发布", icon: "📝", count: publishedList.length },
    { id: "coupons", label: "我的卡券", icon: "🎟️", count: couponStats.available, badge: couponStats.available > 0 ? `${couponStats.available}张` : undefined },
    { id: "follows", label: "关注店铺", icon: "⭐", count: followsList.length },
    { id: "services", label: "常用服务", icon: "🔄", count: commonServicesList.length },
    { id: "membership", label: "我的会员", icon: "👑", highlight: isVip },
    { id: "coins", label: "金币钱包", icon: "🪙", badge: `${coinBalance}` },
    { id: "points", label: "积分签到", icon: "🎁", badge: `${pointAccount?.balance || 0}` },
    { id: "houses", label: "我的房产", icon: "🏠", count: housesList.length },
    { id: "shops", label: "我的商户", icon: "🏪", count: shopsList.length },
    { id: "jobs", label: "我的招聘", icon: "💼", count: jobsList.length },
    { id: "dating", label: "我的相亲", icon: "💕", count: datingList.length },
    { id: "favorites", label: "我的收藏", icon: "💖", count: favoritesList.length },
    { id: "notifications", label: "消息通知", icon: "🔔", count: notificationsList.filter((n) => !n.readAt).length },
    { id: "verification", label: "认证中心", icon: "🛡️", count: verificationRecords.length },
    { id: "security", label: "账号安全", icon: "🔒" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style>{`
        /* ===== 桌面端保持原样 ===== */
        @media (min-width: 768px) {
          .p-mobile-view { display: none !important; }
        }
        /* ===== 移动端：完全重做 ===== */
        @media (max-width: 767px) {
          .p-navbar-wrap { display: none !important; }
          .p-desktop-view { display: none !important; }
          .p-mobile-view { display: block !important; }
          .p-mobile-view .m-detail-content .profile-coin-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .p-mobile-view .m-detail-content .profile-member-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
          .p-mobile-view .m-detail-content table { font-size: 12px !important; }
          .p-mobile-view .m-detail-content table th,
          .p-mobile-view .m-detail-content table td { padding: 8px 10px !important; }
        }
      `}</style>
      <div className="p-navbar-wrap"><Navbar /></div>

      {/* ===== 移动端「我的」全新设计 ===== */}
      <div className="p-mobile-view" style={{ display: "none", background: "#F5F6F8", minHeight: "100vh" }}>
        {mobileView === "dashboard" ? (
          <>
            {/* 1. 顶部标题栏 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 10px", background: "#fff" }}>
              <h1 style={{ margin: 0, fontSize: "19px", fontWeight: "800", color: "#1F2937" }}>我的</h1>
              <button onClick={() => goDetail("security")} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", padding: "4px", lineHeight: 1 }} aria-label="设置">⚙️</button>
            </div>

            {/* 2. 用户信息卡（白底，简洁） */}
            <div style={{ padding: "16px 16px 0", background: "#fff", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {user?.avatar && !imgError && (user.avatar.startsWith("http") || user.avatar.startsWith("/")) ? (
                  <img src={user.avatar} referrerPolicy="no-referrer" alt={displayName} onError={() => setImgError(true)} style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "2px solid #f1f5f9", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#EBF5FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "bold", color: "#1677FF", flexShrink: 0 }}>
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "18px", fontWeight: "700", color: "#1F2937" }}>{displayName}</span>
                    {isVip && <span style={{ fontSize: "10px", background: "linear-gradient(135deg,#FEF3C7,#FDE68A)", color: "#92400E", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>👑 VIP</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: "#16a34a", marginTop: "3px", fontWeight: "500" }}>✓ 已注册认证</div>
                  <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "1px" }}>📍 杨林镇 · 嵩明</div>
                </div>
                <button onClick={() => { setEditNickname(user?.nickname || ""); setEditAvatar(user?.avatar || ""); setEditOpen(true); }} style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap", padding: "4px 0" }}>
                  编辑资料 &gt;
                </button>
              </div>

              {/* 3. 统计数据行 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", marginTop: "18px", paddingTop: "14px", paddingBottom: "16px", borderTop: "1px solid #F3F4F6" }}>
                {[
                  { value: publishedList.length, label: "发布", tab: "published" },
                  { value: favoritesList.length, label: "收藏", tab: "favorites" },
                  { value: counts.comments || 0, label: "评论" },
                  { value: pointAccount?.balance || 0, label: "积分", tab: "points" },
                ].map((s, i) => (
                  <div key={i} onClick={() => s.tab && goDetail(s.tab)} style={{ textAlign: "center", cursor: s.tab ? "pointer" : "default" }}>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#1F2937", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                    <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* P5 移动端业务身份与工作台快捷切换 */}
            <div style={{ background: "#fff", padding: "12px 16px", marginBottom: "8px" }}>
              <div style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)", borderRadius: "12px", border: "1px solid #bbf7d0", padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "16px" }}>🔀</span>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#065f46" }}>多身份工作台切换</span>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#166534", background: "#dcfce7", padding: "2px 6px", borderRadius: "4px" }}>
                    居民生活模式
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <Link
                    href="/workspace?mode=merchant"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      background: "#ffffff",
                      border: "1px solid #10b981",
                      color: "#047857",
                      padding: "8px 0",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "700",
                      textDecoration: "none",
                    }}
                  >
                    <span>💼</span> 商家师傅工作台
                  </Link>
                  <Link
                    href="/workspace?mode=enterprise"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      background: "#ffffff",
                      border: "1px solid #0284c7",
                      color: "#0369a1",
                      padding: "8px 0",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "700",
                      textDecoration: "none",
                    }}
                  >
                    <span>🏢</span> 企业直聘工作台
                  </Link>
                </div>
              </div>
            </div>

            {/* 4. 本地生活与复购卡包 4 宫格 */}
            <div style={{ background: "#fff", padding: "16px", marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <span style={{ fontSize: "15px", fontWeight: "700", color: "#1F2937" }}>消费卡包与复购</span>
                <Link href="/services" style={{ fontSize: "12px", color: "#047857", textDecoration: "none", fontWeight: "600" }}>便民商城 &gt;</Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px 0" }}>
                {[
                  { icon: "🎟️", label: "我的卡券", tab: "coupons", badge: couponStats.available },
                  { icon: "⭐", label: "关注店铺", tab: "follows", badge: followsList.length },
                  { icon: "🔄", label: "常用服务", tab: "services", badge: commonServicesList.length },
                  { icon: "📦", label: "服务订单", href: "/orders" },
                ].map((item: any, i) => (
                  <div key={i} onClick={() => { if (item.href) { window.location.href = item.href; } else if (item.tab) { goDetail(item.tab); } }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", position: "relative" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>{item.icon}</div>
                    <div style={{ fontSize: "11px", color: "#1e293b", fontWeight: "600" }}>{item.label}</div>
                    {(item.badge ?? 0) > 0 && (
                      <span style={{ position: "absolute", top: "-4px", right: "calc(50% - 24px)", fontSize: "10px", background: "#EF4444", color: "#fff", padding: "0 5px", borderRadius: "8px", fontWeight: "700", minWidth: "16px", textAlign: "center", lineHeight: "16px" }}>{item.badge}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 4.5. 我的服务 4×2 宫格 */}
            <div style={{ background: "#fff", padding: "16px", marginBottom: "8px" }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#1F2937", marginBottom: "14px" }}>我的便民服务</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px 0" }}>
                {[
                  { icon: "📝", label: "我的发布", tab: "published", badge: publishedList.length },
                  { icon: "❤️", label: "我的收藏", tab: "favorites", badge: favoritesList.length },
                  { icon: "🔔", label: "消息通知", tab: "notifications", badge: notificationsList.filter((n) => !n.readAt).length },
                  { icon: "🕘", label: "浏览记录" },
                  { icon: "🏠", label: "房产管理", tab: "houses", badge: housesList.length },
                  { icon: "💼", label: "招聘管理", tab: "jobs", badge: jobsList.length },
                  { icon: "🏪", label: "商家管理", tab: "shops", badge: shopsList.length },
                  { icon: "💕", label: "相亲管理", tab: "dating", badge: datingList.length },
                ].map((item, i) => (
                  <div key={i} onClick={() => item.tab && goDetail(item.tab)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: item.tab ? "pointer" : "default", position: "relative" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#F5F6F8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>{item.icon}</div>
                    <div style={{ fontSize: "11px", color: "#4B5563", fontWeight: "500" }}>{item.label}</div>
                    {(item.badge ?? 0) > 0 && (
                      <span style={{ position: "absolute", top: "-4px", right: "calc(50% - 24px)", fontSize: "10px", background: "#EF4444", color: "#fff", padding: "0 5px", borderRadius: "8px", fontWeight: "700", minWidth: "16px", textAlign: "center", lineHeight: "16px" }}>{item.badge}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. 我的发布预览（最近3条） */}
            {publishedList.length > 0 && (
              <div style={{ background: "#fff", padding: "16px", marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "15px", fontWeight: "700", color: "#1F2937" }}>我的发布</span>
                  <span onClick={() => goDetail("published")} style={{ color: "#9CA3AF", fontSize: "13px", cursor: "pointer" }}>全部 &gt;</span>
                </div>
                {publishedList.slice(0, 3).map((item) => (
                  <Link key={item.id} href={item.link || "#"} style={{ display: "block", padding: "12px 0", borderBottom: "1px solid #F3F4F6", textDecoration: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#1677FF", background: "#EBF5FF", padding: "2px 8px", borderRadius: "4px" }}>{modLabel(item.module)}</span>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: staColor(item.status) }}>● {staLabel(item.status)}</span>
                      <span style={{ fontSize: "11px", color: "#CBD5E1", marginLeft: "auto" }}>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</span>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                  </Link>
                ))}
              </div>
            )}

            {/* 6. 常用工具 */}
            <div style={{ background: "#fff", padding: "16px", marginBottom: "8px" }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#1F2937", marginBottom: "14px" }}>常用工具</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px 0" }}>
                {[
                  { icon: "👑", label: "会员中心", tab: "membership" },
                  { icon: "🛠️", label: "师傅工作台", href: "/provider/center" },
                  { icon: "📋", label: "服务需求", href: "/info/requests" },
                  { icon: "💎", label: "积分签到", tab: "points" },
                  { icon: "💰", label: "金币钱包", tab: "coins" },
                  { icon: "🔒", label: "账号安全", tab: "security" },
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if ((item as any).href) {
                        window.location.href = (item as any).href;
                      } else if (item.tab) {
                        goDetail(item.tab);
                      }
                    }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}
                  >
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#F5F6F8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>{item.icon}</div>
                    <div style={{ fontSize: "11px", color: "#4B5563", fontWeight: "500" }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. 底部列表链接 */}
            <div style={{ background: "#fff", marginBottom: "100px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 16px", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
                <span style={{ fontSize: "14px", color: "#4B5563" }}>帮助与反馈</span>
                <span style={{ color: "#D1D5DB", fontSize: "14px" }}>›</span>
              </div>
              <div onClick={() => goDetail("security")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 16px", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
                <span style={{ fontSize: "14px", color: "#4B5563" }}>设置</span>
                <span style={{ color: "#D1D5DB", fontSize: "14px" }}>›</span>
              </div>
              <div onClick={handleLogout} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 16px", cursor: "pointer" }}>
                <span style={{ fontSize: "14px", color: "#EF4444" }}>退出登录</span>
                <span style={{ color: "#D1D5DB", fontSize: "14px" }}>›</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ===== 移动端详情页 ===== */}
            {/* 详情顶部导航栏 */}
            <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: "#fff", borderBottom: "1px solid #F1F5F9", position: "sticky", top: 0, zIndex: 20 }}>
              <button onClick={() => setMobileView("dashboard")} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", padding: "2px 10px 2px 0", color: "#1F2937", lineHeight: 1 }}>←</button>
              <h1 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1F2937", flex: 1, textAlign: "center" }}>
                {navTabs.find((t) => t.id === activeTab)?.label || "详情"}
              </h1>
              <div style={{ width: "30px" }} />
            </div>

            {/* 详情内容区 */}
            <div className="m-detail-content" style={{ padding: "12px", paddingBottom: "100px" }}>
              {/* 我的发布 - 全新移动端卡片 */}
              {activeTab === "published" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>共 {publishedList.length} 条发布</span>
                    <Link href="/publish" style={{ padding: "6px 14px", background: "#1677FF", color: "#fff", borderRadius: "16px", textDecoration: "none", fontSize: "12px", fontWeight: "700" }}>+ 新建发布</Link>
                  </div>
                  {publishedList.length === 0 ? (
                    <div style={{ padding: "60px 0", textAlign: "center", color: "#9CA3AF" }}>
                      <div style={{ fontSize: "36px", marginBottom: "8px" }}>📭</div>
                      <div>您还没有发布过任何信息</div>
                      <Link href="/publish" style={{ display: "inline-block", marginTop: "12px", color: "#1677FF", fontWeight: "600", fontSize: "14px", textDecoration: "none" }}>立即免费发布一条 →</Link>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {publishedList.map((item) => (
                        <div key={item.id} style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid #F1F5F9" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#1677FF", background: "#EBF5FF", padding: "2px 8px", borderRadius: "4px" }}>{modLabel(item.module)}</span>
                            <span style={{ fontSize: "11px", fontWeight: "600", color: staColor(item.status), display: "flex", alignItems: "center", gap: "4px" }}>
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: staColor(item.status), display: "inline-block" }} />
                              {staLabel(item.status)}
                            </span>
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: "600", color: "#1F2937", marginBottom: "8px", lineHeight: "1.4" }}>{item.title}</div>
                          <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "10px" }}>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</div>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            <Link href={item.link || "#"} style={{ flex: 1, minWidth: "70px", padding: "7px 0", borderRadius: "8px", border: "1px solid #E5E7EB", color: "#4B5563", textDecoration: "none", fontSize: "12px", fontWeight: "600", textAlign: "center" }}>查看</Link>
                            {item.module.toUpperCase() === "LISTING" && (
                              <>
                                <Link href={`/info/${item.id}/edit`} style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", color: "#0B7A75", background: "#f0fdfa", textDecoration: "none", fontSize: "12px", fontWeight: "700" }}>编辑</Link>
                                <button type="button" onClick={() => handleRefreshListing(item.id)} style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid #bbf7d0", color: "#15803d", background: "#f0fdf4", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>⚡ 刷新</button>
                              </>
                            )}
                            {item.module.toUpperCase() === "LISTING" ? (
                              <button
                                type="button"
                                onClick={() => setPromoteListing({ id: item.id, title: item.title })}
                                style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #FDE68A", background: "#FFFBEB", color: "#B45309", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                              >
                                🚀 推广加权
                              </button>
                            ) : (
                              <Link href={`/billing/promote?id=${item.id}&module=${item.module}`} style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #FDE68A", background: "#FFFBEB", color: "#B45309", textDecoration: "none", fontSize: "12px", fontWeight: "600" }}>推广</Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 房产管理 */}
              {activeTab === "houses" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>共 {housesList.length} 条房源</span>
                    <Link href="/house/new" style={{ padding: "6px 14px", background: "#1677FF", color: "#fff", borderRadius: "16px", textDecoration: "none", fontSize: "12px", fontWeight: "700" }}>+ 发布房源</Link>
                  </div>
                  {housesList.length === 0 ? (
                    <div style={{ padding: "60px 0", textAlign: "center", color: "#9CA3AF" }}>暂无发布的房源</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {housesList.map((h) => (
                        <div key={h.id} style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid #F1F5F9" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#1677FF", background: "#EBF5FF", padding: "2px 8px", borderRadius: "4px" }}>房产</span>
                            <span style={{ fontSize: "11px", fontWeight: "600", color: staColor(h.status) }}>● {staLabel(h.status)}</span>
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: "600", color: "#1F2937", marginBottom: "4px" }}>{h.title}</div>
                          <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "10px" }}>{h.layout} · {h.price} · {h.location}</div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <Link href={`/house/${h.id}`} style={{ flex: 1, padding: "7px 0", borderRadius: "8px", border: "1px solid #E5E7EB", color: "#4B5563", textDecoration: "none", fontSize: "12px", fontWeight: "600", textAlign: "center" }}>查看详情</Link>
                            <Link href={`/billing/promote?id=${h.id}&module=house`} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #FDE68A", background: "#FFFBEB", color: "#B45309", textDecoration: "none", fontSize: "12px", fontWeight: "600" }}>推广</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 招聘管理 */}
              {activeTab === "jobs" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>共 {jobsList.length} 个岗位</span>
                    <Link href="/jobs/new" style={{ padding: "6px 14px", background: "#1677FF", color: "#fff", borderRadius: "16px", textDecoration: "none", fontSize: "12px", fontWeight: "700" }}>+ 发布职位</Link>
                  </div>
                  {jobsList.length === 0 ? (
                    <div style={{ padding: "60px 0", textAlign: "center", color: "#9CA3AF" }}>暂无发布的职位</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {jobsList.map((j) => (
                        <div key={j.id} style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid #F1F5F9", opacity: (j.status || "").toUpperCase() === "OFFLINE" ? 0.65 : 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#B45309", background: "#FEF3C7", padding: "2px 8px", borderRadius: "4px" }}>招聘</span>
                            <span style={{ fontSize: "11px", fontWeight: "600", color: staColor(j.status) }}>● {staLabel(j.status)}</span>
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: "600", color: "#1F2937", marginBottom: "4px" }}>{j.title}</div>
                          <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "10px" }}>
                            {j.company} · <span style={{ color: "#D97706", fontWeight: "600" }}>{j.salary}</span> · {j.area}
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <Link href={`/jobs/${j.id}`} style={{ flex: 1, padding: "7px 0", borderRadius: "8px", border: "1px solid #E5E7EB", color: "#4B5563", textDecoration: "none", fontSize: "12px", fontWeight: "600", textAlign: "center" }}>查看详情</Link>
                            {(j.status || "").toUpperCase() !== "OFFLINE" && (
                              <Link href={`/billing/promote?id=${j.id}&module=job`} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #FDE68A", background: "#FFFBEB", color: "#B45309", textDecoration: "none", fontSize: "12px", fontWeight: "600" }}>推广</Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 商家管理 */}
              {activeTab === "shops" && (
                <div>
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>共 {shopsList.length} 家商户</span>
                  </div>
                  {shopsList.length === 0 ? (
                    <div style={{ padding: "60px 0", textAlign: "center", color: "#9CA3AF" }}>暂无历史商户资料</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {shopsList.map((s) => (
                        <div key={s.id} style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid #F1F5F9" }}>
                          <div style={{ fontSize: "15px", fontWeight: "600", color: "#1F2937", marginBottom: "4px" }}>{s.name}</div>
                          <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "10px" }}>{s.category} · {s.address} · {s.phone}</div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <Link href={`/haodian/${s.id}`} style={{ flex: 1, padding: "7px 0", borderRadius: "8px", border: "1px solid #E5E7EB", color: "#4B5563", textDecoration: "none", fontSize: "12px", fontWeight: "600", textAlign: "center" }}>查看详情</Link>
                            <Link href={`/billing/promote?id=${s.id}&module=shop`} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #FDE68A", background: "#FFFBEB", color: "#B45309", textDecoration: "none", fontSize: "12px", fontWeight: "600" }}>推广</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 相亲管理 */}
              {activeTab === "dating" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>共 {datingList.length} 份资料</span>
                    <Link href="/love/new" style={{ padding: "6px 14px", background: "#E11D48", color: "#fff", borderRadius: "16px", textDecoration: "none", fontSize: "12px", fontWeight: "700" }}>+ 发布相亲</Link>
                  </div>
                  {datingList.length === 0 ? (
                    <div style={{ padding: "60px 0", textAlign: "center", color: "#9CA3AF" }}>暂未登记相亲信息</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {datingList.map((d) => (
                        <div key={d.id} style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: "1px solid #F1F5F9" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#E11D48", background: "#FFE4E6", padding: "2px 8px", borderRadius: "4px" }}>相亲</span>
                            <span style={{ fontSize: "11px", fontWeight: "600", color: staColor(d.status) }}>● {staLabel(d.status)}</span>
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: "600", color: "#1F2937", marginBottom: "4px" }}>{d.nickname} ({d.gender === "male" ? "男" : d.gender === "female" ? "女" : d.gender})</div>
                          <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "10px" }}>
                            {d.occupation} · {d.income} · {d.location}
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <Link href={`/love/${d.id}`} style={{ flex: 1, padding: "7px 0", borderRadius: "8px", border: "1px solid #E5E7EB", color: "#4B5563", textDecoration: "none", fontSize: "12px", fontWeight: "600", textAlign: "center" }}>查看详情</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 我的收藏 */}
              {activeTab === "favorites" && (
                <div>
                  {/* 分类过滤器 */}
                  <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "12px", marginBottom: "12px" }}>
                    {[
                      { key: "ALL", label: "全部" },
                      { key: "JOB", label: "招聘" },
                      { key: "HOUSE", label: "房产" },
                      { key: "INDUSTRIAL", label: "招商" },
                      { key: "COMMUNITY", label: "社区" },
                      { key: "MERCHANT", label: "商家" },
                      { key: "PRODUCT", label: "商品" },
                    ].map((tab) => {
                      const active = favoriteCategory === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setFavoriteCategory(tab.key)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: "16px",
                            fontSize: "12px",
                            fontWeight: active ? "700" : "500",
                            border: active ? "1px solid #0B7A75" : "1px solid #E5E7EB",
                            background: active ? "#F0FDF4" : "#FFFFFF",
                            color: active ? "#0B7A75" : "#4B5563",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {filteredFavorites.length === 0 ? (
                    <div style={{ padding: "60px 0", textAlign: "center", color: "#9CA3AF" }}>
                      <div style={{ fontSize: "36px", marginBottom: "8px" }}>💝</div>
                      <div>暂无该分类的收藏内容</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {filteredFavorites.map((fav) => {
                        const badge = getResourceTypeBadge(fav.resourceType);
                        return (
                          <div
                            key={fav.id}
                            style={{
                              background: "#fff",
                              padding: "14px",
                              borderRadius: "12px",
                              border: "1px solid #F1F5F9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "10px",
                            }}
                          >
                            <Link
                              href={fav.link || "#"}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                textDecoration: "none",
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: badge.bg,
                                  color: badge.color,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {badge.label}
                              </span>
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "600",
                                  color: "#1F2937",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {fav.title}
                              </span>
                            </Link>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                              <Link
                                href={fav.link || "#"}
                                style={{ color: "#0B7A75", fontSize: "12px", fontWeight: "600", textDecoration: "none" }}
                              >
                                查看 &gt;
                              </Link>
                              <button
                                type="button"
                                onClick={(e) => handleRemoveFavorite(e, fav.id)}
                                disabled={favRemovingId === fav.id}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#9CA3AF",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  padding: "4px",
                                }}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 消息通知 */}
              {activeTab === "notifications" && (
                <div>
                  {notificationsList.length === 0 ? (
                    <div style={{ padding: "60px 0", textAlign: "center", color: "#9CA3AF" }}>
                      <div style={{ fontSize: "36px", marginBottom: "8px" }}>🔔</div>
                      <div>暂无系统通知</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {notificationsList.map((notif) => (
                        <div key={notif.id} style={{ background: notif.readAt ? "#fff" : "#F0FDF4", padding: "14px", borderRadius: "12px", border: "1px solid #F1F5F9" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontWeight: "600", fontSize: "14px", color: "#1F2937" }}>{notif.title}</span>
                            <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{new Date(notif.createdAt).toLocaleDateString("zh-CN")}</span>
                          </div>
                          <p style={{ fontSize: "13px", color: "#6B7280", margin: 0, lineHeight: "1.5" }}>{notif.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 金币钱包 */}
              {activeTab === "coins" && (
                <div>
                  {/* 余额卡 */}
                  <div style={{ background: "linear-gradient(135deg,#FEF3C7,#FDE68A)", borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", color: "#92400E", fontWeight: "600", marginBottom: "4px" }}>金币余额</div>
                    <div style={{ fontSize: "32px", fontWeight: "800", color: "#78350F" }}>{coinBalance} <span style={{ fontSize: "14px" }}>币</span></div>
                    <div style={{ fontSize: "11px", color: "#92400E", marginTop: "4px" }}>1 元 = 10 金币 · 用于置顶推广与特权消费</div>
                  </div>
                  {/* 充值套餐 */}
                  {coinPackages.length > 0 && (
                    <>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#1F2937", marginBottom: "12px" }}>充值套餐</div>
                      <div className="profile-coin-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
                        {coinPackages.map((pkg: any) => (
                          <div key={pkg.id} style={{ background: "#fff", borderRadius: "12px", padding: "14px 10px", border: "2px solid #FEF3C7", textAlign: "center" }}>
                            <div style={{ fontWeight: "700", color: "#92400E", fontSize: "14px" }}>{pkg.coins} 金币</div>
                            {pkg.bonusCoins > 0 && <div style={{ fontSize: "10px", color: "#DC2626", fontWeight: "700" }}>赠 +{pkg.bonusCoins}</div>}
                            <div style={{ fontSize: "18px", fontWeight: "800", color: "#B45309", margin: "6px 0" }}>¥{pkg.price ?? (pkg.priceCents ? (pkg.priceCents / 100).toFixed(0) : "10")}</div>
                            <button onClick={() => handleOpenCoinCashier(pkg)} style={{ width: "100%", padding: "6px 0", background: "#F59E0B", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>充值</button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {/* 收支明细 */}
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#1F2937", marginBottom: "12px" }}>收支明细</div>
                  {coinTransactions.length === 0 ? (
                    <div style={{ padding: "30px", textAlign: "center", color: "#9CA3AF", fontSize: "13px" }}>暂无记录</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                      {coinTransactions.map((tx: any) => (
                        <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1F2937" }}>{tx.remark || tx.type}</div>
                            <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>{new Date(tx.createdAt).toLocaleDateString("zh-CN")}</div>
                          </div>
                          <span style={{ fontSize: "15px", fontWeight: "700", color: tx.amount > 0 ? "#16a34a" : "#DC2626" }}>{tx.amount > 0 ? `+${tx.amount}` : tx.amount} 币</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 积分签到 */}
              {activeTab === "points" && (
                <div>
                  {/* 签到卡 */}
                  <div style={{ background: "#F0FDF4", borderRadius: "14px", padding: "20px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "#166534", fontWeight: "600" }}>当前积分</div>
                      <div style={{ fontSize: "28px", fontWeight: "800", color: "#15803D" }}>{pointAccount?.balance || 0} <span style={{ fontSize: "13px" }}>分</span></div>
                    </div>
                    <button onClick={handleCheckin} disabled={checkinLoading || pointAccount?.checkedInToday} style={{
                      padding: "10px 20px", borderRadius: "20px", border: "none", fontWeight: "700", fontSize: "13px", cursor: pointAccount?.checkedInToday ? "default" : "pointer",
                      background: pointAccount?.checkedInToday ? "#D1D5DB" : "#16a34a", color: "#fff",
                    }}>
                      {pointAccount?.checkedInToday ? "已签到 ✓" : "签到 +10"}
                    </button>
                  </div>
                  {checkinMsg && <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E40AF", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontWeight: "600", fontSize: "13px" }}>{checkinMsg}</div>}
                  {/* 积分明细 */}
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#1F2937", marginBottom: "12px" }}>积分明细</div>
                  {pointTransactions.length === 0 ? (
                    <div style={{ padding: "30px", textAlign: "center", color: "#9CA3AF", fontSize: "13px" }}>暂无积分记录</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {pointTransactions.map((tx) => (
                        <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1F2937" }}>{tx.remark || tx.type}</div>
                            <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>{new Date(tx.createdAt).toLocaleDateString("zh-CN")}</div>
                          </div>
                          <span style={{ fontSize: "15px", fontWeight: "700", color: tx.amount > 0 ? "#16a34a" : "#DC2626" }}>{tx.amount > 0 ? `+${tx.amount}` : tx.amount} 分</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 会员中心 */}
              {activeTab === "membership" && (
                <div>
                  {/* 当前会员状态 */}
                  <div style={{ background: isVip ? "linear-gradient(135deg,#FEF3C7,#FDE68A)" : "#F5F6F8", borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", color: isVip ? "#92400E" : "#6B7280", fontWeight: "600", marginBottom: "4px" }}>会员状态</div>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: isVip ? "#78350F" : "#1F2937" }}>
                      {isVip ? `👑 ${activeMembership?.name}` : "普通用户"}
                    </div>
                    <div style={{ fontSize: "12px", color: isVip ? "#92400E" : "#9CA3AF", marginTop: "4px" }}>
                      {isVip ? "享有优先展示与免审极速发布特权" : "升级会员享专属推广权益"}
                    </div>
                  </div>
                  {memberMsg && <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontWeight: "600", fontSize: "13px" }}>{memberMsg}</div>}
                  {/* 套餐列表 */}
                  <div className="profile-member-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                    {membershipPackages.map((pkg: any) => (
                      <div key={pkg.id} style={{ background: "#fff", borderRadius: "14px", padding: "18px", border: "2px solid #E2E8F0" }}>
                        <div style={{ fontSize: "16px", fontWeight: "800", color: "#1F2937", marginBottom: "4px" }}>{pkg.name}</div>
                        <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "10px" }}>有效期: {pkg.durationDays} 天</div>
                        <div style={{ fontSize: "22px", fontWeight: "800", color: "#1677FF", marginBottom: "10px" }}>¥{pkg.priceYuan ?? (pkg.priceCents ? (pkg.priceCents / 100).toFixed(2) : pkg.price || "98.00")}</div>
                        <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: "1.5", margin: "0 0 14px" }}>{pkg.description || "包含优先展示、免审发布与专属VIP标识"}</p>
                        <button onClick={() => handleOpenMemberCashier(pkg)} style={{ width: "100%", padding: "10px 0", background: "#1677FF", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>立即开通</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 账号安全 */}
              {activeTab === "security" && (
                <div>
                  <div style={{ background: "#fff", borderRadius: "14px", padding: "18px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#1F2937", marginBottom: "14px" }}>修改登录密码</div>
                    {secMsg && <div style={{ background: "#ECFDF5", color: "#065F46", padding: "8px 12px", borderRadius: "8px", marginBottom: "10px", fontSize: "13px", fontWeight: "600" }}>{secMsg}</div>}
                    {secErr && <div style={{ background: "#FEF2F2", color: "#991B1B", padding: "8px 12px", borderRadius: "8px", marginBottom: "10px", fontSize: "13px", fontWeight: "600" }}>{secErr}</div>}
                    <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <input required type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="原登录密码" style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: "14px", boxSizing: "border-box" }} />
                      <input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="新密码（至少6位）" style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: "14px", boxSizing: "border-box" }} />
                      <button type="submit" style={{ padding: "12px 0", background: "#1677FF", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>确认修改密码</button>
                    </form>
                  </div>

                  <div style={{ background: "#fff", borderRadius: "14px", padding: "18px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#DC2626", marginBottom: "6px" }}>⚠️ 紧急安全控制</div>
                    <p style={{ fontSize: "12px", color: "#6B7280", margin: "0 0 14px" }}>踢出所有设备的登录状态，如您怀疑账号泄露请立即执行</p>
                    <button onClick={handleLogoutAll} style={{ width: "100%", padding: "10px 0", background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: "10px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}>⚡ 一键踢出全平台设备</button>
                  </div>

                  <div style={{ background: "#fff", borderRadius: "14px", padding: "18px" }}>
                    <div onClick={handleLogout} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                      <span style={{ fontSize: "14px", color: "#EF4444", fontWeight: "600" }}>退出当前登录</span>
                      <span style={{ color: "#D1D5DB" }}>›</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 优惠券与卡包 */}
              {activeTab === "coupons" && renderCouponsTab()}

              {/* 关注店铺与师傅 */}
              {activeTab === "follows" && renderFollowsTab()}

              {/* 常用服务与一键再约 */}
              {activeTab === "services" && renderServicesTab()}

              {/* 统一认证中心 */}
              {activeTab === "verification" && renderVerificationTab()}
            </div>
          </>
        )}
      </div>

      {/* ===== 桌面端原有布局（移动端隐藏） ===== */}
      <div className="p-desktop-view">

      {/* 顶部现代化高奢名片 Hero Banner */}
      <section
        className="profile-hero-section"
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #0d9488 60%, #0284c7 100%)",
          color: "white",
          padding: "2.25rem 1rem 2.25rem 1rem",
          position: "relative",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <div className="profile-hero-inner" style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          {/* 用户核心信息 */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ position: "relative" }}>
              {user?.avatar && !imgError && (user.avatar.startsWith("http") || user.avatar.startsWith("/")) ? (
                <img
                  src={user.avatar}
                  referrerPolicy="no-referrer"
                  alt={displayName}
                  onError={() => setImgError(true)}
                  style={{
                    width: "76px",
                    height: "76px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid rgba(255,255,255,0.9)",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "76px",
                    height: "76px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.25)",
                    backdropFilter: "blur(12px)",
                    border: "3px solid rgba(255,255,255,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "30px",
                    fontWeight: "bold",
                    color: "white",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  }}
                >
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              {isVip && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "-4px",
                    right: "-4px",
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "white",
                    fontSize: "11px",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  }}
                >
                  👑 VIP
                </span>
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "800", letterSpacing: "0.5px" }}>{displayName}</h1>
                <button
                  onClick={() => {
                    setEditNickname(user?.nickname || "");
                    setEditAvatar(user?.avatar || "");
                    setEditOpen(true);
                  }}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.35)",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                    fontWeight: "bold",
                  }}
                >
                  ✏️ 编辑资料
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px", fontSize: "13px", opacity: 0.95 }}>
                <span>账号: <b style={{ fontFamily: "monospace" }}>{user?.username}</b></span>
                <span>·</span>
                <span>身份: <b>{user?.role === "ADMIN" ? "系统管理员" : user?.role === "EDITOR" ? "运营编辑" : "注册会员"}</b></span>
                <span>·</span>
                <span style={{ color: "#a7f3d0", fontWeight: "bold" }}>● 状态正常</span>
              </div>
            </div>
          </div>

          {/* 快捷操作区 */}
          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href="/publish"
              style={{
                background: "#ffffff",
                color: "#065f46",
                padding: "10px 20px",
                borderRadius: "12px",
                fontWeight: "bold",
                textDecoration: "none",
                fontSize: "14px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>➕</span> 快速发布便民
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                padding: "10px 16px",
                borderRadius: "12px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "14px",
                backdropFilter: "blur(10px)",
              }}
            >
              退出
            </button>
          </div>
        </div>
      </section>

      {/* P5 平台多维身份与统一工作台切换器 */}
      <div style={{ maxWidth: "1280px", margin: "1.25rem auto 0 auto", padding: "0 1rem" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
            borderRadius: "16px",
            border: "1px solid #bbf7d0",
            padding: "1rem 1.5rem",
            boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "28px" }}>🔀</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: "800", color: "#065f46", fontSize: "15px" }}>平台多重业务身份能力</span>
                <span style={{ fontSize: "11px", fontWeight: "bold", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "10px" }}>
                  🏡 当前：居民生活模式
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                一个账号通行全平台，拥有商户入驻或企业招聘身份可一键切换专业工作台
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Link
              href="/workspace?mode=merchant"
              style={{
                padding: "7px 14px",
                background: "#ffffff",
                border: "1.5px solid #10b981",
                color: "#047857",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              💼 切换为商家/师傅工作台 ›
            </Link>
            <Link
              href="/workspace?mode=enterprise"
              style={{
                padding: "7px 14px",
                background: "#ffffff",
                border: "1.5px solid #0284c7",
                color: "#0369a1",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              🏢 切换为企业直聘工作台 ›
            </Link>
            <button
              onClick={() => setActiveTab("verification")}
              style={{
                padding: "7px 14px",
                background: "#ecfdf5",
                border: "1px dashed #059669",
                color: "#047857",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🛡️ 认证中心
            </button>
          </div>
        </div>
      </div>

      {/* 主体内容容器 */}
      <main className="profile-main" style={{ maxWidth: "1280px", margin: "1.5rem auto 3rem auto", padding: "0 1rem" }}>
        {/* 4 大核心资产卡片 (Grid 矩阵) */}
        <div className="profile-assets-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {/* 金币钱包 */}
          <div
            onClick={() => setActiveTab("coins")}
            style={{
              background: "white",
              padding: "1.25rem",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>🪙 金币钱包余额</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#f59e0b", margin: "4px 0" }}>{coinBalance} <span style={{ fontSize: "12px", color: "#64748b" }}>币</span></div>
              <div style={{ fontSize: "11px", color: "#0d9488" }}>用于极速置顶与特权消费 →</div>
            </div>
            <button style={{ padding: "6px 12px", background: "#fef3c7", color: "#b45309", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
              充值
            </button>
          </div>

          {/* 活跃积分 */}
          <div
            onClick={() => setActiveTab("points")}
            style={{
              background: "white",
              padding: "1.25rem",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>💎 活跃积分资产</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#0284c7", margin: "4px 0" }}>{pointAccount?.balance || 0} <span style={{ fontSize: "12px", color: "#64748b" }}>分</span></div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>连续签到领丰厚福利 →</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCheckin();
              }}
              disabled={checkinLoading || pointAccount?.checkedInToday}
              style={{
                padding: "6px 12px",
                background: pointAccount?.checkedInToday ? "#f1f5f9" : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                color: pointAccount?.checkedInToday ? "#94a3b8" : "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "12px",
                cursor: pointAccount?.checkedInToday ? "default" : "pointer",
              }}
            >
              {pointAccount?.checkedInToday ? "已签到 ✓" : "打卡 +10"}
            </button>
          </div>

          {/* 会员特权 */}
          <div
            onClick={() => setActiveTab("membership")}
            style={{
              background: "white",
              padding: "1.25rem",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>👑 B2B 会员特权</div>
              <div style={{ fontSize: "1.2rem", fontWeight: "800", color: isVip ? "#15803d" : "#0f172a", margin: "6px 0" }}>
                {activeMembership?.name || "普通免费会员"}
              </div>
              <div style={{ fontSize: "11px", color: isVip ? "#15803d" : "#64748b" }}>
                {isVip ? "享尊贵企业推广权益" : "升级立享无限刷新与特权 →"}
              </div>
            </div>
            <span style={{ fontSize: "28px" }}>👑</span>
          </div>

          {/* 我的发布总览 */}
          <div
            onClick={() => setActiveTab("published")}
            style={{
              background: "white",
              padding: "1.25rem",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>📢 在线发布便民</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#065f46", margin: "4px 0" }}>{publishedList.length} <span style={{ fontSize: "12px", color: "#64748b" }}>条</span></div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>房产·招聘·好店·相亲 →</div>
            </div>
            <span style={{ fontSize: "28px" }}>📦</span>
          </div>

          {/* 专属优惠券卡包 */}
          <div
            onClick={() => setActiveTab("coupons")}
            style={{
              background: "white",
              padding: "1.25rem",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>🎟️ 专属卡券包</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#047857", margin: "4px 0" }}>{couponStats.available} <span style={{ fontSize: "12px", color: "#64748b" }}>张可用</span></div>
              <div style={{ fontSize: "11px", color: "#047857" }}>立减打折立享优惠 →</div>
            </div>
            <span style={{ fontSize: "28px" }}>🎟️</span>
          </div>
        </div>

        {/* 双栏工作大厅 */}
        <div className="profile-work-hall" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "1.5rem", alignItems: "start" }}>
          {/* 左侧：高雅竖向导航栏 */}
          <aside className="profile-sidebar-nav" style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "0.75rem", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#94a3b8", padding: "6px 12px 10px 12px", letterSpacing: "0.5px" }}>
              业务管理中心
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {navTabs.map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "none",
                      background: isActive ? "#047857" : "transparent",
                      color: isActive ? "white" : "#334155",
                      fontWeight: isActive ? "bold" : "500",
                      fontSize: "13.5px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "16px" }}>{t.icon}</span>
                      <span>{t.label}</span>
                    </div>
                    {t.count !== undefined && t.count > 0 && (
                      <span
                        style={{
                          background: isActive ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                          color: isActive ? "white" : "#64748b",
                          padding: "2px 7px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        {t.count}
                      </span>
                    )}
                    {t.badge && (
                      <span
                        style={{
                          background: isActive ? "rgba(255,255,255,0.25)" : "#fef3c7",
                          color: isActive ? "white" : "#b45309",
                          padding: "2px 7px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
              
              <div style={{ height: "1px", background: "#f1f5f9", margin: "8px 0" }} />
              
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontWeight: "bold",
                  fontSize: "13.5px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                  width: "100%",
                }}
              >
                <span style={{ fontSize: "16px" }}>🚪</span>
                <span>退出当前登录</span>
              </button>
            </nav>
          </aside>

          {/* 移动端：横向滚动 Tab（替代侧边栏） */}
          <div className="profile-mobile-tabs" style={{ display: "none", overflowX: "auto", gap: "6px", padding: "4px 0 10px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
            {navTabs.filter(t => !["security"].includes(t.id)).map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "7px 12px",
                    borderRadius: "20px",
                    border: "none",
                    background: isActive ? "#1677FF" : "#f1f5f9",
                    color: isActive ? "#fff" : "#475569",
                    fontWeight: isActive ? "700" : "500",
                    fontSize: "12px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {(t as any).count > 0 && (
                    <span style={{ fontSize: "10px", fontWeight: "700", background: isActive ? "rgba(255,255,255,0.3)" : "#e2e8f0", padding: "1px 5px", borderRadius: "8px" }}>
                      {(t as any).count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 右侧：主工作台展示大厅 */}
          <section className="profile-content-panel" style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.5rem", boxShadow: "0 4px 15px rgba(0,0,0,0.02)", minHeight: "520px" }}>
            {/* TAB 1: 我的发布 */}
            {activeTab === "published" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>📝 我发布的便民信息</h2>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>管理您发布的房产、商户、招聘、二手与相亲交友</p>
                  </div>
                  <Link href="/publish" style={{ padding: "8px 14px", background: "#047857", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: "bold" }}>
                    + 新建发布
                  </Link>
                </div>

                {publishedList.length === 0 ? (
                  <div style={{ padding: "4rem 1rem", textAlign: "center", color: "#94a3b8" }}>
                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>📭</div>
                    <div>您还没有发布过任何便民信息</div>
                    <Link href="/publish" style={{ display: "inline-block", marginTop: "1rem", color: "#047857", fontWeight: "bold", fontSize: "14px" }}>
                      立即免费发布一条 →
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {publishedList.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "1rem 1.25rem",
                          borderRadius: "12px",
                          border: "1px solid #f1f5f9",
                          background: "#fafafa",
                          transition: "all 0.2s",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, paddingRight: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "bold",
                                background: item.module === "house" ? "#dbeafe" : item.module === "job" ? "#fef3c7" : item.module === "shop" ? "#e0e7ff" : "#dcfce7",
                                color: item.module === "house" ? "#1e40af" : item.module === "job" ? "#92400e" : item.module === "shop" ? "#3730a3" : "#166534",
                              }}
                            >
                              {item.module.toUpperCase()}
                            </span>
                            <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "bold" }}>● {item.status === "ACTIVE" ? "已上线" : item.status}</span>
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</span>
                          </div>
                          <div style={{ fontWeight: "bold", fontSize: "14px", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.title}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <Link
                            href={item.link || "#"}
                            target="_blank"
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              background: "white",
                              border: "1px solid #cbd5e1",
                              color: "#334155",
                              textDecoration: "none",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            查看详情 ↗
                          </Link>
                          {item.module.toUpperCase() === "LISTING" && (
                            <>
                              <Link
                                href={`/info/${item.id}/edit`}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  background: "#f0fdfa",
                                  border: "1px solid #0B7A75",
                                  color: "#0B7A75",
                                  textDecoration: "none",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              >
                                ✏️ 编辑
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleRefreshListing(item.id)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  background: "#f0fdf4",
                                  border: "1px solid #16a34a",
                                  color: "#16a34a",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                }}
                              >
                                ⚡ 一键刷新
                              </button>
                            </>
                          )}
                          <Link
                            href={`/billing/promote?id=${item.id}&module=${item.module}`}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                              color: "white",
                              textDecoration: "none",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            🔥 置顶推广
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: 金币钱包 */}
            {activeTab === "coins" && (
              <div>
                <div style={{ marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>🪙 杨林金币钱包</h2>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>1 元 = 10 金币 · 支持发帖免审、置顶推广与极速抵扣</p>
                </div>

                {rechargeMsg && (
                  <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem", fontWeight: "bold", fontSize: "13px" }}>
                    {rechargeMsg}
                  </div>
                )}

                {/* 充值套餐 Grid */}
                <div className="profile-coin-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                  {coinPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      style={{
                        padding: "1.25rem",
                        borderRadius: "12px",
                        border: "2px solid #fef3c7",
                        background: "#fffbeb",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div style={{ fontWeight: "bold", color: "#92400e", fontSize: "15px" }}>{pkg.coins} 金币</div>
                      {pkg.bonusCoins > 0 && (
                        <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: "bold" }}>赠送 +{pkg.bonusCoins} 币</div>
                      )}
                      <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#b45309" }}>
                        ¥{pkg.price ?? (pkg.priceCents ? (pkg.priceCents / 100).toFixed(0) : "10")}
                      </div>
                      <button
                        onClick={() => handleOpenCoinCashier(pkg)}
                        style={{
                          marginTop: "6px",
                          padding: "8px 0",
                          background: "#f59e0b",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        立即充值
                      </button>
                    </div>
                  ))}
                </div>

                {/* 交易明细记录 */}
                <h3 style={{ fontSize: "1rem", fontWeight: "bold", color: "#0f172a", marginBottom: "0.75rem" }}>📜 金币收支明细</h3>
                {coinTransactions.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>暂无金币收支记录</div>
                ) : (
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ padding: "10px 14px", textAlign: "left" }}>变动明细</th>
                          <th style={{ padding: "10px 14px", textAlign: "left" }}>类型</th>
                          <th style={{ padding: "10px 14px", textAlign: "right" }}>金额</th>
                          <th style={{ padding: "10px 14px", textAlign: "right" }}>时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coinTransactions.map((tx: any) => (
                          <tr key={tx.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 14px", fontWeight: "bold" }}>{tx.remark || tx.type}</td>
                            <td style={{ padding: "10px 14px", color: "#64748b" }}>{tx.type}</td>
                            <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "bold", color: tx.amount > 0 ? "#16a34a" : "#dc2626" }}>
                              {tx.amount > 0 ? `+${tx.amount}` : tx.amount} 币
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8", fontSize: "12px" }}>
                              {new Date(tx.createdAt).toLocaleDateString("zh-CN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: 我的会员 */}
            {activeTab === "membership" && (
              <div>
                <div style={{ marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>👑 B2B 企业与 VIP 会员特权</h2>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>开通享有房产发布配额、招聘名额与专属大标牌展示</p>
                </div>

                {memberMsg && (
                  <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem", fontWeight: "bold", fontSize: "13px" }}>
                    {memberMsg}
                  </div>
                )}

                <div className="profile-member-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
                  {membershipPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      style={{
                        padding: "1.5rem",
                        borderRadius: "16px",
                        border: "2px solid #e2e8f0",
                        background: "white",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>{pkg.name}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "1rem" }}>有效期限: {pkg.durationDays} 天</div>
                        <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#047857", marginBottom: "1rem" }}>
                          ¥{pkg.priceYuan ?? (pkg.priceCents ? (pkg.priceCents / 100).toFixed(2) : pkg.price || "98.00")}
                        </div>
                        <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>{pkg.description || "包含优先展示、免审极速发布与专属 VIP 会员身份标识。"}</p>
                      </div>

                      <button
                        onClick={() => handleOpenMemberCashier(pkg)}
                        style={{
                          marginTop: "1.5rem",
                          padding: "10px 0",
                          background: "#047857",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        立即开通特权
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: 积分签到 */}
            {activeTab === "points" && (
              <div>
                <div style={{ marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>🎁 每日签到与积分中心</h2>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>每日打卡领积分 · 累计积分兑换置顶特权</p>
                </div>

                {checkinMsg && (
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem", fontWeight: "bold", fontSize: "13px" }}>
                    {checkinMsg}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem" }}>
                  <div>
                    <div style={{ fontSize: "14px", color: "#166534", fontWeight: "bold" }}>今日打卡状态</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#15803d", marginTop: "4px" }}>
                      {pointAccount?.checkedInToday ? "今日已打卡 ✓" : "尚未签到打卡"}
                    </div>
                  </div>
                  <button
                    onClick={handleCheckin}
                    disabled={checkinLoading || pointAccount?.checkedInToday}
                    style={{
                      padding: "10px 24px",
                      background: pointAccount?.checkedInToday ? "#cbd5e1" : "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      cursor: pointAccount?.checkedInToday ? "default" : "pointer",
                      fontSize: "14px",
                    }}
                  >
                    {pointAccount?.checkedInToday ? "已完成" : "点击签到 +10分"}
                  </button>
                </div>

                {/* P5 积分商城与权益兑换 */}
                <div style={{ marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "bold", color: "#0f172a", marginBottom: "0.75rem" }}>
                    🎁 积分商城与特权兑换
                  </h3>
                  {redeemMsg && (
                    <div style={{ padding: "10px 14px", background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", borderRadius: "8px", marginBottom: "1rem", fontWeight: "bold", fontSize: "13px" }}>
                      {redeemMsg}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                    {[
                      { type: "COUPON_10", cost: 50, title: "10元本地生活通用券", desc: "满30可用，通用全站上门服务", icon: "🎟️" },
                      { type: "TOPPING_3D", cost: 100, title: "3天信息置顶体验券", desc: "任意便民/招聘/房产置顶生效", icon: "🚀" },
                      { type: "PLUS_15D", cost: 200, title: "15天平台生活PLUS卡", desc: "尊享发帖额度翻倍与优先审核", icon: "👑" },
                    ].map((item: any) => (
                      <div
                        key={item.type}
                        style={{
                          background: "white",
                          borderRadius: "14px",
                          border: "1px solid #e2e8f0",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "24px", marginBottom: "6px" }}>{item.icon}</div>
                          <div style={{ fontSize: "15px", fontWeight: "bold", color: "#0f172a" }}>{item.title}</div>
                          <div style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 10px" }}>{item.desc}</div>
                        </div>
                        <button
                          onClick={() => handleRedeemPoints(item.type)}
                          disabled={redeemLoading || (pointAccount?.balance || 0) < item.cost}
                          style={{
                            padding: "8px 0",
                            borderRadius: "8px",
                            border: "none",
                            background: (pointAccount?.balance || 0) >= item.cost ? "#047857" : "#cbd5e1",
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "13px",
                            cursor: (pointAccount?.balance || 0) >= item.cost ? "pointer" : "not-allowed",
                          }}
                        >
                          {item.cost} 积分兑换
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 积分流水明细 */}
                <h3 style={{ fontSize: "1rem", fontWeight: "bold", color: "#0f172a", marginBottom: "0.75rem" }}>📜 积分收支明细</h3>
                {pointTransactions.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>暂无积分变动记录</div>
                ) : (
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ padding: "10px 14px", textAlign: "left" }}>变动说明</th>
                          <th style={{ padding: "10px 14px", textAlign: "right" }}>积分数</th>
                          <th style={{ padding: "10px 14px", textAlign: "right" }}>时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pointTransactions.map((tx) => (
                          <tr key={tx.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 14px", fontWeight: "bold" }}>{tx.remark || tx.type}</td>
                            <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "bold", color: tx.amount > 0 ? "#16a34a" : "#dc2626" }}>
                              {tx.amount > 0 ? `+${tx.amount}` : tx.amount} 分
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8", fontSize: "12px" }}>
                              {new Date(tx.createdAt).toLocaleDateString("zh-CN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: 房产管理 */}
            {activeTab === "houses" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>🏠 我的房产楼市发布</h2>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>管理您发布的租房、二手房与商铺房源</p>
                  </div>
                  <Link href="/house/new" style={{ padding: "8px 14px", background: "#0284c7", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: "bold" }}>
                    + 发布房源
                  </Link>
                </div>

                {housesList.length === 0 ? (
                  <div style={{ padding: "4rem 1rem", textAlign: "center", color: "#94a3b8" }}>暂无发布的房产房源</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {housesList.map((h) => (
                      <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid #f1f5f9", background: "#fafafa" }}>
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "14px", color: "#0f172a", marginBottom: "4px" }}>{h.title}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {h.layout} · {h.price} · {h.location}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <Link href={`/house/${h.id}`} target="_blank" style={{ padding: "6px 12px", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#334155", fontSize: "12px", textDecoration: "none", fontWeight: "bold" }}>
                            查看 ↗
                          </Link>
                          <Link href={`/billing/promote?id=${h.id}&module=house`} style={{ padding: "6px 12px", background: "#f59e0b", borderRadius: "6px", color: "white", fontSize: "12px", textDecoration: "none", fontWeight: "bold" }}>
                            🔥 置顶
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: 历史商户资料（前台入驻业务已停止） */}
            {activeTab === "shops" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>🏪 历史好店资料</h2>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>商家入驻服务已停止，此处仅保留已有资料查询</p>
                  </div>
                  <Link href="/haodian" style={{ padding: "8px 14px", background: "#3730a3", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: "bold" }}>
                    浏览自营商城
                  </Link>
                </div>

                {shopsList.length === 0 ? (
                  <div style={{ padding: "4rem 1rem", textAlign: "center", color: "#94a3b8" }}>暂无历史好店资料</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {shopsList.map((s) => (
                      <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid #f1f5f9", background: "#fafafa" }}>
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "14px", color: "#0f172a", marginBottom: "4px" }}>{s.name}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {s.category} · {s.address} · 电话: {s.phone}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <Link href={`/haodian/${s.id}`} target="_blank" style={{ padding: "6px 12px", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#334155", fontSize: "12px", textDecoration: "none", fontWeight: "bold" }}>
                            查看 ↗
                          </Link>
                          <Link href={`/billing/promote?id=${s.id}&module=shop`} style={{ padding: "6px 12px", background: "#f59e0b", borderRadius: "6px", color: "white", fontSize: "12px", textDecoration: "none", fontWeight: "bold" }}>
                            🔥 霸屏推广
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: 招聘管理 */}
            {activeTab === "jobs" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>💼 我的招聘岗位与用人需求</h2>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>管理您发布的招工岗位与收到的求职投递</p>
                  </div>
                  <Link href="/jobs/new" style={{ padding: "8px 14px", background: "#b45309", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: "bold" }}>
                    + 发布职位
                  </Link>
                </div>

                {jobsList.length === 0 ? (
                  <div style={{ padding: "4rem 1rem", textAlign: "center", color: "#94a3b8" }}>暂无发布的招工职位</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {jobsList.map((j) => {
                      const isOffline = (j.status || "").toUpperCase() === "OFFLINE";
                      const isPending = (j.status || "").toUpperCase() === "PENDING";
                      return (
                        <div
                          key={j.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "1rem 1.25rem",
                            borderRadius: "12px",
                            border: isOffline ? "1px dashed #cbd5e1" : "1px solid #f1f5f9",
                            background: isOffline ? "#f8fafc" : "#fafafa",
                            opacity: isOffline ? 0.75 : 1,
                            transition: "all 0.2s"
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <div style={{ fontWeight: "bold", fontSize: "14px", color: isOffline ? "#64748b" : "#0f172a" }}>
                                {j.title}
                              </div>
                              {/* 状态徽章 Badge */}
                              {isOffline ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold", background: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1" }}>
                                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#94a3b8" }} />
                                  已下线 / 暂停招聘
                                </span>
                              ) : isPending ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold", background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#d97706" }} />
                                  ⏳ 待审核
                                </span>
                              ) : (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold", background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }}>
                                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }} />
                                  ✅ 招聘中 (已上线)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              {j.company} · 薪资: <b style={{ color: isOffline ? "#94a3b8" : "#d97706" }}>{j.salary}</b> · 片区: {j.area}
                              {isOffline && <span style={{ marginLeft: "8px", color: "#dc2626", fontWeight: "bold" }}>（前台暂不公开展示）</span>}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <Link href={`/jobs/${j.id}`} target="_blank" style={{ padding: "6px 12px", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#334155", fontSize: "12px", textDecoration: "none", fontWeight: "bold" }}>
                              查看 ↗
                            </Link>
                            {!isOffline && (
                              <Link href={`/billing/promote?id=${j.id}&module=job`} style={{ padding: "6px 12px", background: "#f59e0b", borderRadius: "6px", color: "white", fontSize: "12px", textDecoration: "none", fontWeight: "bold" }}>
                                🔥 置顶招人
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 8: 相亲交友 */}
            {activeTab === "dating" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>💕 我的同城相亲交友资料</h2>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>管理个人相亲征婚卡片与牵线动态</p>
                  </div>
                  <Link href="/love/new" style={{ padding: "8px 14px", background: "#db2777", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: "bold" }}>
                    + 发布相亲
                  </Link>
                </div>

                {datingList.length === 0 ? (
                  <div style={{ padding: "4rem 1rem", textAlign: "center", color: "#94a3b8" }}>暂未登记相亲交友信息</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {datingList.map((d) => (
                      <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid #f1f5f9", background: "#fafafa" }}>
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "14px", color: "#0f172a", marginBottom: "4px" }}>{d.nickname} ({d.gender})</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            职业: {d.occupation} · 收入: {d.income} · 地区: {d.location}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <Link href={`/love/${d.id}`} target="_blank" style={{ padding: "6px 12px", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#334155", fontSize: "12px", textDecoration: "none", fontWeight: "bold" }}>
                            查看 ↗
                          </Link>
                          <Link href={`/billing/promote?id=${d.id}&module=dating`} style={{ padding: "6px 12px", background: "#f59e0b", borderRadius: "6px", color: "white", fontSize: "12px", textDecoration: "none", fontWeight: "bold" }}>
                            🔥 置顶推荐
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 9: 账号安全与密码修改 */}
            {activeTab === "security" && (
              <div>
                <div style={{ marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>🔒 账号安全中心</h2>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>修改个人登录密码与全平台设备登录管理</p>
                </div>

                {secMsg && <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem", fontWeight: "bold" }}>{secMsg}</div>}
                {secErr && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem", fontWeight: "bold" }}>{secErr}</div>}

                <form onSubmit={handlePasswordChange} style={{ maxWidth: "420px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "#475569" }}>
                    原登录密码
                    <input
                      required
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="请输入当前密码"
                      style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </label>

                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "#475569" }}>
                    新密码（至少 6 位）
                    <input
                      required
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="请输入新密码"
                      style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </label>

                  <button
                    type="submit"
                    style={{
                      padding: "11px 0",
                      background: "#047857",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "14px",
                      marginTop: "6px",
                    }}
                  >
                    确认修改密码
                  </button>
                </form>

                <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid #f1f5f9" }}>
                  <h4 style={{ margin: "0 0 6px 0", color: "#dc2626", fontSize: "14px" }}>⚠️ 紧急安全控制：踢出全平台登录设备</h4>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 1rem 0" }}>如果您怀疑账号泄露，点击下方按钮将立即作废该账号在所有手机与电脑端已登录的 Session。</p>
                  <button
                    onClick={handleLogoutAll}
                    style={{
                      padding: "8px 16px",
                      background: "#fee2e2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    ⚡ 一键踢出全平台设备
                  </button>
                </div>
              </div>
            )}

            {/* TAB 10: 我的收藏 */}
            {activeTab === "favorites" && (
              <div>
                <div style={{ marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>💖 我的收藏夹</h2>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>您收藏的招工、房源、园区招商、社区与好店内容</p>
                  </div>

                  {/* 频道筛选标签 */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    {[
                      { key: "ALL", label: "全部" },
                      { key: "JOB", label: "招聘" },
                      { key: "HOUSE", label: "房产" },
                      { key: "INDUSTRIAL", label: "园区招商" },
                      { key: "COMMUNITY", label: "社区" },
                      { key: "MERCHANT", label: "商家" },
                      { key: "PRODUCT", label: "商品" },
                    ].map((tab) => {
                      const active = favoriteCategory === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setFavoriteCategory(tab.key)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            fontSize: "12.5px",
                            fontWeight: active ? "700" : "500",
                            border: active ? "1px solid #0B7A75" : "1px solid #e2e8f0",
                            background: active ? "#F0FDF4" : "#ffffff",
                            color: active ? "#0B7A75" : "#475569",
                            cursor: "pointer",
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {filteredFavorites.length === 0 ? (
                  <div style={{ padding: "4rem 1rem", textAlign: "center", color: "#94a3b8" }}>暂无该分类的收藏信息</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {filteredFavorites.map((fav) => {
                      const badge = getResourceTypeBadge(fav.resourceType);
                      return (
                        <div
                          key={fav.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "1rem 1.25rem",
                            borderRadius: "12px",
                            border: "1px solid #f1f5f9",
                            background: "#fafafa",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: "11.5px",
                                fontWeight: "700",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                background: badge.bg,
                                color: badge.color,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {badge.label}
                            </span>
                            <div style={{ fontWeight: "bold", fontSize: "14px", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {fav.title}
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "12px" }}>
                            <Link
                              href={fav.link || "#"}
                              target="_blank"
                              style={{
                                padding: "6px 14px",
                                background: "white",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                color: "#334155",
                                fontSize: "12.5px",
                                textDecoration: "none",
                                fontWeight: "bold",
                              }}
                            >
                              查看 ↗
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveFavorite(e, fav.id)}
                              disabled={favRemovingId === fav.id}
                              style={{
                                padding: "6px 10px",
                                background: "transparent",
                                border: "none",
                                color: "#94a3b8",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              {favRemovingId === fav.id ? "取消中..." : "取消收藏"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 11: 消息通知 */}
            {activeTab === "notifications" && (
              <div>
                <div style={{ marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: "#0f172a" }}>🔔 消息与系统通知</h2>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>审核结果通知、订单履约、互动提醒与系统公告</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* 分类 Tab */}
                    <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
                      {[
                        { key: "ALL", label: "全部" },
                        { key: "ORDER", label: "订单" },
                        { key: "INTERACTION", label: "互动" },
                        { key: "SYSTEM", label: "系统" },
                      ].map((tc) => (
                        <button
                          key={tc.key}
                          onClick={() => setNotifCategory(tc.key)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "none",
                            fontSize: "12px",
                            fontWeight: notifCategory === tc.key ? "bold" : "normal",
                            background: notifCategory === tc.key ? "white" : "transparent",
                            color: notifCategory === tc.key ? "#0f172a" : "#64748b",
                            cursor: "pointer",
                            boxShadow: notifCategory === tc.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                          }}
                        >
                          {tc.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleReadAllNotifications}
                      disabled={readAllLoading || notificationsList.filter((n) => !n.readAt).length === 0}
                      style={{
                        padding: "6px 12px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        color: "#15803d",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      {readAllLoading ? "处理中..." : "✓ 一键已读"}
                    </button>
                  </div>
                </div>

                {notificationsList.filter((n: any) => notifCategory === "ALL" || (n.category || "SYSTEM") === notifCategory).length === 0 ? (
                  <div style={{ padding: "4rem 1rem", textAlign: "center", color: "#94a3b8" }}>暂无此类系统通知</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {notificationsList
                      .filter((n: any) => notifCategory === "ALL" || (n.category || "SYSTEM") === notifCategory)
                      .map((notif) => (
                        <div key={notif.id} style={{ padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid #f1f5f9", background: notif.readAt ? "#fafafa" : "#f0fdf4" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontWeight: "bold", fontSize: "14px", color: "#0f172a" }}>{notif.title}</span>
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(notif.createdAt).toLocaleDateString("zh-CN")}</span>
                          </div>
                          <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>{notif.content}</p>
                          {notif.link && (
                            <Link href={notif.link} style={{ display: "inline-block", marginTop: "6px", fontSize: "12px", color: "#047857", fontWeight: "bold", textDecoration: "none" }}>
                              查看详情 ›
                            </Link>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 12: 我的优惠券 */}
            {activeTab === "coupons" && renderCouponsTab()}

            {/* TAB 13: 关注店铺 */}
            {activeTab === "follows" && renderFollowsTab()}

            {/* TAB 14: 常用服务 */}
            {activeTab === "services" && renderServicesTab()}

            {/* TAB 15: 统一认证中心 */}
            {activeTab === "verification" && renderVerificationTab()}
          </section>
        </div>
      </main>
      </div>{/* p-desktop-view 结束 */}

      {/* 编辑个人资料弹窗 */}
      {editOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "440px", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem", color: "#0f172a" }}>✏️ 修改个人名片资料</h3>

            {editMsg && <div style={{ background: "#ecfdf5", color: "#065f46", padding: "8px 12px", borderRadius: "6px", marginBottom: "1rem", fontSize: "13px" }}>{editMsg}</div>}
            {editErr && <div style={{ background: "#fef2f2", color: "#991b1b", padding: "8px 12px", borderRadius: "6px", marginBottom: "1rem", fontSize: "13px" }}>{editErr}</div>}

            <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "#475569" }}>
                个人昵称
                <input
                  required
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder="请输入您的对外昵称"
                  style={{ width: "100%", padding: "9px 12px", marginTop: "4px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </label>

              <label style={{ fontSize: "13px", fontWeight: "bold", color: "#475569" }}>
                头像更换
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]);
                  }}
                  style={{ width: "100%", marginTop: "4px", fontSize: "12px" }}
                />
              </label>

              {user?.wechatAvatar && (
                <div style={{ marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setEditAvatar(user.wechatAvatar || "")}
                    style={{
                      padding: "4px 10px",
                      background: "#F0FDF4",
                      color: "#166534",
                      border: "1px solid #86EFAC",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>🟢</span> 使用微信头像
                  </button>
                </div>
              )}

              {editUploading && <div style={{ fontSize: "12px", color: "#0284c7" }}>正在上传头像...</div>}
              {editAvatar && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                  <img src={editAvatar} referrerPolicy="no-referrer" alt="预览" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
                  <span style={{ fontSize: "12px", color: "#16a34a" }}>头像就绪 ✓</span>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button type="button" onClick={() => setEditOpen(false)} style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                  取消
                </button>
                <button type="submit" style={{ padding: "8px 18px", background: "#047857", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 微信安全支付收银台模态框 (Portal挂载至全局Body) */}
      {cashierModal.open && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              stopCashierPolling();
              setCashierModal((prev) => ({ ...prev, open: false }));
            }
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              padding: "32px 28px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.3)",
              textAlign: "center",
              position: "relative",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => {
                stopCashierPolling();
                setCashierModal((prev) => ({ ...prev, open: false }));
              }}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
                fontSize: "16px",
              }}
            >
              ✕
            </button>

            {cashierModal.success ? (
              <div style={{ padding: "20px 0" }}>
                <div style={{ fontSize: "52px", marginBottom: "16px" }}>🎉</div>
                <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#047857", margin: "0 0 8px 0" }}>
                  微信支付成功！
                </h3>
                <p style={{ fontSize: "14px", color: "#475569", margin: 0 }}>
                  您的权益已实时到账并已为您完成系统记账！
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "20px" }}>🟢</span>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#059669" }}>微信安全支付收银台</span>
                </div>

                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>
                  {cashierModal.targetTitle}
                </h3>

                <div style={{ fontSize: "28px", fontWeight: "900", color: "#e11d48", margin: "10px 0 4px 0" }}>
                  ¥{cashierModal.amountYuan}
                </div>

                {cashierModal.orderNo && (
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "16px" }}>
                    订单号: <code style={{ color: "#64748b" }}>{cashierModal.orderNo}</code>
                  </div>
                )}

                {cashierModal.loading ? (
                  <div style={{ padding: "48px 0", color: "#059669", fontSize: "14px", fontWeight: "bold" }}>
                    正在创建微信安全支付订单...
                  </div>
                ) : (
                  <div>
                    {cashierModal.paymentScene === "JSAPI" ? (
                      <div style={{ padding: "32px 0", textAlign: "center" }}>
                        <div style={{ fontSize: "48px", marginBottom: "12px" }}>💳</div>
                        <p style={{ color: "#059669", fontWeight: "700", fontSize: "15px" }}>正在拉起微信支付...</p>
                        <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "8px" }}>如未自动弹出支付窗口，请点击下方按钮重试</p>
                        <button
                          type="button"
                          onClick={async () => {
                            if (cashierModal.jsapiParams) {
                              try {
                                const r = await invokeWeixinPay(cashierModal.jsapiParams);
                                if (r === "success" && cashierModal.orderNo) startCashierPolling(cashierModal.orderNo);
                                else if (r === "cancel") setCashierModal((prev) => ({ ...prev, error: "您已取消支付" }));
                              } catch { setCashierModal((prev) => ({ ...prev, error: "拉起支付失败" })); }
                            }
                          }}
                          style={{ marginTop: "12px", padding: "8px 20px", background: "#07c160", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }}
                        >
                          重新拉起微信支付
                        </button>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            width: "200px",
                            height: "200px",
                            margin: "0 auto 16px",
                            borderRadius: "16px",
                            border: "2px solid #e2e8f0",
                            padding: "10px",
                            background: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                          }}
                        >
                          <img
                            src={`/api/payment/qrcode?text=${encodeURIComponent(
                              cashierModal.codeUrl || `weixin://wxpay/bizpayurl?pr=${cashierModal.orderNo}`
                            )}`}
                            alt="微信支付二维码"
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", color: "#64748b", marginBottom: "16px", fontWeight: "600" }}>
                          <span>⏳</span> 正在等待微信扫码支付中...
                        </div>
                      </>
                    )}

                    {cashierModal.error && (
                      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", marginBottom: "14px" }}>
                        ⚠️ {cashierModal.error}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={cashierModal.checking}
                      onClick={handleVerifyCashier}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "12px",
                        background: "#047857",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: "700",
                        border: "none",
                        cursor: cashierModal.checking ? "not-allowed" : "pointer",
                        opacity: cashierModal.checking ? 0.7 : 1,
                        boxShadow: "0 4px 12px rgba(4, 120, 87, 0.2)",
                      }}
                    >
                      {cashierModal.checking ? "正在核验订单..." : "✓ 我已完成微信支付"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {promoteListing && (
        <PromotionSheet
          listingId={promoteListing.id}
          listingTitle={promoteListing.title}
          isOpen={!!promoteListing}
          onClose={() => setPromoteListing(null)}
          onSuccess={() => {
            setPromoteListing(null);
          }}
        />
      )}

      {/* 统一身份认证申请弹窗 */}
      {verifyModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "480px", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a" }}>🛡️ 申请身份与主体认证</h3>
              <button onClick={() => setVerifyModalOpen(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleVerificationSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "#334155" }}>
                认证类型
                <select
                  value={verifyForm.verifyType}
                  onChange={(e) => setVerifyForm({ ...verifyForm, verifyType: e.target.value })}
                  style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="REAL_NAME">👤 个人实名认证 (赠15积分)</option>
                  <option value="ENTERPRISE">🏢 经开区企业雇主认证</option>
                  <option value="MERCHANT">🏪 本地好店商家认证</option>
                  <option value="PROVIDER">👨‍🔧 专业服务者/师傅认证</option>
                  <option value="LANDLORD">🏠 真实房东直供认证</option>
                </select>
              </label>

              {(verifyForm.verifyType === "REAL_NAME" || verifyForm.verifyType === "PROVIDER" || verifyForm.verifyType === "LANDLORD") && (
                <>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "#334155" }}>
                    真实姓名 / 申请人
                    <input
                      required
                      type="text"
                      value={verifyForm.idCardName}
                      onChange={(e) => setVerifyForm({ ...verifyForm, idCardName: e.target.value })}
                      placeholder="例：张三"
                      style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </label>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "#334155" }}>
                    身份证号码 (平台严格脱敏加密保护)
                    <input
                      type="text"
                      value={verifyForm.idCardNoMasked}
                      onChange={(e) => setVerifyForm({ ...verifyForm, idCardNoMasked: e.target.value })}
                      placeholder="例：53012419900101XXXX"
                      style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </label>
                </>
              )}

              {(verifyForm.verifyType === "ENTERPRISE" || verifyForm.verifyType === "MERCHANT") && (
                <>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "#334155" }}>
                    企业 / 店铺注册全称
                    <input
                      required
                      type="text"
                      value={verifyForm.companyName}
                      onChange={(e) => setVerifyForm({ ...verifyForm, companyName: e.target.value })}
                      placeholder="例：云南某某工贸有限公司 / 杨林某某汽修店"
                      style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </label>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "#334155" }}>
                    统一社会信用代码 / 注册号
                    <input
                      type="text"
                      value={verifyForm.licenseNo}
                      onChange={(e) => setVerifyForm({ ...verifyForm, licenseNo: e.target.value })}
                      placeholder="例：91530124XXXXXXXXXX"
                      style={{ width: "100%", padding: "10px", marginTop: "4px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </label>
                </>
              )}

              <div style={{ fontSize: "12px", color: "#64748b", background: "#f8fafc", padding: "10px", borderRadius: "8px" }}>
                🔒 承诺说明：杨林生活网依据《网络安全法》执行实名认证，所有提交信息均加密存储，绝不泄露给任何第三方。
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", color: "#64748b", fontWeight: "bold", cursor: "pointer" }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={verifySubmitting}
                  style={{ flex: 2, padding: "10px", borderRadius: "8px", border: "none", background: "#047857", color: "white", fontWeight: "bold", cursor: "pointer" }}
                >
                  {verifySubmitting ? "正在提交..." : "立即提交认证"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
