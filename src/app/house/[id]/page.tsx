import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getHouse } from "@/lib/house-store";
import { parseHouseBody } from "@/lib/house-parser";
import { cleanText } from "@/lib/strip-html";
import ContactRevealer from "@/components/ContactRevealer";
import DetailActions from "@/components/DetailActions";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONTACT_VIEW_COIN_COST } from "@/lib/coin-wallet-store";
import { Metadata } from "next";
import Link from "next/link";
import { getImageUrl } from "@/lib/image-url";
import HouseImage from "@/components/HouseImage";
import WechatShareHiddenImage from "@/components/WechatShareHiddenImage";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const houseTypeLabels: Record<string, string> = {
  rent: "房屋出租",
  secondhand: "二手好房",
  newhouse: "新房楼盘",
  shop: "商铺门面",
  factory: "厂房仓库",
  "住宅": "住宅好房",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const house = await getHouse(id);
  if (!house) return {};

  const parsed = parseHouseBody(house.body);
  const typeLabel = parsed.houseType || houseTypeLabels[house.houseType] || "房产楼市";
  const title = `${cleanText(house.title)} - ${typeLabel}`;
  const description = `杨林生活网房产频道为您提供${cleanText(house.title)}的真实房源详情，包含价格预算：${parsed.price || house.price || "面议"}，地理位置：${parsed.location || house.location || "嵩明杨林"}，居室户型：${parsed.layout || house.layout || "精选户型"}。真实房东直连，免中介费。`;

  return {
    title,
    description,
    keywords: [cleanText(house.title), typeLabel, parsed.location || "嵩明杨林", "杨林租房", "杨林二手房", "杨林房产"],
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://iyanglin.com/house/${house.id}`,
      siteName: "杨林生活网",
      images: [
        {
          url: (house.images && house.images[0]) || "https://iyanglin.com/share/v2/house.png?v=20260912",
          width: 600,
          height: 600,
        },
      ],
    },
    alternates: {
      canonical: `https://iyanglin.com/house/${house.id}`,
    },
  };
}

export default async function HouseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const house = await getHouse(id);

  const session = await getSession();
  const isLoggedIn = !!session?.id;
  const isAuthor = Boolean(session?.id && house?.authorId && session.id === house.authorId);
  const isAdmin = session?.role === "ADMIN" || session?.role === "EDITOR";
  const canPreview = isAuthor || isAdmin;

  if (!house) {
    notFound();
  }

  const parsed = parseHouseBody(house.body);
  const cleanHouseTitle = cleanText(house.title);
  const locationStr = cleanText(house.location) || "嵩明杨林生活圈";
  const layoutStr = house.layout || parsed.layout || "2室1厅";
  const areaNum = (house.areaSize || "").replace(/[^\d.]/g, "");
  const areaStr = areaNum ? `${areaNum} ㎡` : "85 ㎡";
  const floorStr = parsed.floor || "中楼层 / 共18层";
  const orientStr = parsed.facing || "南北通透";
  const rawPhone = parsed.contact || house.contact || "";

  // 房源类型中文标签
  const typeBadge = houseTypeLabels[house.houseType] || "优质房源";

  // 非审核通过状态拦截与专用视图呈现
  if (house.status !== "approved") {
    // 1. 外部普通访客访问未公开内容：给出友好提示，绝不抛出冷冰冰的 404
    if (!canPreview) {
      return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
          <Navbar />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
            <div style={{ maxWidth: "480px", width: "100%", background: "white", borderRadius: "16px", padding: "2.5rem 2rem", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "52px", marginBottom: "1rem" }}>⏳</div>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b", marginBottom: "8px" }}>
                {house.status === "pending" ? "房源正在审核中" : house.status === "offline" ? "房源已下架" : "内容暂未公开"}
              </h2>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                {house.status === "pending"
                  ? "该房源信息已由房东/发布者成功提交，平台专员正在进行真实性与合规审核。审核通过后将自动对全站公开展示，敬请期待！"
                  : house.status === "offline"
                  ? "该房源目前处于下架或已出租/售出状态。您可以浏览杨林其他最新真实房源。"
                  : "该信息目前不可见，请浏览其他房产信息。"}
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/house" style={{ padding: "10px 20px", background: "#FF7500", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: "700" }}>
                  浏览房产大厅
                </Link>
                <Link href="/" style={{ padding: "10px 20px", background: "#f1f5f9", color: "#475569", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: "700" }}>
                  返回网站首页
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2. 作者本人或管理员访问待审核房源：呈现专属的【待审核 · 房源预览与审核跟踪】页面
    if (house.status === "pending") {
      const createdDateStr = house.createdAt
        ? new Date(house.createdAt).toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "刚刚提交";

      return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
          <Navbar />

          {/* 顶部面包屑 */}
          <section style={{ background: "#ffffff", borderBottom: "1px solid #E5E7EB", padding: "0.85rem 0" }}>
            <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 1.25rem", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6B7280" }}>
              <Link href="/" style={{ color: "#4B5563", textDecoration: "none" }}>网站首页</Link>
              <span>/</span>
              <Link href="/profile" style={{ color: "#4B5563", textDecoration: "none" }}>会员中心</Link>
              <span>/</span>
              <span style={{ color: "#D97706", fontWeight: "700" }}>房源待审核详情</span>
            </div>
          </section>

          {/* 主体容器 */}
          <main style={{ maxWidth: "860px", width: "100%", margin: "1.5rem auto 3rem auto", padding: "0 1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* 审核状态卡片 */}
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #fde68a", padding: "1.75rem", boxShadow: "0 4px 16px rgba(245, 158, 11, 0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "28px" }}>⏳</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h1 style={{ fontSize: "18px", fontWeight: "800", color: "#92400e", margin: 0 }}>房源待审核</h1>
                      <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "12px", fontWeight: "700", background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                        平台审核中
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#78350f", margin: "3px 0 0 0" }}>
                      您提交的房源正在平台人工审核中，暂未对公众公开展示。
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <Link
                    href="/admin/content?kind=house"
                    style={{
                      padding: "6px 14px",
                      background: "#16a34a",
                      color: "white",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    🛠️ 管理员前往后台审核上线 →
                  </Link>
                )}
              </div>

              {/* 三步流转进度 */}
              <div style={{ background: "#fffbeb", borderRadius: "12px", padding: "1.25rem", border: "1px solid #fef08a", marginTop: "0.5rem" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#92400e", marginBottom: "12px" }}>
                  📋 平台审核流转进度：
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#16a34a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>✓</div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#166534" }}>1. 提交成功</div>
                      <div style={{ fontSize: "11px", color: "#65a30d" }}>{createdDateStr}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#f59e0b", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>2</div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#b45309" }}>2. 平台人工审核 (进行中)</div>
                      <div style={{ fontSize: "11px", color: "#d97706" }}>核验房源真实度与产权合规，工作日约2小时</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#cbd5e1", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>3</div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#64748b" }}>3. 审核通过全网公开</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>上线全站房产频道与推荐流</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "1rem", fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🔒</span>
                <span>当前页面为已提交内容的专属预览视图，外部非发布者访客访问将显示“审核中”，无法查看房东联系方式。</span>
              </div>
            </div>

            {/* 房源核对预览卡片 */}
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
                    {cleanHouseTitle}
                  </h2>
                  <div style={{ fontSize: "14px", color: "#64748b", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "700", color: "#334155" }}>🏷️ {typeBadge}</span>
                    <span>·</span>
                    <span>📍 {locationStr}</span>
                    <span>·</span>
                    <span>📐 {areaStr}</span>
                  </div>
                </div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#FF7500" }}>
                  {parsed.price || house.price || "面议"}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                <span style={{ padding: "4px 10px", borderRadius: "6px", background: "#f1f5f9", color: "#475569", fontSize: "12px", fontWeight: "600" }}>
                  户型：{layoutStr}
                </span>
                <span style={{ padding: "4px 10px", borderRadius: "6px", background: "#f1f5f9", color: "#475569", fontSize: "12px", fontWeight: "600" }}>
                  朝向：{orientStr}
                </span>
                <span style={{ padding: "4px 10px", borderRadius: "6px", background: "#f1f5f9", color: "#475569", fontSize: "12px", fontWeight: "600" }}>
                  楼层：{floorStr}
                </span>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                  📄 房源描述与配置：
                </div>
                <div style={{ fontSize: "13.5px", color: "#334155", lineHeight: "1.7", background: "#f8fafc", padding: "1rem 1.25rem", borderRadius: "10px", whiteSpace: "pre-wrap", border: "1px solid #f1f5f9" }}>
                  {parsed.description || house.body || "暂无详细描述"}
                </div>
              </div>

              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#1d4ed8", marginBottom: "4px" }}>
                  📞 提交的房东联系方式（作者本人核对）：
                </div>
                <div style={{ fontSize: "14px", color: "#1e40af", fontWeight: "600" }}>
                  电话：{rawPhone || "暂未填写手机号"}
                </div>
              </div>
            </div>

            {/* 底部操作与加急 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.25rem 1.75rem" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Link
                  href="/profile"
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    background: "#f1f5f9",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: "700",
                    textDecoration: "none",
                  }}
                >
                  ← 返回会员中心
                </Link>
                <Link
                  href="/house/new"
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    background: "#FF7500",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: "700",
                    textDecoration: "none",
                  }}
                >
                  + 发布其他房源
                </Link>
              </div>

              <div style={{ fontSize: "12.5px", color: "#64748b", textAlign: "right" }}>
                <span>如需加急审核，可联系平台客服电话/微信：</span>
                <b style={{ color: "#d97706", marginLeft: "4px" }}>15887208151</b>
              </div>
            </div>

          </main>
        </div>
      );
    }
  }

  // 检查当前用户是否已购买过该房源联系方式
  let contactUnlocked = false;
  if (session?.id) {
    const purchase = await prisma.contactPurchase.findUnique({
      where: { userId_targetKind_targetId: { userId: session.id, targetKind: "house", targetId: id } },
    });
    if (purchase) contactUnlocked = true;
    // 管理员 / VIP / 作者本人免费
    if (!contactUnlocked && (isAdmin || isAuthor)) contactUnlocked = true;
    if (!contactUnlocked) {
      const vip = await prisma.userMembership.findFirst({ where: { userId: session.id, status: "ACTIVE" } });
      if (vip) contactUnlocked = true;
    }
  }

  const rawHouseImg = house.images && house.images[0];
  const houseShareImg = rawHouseImg
    ? (rawHouseImg.startsWith("http") ? rawHouseImg : `https://iyanglin.com${rawHouseImg.startsWith("/") ? "" : "/"}${rawHouseImg}`)
    : "https://iyanglin.com/share/v2/house.png?v=20260912";
  const houseShareTitle = `【${typeBadge}】${cleanHouseTitle}`;
  const houseShareDesc = `租售价格：${parsed.price || house.price || "面议"}，位置：${parsed.location || house.location || "嵩明杨林"}，户型：${parsed.layout || house.layout || "精选户型"}。真实房东直连。`;

  return (
    <main className="template-page homepick-page homepick-detail-page" style={{ minHeight: "100vh", background: "#F8F9FA", paddingBottom: "5rem" }}>
      {/* 微信与社交分享爬虫首图兜底 */}
      <WechatShareHiddenImage imageUrl={houseShareImg} alt={houseShareTitle} />
      <Navbar />

      {/* =========================================================================
          1. 顶部面包屑与房源标题条
          ========================================================================= */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #E2DAD3", padding: "1rem 0" }}>
        <div className="shell" style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#87898E" }}>
            <Link prefetch={false} href="/" style={{ color: "#4B5563", textDecoration: "none" }}>网站首页</Link>
            <span>/</span>
            <Link prefetch={false} href="/house" style={{ color: "#4B5563", textDecoration: "none" }}>房产楼市</Link>
            <span>/</span>
            <span style={{ color: "#FF7500", fontWeight: "700" }}>房源详情</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. HomePick apartment-details 主体结构
          ========================================================================= */}
      <div className="shell" style={{ maxWidth: "1240px", margin: "2rem auto 0 auto", padding: "0 1.25rem" }}>
        <div className="homepick-detail-layout" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", alignItems: "start" }}>
          
          {/* 左侧主体内容 */}
          <div>
            {/* 实景大图与悬浮 6 宫格核心参数条 (HomePick apartment-details__img-box) */}
            <div
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                background: "#25384A",
                boxShadow: "0 10px 30px rgba(37,56,74,0.08)",
                border: "1px solid #E2DAD3",
                marginBottom: "28px",
              }}
            >
              {/* 实景大图视窗 */}
              <div className="homepick-gallery" style={{ position: "relative", width: "100%", height: "460px", background: "#1E2D3D" }}>
                {house.images && house.images.length > 0 ? (
                  <>
                    <div className="homepick-gallery-main">
                      <HouseImage src={getImageUrl(house.images[0]) || house.images[0]} alt={cleanHouseTitle} loading="eager" />
                    </div>
                    {house.images.length > 1 && (
                      <div className="homepick-gallery-thumbs">
                        {house.images.slice(1, 4).map((image, index) => (
                          <div className="homepick-gallery-thumb" key={`${image}-${index}`}>
                            <HouseImage src={getImageUrl(image) || image} alt={`${cleanHouseTitle} 实景图 ${index + 2}`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FF7500",
                      background: "linear-gradient(135deg, #25384A 0%, #15222E 100%)",
                    }}
                  >
                    <span style={{ fontSize: "64px" }}>🏡</span>
                    <span style={{ fontSize: "16px", fontWeight: "800", marginTop: "10px", color: "#ffffff" }}>
                      嵩明杨林 · 实景认证好房
                    </span>
                  </div>
                )}

                {/* 悬浮角标：类型与图集计数 */}
                <div style={{ position: "absolute", top: "18px", left: "18px", background: "#FF7500", color: "#ffffff", padding: "6px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: "800", boxShadow: "0 4px 12px rgba(255,117,0,0.3)" }}>
                  {typeBadge}
                </div>

                <div style={{ position: "absolute", bottom: "18px", right: "18px", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", color: "#ffffff", padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                  实景照片（共 {house.images?.length || 1} 张）
                </div>
              </div>

              {/* 悬浮 6 宫格核心参数条 (HomePick 经典 apartment-details__list 结构，纯中文) */}
              <div
                className="homepick-facts-grid"
                style={{
                  background: "#25384A",
                  padding: "20px 24px",
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: "16px",
                  textAlign: "center",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#FF7500", lineHeight: "1.2" }}>{areaStr}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>建筑面积</div>
                </div>

                <div>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#ffffff", lineHeight: "1.2" }}>{floorStr.split("/")[0] || "8层"}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>所在楼层</div>
                </div>

                <div>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#ffffff", lineHeight: "1.2" }}>{layoutStr.slice(0, 2) || "2室"}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>居室户型</div>
                </div>

                <div>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#ffffff", lineHeight: "1.2" }}>独立卫浴</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>卫生间配置</div>
                </div>

                <div>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#ffffff", lineHeight: "1.2" }}>{orientStr}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>景观阳台/朝向</div>
                </div>

                <div>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#ffffff", lineHeight: "1.2" }}>配备车位</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>车位与电梯</div>
                </div>
              </div>
            </div>

            {/* 房源标题与价格主卡片 */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #E2DAD3",
                padding: "28px 32px",
                boxShadow: "0 4px 20px rgba(37,56,74,0.03)",
                marginBottom: "28px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid #F1F3F5", paddingBottom: "20px", marginBottom: "24px" }}>
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <h1 style={{ margin: "0 0 10px 0", fontSize: "24px", fontWeight: "900", color: "#25384A", lineHeight: "1.4" }}>
                    {cleanHouseTitle}
                  </h1>
                  <div style={{ display: "flex", gap: "16px", fontSize: "13.5px", color: "#87898E", flexWrap: "wrap" }}>
                    <span>📍 {locationStr}</span>
                    <span>🕒 发布更新时间：近期有效</span>
                    <span>👁️ 浏览热度：256 次</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "13px", color: "#87898E", textAlign: "right" }}>业主期望预算</div>
                  <div style={{ fontSize: "32px", fontWeight: "900", color: "#FF7500", lineHeight: "1.2" }}>
                    {house.price || "面议"}
                  </div>
                </div>
              </div>

              {/* 房源特色亮点清单 (HomePick apartment-details__points 风格，纯中文) */}
              <div style={{ marginBottom: "28px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "800", color: "#25384A", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "4px", height: "18px", background: "#FF7500", borderRadius: "2px" }}></span>
                  房源特色与品质保障
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
                  {[
                    "业主真实挂牌，房东直租直售免中介费",
                    "房屋精装修交付，生活家具家电配置齐全",
                    "采光通透视野开阔，民用水电标准",
                    "临近杨林大学城商圈与主干道，交通便利",
                    "智能密码门锁入户，24小时小区安保管控",
                    "产证与房屋信息经杨林生活网人工巡检验真",
                  ].map((text, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "#F8F9FA", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13.5px", color: "#25384A" }}>
                      <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#FF7500", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "900", flexShrink: 0 }}>
                        ✓
                      </span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 详细描述正文 */}
              <div>
                <h3 style={{ margin: "0 0 14px 0", fontSize: "18px", fontWeight: "800", color: "#25384A", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "4px", height: "18px", background: "#FF7500", borderRadius: "2px" }}></span>
                  房源详细概况
                </h3>
                <div
                  style={{
                    background: "#F8F9FA",
                    borderRadius: "12px",
                    padding: "20px",
                    fontSize: "15px",
                    lineHeight: "1.8",
                    color: "#374151",
                    whiteSpace: "pre-wrap",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  {house.body
                    ? (() => {
                        let text = house.body.replace(/<[^>]+>/g, "").trim();
                        // 未付费用户脱敏正文中的手机号和微信号
                        if (!contactUnlocked) {
                          text = text.replace(/1[3-9]\d{9}/g, (m) => m.slice(0, 3) + "****" + m.slice(7));
                        }
                        return text;
                      })()
                    : "房东暂未填写详细文本说明，欢迎直接拨打电话或添加微信沟通看房事宜。"}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：房东/经纪人置业卡片与行动中枢 */}
          <aside className="homepick-contact-rail" style={{ position: "sticky", top: "20px" }}>
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #E2DAD3",
                padding: "24px",
                boxShadow: "0 10px 30px rgba(37,56,74,0.06)",
                textAlign: "center",
              }}
            >
              {/* 房东头像与认证 */}
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #25384A 0%, #15222E 100%)", color: "#FF7500", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", margin: "0 auto 12px auto", boxShadow: "0 4px 15px rgba(37,56,74,0.2)" }}>
                👤
              </div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "800", color: "#25384A" }}>
                认证房东 / 置业管家
              </h3>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(255,117,0,0.12)", color: "#FF7500", padding: "2px 10px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "700", marginBottom: "20px" }}>
                <span>✓</span> 实名电话已核验
              </div>

              {/* 电话解锁与拨打模块 */}
              <div style={{ background: "#F8F9FA", borderRadius: "12px", padding: "16px", border: "1px solid #E5E7EB", marginBottom: "16px" }}>
                <ContactRevealer
                  contact={contactUnlocked ? rawPhone : undefined}
                  maskedPhone={rawPhone ? rawPhone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : undefined}
                  hasPhone={!!rawPhone}
                  isLoggedIn={isLoggedIn}
                  redirectUrl={`/house/${house.id}`}
                  targetKind="house"
                  targetId={house.id}
                  coinCost={CONTACT_VIEW_COIN_COST}
                  unlocked={contactUnlocked}
                />
              </div>

              {/* 微信扫码一键咨询通道 */}
              <div style={{ borderTop: "1px dashed #E5E7EB", paddingTop: "16px" }}>
                <div style={{ fontSize: "12px", color: "#87898E", marginBottom: "8px" }}>
                  支持添加微信 · 预约实地看房
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", fontWeight: "700", color: "#059669" }}>
                  <span>🟢</span> 微信扫码即刻在线沟通
                </div>
              </div>

              {/* 收藏、举报与安全提示 */}
              <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #F1F3F5", display: "flex", justifyContent: "center", gap: "16px" }}>
                <DetailActions
                  resourceType="HOUSE"
                  resourceId={house.id}
                  title={houseShareTitle}
                  desc={houseShareDesc}
                  link={`https://iyanglin.com/house/${house.id}`}
                  imageUrl={houseShareImg}
                />
              </div>
            </div>

            {/* 安全提示卡片 */}
            <div style={{ background: "#FFF7ED", borderRadius: "12px", border: "1px solid #FFEDD5", padding: "16px", marginTop: "16px", fontSize: "12px", color: "#C2410C", lineHeight: "1.6" }}>
              <div style={{ fontWeight: "800", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                <span>⚠️</span> 租房安全防骗温馨提示
              </div>
              建议实地看房、查验房东有效证件后再支付定金或押金，谨防网络电信转账欺诈。
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
