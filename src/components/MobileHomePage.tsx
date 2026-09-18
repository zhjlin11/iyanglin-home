"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getImageUrl } from "@/lib/image-url";
import { stripHtml } from "@/lib/strip-html";

/* ───────── 数据类型（Prisma 模型的序列化版本） ───────── */
interface JobItem {
  id: string;
  title: string;
  company: string | null;
  salary: string | null;
  district?: string | null;
  createdAt: string;
}
interface HouseItem {
  id: string;
  title: string;
  images: string[];
  layout: string | null;
  location: string | null;
  price: string | null;
  createdAt: string;
}
interface ShopItem {
  id: string;
  name: string;
  logo: string | null;
  images: string[];
  createdAt: string;
}
interface EventItem {
  id: string;
  title: string;
  images: string[];
  eventTime: string | null;
  createdAt: string;
}
interface ArticleItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  images?: string[];
  viewCount?: number;
}
interface PostItem {
  id: string;
  title: string;
  createdAt: string;
}
interface DatingItem {
  id: string;
  nickname: string | null;
  photos: string[];
  birthYear: number | null;
  heightCm: number | null;
  createdAt: string;
}

import type {
  ShowcaseProduct,
  ShowcaseDeliveryZone,
  ShowcaseCategory,
} from "@/components/mall/HomeMallShowcase";

interface MobileHomePageProps {
  jobs: JobItem[];
  houses: HouseItem[];
  shops: ShopItem[];
  events: EventItem[];
  articles: ArticleItem[];
  posts: PostItem[];
  datingProfiles: DatingItem[];
  mallProducts?: ShowcaseProduct[];
  deliveryZones?: ShowcaseDeliveryZone[];
  categories?: ShowcaseCategory[];
}

/* ───────── 设计令牌 ───────── */
const T = {
  blue: "#1677FF",
  blueLight: "#e8f0fe",
  green: "#16A34A",
  orange: "#FF7A00",
  red: "#EF4444",
  pink: "#E11D48",
  bg: "#F5F6F8",
  card: "#FFFFFF",
  text1: "#1F2937",
  text2: "#6B7280",
  text3: "#9CA3AF",
  border: "#F0F0F0",
  radius: "16px",
  radiusSm: "12px",
  shadow: "0 2px 8px rgba(0,0,0,0.04)",
};

/* ───────── 隐藏滚动条样式（注入一次） ───────── */
const scrollHideCSS = `
.yl-no-scrollbar::-webkit-scrollbar { display: none; }
.yl-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.yl-mobile-home * { box-sizing: border-box; }
@keyframes ylBannerFade { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
`;

export default function MobileHomePage({
  jobs,
  houses,
  shops,
  events,
  articles,
  posts,
  datingProfiles,
  mallProducts = [],
  deliveryZones = [],
  categories = [],
}: MobileHomePageProps) {
  const [mobileToast, setMobileToast] = useState("");
  const [mobileMallCat, setMobileMallCat] = useState<string>("ALL");

  const handleMobileAddToCart = (product: ShowcaseProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) {
      setMobileToast("该商品已售罄");
      setTimeout(() => setMobileToast(""), 2000);
      return;
    }

    try {
      const saved = localStorage.getItem("yl_mall_cart");
      const cart = saved ? JSON.parse(saved) : {};
      cart[product.id] = (cart[product.id] || 0) + 1;
      localStorage.setItem("yl_mall_cart", JSON.stringify(cart));
      window.dispatchEvent(
        new CustomEvent("cart-updated", { detail: { cart, addedId: product.id } })
      );
      setMobileToast("已加入自营购物车");
      setTimeout(() => setMobileToast(""), 2000);
    } catch {
      setMobileToast("加购失败，请重试");
      setTimeout(() => setMobileToast(""), 2000);
    }
  };

  /* ───────── Banner 轮播 ───────── */
  const [bannerIdx, setBannerIdx] = useState(0);
  const bannerTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const banners = [
    {
      title: "杨林经开区秋季大型招聘会",
      subtitle: "50+ 高薪名企 · 1500+ 岗位直招",
      tag: "🔥 重点专题",
      bg: "linear-gradient(135deg, #1677FF 0%, #3b82f6 100%)",
      href: "/jobs",
    },
    {
      title: "杨林大学城租房季 · 房东直租",
      subtitle: "免中介费 · 拎包入住 · 空港城/云谷房源直供",
      tag: "🏠 房源特惠",
      bg: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
      href: "/house",
    },
    {
      title: "老字号杨林肥酒 · 嵩明非遗特产",
      subtitle: "平台自营保真 · 同城2小时极速直达",
      tag: "🛍️ 商城甄选",
      bg: "linear-gradient(135deg, #d97706 0%, #ea580c 100%)",
      href: "/haodian",
    },
  ];

  useEffect(() => {
    bannerTimer.current = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => {
      if (bannerTimer.current) clearInterval(bannerTimer.current);
    };
  }, [banners.length]);

  /* ───────── 频道宫格 ───────── */
  const channels = [
    { label: "找工作", icon: "💼", color: "#3b82f6", bg: "#dbeafe", href: "/jobs" },
    { label: "找房子", icon: "🏠", color: "#059669", bg: "#d1fae5", href: "/house" },
    { label: "园区招商", icon: "🏭", color: "#0284c7", bg: "#e0f2fe", href: "/industrial" },
    { label: "综合信息", icon: "📋", color: "#0B7A75", bg: "#f0fdfa", href: "/info" },
    { label: "本地商城", icon: "🛒", color: "#e11d48", bg: "#ffe4e6", href: "/haodian" },
    { label: "生活服务", icon: "🔧", color: "#0891b2", bg: "#cffafe", href: "/bianmin" },
    { label: "本地资讯", icon: "📰", color: "#6366f1", bg: "#e0e7ff", href: "/articles" },
    { label: "相亲交友", icon: "💖", color: "#ec4899", bg: "#fce7f3", href: "/love" },
    { label: "同城活动", icon: "🎪", color: "#7c3aed", bg: "#ede9fe", href: "/active" },
    { label: "社区论坛", icon: "💬", color: "#0d9488", bg: "#ccfbf1", href: "/community" },
  ];

  /* ───────── 辅助函数 ───────── */
  const fmtDate = (d: string) => {
    try {
      const dt = new Date(d);
      return `${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  const houseImg = (h: HouseItem): string =>
    (h.images?.[0] ? getImageUrl(h.images[0]) : null) || "/images/legacy/notfindimg_house.png";

  const shopImg = (s: ShopItem): string | null =>
    s.logo ? getImageUrl(s.logo) : s.images?.[0] ? getImageUrl(s.images[0]) : null;

  const eventImg = (e: EventItem): string =>
    (e.images?.[0] ? getImageUrl(e.images[0]) : null) || "/images/legacy/active_nofindimg2.png";

  /* ───────── Section Header 组件 ───────── */
  const SectionHeader = ({
    icon,
    title,
    href,
    more = "查看全部",
    accentColor = T.blue,
  }: {
    icon: string;
    title: string;
    href: string;
    more?: string;
    accentColor?: string;
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 0 12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            width: "3px",
            height: "16px",
            borderRadius: "2px",
            background: accentColor,
          }}
        />
        <span style={{ fontSize: "15px", fontWeight: "800", color: T.text1 }}>
          {icon} {title}
        </span>
      </div>
      <Link
        href={href}
        prefetch={false}
        style={{
          fontSize: "12px",
          color: T.text3,
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "2px",
        }}
      >
        {more} ›
      </Link>
    </div>
  );

  /* ───────────────────────────────────────────────────────────────────────────
     渲染
  ─────────────────────────────────────────────────────────────────────────── */
  return (
    <div
      className="yl-mobile-home"
      style={{ background: T.bg, paddingBottom: "76px" }}
    >
      <style>{scrollHideCSS}</style>

      {/* ══════════════════════════════════════════════════════════════
         1. Banner 轮播
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ padding: "10px 12px 0" }}>
        <div
          style={{
            position: "relative",
            height: "140px",
            borderRadius: T.radius,
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(22,119,255,0.12)",
          }}
        >
          {banners.map((b, idx) => (
            <Link
              key={idx}
              href={b.href}
              prefetch={false}
              style={{
                position: "absolute",
                inset: 0,
                background: b.bg,
                color: "#fff",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                textDecoration: "none",
                opacity: idx === bannerIdx ? 1 : 0,
                transition: "opacity 0.5s ease",
                zIndex: idx === bannerIdx ? 10 : 0,
              }}
            >
              <span
                style={{
                  alignSelf: "flex-start",
                  fontSize: "10px",
                  fontWeight: "700",
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(4px)",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  letterSpacing: "0.3px",
                }}
              >
                {b.tag}
              </span>
              <div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    lineHeight: "1.35",
                    textShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  {b.title}
                </div>
                <div
                  style={{
                    fontSize: "11.5px",
                    opacity: 0.9,
                    marginTop: "4px",
                    lineHeight: "1.4",
                  }}
                >
                  {b.subtitle}
                </div>
              </div>
            </Link>
          ))}

          {/* 指示器圆点 */}
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              right: "14px",
              zIndex: 20,
              display: "flex",
              gap: "4px",
            }}
          >
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  setBannerIdx(i);
                }}
                style={{
                  height: "4px",
                  width: i === bannerIdx ? "16px" : "6px",
                  borderRadius: "2px",
                  background: i === bannerIdx ? "#fff" : "rgba(255,255,255,0.45)",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         2. 频道宫格 5×2
      ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          margin: "10px 12px 0",
          background: T.card,
          borderRadius: T.radius,
          padding: "16px 12px 12px",
          boxShadow: T.shadow,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "14px 4px",
          }}
        >
          {channels.map((ch, i) => (
            <Link
              key={i}
              href={ch.href}
              prefetch={false}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textDecoration: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  background: ch.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  transition: "transform 0.15s ease",
                }}
              >
                {ch.icon}
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: T.text1,
                  marginTop: "6px",
                  lineHeight: 1,
                }}
              >
                {ch.label}
              </span>
            </Link>
          ))}
        </div>

        {/* 全部服务入口 */}
        <Link
          href="/categories"
          prefetch={false}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${T.border}`,
            marginTop: "12px",
            paddingTop: "10px",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: T.text2,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ✨ 全部生活服务大厅
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: T.blue,
            }}
          >
            全部服务 ›
          </span>
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         3. 公告/今日杨林 快捷条
      ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          margin: "10px 12px 0",
          background: T.card,
          borderRadius: T.radiusSm,
          padding: "10px 14px",
          boxShadow: T.shadow,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: "800",
            color: "#fff",
            background: T.red,
            padding: "2px 8px",
            borderRadius: "4px",
            letterSpacing: "0.5px",
            whiteSpace: "nowrap",
          }}
        >
          公告
        </span>
        <span
          style={{
            fontSize: "12px",
            color: T.text2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          杨林生活网全新改版上线，更多本地服务尽在 iyanglin.com
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         4. 热门招聘 — 横向滚动卡片
      ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          margin: "14px 12px 0",
          background: T.card,
          borderRadius: T.radius,
          padding: "14px 0 14px",
          boxShadow: T.shadow,
        }}
      >
        <div style={{ padding: "0 14px" }}>
          <SectionHeader icon="💼" title="热门招聘" href="/jobs" accentColor="#3b82f6" />
        </div>

        <div
          className="yl-no-scrollbar"
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            padding: "0 14px 4px",
          }}
        >
          {jobs.slice(0, 8).map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              prefetch={false}
              style={{
                minWidth: "240px",
                maxWidth: "260px",
                background: "#f8fafc",
                borderRadius: T.radiusSm,
                padding: "14px",
                textDecoration: "none",
                border: "1px solid #f1f5f9",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: T.text1,
                    lineHeight: "1.3",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {job.title}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    color: T.orange,
                    whiteSpace: "nowrap",
                    marginLeft: "8px",
                  }}
                >
                  {job.salary || "面议"}
                </span>
              </div>
              <div
                style={{
                  fontSize: "11.5px",
                  color: T.text2,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>{job.company || "杨林企业"}</span>
                <span style={{ color: T.text3 }}>·</span>
                <span>{(job as any).district || "杨林"}</span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    color: "#059669",
                    background: "#ecfdf5",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  包吃住
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    color: "#2563eb",
                    background: "#eff6ff",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  五险一金
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         5. 精选房源 — 横向滚动卡片（带封面图）
      ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          margin: "14px 12px 0",
          background: T.card,
          borderRadius: T.radius,
          padding: "14px 0 14px",
          boxShadow: T.shadow,
        }}
      >
        <div style={{ padding: "0 14px" }}>
          <SectionHeader
            icon="🏠"
            title="精选房源"
            href="/house"
            accentColor="#059669"
          />
        </div>

        <div
          className="yl-no-scrollbar"
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            padding: "0 14px 4px",
          }}
        >
          {houses.slice(0, 6).map((h) => (
            <Link
              key={h.id}
              href={`/house/${h.id}`}
              prefetch={false}
              style={{
                minWidth: "180px",
                maxWidth: "200px",
                borderRadius: T.radiusSm,
                overflow: "hidden",
                textDecoration: "none",
                background: "#fff",
                border: "1px solid #f1f5f9",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "120px",
                  background: "#f0f0f0",
                  overflow: "hidden",
                }}
              >
                <img
                  loading="lazy"
                  src={houseImg(h)}
                  alt={h.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: T.text1,
                    lineHeight: "1.3",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h.title}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: T.text3,
                    marginTop: "4px",
                  }}
                >
                  {h.layout || "2室1厅"} · {h.location || "杨林大学城"}
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: "800",
                    color: T.orange,
                    marginTop: "6px",
                  }}
                >
                  {h.price ? `${h.price}` : "面议"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         6. 便民信息 — 列表卡片
      ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          margin: "14px 12px 0",
          background: T.card,
          borderRadius: T.radius,
          padding: "14px",
          boxShadow: T.shadow,
        }}
      >
        <SectionHeader
          icon="📋"
          title="便民信息"
          href="/info"
          accentColor="#d97706"
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {posts.slice(0, 6).map((p, i) => (
            <Link
              key={p.id}
              href={`/info/${p.id}`}
              prefetch={false}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 0",
                borderBottom:
                  i < Math.min(posts.length, 6) - 1
                    ? `1px solid ${T.border}`
                    : "none",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    color: "#d97706",
                    background: "#fef3c7",
                    padding: "1px 6px",
                    borderRadius: "3px",
                    whiteSpace: "nowrap",
                  }}
                >
                  便民
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: T.text1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.title}
                </span>
              </div>
              <span
                style={{ fontSize: "11px", color: T.text3, whiteSpace: "nowrap", marginLeft: "8px" }}
              >
                {fmtDate(p.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         7. 本地资讯 — 图文卡片
      ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          margin: "14px 12px 0",
          background: T.card,
          borderRadius: T.radius,
          padding: "14px",
          boxShadow: T.shadow,
        }}
      >
        <SectionHeader
          icon="📰"
          title="本地资讯"
          href="/articles"
          accentColor="#6366f1"
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {articles.slice(0, 4).map((art) => (
            <Link
              key={art.id}
              href={`/articles/${art.id}`}
              prefetch={false}
              style={{
                display: "flex",
                gap: "12px",
                textDecoration: "none",
                padding: "10px",
                borderRadius: T.radiusSm,
                background: "#f8fafc",
                border: "1px solid #f1f5f9",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: T.text1,
                    lineHeight: "1.4",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {art.title}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: T.text3,
                    marginTop: "6px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {stripHtml(art.body).slice(0, 60)}…
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: T.text3,
                    marginTop: "6px",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "600",
                      color: "#6366f1",
                      background: "#e0e7ff",
                      padding: "1px 6px",
                      borderRadius: "3px",
                    }}
                  >
                    杨林资讯
                  </span>
                  <span>{art.viewCount ?? 0} 阅读</span>
                  <span>{fmtDate(art.createdAt)}</span>
                </div>
              </div>
              <div
                style={{
                  width: "90px",
                  height: "70px",
                  borderRadius: "8px",
                  background: "#e5e7eb",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <img
                  loading="lazy"
                  src={(art.images && art.images.length > 0) ? (getImageUrl(art.images[0]) || "/UploadFile/image/2020/04-18/20200418190934_42050.jpg") : "/UploadFile/image/2020/04-18/20200418190934_42050.jpg"}
                  alt={art.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         8. 同城活动 — 横向滚动
      ══════════════════════════════════════════════════════════════ */}
      {events.length > 0 && (
        <div
          style={{
            margin: "14px 12px 0",
            background: T.card,
            borderRadius: T.radius,
            padding: "14px 0 14px",
            boxShadow: T.shadow,
          }}
        >
          <div style={{ padding: "0 14px" }}>
            <SectionHeader
              icon="🎪"
              title="同城活动"
              href="/active"
              accentColor="#7c3aed"
            />
          </div>
          <div
            className="yl-no-scrollbar"
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              padding: "0 14px 4px",
            }}
          >
            {events.map((ev) => (
              <Link
                key={ev.id}
                href={`/active/${ev.id}`}
                prefetch={false}
                style={{
                  minWidth: "220px",
                  maxWidth: "260px",
                  borderRadius: T.radiusSm,
                  overflow: "hidden",
                  textDecoration: "none",
                  background: "#fff",
                  border: "1px solid #f1f5f9",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "110px",
                    background: "#f0f0f0",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <img
                    loading="lazy"
                    src={eventImg(ev)}
                    alt={ev.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      fontSize: "10px",
                      fontWeight: "700",
                      color: "#fff",
                      background: "rgba(124,58,237,0.85)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    报名中
                  </span>
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: T.text1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ev.title}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: T.text3,
                      marginTop: "4px",
                    }}
                  >
                    👥 已报名 · {ev.eventTime || "进行中"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
         9. 杨林生活网自营便利店 — 本地即时零售楼层
      ══════════════════════════════════════════════════════════════ */}
      {(() => {
        const displayedProds =
          mobileMallCat === "ALL"
            ? mallProducts
            : mallProducts.filter(
                (p) =>
                  p.category?.id === mobileMallCat ||
                  p.categoryId === mobileMallCat
              );

        return (
          <div
            id="mobile-home-mall-showcase"
            style={{
              margin: "14px 12px 0",
              background: T.card,
              borderRadius: T.radius,
              padding: "14px 0 12px",
              boxShadow: T.shadow,
            }}
          >
            {/* 楼层头部 */}
            <div
              style={{
                padding: "0 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "17px" }}>🛍️</span>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "800",
                    color: T.text1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  杨林生活网自营便利店
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    color: "#D97706",
                    background: "#FEF3C7",
                    padding: "1px 5px",
                    borderRadius: "4px",
                  }}
                >
                  本地现货 · 支持配送
                </span>
              </div>
              <Link
                href="/mall"
                prefetch={false}
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#2563EB",
                  textDecoration: "none",
                }}
              >
                更多 ›
              </Link>
            </div>

            {/* 配送服务轻条 */}
            <div
              style={{
                margin: "0 14px 10px",
                background: "#F8FAFC",
                border: "1px solid #F1F5F9",
                borderRadius: "6px",
                padding: "5px 10px",
                fontSize: "11px",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ color: "#EA580C" }}>📍</span>
              <span>杨林大学城 · 约25-35分钟送达 · 支持即时配送/自提</span>
            </div>

            {/* 分类快捷横滑胶囊 */}
            <div
              className="yl-no-scrollbar"
              style={{
                display: "flex",
                gap: "6px",
                overflowX: "auto",
                padding: "0 14px 10px",
              }}
            >
              <button
                type="button"
                onClick={() => setMobileMallCat("ALL")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  padding: "4px 10px",
                  borderRadius: "16px",
                  fontSize: "11px",
                  fontWeight: mobileMallCat === "ALL" ? "700" : "600",
                  cursor: "pointer",
                  border:
                    mobileMallCat === "ALL"
                      ? "1px solid #EA580C"
                      : "1px solid #E2E8F0",
                  background: mobileMallCat === "ALL" ? "#EA580C" : "#F8FAFC",
                  color: mobileMallCat === "ALL" ? "#FFFFFF" : "#475569",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <span>🔥 全部</span>
              </button>
              {categories.map((cat) => {
                const isSelected = mobileMallCat === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setMobileMallCat(cat.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      padding: "4px 10px",
                      borderRadius: "16px",
                      fontSize: "11px",
                      fontWeight: isSelected ? "700" : "600",
                      cursor: "pointer",
                      border: isSelected
                        ? "1px solid #EA580C"
                        : "1px solid #E2E8F0",
                      background: isSelected ? "#EA580C" : "#F8FAFC",
                      color: isSelected ? "#FFFFFF" : "#475569",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    <span>{cat.icon || "📦"}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* 横向滑动商品卡列表 */}
            {displayedProds.length === 0 ? (
              <div
                style={{
                  padding: "24px 14px",
                  textAlign: "center",
                  color: "#94A3B8",
                  fontSize: "12px",
                }}
              >
                该分类商品加速上新中，去自营商城看看吧
              </div>
            ) : (
              <div
                className="yl-no-scrollbar"
                style={{
                  display: "flex",
                  gap: "10px",
                  overflowX: "auto",
                  padding: "0 14px 4px",
                }}
              >
                {displayedProds.slice(0, 8).map((p) => {
                  const img =
                    p.coverImage ||
                    (p.images && p.images[0]) ||
                    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80";
                  const isSoldOut = p.stock <= 0;
                  const isLowStock =
                    p.stock > 0 && p.stock <= (p.lowStockThreshold || 5);

                  // 提取短卖点
                  let sellingPoint = "本地现货";
                  if (p.subtitle && p.subtitle.trim().length > 0) {
                    sellingPoint = p.subtitle.trim().split(/[,， ·\s]/)[0].slice(0, 8);
                  }

                  // 属性标签
                  let attrBadge = { text: "精选", bg: "#7C3AED" };
                  if (p.isFeatured) attrBadge = { text: "爆款", bg: "#DC2626" };
                  else if (p.isHot) attrBadge = { text: "热销", bg: "#EA580C" };
                  else if (p.isNew) attrBadge = { text: "新品", bg: "#2563EB" };

                  return (
                    <Link
                      key={p.id}
                      href={`/mall/${p.id}`}
                      prefetch={false}
                      style={{
                        minWidth: "150px",
                        maxWidth: "160px",
                        borderRadius: T.radiusSm,
                        overflow: "hidden",
                        textDecoration: "none",
                        background: "#fff",
                        border: "1px solid #f1f5f9",
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        {/* 1:1 图片容器 */}
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            paddingTop: "100%",
                            background: "#f8fafc",
                            overflow: "hidden",
                          }}
                        >
                          <img
                            loading="lazy"
                            src={img}
                            alt={p.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80";
                            }}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          {/* 双标签 */}
                          <div
                            style={{
                              position: "absolute",
                              top: "5px",
                              left: "5px",
                              display: "flex",
                              gap: "3px",
                              zIndex: 2,
                            }}
                          >
                            <span
                              style={{
                                background: "#EA580C",
                                color: "#fff",
                                fontSize: "9px",
                                fontWeight: "800",
                                padding: "1px 4px",
                                borderRadius: "3px",
                              }}
                            >
                              自营
                            </span>
                            <span
                              style={{
                                background: attrBadge.bg,
                                color: "#fff",
                                fontSize: "9px",
                                fontWeight: "800",
                                padding: "1px 4px",
                                borderRadius: "3px",
                              }}
                            >
                              {attrBadge.text}
                            </span>
                          </div>

                          {isSoldOut ? (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(15,23,42,0.55)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: "11px",
                                fontWeight: "800",
                              }}
                            >
                              已售罄
                            </div>
                          ) : isLowStock ? (
                            <span
                              style={{
                                position: "absolute",
                                bottom: "4px",
                                left: "4px",
                                background: "rgba(239,68,68,0.9)",
                                color: "#fff",
                                fontSize: "9px",
                                padding: "1px 4px",
                                borderRadius: "3px",
                              }}
                            >
                              仅剩{p.stock}件
                            </span>
                          ) : null}
                        </div>

                        {/* 文本信息 */}
                        <div style={{ padding: "8px 8px 0" }}>
                          <div
                            style={{
                              fontSize: "12.5px",
                              fontWeight: "700",
                              color: T.text1,
                              lineHeight: "1.3",
                              height: "33px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {p.name}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontSize: "10.5px",
                              color: T.text3,
                              marginTop: "3px",
                            }}
                          >
                            <span>{p.specification || `${p.unit ? `1${p.unit}` : "标品"}`}</span>
                            <span style={{ color: "#DC2626", fontWeight: "600" }}>{sellingPoint}</span>
                          </div>
                        </div>
                      </div>

                      {/* 价格与加购 */}
                      <div
                        style={{
                          padding: "6px 8px 8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: "800",
                              color: "#DC2626",
                            }}
                          >
                            <span style={{ fontSize: "11px" }}>¥</span>
                            {(p.priceCents / 100).toFixed(2)}
                          </span>
                          {p.originalPriceCents && p.originalPriceCents > p.priceCents && (
                            <span
                              style={{
                                fontSize: "10px",
                                color: "#94A3B8",
                                textDecoration: "line-through",
                              }}
                            >
                              ¥{(p.originalPriceCents / 100).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={isSoldOut}
                          onClick={(e) => handleMobileAddToCart(p, e)}
                          style={{
                            background: isSoldOut
                              ? "#E2E8F0"
                              : "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",
                            color: isSoldOut ? "#94A3B8" : "#fff",
                            border: "none",
                            borderRadius: "20px",
                            padding: "3px 9px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: isSoldOut ? "not-allowed" : "pointer",
                            boxShadow: isSoldOut
                              ? "none"
                              : "0 2px 6px rgba(234, 88, 12, 0.2)",
                          }}
                        >
                          + 加入
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* 底部整行导购按钮 */}
            <div style={{ padding: "8px 14px 0" }}>
              <Link
                href="/mall"
                prefetch={false}
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  padding: "7px 0",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: "700",
                  textDecoration: "none",
                }}
              >
                进入自营商城选购全部商品 ›
              </Link>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════
         9.5 本地口碑好店 — 商家名录
      ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          margin: "14px 12px 0",
          background: T.card,
          borderRadius: T.radius,
          padding: "14px 0 14px",
          boxShadow: T.shadow,
        }}
      >
        <div style={{ padding: "0 14px" }}>
          <SectionHeader
            icon="🏪"
            title="口碑好店"
            href="/haodian"
            accentColor="#059669"
          />
        </div>
        <div
          className="yl-no-scrollbar"
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            padding: "0 14px 4px",
          }}
        >
          {shops.slice(0, 12).map((s) => {
            const img = shopImg(s);
            return (
              <Link
                key={s.id}
                href={`/haodian/${s.id}`}
                prefetch={false}
                style={{
                  minWidth: "100px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "14px",
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {img ? (
                    <img
                      loading="lazy"
                      src={img}
                      alt={s.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "28px" }}>🛍️</span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: T.text1,
                    marginTop: "6px",
                    maxWidth: "80px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  {s.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         10. 相亲交友 — 横向滚动人物卡片
      ══════════════════════════════════════════════════════════════ */}
      {datingProfiles.length > 0 && (
        <div
          style={{
            margin: "14px 12px 0",
            background: T.card,
            borderRadius: T.radius,
            padding: "14px 0 14px",
            boxShadow: T.shadow,
          }}
        >
          <div style={{ padding: "0 14px" }}>
            <SectionHeader
              icon="💖"
              title="同城相亲"
              href="/love"
              accentColor="#ec4899"
            />
          </div>
          <div
            className="yl-no-scrollbar"
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              padding: "0 14px 4px",
            }}
          >
            {datingProfiles.map((p) => {
              const photo =
                p.photos?.[0] ? getImageUrl(p.photos[0]) : null;
              return (
                <Link
                  key={p.id}
                  href={`/love/${p.id}`}
                  prefetch={false}
                  style={{
                    minWidth: "120px",
                    borderRadius: T.radiusSm,
                    overflow: "hidden",
                    textDecoration: "none",
                    background: "#fff",
                    border: "1px solid #fce7f3",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: "120px",
                      height: "130px",
                      background: "#fce7f3",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {photo ? (
                      <>
                        <img
                          loading="lazy"
                          src={photo}
                          alt={p.nickname || ""}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            filter: "blur(8px)",
                          }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            bottom: "6px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            fontSize: "9px",
                            color: "#fff",
                            background: "rgba(0,0,0,0.45)",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          🔒 隐私保护
                        </span>
                      </>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "36px",
                        }}
                      >
                        👤
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "8px 10px", textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: T.text1,
                      }}
                    >
                      {p.nickname || "单身嘉宾"}
                    </div>
                    <div
                      style={{
                        fontSize: "10.5px",
                        color: T.text3,
                        marginTop: "2px",
                      }}
                    >
                      {p.birthYear
                        ? `${new Date().getFullYear() - p.birthYear}岁`
                        : "24岁"}{" "}
                      · {p.heightCm ? `${p.heightCm}cm` : "165cm"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
         11. 便民电话入口
      ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          margin: "14px 12px 0",
          background: "linear-gradient(135deg, #1677FF 0%, #3b82f6 100%)",
          borderRadius: T.radius,
          padding: "16px 18px",
          boxShadow: "0 4px 14px rgba(22,119,255,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: "800",
              color: "#fff",
            }}
          >
            📞 杨林便民电话簿
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.8)",
              marginTop: "4px",
            }}
          >
            派出所 · 医院 · 快递 · 公交 · 物业 · 维修
          </div>
        </div>
        <Link
          href="/bianmin"
          prefetch={false}
          style={{
            fontSize: "12px",
            fontWeight: "700",
            color: T.blue,
            background: "#fff",
            padding: "7px 16px",
            borderRadius: "20px",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          查看电话簿
        </Link>
      </div>

      {/* 移动端轻量 Toast 提示 */}
      {mobileToast && (
        <div
          style={{
            position: "fixed",
            bottom: "75px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.9)",
            color: "#FFFFFF",
            padding: "8px 18px",
            borderRadius: "50px",
            fontSize: "13px",
            fontWeight: "700",
            zIndex: 10000,
            boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap",
          }}
        >
          <span>🛒</span>
          <span>{mobileToast}</span>
        </div>
      )}

      {/* 底部占位 */}
      <div style={{ height: "16px" }} />
    </div>
  );
}
