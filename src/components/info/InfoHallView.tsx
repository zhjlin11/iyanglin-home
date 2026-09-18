"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Car,
  ShoppingBag,
  Wrench,
  Laptop,
  Wheat,
  UtensilsCrossed,
  Briefcase,
  Dog,
  GraduationCap,
  LifeBuoy,
  Search,
  PlusCircle,
  Filter,
  SlidersHorizontal,
  X,
  Clock,
  MapPin,
  Tag,
  CheckCircle2,
  Heart,
  Share2,
  Eye,
  ChevronRight,
  ArrowUpDown,
  Image as ImageIcon,
  Flame,
  Layers,
  PhoneCall,
  Sparkles
} from "lucide-react";
import {
  INFO_CATEGORIES,
  INFO_AREAS,
  getCategoryByKey,
  getCategoryByName,
  getCategoryBadge,
  getItemTypeBadge,
  getItemTypeDisplay,
  TIME_RANGES,
} from "@/lib/info-categories";
import Pagination from "@/components/Pagination";
import InfoFeaturedShowcase from "@/components/info/InfoFeaturedShowcase";

interface InfoItem {
  id: string;
  title: string;
  body: string;
  category: string;
  subCategory?: string | null;
  itemType: string;
  price?: string | null;
  priceUnit?: string | null;
  condition?: string | null;
  area?: string | null;
  address?: string | null;
  contact?: string | null;
  contactName?: string | null;
  wechat?: string | null;
  images: string[];
  viewsCount: number;
  isTop: boolean;
  isFeatured?: boolean;
  status: string;
  rejectReason?: string | null;
  expiresAt?: string | Date | null;
  extraData?: any;
  fromPlace?: string | null;
  toPlace?: string | null;
  departureTime?: string | null;
  createdAt: string | Date;
  refreshedAt: string | Date;
  author?: {
    id: string;
    username: string;
    nickname?: string | null;
    avatar?: string | null;
    phoneVerifiedAt?: string | Date | null;
    role?: string;
  } | null;
}

interface InfoHallViewProps {
  initialItems: InfoItem[];
  homeFeaturedItems?: any[];
  featuredProviders?: any[];
  totalCount: number;
  totalApprovedAll: number;
  todayApprovedCount: number;
  currentPage: number;
  pageSize: number;
  areas: string[];
  currentQuery: string;
  currentCategory: string;
  currentSubCategory: string;
  currentArea: string;
  currentItemType: string;
  currentTimeRange: string;
  currentHasImage: boolean;
  currentSort: string;
}

// 类别图标映射
const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  used: ShoppingBag,
  carpool: Car,
  service: Wrench,
  digital: Laptop,
  agri: Wheat,
  food: UtensilsCrossed,
  business: Briefcase,
  pet: Dog,
  tutoring: GraduationCap,
  help: LifeBuoy,
};

function formatTimeAgo(dateInput: Date | string | null | undefined) {
  if (!dateInput) return "刚刚";
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 5) return "刚刚刷新";
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays === 1) return "昨天";
  if (diffDays <= 7) return `${diffDays}天前`;
  return date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

function formatPriceDisplay(item: InfoItem) {
  if (!item.price || item.price === "面议" || item.price === "0") {
    return { text: "面议", isFree: false, color: "#0B7A75" };
  }
  if (item.price === "免费" || item.price === "互助免费") {
    return { text: "免费", isFree: true, color: "#10b981" };
  }
  const cleanPrice = String(item.price).replace(/^(¥|￥)/, "").trim();
  if (!isNaN(Number(cleanPrice))) {
    return {
      text: `¥${cleanPrice}`,
      unit: item.priceUnit || "元",
      isFree: false,
      color: "#e11d48",
    };
  }
  return { text: item.price, isFree: false, color: "#e11d48" };
}

export default function InfoHallView({
  initialItems,
  homeFeaturedItems = [],
  featuredProviders = [],
  totalCount,
  totalApprovedAll,
  todayApprovedCount,
  currentPage,
  pageSize,
  areas,
  currentQuery,
  currentCategory,
  currentSubCategory,
  currentArea,
  currentItemType,
  currentTimeRange,
  currentHasImage,
  currentSort,
}: InfoHallViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 搜索关键字状态
  const [searchInput, setSearchInput] = useState(currentQuery);

  // 手机端 Bottom Sheet 状态
  const [showMoreCategoriesSheet, setShowMoreCategoriesSheet] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // 收藏与点赞本地状态
  const [favoritedMap, setFavoritedMap] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 临时筛选参数（供 Filter Sheet 暂存）
  const [sheetTimeRange, setSheetTimeRange] = useState(currentTimeRange || "all");
  const [sheetHasImage, setSheetHasImage] = useState(currentHasImage);
  const [sheetSort, setSheetSort] = useState(currentSort || "newest");

  // 显示 Toast 提示
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // URL 构建助手
  const createQueryUrl = (params: Record<string, string | boolean | number | undefined>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === "" || v === "all" || v === false) {
        p.delete(k);
      } else {
        p.set(k, String(v));
      }
    });
    // 改变筛选条件时通常重置到第一页
    if (!("page" in params) && params.page !== 1) {
      p.delete("page");
    }
    const query = p.toString();
    return query ? `/info?${query}` : "/info";
  };

  const handleNavigate = (params: Record<string, string | boolean | number | undefined>) => {
    router.push(createQueryUrl(params));
  };

  // 切换收藏
  const handleToggleFavorite = async (itemId: string, itemTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isFav = favoritedMap[itemId];
    const newFav = !isFav;
    setFavoritedMap((prev) => ({ ...prev, [itemId]: newFav }));

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "LISTING",
          targetId: itemId,
          title: itemTitle,
          link: `/info/${itemId}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.needLogin || res.status === 401) {
          showToast("请先登录后再收藏信息");
          router.push(`/login?from=/info/${itemId}`);
          return;
        }
        throw new Error(data.error || "收藏操作失败");
      }
      showToast(newFav ? "❤️ 收藏成功，可在个人中心查看" : "已取消收藏");
    } catch (err: any) {
      // 回滚状态
      setFavoritedMap((prev) => ({ ...prev, [itemId]: isFav }));
      showToast(err.message || "网络异常，请重试");
    }
  };

  // 快捷分享
  const handleShare = (itemId: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/info/${itemId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast("📋 信息链接已复制，可粘贴分享给好友");
      }).catch(() => {
        showToast(`请复制链接: ${url}`);
      });
    } else {
      showToast(`请复制链接: ${url}`);
    }
  };

  // 获取当前分类对象
  const activeCatObj = currentCategory !== "all"
    ? getCategoryByKey(currentCategory) || getCategoryByName(currentCategory)
    : null;

  // 8个高频分类 + 第9个"更多分类"
  const mobileTop8Categories = INFO_CATEGORIES.slice(0, 8);

  return (
    <div className="info-hall-container" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* 提示 Toast */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.92)",
            color: "white",
            padding: "10px 20px",
            borderRadius: "30px",
            fontSize: "13px",
            fontWeight: "600",
            zIndex: 9999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            backdropFilter: "blur(6px)",
            pointerEvents: "none",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* 1. 顶部 Hero Banner (260~320px 黄金高度) */}
      <section
        className="info-hero-section"
        style={{
          background: "linear-gradient(135deg, #064E4B 0%, #0B7A75 55%, #134E4A 100%)",
          color: "white",
          padding: "2.25rem 1rem 2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景微光光斑 */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-40px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(253, 224, 71, 0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="shell"
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* 顶栏标题与发布入口 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255, 255, 255, 0.15)",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                  backdropFilter: "blur(4px)",
                  marginBottom: "8px",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <Sparkles size={14} color="#fde047" />
                <span>杨林便民信息 · 本地生活服务大厅</span>
                <span>·</span>
                <span style={{ color: "#fde047" }}>真实互通</span>
              </div>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: "900",
                  margin: "0 0 6px 0",
                  letterSpacing: "-0.5px",
                }}
              >
                便民综合信息 · 街坊拼车闲置家政
              </h1>
              <p
                style={{
                  fontSize: "13.5px",
                  opacity: 0.88,
                  margin: 0,
                  maxWidth: "640px",
                  lineHeight: "1.5",
                }}
              >
                二手、拼车、维修、求助、转让、家政、本地服务，一站查询。经开区与大学城已汇聚{" "}
                <b style={{ color: "#fde047" }}>{totalApprovedAll}</b> 条真实信息 · 今日新发{" "}
                <b style={{ color: "#fde047" }}>{todayApprovedCount}</b> 条
              </p>
            </div>

            {/* 双核心发布入口 */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <Link
                href="/info/new"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255, 255, 255, 0.18)",
                  color: "#ffffff",
                  padding: "10px 18px",
                  borderRadius: "28px",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  textDecoration: "none",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <span>📝 免费发布信息</span>
              </Link>
              <Link
                href="/info/request/new"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#fde047",
                  color: "#064e4b",
                  padding: "10px 20px",
                  borderRadius: "28px",
                  fontSize: "13.5px",
                  fontWeight: "900",
                  textDecoration: "none",
                  boxShadow: "0 4px 18px rgba(0, 0, 0, 0.22)",
                }}
              >
                <span>⚡ 找师傅·发需求</span>
              </Link>
              <Link
                href="/services"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  padding: "10px 18px",
                  borderRadius: "28px",
                  fontSize: "13.5px",
                  fontWeight: "900",
                  textDecoration: "none",
                  boxShadow: "0 4px 18px rgba(0, 0, 0, 0.22)",
                }}
              >
                <span>🛒 服务商城·担保交易</span>
              </Link>
            </div>
          </div>

          {/* 搜索框 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNavigate({ q: searchInput.trim() || undefined, page: 1 });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              background: "white",
              borderRadius: "32px",
              padding: "4px 6px 4px 18px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.16)",
              maxWidth: "840px",
            }}
          >
            <Search size={18} color="#0B7A75" style={{ marginRight: "10px", flexShrink: 0 }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜拼车、二手、维修、宠物、求助、转让……"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "14.5px",
                color: "#0f172a",
                background: "transparent",
                padding: "8px 0",
              }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  handleNavigate({ q: undefined, page: 1 });
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                <X size={16} />
              </button>
            )}
            <button
              type="submit"
              style={{
                background: "#0B7A75",
                color: "white",
                border: "none",
                borderRadius: "24px",
                padding: "9px 26px",
                fontSize: "14px",
                fontWeight: "800",
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
            >
              搜索
            </button>
          </form>

          {/* 热门搜索标签 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "12px",
              flexWrap: "wrap",
              fontSize: "12px",
            }}
          >
            <span style={{ color: "#fde047", fontWeight: "700" }}>大家都在搜：</span>
            {[
              { q: "昆明拼车", label: "🚗 昆明拼车" },
              { q: "电动车", label: "🛵 电动车" },
              { q: "长水机场", label: "✈️ 机场顺风车" },
              { q: "家电维修", label: "🛠️ 家电维修" },
              { q: "土鸡蛋", label: "🥚 本地土鸡蛋" },
              { q: "二手手机", label: "📱 二手手机" },
              { q: "失物招领", label: "🔍 失物招领" },
            ].map((hot) => (
              <button
                key={hot.q}
                type="button"
                onClick={() => {
                  setSearchInput(hot.q);
                  handleNavigate({ q: hot.q, page: 1 });
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.16)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.2)",
                  padding: "3px 10px",
                  borderRadius: "14px",
                  fontSize: "11.5px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                {hot.label}
              </button>
            ))}
          </div>

          {/* P2 本地找师傅热门需求快捷入口与需求大厅提示 */}
          <div
            style={{
              marginTop: "16px",
              paddingTop: "14px",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "white", flexWrap: "wrap" }}>
              <span style={{ backgroundColor: "#f59e0b", color: "#ffffff", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>找师傅</span>
              <span>热门需求：</span>
              {[
                { name: "家电维修", icon: "🔌" },
                { name: "管道疏通", icon: "🚿" },
                { name: "开锁换锁", icon: "🔑" },
                { name: "家政保洁", icon: "🧹" },
                { name: "房屋修缮", icon: "🔨" },
                { name: "搬家拉货", icon: "🚚" },
              ].map((s) => (
                <Link
                  key={s.name}
                  href={`/info/request/new`}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    textDecoration: "none",
                    fontSize: "11.5px",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {s.icon} {s.name}
                </Link>
              ))}
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <Link
                href="/services"
                style={{
                  color: "#6ee7b7",
                  fontSize: "12px",
                  textDecoration: "none",
                  fontWeight: "700",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <span>🛒 标准服务商城</span>
                <ChevronRight size={13} />
              </Link>
              <Link
                href="/info/requests"
                style={{
                  color: "#fef08a",
                  fontSize: "12px",
                  textDecoration: "none",
                  fontWeight: "700",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <span>查看服务需求大厅 ›</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 分类导航矩阵 (PC 10大分类网格 / 手机端 8+1 架构) */}
      <section
        className="shell"
        style={{
          maxWidth: "1240px",
          margin: "1.25rem auto 0",
          padding: "0 1rem",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "1.25rem 1rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            border: "1px solid #e2e8f0",
          }}
        >
          {/* PC 端 10 大分类网格 */}
          <div className="pc-category-grid">
            {/* 全部分类 */}
            <button
              type="button"
              onClick={() => handleNavigate({ category: undefined, subCategory: undefined, page: 1 })}
              className={`cat-grid-btn ${currentCategory === "all" ? "active" : ""}`}
            >
              <div className="cat-icon-wrap all-icon">
                <Layers size={22} />
              </div>
              <span className="cat-btn-name">全部分类</span>
            </button>

            {/* 10 大标准分类 */}
            {INFO_CATEGORIES.map((cat) => {
              const IconComp = CATEGORY_ICON_MAP[cat.key] || Tag;
              const isActive = currentCategory === cat.key || currentCategory === cat.name;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleNavigate({ category: cat.key, subCategory: undefined, page: 1 })}
                  className={`cat-grid-btn ${isActive ? "active" : ""}`}
                >
                  <div className={`cat-icon-wrap ${isActive ? "active-icon" : ""}`}>
                    <IconComp size={22} />
                  </div>
                  <span className="cat-btn-name">{cat.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* 手机端 8 + 1 分类九宫格 */}
          <div className="mobile-category-grid">
            {/* 全部分类 */}
            <button
              type="button"
              onClick={() => handleNavigate({ category: undefined, subCategory: undefined, page: 1 })}
              className={`cat-grid-btn ${currentCategory === "all" ? "active" : ""}`}
            >
              <div className="cat-icon-wrap all-icon">
                <Layers size={20} />
              </div>
              <span className="cat-btn-name">全部</span>
            </button>

            {/* 前 7 个高频分类 */}
            {mobileTop8Categories.slice(0, 7).map((cat) => {
              const IconComp = CATEGORY_ICON_MAP[cat.key] || Tag;
              const isActive = currentCategory === cat.key || currentCategory === cat.name;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleNavigate({ category: cat.key, subCategory: undefined, page: 1 })}
                  className={`cat-grid-btn ${isActive ? "active" : ""}`}
                >
                  <div className={`cat-icon-wrap ${isActive ? "active-icon" : ""}`}>
                    <IconComp size={20} />
                  </div>
                  <span className="cat-btn-name">{cat.shortName}</span>
                </button>
              );
            })}

            {/* 第 9 个：更多分类 (点击打开 Bottom Sheet) */}
            <button
              type="button"
              onClick={() => setShowMoreCategoriesSheet(true)}
              className="cat-grid-btn"
              style={{ color: "#0B7A75" }}
            >
              <div className="cat-icon-wrap more-icon">
                <SlidersHorizontal size={20} color="#0B7A75" />
              </div>
              <span className="cat-btn-name" style={{ color: "#0B7A75", fontWeight: "800" }}>更多分类</span>
            </button>
          </div>

          {/* 二级子类滑动胶囊条 (当前选中大类有细分子类时展示) */}
          {activeCatObj && activeCatObj.subCategories.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                overflowX: "auto",
                paddingTop: "12px",
                marginTop: "12px",
                borderTop: "1px dashed #e2e8f0",
                scrollbarWidth: "none",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#64748b",
                  whiteSpace: "nowrap",
                  marginRight: "4px",
                }}
              >
                细分子类：
              </span>
              {activeCatObj.subCategories.map((sub) => {
                const isSubActive =
                  (currentSubCategory === "all" && sub.startsWith("全部")) ||
                  currentSubCategory === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() =>
                      handleNavigate({
                        subCategory: sub.startsWith("全部") ? undefined : sub,
                        page: 1,
                      })
                    }
                    style={{
                      fontSize: "12px",
                      padding: "4px 12px",
                      borderRadius: "16px",
                      border: "none",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      fontWeight: isSubActive ? "800" : "600",
                      background: isSubActive ? "#0B7A75" : "#f1f5f9",
                      color: isSubActive ? "white" : "#475569",
                      transition: "all 0.15s",
                    }}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 3. 多维筛选工具栏 (PC 端平铺 / 手机端横向 Chip 筛选条 + Bottom Sheet) */}
      <section
        className="shell"
        style={{
          maxWidth: "1240px",
          margin: "1rem auto 0",
          padding: "0 1rem",
        }}
      >
        {/* PC 端筛选工具栏 */}
        <div className="pc-filter-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* 区域切换 */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#64748b" }}>区域：</span>
              <div style={{ display: "flex", gap: "4px" }}>
                {["all", ...areas].map((areaItem) => {
                  const isActive = (currentArea === "all" && areaItem === "all") || currentArea === areaItem;
                  return (
                    <button
                      key={areaItem}
                      type="button"
                      onClick={() => handleNavigate({ area: areaItem === "all" ? undefined : areaItem, page: 1 })}
                      style={{
                        fontSize: "12px",
                        padding: "4px 10px",
                        borderRadius: "14px",
                        border: isActive ? "1px solid #0B7A75" : "1px solid #e2e8f0",
                        cursor: "pointer",
                        fontWeight: isActive ? "800" : "500",
                        background: isActive ? "#0B7A75" : "#ffffff",
                        color: isActive ? "white" : "#64748b",
                      }}
                    >
                      {areaItem === "all" ? "全部区域" : areaItem}
                    </button>
                  );
                })}
              </div>
            </div>

            <span style={{ color: "#cbd5e1" }}>|</span>

            {/* 供求切换 */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#64748b" }}>供求：</span>
              <div style={{ display: "flex", gap: "4px" }}>
                {[
                  { key: "all", label: "全部" },
                  { key: "OFFER", label: "提供/转让" },
                  { key: "WANTED", label: "需求/求购" },
                ].map((t) => {
                  const isActive = currentItemType === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => handleNavigate({ itemType: t.key === "all" ? undefined : t.key, page: 1 })}
                      style={{
                        fontSize: "12px",
                        padding: "4px 10px",
                        borderRadius: "14px",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: isActive ? "800" : "500",
                        background: isActive ? "#e0f2fe" : "transparent",
                        color: isActive ? "#0284c7" : "#64748b",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <span style={{ color: "#cbd5e1" }}>|</span>

            {/* 时间跨度 */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#64748b" }}>时间：</span>
              <div style={{ display: "flex", gap: "4px" }}>
                {TIME_RANGES.map((tr) => {
                  const isActive = (currentTimeRange || "all") === tr.key;
                  return (
                    <button
                      key={tr.key}
                      type="button"
                      onClick={() => handleNavigate({ timeRange: tr.key === "all" ? undefined : tr.key, page: 1 })}
                      style={{
                        fontSize: "12px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: isActive ? "800" : "500",
                        background: isActive ? "#f0fdfa" : "transparent",
                        color: isActive ? "#0B7A75" : "#64748b",
                      }}
                    >
                      {tr.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <span style={{ color: "#cbd5e1" }}>|</span>

            {/* 只看有图 */}
            <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", cursor: "pointer", color: "#64748b" }}>
              <input
                type="checkbox"
                checked={currentHasImage}
                onChange={(e) => handleNavigate({ hasImage: e.target.checked ? true : undefined, page: 1 })}
              />
              <span>只看有图</span>
            </label>
          </div>

          {/* 右侧：排序与统计 */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "12.5px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#64748b" }}>排序：</span>
              {[
                { key: "newest", label: "最新" },
                { key: "hottest", label: "最热" },
                { key: "price_asc", label: "价格 ↑" },
                { key: "price_desc", label: "价格 ↓" },
              ].map((s) => {
                const isActive = (currentSort || "newest") === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => handleNavigate({ sort: s.key === "newest" ? undefined : s.key, page: 1 })}
                    style={{
                      background: "none",
                      border: "none",
                      color: isActive ? "#0B7A75" : "#64748b",
                      fontWeight: isActive ? "900" : "500",
                      cursor: "pointer",
                      borderBottom: isActive ? "2px solid #0B7A75" : "2px solid transparent",
                      paddingBottom: "1px",
                      fontSize: "12px",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            <span style={{ color: "#0f172a", fontWeight: "700" }}>
              共 <b style={{ color: "#0B7A75" }}>{totalCount}</b> 条
            </span>
          </div>
        </div>

        {/* 手机端横向 Chip 筛选条 */}
        <div className="mobile-chip-bar">
          {/* 区域 Chip */}
          <button
            type="button"
            onClick={() => {
              setSheetTimeRange(currentTimeRange || "all");
              setSheetHasImage(currentHasImage);
              setSheetSort(currentSort || "newest");
              setShowFilterSheet(true);
            }}
            className={`mobile-chip ${currentArea !== "all" ? "active-chip" : ""}`}
          >
            <span>{currentArea === "all" ? "全部区域" : currentArea}</span>
            <span style={{ fontSize: "10px", marginLeft: "2px" }}>▼</span>
          </button>

          {/* 供求 Chip */}
          <button
            type="button"
            onClick={() => {
              const nextType = currentItemType === "all" ? "OFFER" : currentItemType === "OFFER" ? "WANTED" : "all";
              handleNavigate({ itemType: nextType === "all" ? undefined : nextType, page: 1 });
            }}
            className={`mobile-chip ${currentItemType !== "all" ? "active-chip" : ""}`}
          >
            <span>
              {currentItemType === "OFFER" ? "只看提供" : currentItemType === "WANTED" ? "只看需求" : "全部供求"}
            </span>
          </button>

          {/* 分类快捷指示 */}
          {activeCatObj && (
            <button
              type="button"
              onClick={() => setShowMoreCategoriesSheet(true)}
              className="mobile-chip active-chip"
            >
              <span>{activeCatObj.shortName}</span>
              <span style={{ fontSize: "10px", marginLeft: "2px" }}>▼</span>
            </button>
          )}

          {/* 筛选与排序汇总 Chip */}
          <button
            type="button"
            onClick={() => {
              setSheetTimeRange(currentTimeRange || "all");
              setSheetHasImage(currentHasImage);
              setSheetSort(currentSort || "newest");
              setShowFilterSheet(true);
            }}
            className={`mobile-chip ${currentTimeRange !== "all" || currentHasImage || currentSort !== "newest" ? "active-chip" : ""}`}
            style={{ marginLeft: "auto" }}
          >
            <Filter size={13} />
            <span>筛选</span>
            {(currentTimeRange !== "all" || currentHasImage) && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#0B7A75",
                }}
              />
            )}
          </button>
        </div>
      </section>

      {/* 4. 核心信息卡片流大厅 (严格遵循 5 行标准规范) */}
      <section
        className="shell"
        style={{
          maxWidth: "1240px",
          margin: "1.25rem auto 0",
          padding: "0 1rem",
        }}
      >
        {/* 首页精选推荐大横幅与认证服务商条带 (仅在第一页且未限定分类时展示) */}
        {currentPage === 1 && currentCategory === "all" && !currentQuery && (
          <InfoFeaturedShowcase
            featuredItems={homeFeaturedItems}
            providers={featuredProviders}
          />
        )}

        {initialItems.length === 0 ? (
          /* 空状态 */
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "4rem 2rem",
              textAlign: "center",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>📋</div>
            <h3
              style={{
                margin: "0 0 6px 0",
                color: "#0f172a",
                fontSize: "18px",
                fontWeight: "800",
              }}
            >
              未找到符合条件的便民信息
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "13.5px",
                margin: "0 0 1.5rem 0",
                lineHeight: "1.6",
              }}
            >
              没有找到相关信息。建议调整筛选条件、换个关键词，或者立即发布一条您的需求！
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => router.push("/info")}
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  padding: "10px 22px",
                  borderRadius: "24px",
                  fontWeight: "700",
                  fontSize: "13.5px",
                  cursor: "pointer",
                }}
              >
                清除所有筛选
              </button>
              <Link
                href="/info/new"
                style={{
                  background: "#0B7A75",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "24px",
                  fontWeight: "800",
                  fontSize: "13.5px",
                  textDecoration: "none",
                }}
              >
                + 免费发布信息
              </Link>
              <Link
                href="/info/request/new"
                style={{
                  background: "#2563eb",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "24px",
                  fontWeight: "800",
                  fontSize: "13.5px",
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
                }}
              >
                ⚡ 找师傅·发布需求
              </Link>
            </div>
          </div>
        ) : (
          /* 信息卡片列表 */
          <div className="info-card-stream">
            {initialItems.map((item) => {
              const isTop = item.isTop;
              const catBadge = getCategoryBadge(item.category);
              const typeBadge = getItemTypeBadge(item.category, item.itemType);
              const priceInfo = formatPriceDisplay(item);
              const timeAgo = formatTimeAgo(item.refreshedAt || item.createdAt);
              const hasImages = item.images && item.images.length > 0;
              const isFav = !!favoritedMap[item.id];
              const isCarpool =
                item.category.includes("拼车") ||
                item.category.includes("顺风车") ||
                !!item.fromPlace ||
                !!item.toPlace;

              // 解析动态字段参数
              const extra = typeof item.extraData === "object" && item.extraData !== null ? item.extraData : {};

              return (
                <div
                  key={item.id}
                  className={`info-standard-card ${isTop ? "is-top-card" : ""}`}
                >
                  {/* 置顶金光标 */}
                  {isTop && (
                    <div className="top-banner">
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Flame size={13} color="#b45309" />
                        <span>置顶推荐 · 优先展示</span>
                      </div>
                      <span>杨林生活网认证</span>
                    </div>
                  )}

                  {/* 分类/首页精选推介标 */}
                  {item.isFeatured && !isTop && (
                    <div
                      style={{
                        background: "linear-gradient(90deg, #2563eb, #4f46e5)",
                        color: "white",
                        padding: "3px 10px",
                        fontSize: "11px",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderRadius: "12px 12px 0 0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Sparkles size={12} fill="white" />
                        <span>⭐ 精选推介 · 平台优选</span>
                      </div>
                      <span style={{ fontSize: "10px", opacity: 0.9 }}>官方审核</span>
                    </div>
                  )}

                  <div className="card-main-content">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* === 第 1 行：分类标签 + 供求性质 + 区域 === */}
                      <div className="card-line-1">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          {/* 分类徽标 */}
                          <span className="badge-cat">
                            {catBadge.name.split("/")[0]}
                          </span>

                          {/* 二级子分类 */}
                          {item.subCategory && (
                            <span className="badge-sub">
                              {item.subCategory}
                            </span>
                          )}

                          {/* 供求徽标 */}
                          <span className={`badge-type ${typeBadge.className}`}>
                            {typeBadge.label}
                          </span>

                          {/* 物品成色 (二手) */}
                          {item.condition && item.condition !== "不限成色" && (
                            <span className="badge-condition">
                              {item.condition}
                            </span>
                          )}
                        </div>

                        {/* 区域 */}
                        <span className="card-area">
                          <MapPin size={12} style={{ display: "inline", marginRight: "2px" }} />
                          {item.area || "杨林"}
                        </span>
                      </div>

                      {/* === 第 2 行：信息标题 === */}
                      <Link href={`/info/${item.id}`} className="card-title-link">
                        <h2 className="card-title">
                          {item.title}
                        </h2>
                      </Link>

                      {/* === 第 3 行：正文摘要 === */}
                      <p className="card-body-summary">
                        {item.body.replace(/\s+/g, " ")}
                      </p>

                      {/* === 第 4 行：分类核心动态参数 === */}
                      <div className="card-dynamic-params">
                        {isCarpool ? (
                          /* 顺风车路线与座位 */
                          <div className="carpool-route-row">
                            <span className="route-point start">
                              {item.fromPlace || "杨林"}
                            </span>
                            <span className="route-arrow">➔</span>
                            <span className="route-point end">
                              {item.toPlace || "昆明"}
                            </span>
                            {item.departureTime && (
                              <span className="param-pill">
                                <Clock size={11} /> {item.departureTime}
                              </span>
                            )}
                            {extra.seats && (
                              <span className="param-pill">
                                余座: {extra.seats}人
                              </span>
                            )}
                            {extra.carModel && (
                              <span className="param-pill">
                                车型: {extra.carModel}
                              </span>
                            )}
                          </div>
                        ) : item.category.includes("家政") || item.category.includes("维修") ? (
                          /* 家政维修上门与服务 */
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            <span className="param-pill highlight">
                              {extra.isHomeService === false ? "门店服务" : "支持上门服务"}
                            </span>
                            {extra.serviceType && (
                              <span className="param-pill">类型: {extra.serviceType}</span>
                            )}
                            {extra.pricingMethod && (
                              <span className="param-pill">计价: {extra.pricingMethod}</span>
                            )}
                          </div>
                        ) : item.category.includes("闲置") || item.category.includes("二手") || item.category.includes("数码") ? (
                          /* 二手闲置成色与交易方式 */
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {extra.negotiable !== undefined && (
                              <span className="param-pill">
                                {extra.negotiable ? "可小刀议价" : "一口价不刀"}
                              </span>
                            )}
                            {extra.deliveryMethod && (
                              <span className="param-pill">方式: {extra.deliveryMethod}</span>
                            )}
                            {extra.warranty && (
                              <span className="param-pill highlight">在保修期内</span>
                            )}
                          </div>
                        ) : item.category.includes("宠物") ? (
                          /* 宠物疫苗与年龄 */
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {extra.petType && <span className="param-pill">类型: {extra.petType}</span>}
                            {extra.petAge && <span className="param-pill">年龄: {extra.petAge}</span>}
                            {extra.isVaccinated && <span className="param-pill highlight">已免疫打针</span>}
                          </div>
                        ) : item.category.includes("求助") ? (
                          /* 便民求助 */
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            <span className="param-pill urgency">
                              {extra.urgency || "互助求助"}
                            </span>
                            {extra.reward && <span className="param-pill highlight">酬谢: {extra.reward}</span>}
                          </div>
                        ) : (
                          /* 默认地址与补充 */
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {item.address && (
                              <span className="param-pill">地址: {item.address}</span>
                            )}
                            <span className="param-pill">本地街坊直达</span>
                          </div>
                        )}
                      </div>

                      {/* === 第 5 行：价格 / 刷新时间 / 真实认证标签 === */}
                      <div className="card-line-5">
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          <span
                            style={{
                              fontSize: "19px",
                              fontWeight: "900",
                              color: priceInfo.color,
                            }}
                          >
                            {priceInfo.text}
                          </span>
                          {priceInfo.unit && !priceInfo.isFree && priceInfo.text !== "面议" && (
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              {priceInfo.unit}
                            </span>
                          )}
                          <span className="card-refreshed-time">
                            · {timeAgo}
                          </span>
                        </div>

                        {/* 真实认证徽章 */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {item.author?.phoneVerifiedAt ? (
                            <span className="verified-badge">
                              <CheckCircle2 size={12} color="#10b981" />
                              <span>电话已核验</span>
                            </span>
                          ) : (
                            <span className="verified-badge simple">
                              <span>真实发布</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 封面图片 (4:3 比例) */}
                    {hasImages && (
                      <Link href={`/info/${item.id}`} className="card-image-wrap">
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="card-cover-img"
                          loading="lazy"
                        />
                        {item.images.length > 1 && (
                          <span className="card-img-count">
                            {item.images.length} 图
                          </span>
                        )}
                      </Link>
                    )}
                  </div>

                  {/* 卡片底栏交互操作条 */}
                  <div className="card-action-bar">
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "12px", color: "#94a3b8" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Eye size={13} />
                        <span>{item.viewsCount} 浏览</span>
                      </span>
                      {item.contactName && (
                        <span>发布人: {item.contactName}</span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {/* 收藏按钮 */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(item.id, item.title, e)}
                        className={`action-btn ${isFav ? "is-fav" : ""}`}
                        title={isFav ? "取消收藏" : "收藏信息"}
                      >
                        <Heart size={14} fill={isFav ? "#e11d48" : "none"} color={isFav ? "#e11d48" : "#64748b"} />
                        <span>{isFav ? "已收藏" : "收藏"}</span>
                      </button>

                      {/* 分享按钮 */}
                      <button
                        type="button"
                        onClick={(e) => handleShare(item.id, item.title, e)}
                        className="action-btn"
                        title="复制链接分享"
                      >
                        <Share2 size={14} color="#64748b" />
                        <span>分享</span>
                      </button>

                      {/* 详情链接 */}
                      <Link href={`/info/${item.id}`} className="view-detail-btn">
                        <span>详情</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 分页组件 */}
        {totalCount > pageSize && (
          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}>
            <Pagination
              currentPage={currentPage}
              totalItems={totalCount}
              pageSize={pageSize}
              buildUrl={(p) => createQueryUrl({ page: p })}
            />
          </div>
        )}
      </section>

      {/* ========================================================
          手机端专属 Bottom Sheet: 更多分类矩阵
          ======================================================== */}
      {showMoreCategoriesSheet && (
        <div className="bottom-sheet-overlay" onClick={() => setShowMoreCategoriesSheet(false)}>
          <div className="bottom-sheet-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">全部分类矩阵</span>
              <button
                type="button"
                onClick={() => setShowMoreCategoriesSheet(false)}
                className="drawer-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <div className="drawer-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "1rem" }}>
                {INFO_CATEGORIES.map((cat) => {
                  const IconComp = CATEGORY_ICON_MAP[cat.key] || Tag;
                  const isActive = currentCategory === cat.key || currentCategory === cat.name;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setShowMoreCategoriesSheet(false);
                        handleNavigate({ category: cat.key, subCategory: undefined, page: 1 });
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "12px 6px",
                        borderRadius: "12px",
                        border: isActive ? "1px solid #0B7A75" : "1px solid #f1f5f9",
                        background: isActive ? "#f0fdfa" : "#ffffff",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: isActive ? "#0B7A75" : "#f1f5f9",
                          color: isActive ? "white" : "#0B7A75",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "6px",
                        }}
                      >
                        <IconComp size={20} />
                      </div>
                      <span style={{ fontSize: "12.5px", fontWeight: isActive ? "800" : "600", color: isActive ? "#0B7A75" : "#1e293b" }}>
                        {cat.name.split("/")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          手机端专属 Bottom Sheet: 多维筛选器 (时间/有图/排序)
          ======================================================== */}
      {showFilterSheet && (
        <div className="bottom-sheet-overlay" onClick={() => setShowFilterSheet(false)}>
          <div className="bottom-sheet-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">多维筛选条件</span>
              <button
                type="button"
                onClick={() => setShowFilterSheet(false)}
                className="drawer-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <div className="drawer-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {/* 1. 区域选择 */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#334155", marginBottom: "8px" }}>
                  片区网格
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {["all", ...areas].map((areaItem) => {
                    const isActive = (currentArea === "all" && areaItem === "all") || currentArea === areaItem;
                    return (
                      <button
                        key={areaItem}
                        type="button"
                        onClick={() => handleNavigate({ area: areaItem === "all" ? undefined : areaItem, page: 1 })}
                        style={{
                          fontSize: "12px",
                          padding: "8px 4px",
                          borderRadius: "8px",
                          border: isActive ? "1px solid #0B7A75" : "1px solid #e2e8f0",
                          background: isActive ? "#0B7A75" : "#ffffff",
                          color: isActive ? "white" : "#475569",
                          fontWeight: isActive ? "800" : "500",
                        }}
                      >
                        {areaItem === "all" ? "全部区域" : areaItem}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 发布时间范围 */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#334155", marginBottom: "8px" }}>
                  发布时间
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {TIME_RANGES.map((tr) => {
                    const isActive = sheetTimeRange === tr.key;
                    return (
                      <button
                        key={tr.key}
                        type="button"
                        onClick={() => setSheetTimeRange(tr.key)}
                        style={{
                          fontSize: "12px",
                          padding: "8px 4px",
                          borderRadius: "8px",
                          border: isActive ? "1px solid #0B7A75" : "1px solid #e2e8f0",
                          background: isActive ? "#f0fdfa" : "#ffffff",
                          color: isActive ? "#0B7A75" : "#475569",
                          fontWeight: isActive ? "800" : "500",
                        }}
                      >
                        {tr.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. 排序方式 */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#334155", marginBottom: "8px" }}>
                  排序方式
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  {[
                    { key: "newest", label: "最新刷新优先" },
                    { key: "hottest", label: "最多浏览热门" },
                    { key: "price_asc", label: "价格从低到高 ↑" },
                    { key: "price_desc", label: "价格从高到低 ↓" },
                  ].map((s) => {
                    const isActive = sheetSort === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setSheetSort(s.key)}
                        style={{
                          fontSize: "12px",
                          padding: "8px 4px",
                          borderRadius: "8px",
                          border: isActive ? "1px solid #0B7A75" : "1px solid #e2e8f0",
                          background: isActive ? "#f0fdfa" : "#ffffff",
                          color: isActive ? "#0B7A75" : "#475569",
                          fontWeight: isActive ? "800" : "500",
                        }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. 图片开关 */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>
                    只看附带真实照片的信息
                  </span>
                  <input
                    type="checkbox"
                    checked={sheetHasImage}
                    onChange={(e) => setSheetHasImage(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "#0B7A75" }}
                  />
                </label>
              </div>
            </div>

            {/* 抽屉底部操作条 */}
            <div className="drawer-footer">
              <button
                type="button"
                onClick={() => {
                  setSheetTimeRange("all");
                  setSheetHasImage(false);
                  setSheetSort("newest");
                }}
                className="drawer-reset-btn"
              >
                重置
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFilterSheet(false);
                  handleNavigate({
                    timeRange: sheetTimeRange === "all" ? undefined : sheetTimeRange,
                    hasImage: sheetHasImage ? true : undefined,
                    sort: sheetSort === "newest" ? undefined : sheetSort,
                    page: 1,
                  });
                }}
                className="drawer-apply-btn"
              >
                确定查看结果
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 样式表 */}
      <style jsx global>{`
        /* PC 分类网格 */
        .pc-category-grid {
          display: grid;
          grid-template-columns: repeat(11, 1fr);
          gap: 10px 4px;
          text-align: center;
        }
        .mobile-category-grid {
          display: none;
        }

        .cat-grid-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          text-decoration: none;
          background: transparent;
          border: 1px solid transparent;
          padding: 8px 4px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .cat-grid-btn:hover {
          background: #f8fafc;
        }
        .cat-grid-btn.active {
          background: #f0fdfa;
          border-color: #0B7A75;
        }

        .cat-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #f1f5f9;
          color: #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 6px;
          transition: all 0.15s ease;
        }
        .cat-icon-wrap.active-icon {
          background: #0B7A75;
          color: white;
        }
        .cat-icon-wrap.all-icon {
          background: #e0f2fe;
          color: #0284c7;
        }
        .cat-icon-wrap.more-icon {
          background: #ccfbf1;
          color: #0B7A75;
        }

        .cat-btn-name {
          font-size: 12.5px;
          font-weight: 600;
          color: #334155;
          white-space: nowrap;
        }
        .cat-grid-btn.active .cat-btn-name {
          font-weight: 800;
          color: #0B7A75;
        }

        /* 筛选工具栏 */
        .pc-filter-bar {
          background: white;
          border-radius: 14px;
          padding: 10px 16px;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justifyContent: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .mobile-chip-bar {
          display: none;
        }

        /* 标准 5 行卡片流 */
        .info-card-stream {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 16px;
        }

        .info-standard-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .info-standard-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          border-color: #cbd5e1;
        }
        .info-standard-card.is-top-card {
          border: 2px solid #f59e0b;
          box-shadow: 0 4px 18px rgba(245, 158, 11, 0.12);
        }

        .top-banner {
          background: linear-gradient(90deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
          font-size: 11px;
          font-weight: 900;
          padding: 4px 12px;
          display: flex;
          align-items: center;
          justifyContent: space-between;
          border-bottom: 1px solid #fcd34d;
        }

        .card-main-content {
          padding: 14px 16px 12px;
          display: flex;
          gap: 14px;
        }

        /* 第 1 行 */
        .card-line-1 {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          margin-bottom: 8px;
          gap: 6px;
        }
        .badge-cat {
          font-size: 11.5px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #334155;
        }
        .badge-sub {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 6px;
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        .badge-type {
          font-size: 10.5px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid;
        }
        .badge-condition {
          font-size: 10.5px;
          padding: 1px 6px;
          border-radius: 4px;
          background: #e0e7ff;
          color: #4338ca;
          font-weight: 700;
        }
        .card-area {
          font-size: 11.5px;
          color: #64748b;
          white-space: nowrap;
        }

        /* 第 2 行 */
        .card-title-link {
          text-decoration: none;
          color: inherit;
        }
        .card-title {
          font-size: 15.5px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.15s;
        }
        .card-title:hover {
          color: #0B7A75;
        }

        /* 第 3 行 */
        .card-body-summary {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 10px 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* 第 4 行 */
        .card-dynamic-params {
          margin-bottom: 10px;
        }
        .carpool-route-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .route-point {
          font-size: 12px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .route-point.start {
          background: #e0f2fe;
          color: #0369a1;
        }
        .route-point.end {
          background: #fef3c7;
          color: #b45309;
        }
        .route-arrow {
          color: #94a3b8;
          font-size: 12px;
        }
        .param-pill {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          background: #f1f5f9;
          color: #475569;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .param-pill.highlight {
          background: #dcfce7;
          color: #15803d;
          font-weight: 700;
        }
        .param-pill.urgency {
          background: #fee2e2;
          color: #b91c1c;
          font-weight: 700;
        }

        /* 第 5 行 */
        .card-line-5 {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          margin-top: auto;
          padding-top: 6px;
        }
        .card-refreshed-time {
          font-size: 11.5px;
          color: #94a3b8;
        }
        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          color: #059669;
          background: #ecfdf5;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #a7f3d0;
          font-weight: 600;
        }
        .verified-badge.simple {
          color: #64748b;
          background: #f8fafc;
          border-color: #e2e8f0;
        }

        /* 封面图片 (4:3 比例) */
        .card-image-wrap {
          width: 104px;
          height: 78px;
          flex-shrink: 0;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          background: #f1f5f9;
          align-self: flex-start;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .card-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.2s ease;
        }
        .card-image-wrap:hover .card-cover-img {
          transform: scale(1.05);
        }
        .card-img-count {
          position: absolute;
          bottom: 3px;
          right: 3px;
          background: rgba(0, 0, 0, 0.65);
          color: white;
          font-size: 9.5px;
          padding: 1px 4px;
          border-radius: 4px;
          font-weight: 700;
        }

        /* 交互底栏 */
        .card-action-bar {
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          justifyContent: space-between;
        }
        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 11.5px;
          cursor: pointer;
          padding: 3px 6px;
          border-radius: 4px;
          transition: background 0.15s;
        }
        .action-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
        .action-btn.is-fav {
          color: #e11d48;
          font-weight: 700;
        }
        .view-detail-btn {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          background: #0B7A75;
          color: white;
          font-size: 11.5px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 14px;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .view-detail-btn:hover {
          opacity: 0.9;
        }

        /* Bottom Sheet 样式 */
        .bottom-sheet-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(2px);
          z-index: 999;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          animation: fadeIn 0.18s ease-out;
        }
        .bottom-sheet-drawer {
          background: white;
          border-radius: 20px 20px 0 0;
          padding: 16px 16px calc(20px + env(safe-area-inset-bottom, 0px));
          box-shadow: 0 -8px 30px rgba(0,0,0,0.15);
          animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .drawer-header {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 14px;
        }
        .drawer-title {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
        }
        .drawer-close-btn {
          background: #f1f5f9;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
        }
        .drawer-footer {
          display: flex;
          gap: 12px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }
        .drawer-reset-btn {
          flex: 1;
          padding: 12px;
          border-radius: 24px;
          border: 1px solid #cbd5e1;
          background: white;
          color: #475569;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
        }
        .drawer-apply-btn {
          flex: 2;
          padding: 12px;
          border-radius: 24px;
          border: none;
          background: #0B7A75;
          color: white;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
        }

        /* 移动端 (390×844) 响应式调整 */
        @media (max-width: 768px) {
          .info-hall-container {
            padding-bottom: calc(90px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .info-hero-section {
            padding: 1.25rem 1rem 1.5rem !important;
          }
          .pc-category-grid {
            display: none !important;
          }
          .mobile-category-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 12px 6px !important;
          }
          .cat-icon-wrap {
            width: 42px !important;
            height: 42px !important;
          }
          .cat-btn-name {
            font-size: 11.5px !important;
          }

          .pc-filter-bar {
            display: none !important;
          }
          .mobile-chip-bar {
            display: flex !important;
            align-items: center;
            gap: 8px;
            overflow-x: auto;
            scrollbar-width: none;
            padding: 2px 0;
          }
          .mobile-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            font-size: 12px;
            color: #475569;
            white-space: nowrap;
            cursor: pointer;
            flex-shrink: 0;
          }
          .mobile-chip.active-chip {
            background: #f0fdfa;
            border-color: #0B7A75;
            color: #0B7A75;
            font-weight: 800;
          }

          .info-card-stream {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .card-main-content {
            padding: 12px 12px 10px !important;
          }
          .card-image-wrap {
            width: 90px !important;
            height: 68px !important;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
