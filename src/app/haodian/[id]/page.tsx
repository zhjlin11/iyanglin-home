import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getShop } from "@/lib/shop-store";
import { parseShopBody } from "@/lib/shop-parser";
import ContactRevealer from "@/components/ContactRevealer";
import DetailActions from "@/components/DetailActions";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { cleanText } from "@/lib/strip-html";
import { getImageUrl, CATEGORY_FALLBACK_STYLES } from "@/lib/image-url";
import WechatShareHiddenImage from "@/components/WechatShareHiddenImage";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const categoryLabels: Record<string, string> = {
  food: "美食团购",
  digital: "电脑数码",
  hotel: "酒店客栈",
  service: "同城生活",
  car: "汽车养护",
  decorate: "家居建材",
  beauty: "美妆丽人",
  monitor: "安防监控",
  education: "文教培训",
  express: "同城速递",
  enterprise: "企业服务",
};

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const shop = await getShop(id);

  if (!shop || shop.status !== "approved") {
    return { title: "商品未找到 | 杨林生活网商城" };
  }

  const parsed = parseShopBody(shop.intro);
  const mainService = parsed.services ? parsed.services.split(" ")[0] : categoryLabels[shop.category] || "商品";

  return {
    title: `${shop.name} - ${parsed.address || "杨林"}${mainService}特惠直供 | 杨林生活网商城`,
    description: `杨林生活网商城精选：位于${parsed.address || "杨林"}的${shop.name}，主营：${parsed.services || categoryLabels[shop.category] || "同城好物"}。${parsed.intro.slice(0, 80).replace(/\n/g, '')}...`,
    keywords: `${shop.name}, 杨林自营商城, 杨林${mainService}, 杨林同城特惠, 杨林网购, 嵩明好物`,
    openGraph: {
      title: `${shop.name} - 杨林生活网口碑好店`,
      description: parsed.intro.slice(0, 100),
      url: `https://iyanglin.com/haodian/${shop.id}`,
      siteName: "杨林生活网",
      images: [
        {
          url: shop.logo || (shop.images && shop.images[0]) || "https://iyanglin.com/share/v2/merchant.png?v=20260912",
          width: 600,
          height: 600,
        },
      ],
    },
    alternates: {
      canonical: `https://iyanglin.com/haodian/${shop.id}`,
    },
  };
}

export default async function MallDetailPage({ params }: PageProps) {
  const { id } = await params;
  const shop = await getShop(id);

  if (!shop || shop.status !== "approved") {
    notFound();
  }

  const parsed = parseShopBody(shop.intro);
  const cleanShopName = cleanText(shop.name);
  const rawPhone = parsed.contact || shop.phone || "";
  const shopAddress = parsed.address || shop.address || "嵩明杨林镇/大学城商圈";
  const shopHours = parsed.hours || shop.hours || "09:00 - 22:00";

  let allGalleryImages = shop.images || [];
  if (parsed.shopImages && parsed.shopImages.length > 0) {
    allGalleryImages = Array.from(new Set([...allGalleryImages, ...parsed.shopImages]));
  }
  const heroImage = allGalleryImages.length > 0 ? allGalleryImages[0] : (shop.logo || null);
  const logoUrl = getImageUrl(heroImage);
  const fallback = CATEGORY_FALLBACK_STYLES[shop.category] || CATEGORY_FALLBACK_STYLES.default;

  // 提取招牌菜品/服务套餐规格列表
  const serviceItems = parsed.services ? parsed.services.split(" ").filter(Boolean) : ["平台精选品质款", "本地特惠体验装", "官方售后保障款"];

  const rawShopImg = shop.logo || (shop.images && shop.images[0]);
  const shopShareImg = rawShopImg
    ? (rawShopImg.startsWith("http") ? rawShopImg : `https://iyanglin.com${rawShopImg.startsWith("/") ? "" : "/"}${rawShopImg}`)
    : "https://iyanglin.com/share/v2/merchant.png?v=20260912";
  const shopShareTitle = `【好店名录】${cleanShopName} - 杨林口碑好店`;
  const shopShareDesc = `主营特色：${parsed.services || "同城生活服务"}，地址：${parsed.address || shop.address || "杨林镇"}。欢迎在线咨询与光临！`;

  return (
    <main style={{ minHeight: "100vh", background: "#F7F8FA", color: "#17171D", paddingBottom: "5rem" }}>
      {/* 微信与社交分享爬虫首图兜底 */}
      <WechatShareHiddenImage imageUrl={shopShareImg} alt={shopShareTitle} />
      <Navbar />

      {/* =========================================================================
          1. 顶部电商面包屑导航 (Ekka Breadcrumb)
          ========================================================================= */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #ECEFF2", padding: "0.85rem 0" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6B7280" }}>
            <Link prefetch={false} href="/" style={{ color: "#4B5563", textDecoration: "none" }}>网站首页</Link>
            <span>/</span>
            <Link prefetch={false} href="/haodian" style={{ color: "#4B5563", textDecoration: "none" }}>杨林生活网商城</Link>
            <span>/</span>
            <span style={{ color: "#46C389", fontWeight: "700" }}>{cleanShopName}</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. Ekka 经典商品单页核心双栏架构 (product-left-sidebar.html)
          ========================================================================= */}
      <section style={{ maxWidth: "1240px", margin: "2rem auto 0 auto", padding: "0 1.25rem" }}>
        <div
          className="haodian-detail-grid"
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #ECEFF2",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            padding: "32px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "36px",
            alignItems: "start",
            marginBottom: "28px",
          }}
        >
          {/* 左侧：Ekka 电商商品大图与多图画廊展示区 */}
          <div>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "380px",
                borderRadius: "12px",
                background: "#F1F5F9",
                overflow: "hidden",
                border: "1px solid #ECEFF2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={cleanShopName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ textAlign: "center", color: "#64748B" }}>
                  <div style={{ fontSize: "64px", marginBottom: "8px" }}>{fallback.icon}</div>
                  <div style={{ fontSize: "16px", fontWeight: "700" }}>{cleanShopName}</div>
                </div>
              )}

              {/* 爆款热销角标 */}
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "16px",
                  background: "#FF5E3A",
                  color: "#ffffff",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "800",
                  boxShadow: "0 2px 8px rgba(255,94,58,0.4)",
                }}
              >
                🔥 同城爆款特惠
              </div>

              {/* 实体正品直供 */}
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "rgba(13,33,55,0.8)",
                  backdropFilter: "blur(6px)",
                  color: "#46C389",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                ✓ 实体店源头直供
              </div>
            </div>

            {/* 缩略图行 */}
            {allGalleryImages.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
                {allGalleryImages.slice(0, 5).map((img, i) => (
                  <div
                    key={i}
                    style={{
                      height: "72px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#F1F5F9",
                      border: i === 0 ? "2px solid #46C389" : "1px solid #ECEFF2",
                    }}
                  >
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：Ekka 电商商品购买面板 (single-pro-content) */}
          <div>
            {/* 品类与平台自营徽标 */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span style={{ background: "#E8F8F0", color: "#2EA46D", padding: "3px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "800" }}>
                {categoryLabels[shop.category] || "同城商城"}
              </span>
              <span style={{ fontSize: "13px", color: "#64748B" }}>
                🏢 {cleanShopName} 专营直供
              </span>
            </div>

            {/* 自营商品全称大标题 */}
            <h1 style={{ margin: "0 0 12px 0", fontSize: "24px", fontWeight: "900", color: "#17171D", lineHeight: "1.3" }}>
              {cleanShopName} · 同城优选特惠套餐
            </h1>

            {/* 口碑评分与热销 */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "16px", borderBottom: "1px solid #F1F5F9", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#FF5E3A", fontWeight: "900", fontSize: "14px" }}>
                <span>⭐ 4.9 分</span>
                <span style={{ color: "#9CA3AF", fontWeight: "normal", fontSize: "12px" }}>（100+ 条真实评价）</span>
              </div>
              <span style={{ color: "#E2E8F0" }}>|</span>
              <div style={{ fontSize: "13px", color: "#46C389", fontWeight: "700" }}>
                ✓ 杨林生活网平台自营
              </div>
            </div>

            {/* 醒目大字价格区 (Ekka single-price-stoke) */}
            <div
              style={{
                background: "#FFF7ED",
                borderRadius: "10px",
                border: "1px solid #FFEDD5",
                padding: "16px 20px",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#C2410C", fontWeight: "700", marginBottom: "4px" }}>
                同城专享特惠价
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <span style={{ fontSize: "32px", fontWeight: "900", color: "#FF5E3A", lineHeight: "1" }}>
                  ¥ 特惠面议
                </span>
                <span style={{ fontSize: "14px", color: "#9CA3AF", textDecoration: "line-through" }}>
                  市场指导价
                </span>
                <span style={{ background: "#FF5E3A", color: "#ffffff", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "800" }}>
                  同城立减
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#EA580C", marginTop: "8px" }}>
                ⚡ 平台统一选品、统一客服与售后，本地用户享专属优惠！
              </div>
            </div>

            {/* 规格属性选择 (Ekka pro-variation) */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#374151", marginBottom: "10px" }}>
                精选特惠规格 / 招牌推荐：
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {serviceItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: idx === 0 ? "#E8F8F0" : "#F8FAFC",
                      border: idx === 0 ? "2px solid #46C389" : "1px solid #E2E8F0",
                      color: idx === 0 ? "#2EA46D" : "#334155",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* 客服时间与配送信息 */}
            <div style={{ background: "#F8FAFC", borderRadius: "10px", padding: "14px", border: "1px solid #ECEFF2", marginBottom: "24px", fontSize: "13px", color: "#4B5563" }}>
              <div style={{ marginBottom: "6px" }}>📍 提货/服务地址：{shopAddress}</div>
              <div>⏰ 客服服务时间：{shopHours}</div>
            </div>

            {/* 核心订购行动按钮 (Ekka single-cart) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div style={{ background: "#F8F9FA", borderRadius: "10px", padding: "14px", border: "1px solid #ECEFF2" }}>
                <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px" }}>店长订购直通电话</div>
                <div style={{ fontSize: "18px", fontWeight: "900", color: "#0F172A", marginBottom: "10px" }}>
                  {rawPhone ? rawPhone : "联系平台客服选购"}
                </div>
                <ContactRevealer
                  contact={rawPhone}
                  isLoggedIn={true}
                  redirectUrl={`/haodian/${shop.id}`}
                />
              </div>

              {/* 配送与自提位置参考 */}
              <a
                href={`https://uri.amap.com/search?keyword=${encodeURIComponent(cleanShopName + " " + shopAddress)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background: "#2B78E4",
                  color: "#ffffff",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "800",
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(43,120,228,0.25)",
                }}
              >
                <span>📍</span> 查看本地配送 / 自提位置
              </a>
            </div>

            {/* 电商服务保障承诺 */}
            <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#4B5563", borderTop: "1px solid #F1F5F9", paddingTop: "16px", flexWrap: "wrap" }}>
              <span>🛡️ 实体名店保真</span>
              <span>⚡ 同城极速直达</span>
              <span>🤝 纠纷平台协调</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. Ekka 选项卡详情区 (ec-single-pro-tab)
          ========================================================================= */}
      <section style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.25rem" }}>
        <div
          className="haodian-detail-tab"
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #ECEFF2",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            padding: "28px 32px",
          }}
        >
          {/* Tab 标题 */}
          <div className="haodian-tab-header" style={{ borderBottom: "2px solid #F1F5F9", paddingBottom: "12px", marginBottom: "20px", display: "flex", gap: "24px" }}>
            <span style={{ fontSize: "16px", fontWeight: "900", color: "#46C389", borderBottom: "3px solid #46C389", paddingBottom: "12px", marginBottom: "-14px" }}>
              商品详细图文介绍
            </span>
            <span style={{ fontSize: "16px", fontWeight: "700", color: "#64748B" }}>
              服务规格与参数
            </span>
            <span style={{ fontSize: "16px", fontWeight: "700", color: "#64748B" }}>
              顾客口碑与晒单评价
            </span>
          </div>

          {/* 正文介绍 */}
          <div
            style={{
              background: "#F9FAFB",
              borderRadius: "12px",
              padding: "24px",
              fontSize: "14.5px",
              lineHeight: "1.8",
              color: "#374151",
              whiteSpace: "pre-wrap",
              border: "1px solid #ECEFF2",
              marginBottom: "24px",
            }}
          >
            {parsed.intro || `${cleanShopName}由杨林生活网平台统一展示与服务，提供高品质同城商品、统一客服和售后保障，欢迎杨林街坊咨询选购！`}
          </div>

          {/* 顾客真实评价 */}
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "800", color: "#17171D" }}>
              💬 同城顾客好评晒单 (100% 好评)
            </h4>
            <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #ECEFF2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontWeight: "800", fontSize: "14px", color: "#17171D" }}>杨林本地消费者</span>
                <span style={{ color: "#FF5E3A", fontSize: "13px" }}>⭐⭐⭐⭐⭐ 5.0分</span>
              </div>
              <p style={{ margin: 0, fontSize: "13.5px", color: "#4B5563", lineHeight: "1.6" }}>
                “平台客服响应很快，商品介绍清楚，本地配送和自提都很方便，售后也更省心。”
              </p>
            </div>
          </div>

          {/* 底部互动 */}
          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end" }}>
            <DetailActions
              resourceType="MERCHANT"
              resourceId={shop.id}
              title={shopShareTitle}
              desc={shopShareDesc}
              link={`https://iyanglin.com/haodian/${shop.id}`}
              imageUrl={shopShareImg}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
