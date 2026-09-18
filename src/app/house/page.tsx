import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { listHouses } from "@/lib/house-store";
import { getImageUrl } from "@/lib/image-url";
import { cleanText } from "@/lib/strip-html";
import Pagination from "@/components/Pagination";
import Link from "next/link";
import HouseImage from "@/components/HouseImage";
import AdBanner from "@/components/AdBanner";

export const metadata: Metadata = {
  title: "房产楼市 - 嵩明杨林品质人居 | 租房合租 | 二手房买卖 | 商铺厂房",
  description: "杨林生活网房产频道全面升级，为您提供杨林大学城租房、公寓整租单间、二手房挂牌买卖、新房楼盘与沿街旺铺直租，真实房东直连，无中介费。",
  keywords: ["杨林租房", "杨林二手房", "杨林房产", "杨林楼市", "杨林大学城租房", "嵩明房产", "杨林商铺出租"],
  openGraph: {
    title: "房产楼市 - 嵩明杨林品质人居 | 杨林生活网",
    description: "真实认证房源，涵盖出租房、二手房、品牌新房与临街商铺，房东直租直售。",
    url: "https://iyanglin.com/house",
    siteName: "杨林生活网",
  },
  alternates: {
    canonical: "https://iyanglin.com/house",
  },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    type?: string;
    q?: string;
    region?: string;
    price?: string;
    layout?: string;
    area?: string;
    page?: string;
    sort?: string;
  }>;
};

// 房源物业类别
const houseTypeTabs = [
  { key: "all", label: "全部房源" },
  { key: "rent", label: "房屋出租" },
  { key: "secondhand", label: "二手好房" },
  { key: "newhouse", label: "新房楼盘" },
  { key: "shop", label: "商铺门面" },
  { key: "factory", label: "厂房仓库" },
];

// 区域地段
const regionFilterList = [
  { key: "all", label: "全域" },
  { key: "大学城", label: "杨林大学城" },
  { key: "经开区", label: "杨林经开区" },
  { key: "镇中心", label: "杨林镇中心" },
  { key: "职教园", label: "嵩明职教园" },
  { key: "嘉丽泽", label: "嘉丽泽生态区" },
  { key: "县城", label: "嵩明县城区" },
];

// 价格预算
const priceFilterList = [
  { key: "all", label: "不限价格" },
  { key: "0-600", label: "600元以下/月" },
  { key: "600-1000", label: "600-1000元/月" },
  { key: "1000-1800", label: "1000-1800元/月" },
  { key: "1800-3000", label: "1800-3000元/月" },
  { key: "3000+", label: "3000元以上/月" },
  { key: "sale-50", label: "50万以下" },
  { key: "sale-100", label: "50-100万" },
  { key: "sale-100+", label: "100万以上" },
];

// 户型居室
const layoutFilterList = [
  { key: "all", label: "不限户型" },
  { key: "1室", label: "一室宜居" },
  { key: "2室", label: "二室温馨" },
  { key: "3室", label: "三室宽适" },
  { key: "4室", label: "四室以上尊享" },
];

export default async function HouseListPage({ searchParams }: PageProps) {
  const { type, q, region, price, layout, area, page, sort } = await searchParams;
  const currentType = type || "all";
  const searchQuery = q || "";
  const currentRegion = region || "all";
  const currentPrice = price || "all";
  const currentLayout = layout || "all";
  const currentArea = area || "all";
  const currentSort = sort || "newest";
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const pageSize = 12;

  const allHouses = await listHouses({
    houseType: currentType !== "all" ? currentType : undefined,
    status: "approved",
    search: searchQuery || undefined,
  });

  // 多维属性综合过滤
  let filtered = allHouses.filter((h) => {
    if (currentRegion !== "all") {
      const matchReg = `${h.title} ${h.location || ""} ${h.body || ""}`.includes(currentRegion);
      if (!matchReg) return false;
    }
    if (currentLayout !== "all") {
      const matchLayout = `${h.title} ${h.layout || ""} ${h.body || ""}`.includes(currentLayout.replace("以上尊享", "").replace("宜居", "").replace("温馨", "").replace("宽适", ""));
      if (!matchLayout) return false;
    }
    return true;
  });

  const totalItems = filtered.length;
  const paginatedHouses = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const makeFilterUrl = (overrides: Record<string, string>) => {
    const p = new URLSearchParams();
    const t = overrides.type !== undefined ? overrides.type : currentType;
    const r = overrides.region !== undefined ? overrides.region : currentRegion;
    const pr = overrides.price !== undefined ? overrides.price : currentPrice;
    const l = overrides.layout !== undefined ? overrides.layout : currentLayout;
    const a = overrides.area !== undefined ? overrides.area : currentArea;
    const s = overrides.sort !== undefined ? overrides.sort : currentSort;
    const queryStr = overrides.q !== undefined ? overrides.q : searchQuery;

    if (t && t !== "all") p.set("type", t);
    if (queryStr) p.set("q", queryStr);
    if (r && r !== "all") p.set("region", r);
    if (pr && pr !== "all") p.set("price", pr);
    if (l && l !== "all") p.set("layout", l);
    if (a && a !== "all") p.set("area", a);
    if (s && s !== "newest") p.set("sort", s);
    return `/house?${p.toString()}`;
  };

  return (
    <main className="template-page homepick-page" style={{ minHeight: "100vh", background: "#F8F9FA", paddingBottom: "4rem" }}>
      <Navbar />

      {/* =========================================================================
          1. 巨幕高奢品质大横幅 (HomePick Page Header 风格)
          ========================================================================= */}
      <section
        className="homepick-hero"
        style={{
          background: "linear-gradient(135deg, #1E2D3D 0%, #25384A 50%, #15222E 100%)",
          color: "#ffffff",
          padding: "3rem 0 3.5rem 0",
          position: "relative",
          overflow: "hidden",
          borderBottom: "3px solid #FF7500",
        }}
      >
        {/* 背景轻微几何装饰与质感光斑 */}
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "360px",
            height: "360px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,117,0,0.12) 0%, rgba(255,117,0,0) 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="shell" style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.25rem", position: "relative", zIndex: 2 }}>
          {/* 面包屑导航 (纯中文) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.7)", marginBottom: "1.25rem" }}>
            <Link prefetch={false} href="/" style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>网站首页</Link>
            <span>/</span>
            <span style={{ color: "#FF7500", fontWeight: "700" }}>房产楼市</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,117,0,0.2)", border: "1px solid rgba(255,117,0,0.4)", borderRadius: "20px", padding: "4px 14px", fontSize: "12px", color: "#FFB066", fontWeight: "700", marginBottom: "10px" }}>
                <span>✦</span> 嵩明杨林 · 臻品人居生活圈
              </div>
              <h1 style={{ margin: "0 0 10px 0", fontSize: "32px", fontWeight: "900", letterSpacing: "-0.01em", lineHeight: "1.2" }}>
                真实认证好房 · 舒适宜居体验
              </h1>
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.8)", maxWidth: "600px", lineHeight: "1.6" }}>
                聚合大学城精品公寓、经开区自住二手房、品牌新房楼盘与沿街繁华旺铺。真房源、真价格，直连房东免佣金。
              </p>
            </div>

            {/* 右侧行动呼吁 (CTA 按钮群) */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <Link
                prefetch={false}
                href="/house/new"
                style={{
                  background: "linear-gradient(135deg, #FF7500 0%, #FF5500 100%)",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "14.5px",
                  fontWeight: "800",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  textDecoration: "none",
                  boxShadow: "0 8px 20px rgba(255,117,0,0.35)",
                  transition: "transform 0.15s",
                }}
              >
                <span>➕</span> 我要免费挂牌房源
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 房产频道顶部广告位 */}
      <AdBanner placementKey="HOUSE_TOP" maxItems={2} hidePlaceholder />

      {/* =========================================================================
          2. 多维找房筛选中枢 (HomePick 质感卡片布局)
          ========================================================================= */}
      <section className="shell homepick-filter-panel" style={{ maxWidth: "1240px", margin: "-24px auto 0 auto", padding: "0 1.25rem", position: "relative", zIndex: 10 }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(37,56,74,0.08)",
            border: "1px solid #E2DAD3",
            padding: "20px 24px",
          }}
        >
          {/* 顶栏：物业类型大标签 (Tabs) */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", borderBottom: "2px solid #F1F3F5", paddingBottom: "14px", marginBottom: "16px" }}>
            {houseTypeTabs.map((t) => {
              const active = currentType === t.key;
              return (
                <Link
                  prefetch={false}
                  key={t.key}
                  href={makeFilterUrl({ type: t.key })}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "8px",
                    background: active ? "#25384A" : "transparent",
                    color: active ? "#ffffff" : "#4B5563",
                    fontWeight: active ? "800" : "600",
                    fontSize: "14.5px",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>

          {/* 筛选行 1: 所属区域 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", fontSize: "13.5px", marginBottom: "12px" }}>
            <span style={{ color: "#25384A", fontWeight: "800", whiteSpace: "nowrap", flexShrink: 0, paddingTop: "5px" }}>
              所属区域：
            </span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: 1 }}>
              {regionFilterList.map((r) => {
                const active = currentRegion === r.key;
                return (
                  <Link
                    prefetch={false}
                    key={r.key}
                    href={makeFilterUrl({ region: r.key })}
                    style={{
                      padding: "5px 14px",
                      borderRadius: "6px",
                      background: active ? "#FF7500" : "#F8F9FA",
                      color: active ? "#ffffff" : "#4B5563",
                      fontWeight: active ? "800" : "500",
                      textDecoration: "none",
                      border: active ? "1px solid #FF7500" : "1px solid #E5E7EB",
                      transition: "all 0.15s",
                    }}
                  >
                    {r.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 筛选行 2: 租金/售价 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", fontSize: "13.5px", marginBottom: "12px", borderTop: "1px dashed #E5E7EB", paddingTop: "12px" }}>
            <span style={{ color: "#25384A", fontWeight: "800", whiteSpace: "nowrap", flexShrink: 0, paddingTop: "5px" }}>
              价格预算：
            </span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: 1 }}>
              {priceFilterList.map((p) => {
                const active = currentPrice === p.key;
                return (
                  <Link
                    prefetch={false}
                    key={p.key}
                    href={makeFilterUrl({ price: p.key })}
                    style={{
                      padding: "5px 14px",
                      borderRadius: "6px",
                      background: active ? "#FF7500" : "#F8F9FA",
                      color: active ? "#ffffff" : "#4B5563",
                      fontWeight: active ? "800" : "500",
                      textDecoration: "none",
                      border: active ? "1px solid #FF7500" : "1px solid #E5E7EB",
                      transition: "all 0.15s",
                    }}
                  >
                    {p.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 筛选行 3: 居室户型 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", fontSize: "13.5px", borderTop: "1px dashed #E5E7EB", paddingTop: "12px" }}>
            <span style={{ color: "#25384A", fontWeight: "800", whiteSpace: "nowrap", flexShrink: 0, paddingTop: "5px" }}>
              居室户型：
            </span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: 1 }}>
              {layoutFilterList.map((l) => {
                const active = currentLayout === l.key;
                return (
                  <Link
                    prefetch={false}
                    key={l.key}
                    href={makeFilterUrl({ layout: l.key })}
                    style={{
                      padding: "5px 14px",
                      borderRadius: "6px",
                      background: active ? "#FF7500" : "#F8F9FA",
                      color: active ? "#ffffff" : "#4B5563",
                      fontWeight: active ? "800" : "500",
                      textDecoration: "none",
                      border: active ? "1px solid #FF7500" : "1px solid #E5E7EB",
                      transition: "all 0.15s",
                    }}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. 列表控制栏与房源数量概览
          ========================================================================= */}
      <section className="shell" style={{ maxWidth: "1240px", margin: "2rem auto 1.25rem auto", padding: "0 1.25rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            background: "#ffffff",
            padding: "14px 20px",
            borderRadius: "10px",
            border: "1px solid #E2DAD3",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "4px", height: "18px", background: "#FF7500", borderRadius: "2px", display: "inline-block" }}></span>
            <span style={{ fontSize: "16px", fontWeight: "900", color: "#25384A" }}>
              精选真实房源
            </span>
            <span style={{ fontSize: "13px", color: "#87898E" }}>
              （共找到 <b style={{ color: "#FF7500" }}>{totalItems}</b> 套房源）
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "13.5px" }}>
            <span style={{ color: "#87898E" }}>排序规则：</span>
            <Link
              prefetch={false}
              href={makeFilterUrl({ sort: "newest" })}
              style={{
                color: currentSort === "newest" ? "#FF7500" : "#4B5563",
                fontWeight: currentSort === "newest" ? "800" : "500",
                textDecoration: "none",
              }}
            >
              最新发布优先
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. 房产核心列表：HomePick apartments-two__single 经典栅格卡片系统
          ========================================================================= */}
      <section className="shell" style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.25rem" }}>
        {filtered.length === 0 ? (
          <div style={{ background: "#ffffff", borderRadius: "14px", padding: "5rem 2rem", textAlign: "center", border: "1px solid #E2DAD3" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏡</div>
            <h3 style={{ margin: "0 0 8px 0", color: "#25384A", fontSize: "20px", fontWeight: "800" }}>暂无符合条件的认证房源</h3>
            <p style={{ color: "#87898E", fontSize: "14px", margin: "0 0 1.5rem 0" }}>您可以尝试重置筛选条件，或直接在上方搜索周边小区名称。</p>
            <Link
              prefetch={false}
              href="/house"
              style={{
                background: "#25384A",
                color: "#ffffff",
                padding: "10px 28px",
                borderRadius: "6px",
                fontWeight: "800",
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              查看全部房源
            </Link>
          </div>
        ) : (
          <div
            className="homepick-property-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: "24px",
            }}
          >
            {paginatedHouses.map((house) => {
              const rawImg = house.images && house.images.length > 0 ? house.images[0] : null;
              const isImageExt = Boolean(rawImg && /\.(jpg|jpeg|png|webp|gif|bmp|avif)/i.test(rawImg));
              const isHttpOrUpload = Boolean(rawImg && (rawImg.startsWith("http") || rawImg.startsWith("/uploads/") || rawImg.startsWith("/images/")));
              const hasRealPhoto = isImageExt || isHttpOrUpload;
              const coverImg = hasRealPhoto ? getImageUrl(rawImg) : null;
              const cleanHouseTitle = cleanText(house.title);
              const locationStr = cleanText(house.location) || "嵩明杨林生活圈";
              const layoutStr = house.layout || "2室1厅";
              const areaNum = (house.areaSize || "").replace(/[^\d.]/g, "");
              const areaStr = areaNum ? `${areaNum} ㎡` : "85 ㎡";

              // 房源类型中文标签
              let typeBadge = "房屋出租";
              if (house.houseType === "secondhand") typeBadge = "二手好房";
              if (house.houseType === "newhouse") typeBadge = "新房楼盘";
              if (house.houseType === "shop") typeBadge = "商铺门面";
              if (house.houseType === "factory") typeBadge = "厂房仓库";

              return (
                <article
                  className="homepick-property-card"
                  key={house.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #E2DAD3",
                    overflow: "hidden",
                    boxShadow: "0 4px 15px rgba(37,56,74,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                >
                  {/* 房源大图 (带 HomePick 风格角标与悬停平滑放大) */}
                  <Link
                    prefetch={false}
                    href={`/house/${house.id}`}
                    style={{
                      display: "block",
                      width: "100%",
                      height: "220px",
                      position: "relative",
                      overflow: "hidden",
                      background: "#25384A",
                    }}
                  >
                    {hasRealPhoto && coverImg ? (
                      <HouseImage src={coverImg} alt={cleanHouseTitle} />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "linear-gradient(135deg, #25384A 0%, #15222E 100%)",
                          color: "#FF7500",
                        }}
                      >
                        <span style={{ fontSize: "48px" }}>🏡</span>
                        <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", marginTop: "6px", fontWeight: "700" }}>
                          实景认证房源
                        </span>
                      </div>
                    )}

                    {/* 左上角：物业类别标牌 */}
                    <div
                      style={{
                        position: "absolute",
                        top: "14px",
                        left: "14px",
                        background: "#25384A",
                        color: "#ffffff",
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "800",
                        letterSpacing: "0.02em",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      }}
                    >
                      {typeBadge}
                    </div>

                    {/* 右上角：品质认证 */}
                    <div
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(4px)",
                        color: "#FFB066",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>✓</span> 真实房东直连
                    </div>
                  </Link>

                  {/* 卡片内容区 (HomePick apartments-two__content 结构) */}
                  <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: "800", lineHeight: "1.35", color: "#25384A" }}>
                          <Link
                            prefetch={false}
                            href={`/house/${house.id}`}
                            style={{
                              color: "#25384A",
                              textDecoration: "none",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {cleanHouseTitle}
                          </Link>
                        </h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "#87898E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          📍 {locationStr}
                        </p>
                      </div>

                      {/* HomePick 标志性暖橙色建筑面积方块按钮 (apartments-two__btn thm-btn) */}
                      <Link
                        prefetch={false}
                        href={`/house/${house.id}`}
                        style={{
                          background: "#FF7500",
                          color: "#ffffff",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: "800",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                          boxShadow: "0 4px 10px rgba(255,117,0,0.25)",
                        }}
                      >
                        {areaStr}
                      </Link>
                    </div>

                    {/* 微参数胶囊行 (居室、卫浴、采光) */}
                    <div style={{ display: "flex", gap: "14px", alignItems: "center", fontSize: "12.5px", color: "#6B7280", borderTop: "1px solid #F1F3F5", paddingTop: "12px", marginTop: "auto" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>🛏️</span>
                        <span>{layoutStr}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>🚿</span>
                        <span>独立卫浴</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>☀️</span>
                        <span>采光充足</span>
                      </div>
                    </div>

                    {/* 底部价格与查看详情按钮 */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed #E5E7EB" }}>
                      <div>
                        <span style={{ fontSize: "12px", color: "#87898E" }}>参考预算：</span>
                        <span style={{ fontSize: "20px", fontWeight: "900", color: "#FF7500" }}>
                          {house.price ? house.price : "面议"}
                        </span>
                      </div>

                      <Link
                        prefetch={false}
                        href={`/house/${house.id}`}
                        style={{
                          background: "#25384A",
                          color: "#ffffff",
                          padding: "6px 16px",
                          borderRadius: "6px",
                          fontSize: "12.5px",
                          fontWeight: "700",
                          textDecoration: "none",
                          transition: "background 0.15s",
                        }}
                      >
                        查看详情 →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* 分页组件 */}
        {totalItems > pageSize && (
          <div style={{ marginTop: "2.5rem", display: "flex", justifyContent: "center" }}>
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              buildUrl={(p) => makeFilterUrl({ page: String(p) })}
            />
          </div>
        )}
      </section>

      {/* =========================================================================
          5. 底部服务承诺与置业管家便民提示 (HomePick 尊贵服务模块，纯中文)
          ========================================================================= */}
      <section className="shell" style={{ maxWidth: "1240px", margin: "3.5rem auto 0 auto", padding: "0 1.25rem" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #25384A 0%, #1A2836 100%)",
            borderRadius: "16px",
            padding: "2.5rem 2rem",
            color: "#ffffff",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
            border: "1px solid rgba(255,117,0,0.3)",
          }}
        >
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(255,117,0,0.15)", color: "#FF7500", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
              🛡️
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>真实房源核验</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: "1.5" }}>
                全站房源人工巡检审核，杜绝虚假低价与虚构房源。
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(255,117,0,0.15)", color: "#FF7500", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
              🤝
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>房东直租直连</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: "1.5" }}>
                业主直通电话与微信，无任何中间隐形费用。
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(255,117,0,0.15)", color: "#FF7500", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
              ⚡
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>高效挂牌流转</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: "1.5" }}>
                一键在线发布，覆盖杨林数十万本地常住与高校人群。
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
