import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { listShops } from "@/lib/shop-store";
import { parseShopBody } from "@/lib/shop-parser";
import { getImageUrl, CATEGORY_FALLBACK_STYLES } from "@/lib/image-url";
import { cleanText } from "@/lib/strip-html";
import Pagination from "@/components/Pagination";
import Link from "next/link";

export const metadata: Metadata = {
  title: "杨林生活网自营商城 - 嵩明杨林官方精选品质好物",
  description: "杨林生活网平台自营商城，官方选品并提供统一客服与售后，精选电脑数码、本地特产、生活用品、汽车用品与休闲好物。",
  keywords: ["杨林自营商城", "杨林生活网商城", "杨林同城购物", "杨林电商", "杨林特产", "嵩明同城好物"],
  openGraph: {
    title: "杨林生活网自营商城 - 官方精选品质好物",
    description: "平台自营、官方选品、品质保障、统一客服与售后。",
    url: "https://iyanglin.com/haodian",
    siteName: "杨林生活网自营商城",
  },
  alternates: {
    canonical: "https://iyanglin.com/haodian",
  },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
};

const categoryIcons: Record<string, { label: string; icon: string; color: string; tag: string }> = {
  food: { label: "美食团购", icon: "🍜", color: "#FF5E3A", tag: "招牌风味" },
  digital: { label: "电脑数码", icon: "🖥", color: "#6366F1", tag: "数码直供" },
  hotel: { label: "酒店客栈", icon: "🏨", color: "#2B78E4", tag: "品质特惠" },
  service: { label: "同城生活", icon: "🛠", color: "#46C389", tag: "便捷到家" },
  car: { label: "汽车养护", icon: "🚗", color: "#8B5CF6", tag: "洗车保养" },
  decorate: { label: "家居建材", icon: "🏠", color: "#F59E0B", tag: "全屋定制" },
  beauty: { label: "美妆丽人", icon: "💄", color: "#EC4899", tag: "造型美甲" },
  monitor: { label: "安防监控", icon: "📹", color: "#0EA5E9", tag: "弱电布线" },
  education: { label: "文教培训", icon: "🎓", color: "#10B981", tag: "技能考证" },
  express: { label: "同城速递", icon: "📦", color: "#06B6D4", tag: "极速直达" },
};

function extractDisplayPrice(value: string) {
  const text = cleanText(value);
  const match = text.match(/(?:¥|￥|价格|售价|特惠价|活动价)\s*[:：]?\s*(\d+(?:\.\d{1,2})?)/i);
  return match ? `¥${match[1]}` : "咨询价";
}

export default async function MallPage({ searchParams }: PageProps) {
  const { category, q, page } = await searchParams;
  const currentCategory = category || "all";
  const searchQuery = q || "";
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const pageSize = 12;

  const allShops = await listShops({
    category: currentCategory !== "all" ? currentCategory : undefined,
    status: "approved",
    search: searchQuery || undefined,
  });

  const totalItems = allShops.length;
  const paginatedShops = allShops.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const buildUrl = (targetPage: number) => {
    const p = new URLSearchParams();
    if (category && category !== "all") p.set("category", category);
    if (q) p.set("q", q);
    if (targetPage > 1) p.set("page", String(targetPage));
    return `/haodian?${p.toString()}`;
  };

  return (
    <main className="template-page ekka-page" style={{ minHeight: "100vh", background: "#F7F8FA", color: "#17171D", paddingBottom: "5rem" }}>
      <Navbar />

      {/* =========================================================================
          1. Ekka 经典巨幕电商横幅 (Mall Hero Banner)
          ========================================================================= */}
      <section
        style={{
          background: "linear-gradient(135deg, #0D2137 0%, #1A4B75 50%, #46C389 100%)",
          color: "#ffffff",
          padding: "3.5rem 0 4rem 0",
          position: "relative",
          overflow: "hidden",
          borderBottom: "3px solid #46C389",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(70,195,137,0.25) 0%, rgba(13,33,55,0) 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.25rem", position: "relative", zIndex: 2 }}>
          {/* 面包屑导航 (纯中文) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.75)", marginBottom: "1.25rem" }}>
            <Link prefetch={false} href="/" style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>网站首页</Link>
            <span>/</span>
            <span style={{ color: "#46C389", fontWeight: "700" }}>杨林生活网自营商城</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "24px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(70,195,137,0.25)", border: "1px solid rgba(70,195,137,0.5)", borderRadius: "20px", padding: "4px 14px", fontSize: "12px", color: "#A7F3D0", fontWeight: "700", marginBottom: "10px" }}>
                <span>🛍️</span> 嵩明杨林 · 平台自营品质好物
              </div>
              <h1 style={{ margin: "0 0 10px 0", fontSize: "32px", fontWeight: "900", letterSpacing: "-0.01em", lineHeight: "1.2" }}>
                杨林生活网自营商城 · 官方精选品质好物
              </h1>
              <p style={{ margin: 0, fontSize: "14.5px", color: "rgba(255,255,255,0.85)", maxWidth: "640px", lineHeight: "1.6" }}>
                平台统一选品、统一客服与统一售后，精选电脑数码、本地特产、生活用品与人气好物，让本地购物更省心。
              </p>
            </div>

            {/* 右侧商城行动按钮 */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <Link
                prefetch={false}
                href="#products"
                style={{
                  background: "linear-gradient(135deg, #46C389 0%, #2EA46D 100%)",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "14.5px",
                  fontWeight: "800",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  textDecoration: "none",
                  boxShadow: "0 8px 20px rgba(70,195,137,0.35)",
                }}
              >
                <span>🛒</span> 浏览自营好物
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. Ekka 风格电商浮动搜索栏
          ========================================================================= */}
      <section style={{ maxWidth: "1240px", margin: "-28px auto 0 auto", padding: "0 1.25rem", position: "relative", zIndex: 10 }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            border: "1px solid #ECEFF2",
            padding: "20px 24px",
          }}
        >
          <form action="/haodian" method="GET" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="搜索自营商品、本地特产、电脑数码或生活好物..."
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 16px 0 42px",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  fontSize: "14px",
                  outline: "none",
                  background: "#F9FAFB",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ position: "absolute", left: "14px", top: "14px", fontSize: "16px", color: "#9CA3AF" }}>🔍</span>
            </div>
            {currentCategory !== "all" && <input type="hidden" name="category" value={currentCategory} />}
            <button
              type="submit"
              style={{
                height: "46px",
                padding: "0 28px",
                background: "#46C389",
                color: "#ffffff",
                borderRadius: "8px",
                border: "none",
                fontSize: "14.5px",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(70,195,137,0.25)",
              }}
            >
              搜索商品
            </button>
          </form>
        </div>
      </section>

      {/* =========================================================================
          3. Ekka 风格电商十大品类胶囊导航条
          ========================================================================= */}
      <section style={{ maxWidth: "1240px", margin: "2rem auto 0 auto", padding: "0 1.25rem" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "20px 24px",
            border: "1px solid #ECEFF2",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "4px", height: "18px", background: "#46C389", borderRadius: "2px" }}></span>
              <span style={{ fontSize: "16px", fontWeight: "900", color: "#17171D" }}>商城精选品类</span>
            </div>
            {currentCategory !== "all" && (
              <Link prefetch={false} href="/haodian" style={{ fontSize: "13px", color: "#46C389", textDecoration: "none", fontWeight: "700" }}>
                ↺ 重置全部品类
              </Link>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))", gap: "12px" }}>
            {/* 全部好物按钮 */}
            <Link
              prefetch={false}
              href="/haodian"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 8px",
                borderRadius: "10px",
                background: currentCategory === "all" ? "#46C389" : "#F7F8FA",
                color: currentCategory === "all" ? "#ffffff" : "#17171D",
                textDecoration: "none",
                border: currentCategory === "all" ? "1px solid #46C389" : "1px solid #E5E7EB",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: "24px", marginBottom: "6px" }}>🛍️</span>
              <span style={{ fontSize: "13px", fontWeight: "800" }}>全部商品</span>
            </Link>

            {/* 各大电商细分品类 */}
            {Object.entries(categoryIcons).map(([key, item]) => {
              const active = currentCategory === key;
              return (
                <Link
                  prefetch={false}
                  key={key}
                  href={`/haodian?category=${key}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "14px 8px",
                    borderRadius: "10px",
                    background: active ? "#46C389" : "#F7F8FA",
                    color: active ? "#ffffff" : "#17171D",
                    textDecoration: "none",
                    border: active ? "1px solid #46C389" : "1px solid #E5E7EB",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "24px", marginBottom: "6px" }}>{item.icon}</span>
                  <span style={{ fontSize: "13px", fontWeight: "800" }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. Ekka 电商统计与排序控制栏
          ========================================================================= */}
      <section style={{ maxWidth: "1240px", margin: "1.75rem auto 1.25rem auto", padding: "0 1.25rem" }}>
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
            border: "1px solid #ECEFF2",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "15px", fontWeight: "900", color: "#17171D" }}>
              官方精选自营好物
            </span>
            <span style={{ fontSize: "13px", color: "#6B7280" }}>
              （共为您精选 <b style={{ color: "#46C389" }}>{totalItems}</b> 款平台自营商品）
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "13px", color: "#6B7280" }}>
            <span>排序方式：</span>
            <span style={{ color: "#46C389", fontWeight: "800" }}>平台推荐优先 · 官方自营保障</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. Ekka 经典电商商品与特惠大卡片流 (ec-product-inner)
          ========================================================================= */}
      <section style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.25rem" }}>
        <div id="products" className="template-anchor" />
        {paginatedShops.length === 0 ? (
          <div style={{ background: "#ffffff", borderRadius: "14px", padding: "5rem 2rem", textAlign: "center", border: "1px solid #ECEFF2" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛍️</div>
            <h3 style={{ margin: "0 0 8px 0", color: "#17171D", fontSize: "20px", fontWeight: "800" }}>暂无符合条件的商城商品</h3>
            <p style={{ color: "#6B7280", fontSize: "14px", margin: "0 0 1.5rem 0" }}>您可以放宽筛选条件，平台也会持续补充新的自营商品。</p>
            <Link
              prefetch={false}
              href="/haodian"
              style={{
                background: "#46C389",
                color: "#ffffff",
                padding: "10px 28px",
                borderRadius: "6px",
                fontWeight: "800",
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              查看全部自营商品
            </Link>
          </div>
        ) : (
          <div className="ekka-product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "22px" }}>
            {paginatedShops.map((shop) => {
              const parsed = parseShopBody(shop.intro);
              const cleanShopName = cleanText(shop.name);
              const rawLogo = shop.logo || (shop.images && shop.images.length > 0 ? shop.images[0] : null);
              const logoUrl = getImageUrl(rawLogo);
              const fallback = CATEGORY_FALLBACK_STYLES[shop.category] || CATEGORY_FALLBACK_STYLES.default;
              const categoryInfo = categoryIcons[shop.category] || { label: "同城商城", icon: "🛍️", color: "#46C389", tag: "品质推荐" };
              const cleanAddress = cleanText(shop.address) || "嵩明杨林镇/大学城商圈";
              const cleanServices = parsed.services || "杨林生活网官方精选 · 平台统一服务与售后";
              const displayPrice = extractDisplayPrice(`${shop.name} ${shop.intro}`);

              return (
                <article
                  className="ekka-product-card"
                  key={shop.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #ECEFF2",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                >
                  {/* 顶部：商品/门头实拍视窗与爆款角标 */}
                  <Link prefetch={false} href={`/haodian/${shop.id}`} className="ekka-product-media" style={{ position: "relative", height: "230px", background: "#F1F5F9", overflow: "hidden", display: "block" }}>
                    {logoUrl ? (
                      <img
                        loading="lazy"
                        decoding="async"
                        src={logoUrl}
                        alt={cleanShopName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: `linear-gradient(135deg, ${fallback.bg} 0%, #1A4B75 100%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          fontSize: "42px",
                        }}
                      >
                        {fallback.icon}
                      </div>
                    )}

                    {/* 左上角特惠促销角标 (Ekka Sale Badge) */}
                    <div style={{ position: "absolute", top: "12px", left: "12px", background: "#FF5E3A", color: "#ffffff", padding: "3px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", boxShadow: "0 2px 6px rgba(255,94,58,0.4)" }}>
                      🔥 限时特惠
                    </div>

                    {/* 右上角平台自营徽章 */}
                    <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(13,33,55,0.75)", backdropFilter: "blur(6px)", color: "#46C389", padding: "3px 10px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>✓</span> 平台自营
                    </div>
                  </Link>

                  {/* 中间信息区 */}
                  <div style={{ padding: "20px 20px 16px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* 商品名与品类 */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "8px" }}>
                      <Link
                        prefetch={false}
                        href={`/haodian/${shop.id}`}
                        style={{
                          fontSize: "17px",
                          fontWeight: "800",
                          color: "#17171D",
                          textDecoration: "none",
                          lineHeight: "1.3",
                        }}
                      >
                        {cleanShopName}
                      </Link>
                      <span
                        style={{
                          background: "#E8F8F0",
                          color: "#2EA46D",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {categoryInfo.label}
                      </span>
                    </div>

                    {/* 推荐特色与商品描述 */}
                    <p style={{ margin: "0 0 14px 0", fontSize: "13px", color: "#6B7280", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {cleanServices}
                    </p>

                    {/* Ekka 核心电商指标栏（口碑、库存、保障） */}
                    <div
                      style={{
                        background: "#F8F9FA",
                        borderRadius: "10px",
                        padding: "10px",
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "8px",
                        textAlign: "center",
                        border: "1px solid #ECEFF2",
                        marginBottom: "14px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "900", color: "#FF5E3A" }}>⭐ 4.9 分</div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>同城口碑</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "900", color: "#17171D" }}>📦 供应中</div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>{shop.hours || "全天"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "900", color: "#46C389" }}>✓ 官方保障</div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>统一售后</div>
                      </div>
                    </div>

                    {/* 地址 */}
                    <div style={{ fontSize: "12.5px", color: "#4B5563", marginBottom: "6px" }}>
                      📍 {cleanAddress}
                    </div>
                  </div>

                  {/* 底部价格与抢购条 */}
                  <div
                    style={{
                      padding: "14px 20px",
                      background: "#F9FAFB",
                      borderTop: "1px solid #ECEFF2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "11px", color: "#6B7280" }}>平台自营价</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                        <span style={{ fontSize: "20px", fontWeight: "900", color: "#FF5E3A" }}>
                          {displayPrice}
                        </span>
                        <span style={{ fontSize: "12px", color: "#9CA3AF", textDecoration: "line-through" }}>
                          官方精选
                        </span>
                      </div>
                    </div>

                    <Link
                      prefetch={false}
                      href={`/haodian/${shop.id}`}
                      style={{
                        background: "#46C389",
                        color: "#ffffff",
                        padding: "8px 20px",
                        borderRadius: "6px",
                        fontSize: "13.5px",
                        fontWeight: "800",
                        textDecoration: "none",
                        boxShadow: "0 2px 8px rgba(70,195,137,0.25)",
                      }}
                    >
                      立即选购 →
                    </Link>
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
              buildUrl={buildUrl}
            />
          </div>
        )}
      </section>

      {/* =========================================================================
          6. 底部 Ekka 消费者电商服务保障
          ========================================================================= */}
      <section style={{ maxWidth: "1240px", margin: "3.5rem auto 0 auto", padding: "0 1.25rem" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #0D2137 0%, #1A4B75 100%)",
            borderRadius: "16px",
            padding: "2.5rem 2rem",
            color: "#ffffff",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
            border: "1px solid rgba(70,195,137,0.3)",
          }}
        >
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(70,195,137,0.2)", color: "#46C389", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
              🛡️
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>平台自营品质保障</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "1.5" }}>
                商品由杨林生活网统一选品与展示，提供统一客服支持和售后处理。
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(70,195,137,0.2)", color: "#46C389", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
              ⚡
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>同城自提与极速直达</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "1.5" }}>
                支持电话与微信咨询，提供杨林本地自提或同城配送信息。
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(70,195,137,0.2)", color: "#46C389", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
              💰
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>专属特惠 0 中介费</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "1.5" }}>
                由杨林生活网统一客服对接，商品信息和售后流程更加清晰省心。
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
