import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/strip-html";
import Navbar from "@/components/Navbar";
import DetailActions from "@/components/DetailActions";
import ContactRevealer from "@/components/ContactRevealer";
import WechatShareHiddenImage from "@/components/WechatShareHiddenImage";
import InfoStickyContactBar from "@/components/info/InfoStickyContactBar";
import { getSession } from "@/lib/auth";
import { canViewResource } from "@/lib/resource-access";
import ReviewStatusBanner, { VisitorPendingCard } from "@/components/common/ReviewStatusBanner";
import { CONTACT_VIEW_COIN_COST } from "@/lib/coin-wallet-store";
import { Metadata } from "next";
import InfoDetailPromoteButton from "@/components/info/InfoDetailPromoteButton";
import PublisherTrustCard from "@/components/info/PublisherTrustCard";
import { getProviderTrustFacts } from "@/lib/info-promotions";
import {
  getCategoryBadge,
  getItemTypeBadge,
} from "@/lib/info-categories";
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
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Check,
  Eye,
  Heart,
  Share2,
  ShieldCheck,
  PhoneCall,
  MessageCircle,
  AlertCircle,
  Tag,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await prisma.listing.findUnique({ where: { id } });
  if (!item) return {};

  const catBadge = getCategoryBadge(item.category);
  const title = `${item.title} - ${catBadge.name} - 杨林生活网`;
  const description = `${item.title}。分类：${catBadge.name}。所在区域：${item.area || "杨林经开区"}。更多杨林本地拼车顺风车、二手转让与便民服务请上杨林生活网。`;

  const shareImg =
    item.images && item.images[0]
      ? item.images[0].startsWith("http")
        ? item.images[0]
        : `https://iyanglin.com${item.images[0].startsWith("/") ? "" : "/"}${item.images[0]}`
      : "https://iyanglin.com/share/v2/product.png?v=20260912";

  return {
    title,
    description,
    keywords: [item.title, catBadge.name, item.area || "杨林", "杨林生活网", "杨林便民"],
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://iyanglin.com/info/${item.id}`,
      siteName: "杨林生活网",
      images: [
        {
          url: shareImg,
          width: 600,
          height: 600,
        },
      ],
    },
    alternates: {
      canonical: `https://iyanglin.com/info/${item.id}`,
    },
  };
}

function formatPublishTime(dateInput: string | Date | null | undefined) {
  if (!dateInput) return "刚刚发布";
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "🔥 刚刚发布";
  if (diffHours < 24) return `⏱️ ${Math.floor(diffHours)}小时前发布`;
  if (diffDays === 1) return "昨天发布";
  if (diffDays <= 7) return `${diffDays}天前发布`;
  return date.toLocaleDateString("zh-CN");
}

export default async function InfoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = await prisma.listing.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          phone: true,
          phoneVerifiedAt: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });

  if (!item) notFound();

  const session = await getSession();
  const access = canViewResource({
    status: item.status,
    authorId: item.authorId,
    currentUser: session,
  });

  const isAuthor = access.isOwner;
  const isAdmin = access.isAdmin;

  // 状态访问控制
  const isApproved = item.status === "APPROVED";
  const isPending = item.status === "PENDING";
  const isRejected = item.status === "REJECTED";
  const isOffline = item.status === "OFFLINE";
  const isSold = item.status === "SOLD";
  const isResolved = item.status === "RESOLVED";
  const isExpired =
    item.status === "EXPIRED" ||
    (item.expiresAt && new Date(item.expiresAt) < new Date());

  // 如果非公开状态且不能预览，则展示友好未公开/待审核页面
  if (!access.canView && !isSold && !isResolved && !isExpired) {
    return (
      <VisitorPendingCard
        moduleName="分类便民信息"
        channelUrl="/info"
        channelName="分类便民频道"
        status={access.normalizedStatus}
      />
    );
  }

  // 浏览量自增
  prisma.listing
    .update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    })
    .catch((err) => console.error("Increment views failed:", err));

  const isTop = item.isTop;
  const catBadge = getCategoryBadge(item.category);
  const typeBadge = getItemTypeBadge(item.category, item.itemType);
  const isCarpool =
    item.category.includes("拼车") ||
    item.category.includes("顺风车") ||
    Boolean(item.fromPlace || item.toPlace);

  // 解析扩展参数
  const extra = typeof item.extraData === "object" && item.extraData !== null ? (item.extraData as any) : {};

  // 推荐同类其他信息
  const relatedListings = await prisma.listing.findMany({
    where: {
      id: { not: item.id },
      status: "APPROVED",
      category: item.category,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ isTop: "desc" }, { isFeatured: "desc" }, { refreshedAt: "desc" }],
    take: 3,
  });

  // 推荐附近同区域便民服务
  const nearbyListings = await prisma.listing.findMany({
    where: {
      id: { not: item.id },
      status: "APPROVED",
      area: item.area || "杨林经开区",
      category: { not: item.category },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ isTop: "desc" }, { isFeatured: "desc" }, { refreshedAt: "desc" }],
    take: 3,
  });

  // 获取发布者真实可信度事实
  const trustFacts = await getProviderTrustFacts(item.authorId);

  // 获取发布者的认证服务商资料
  const provider = item.authorId
    ? await prisma.serviceProvider.findFirst({
        where: { userId: item.authorId, verificationStatus: "APPROVED" },
        select: {
          id: true,
          name: true,
          serviceCategory: true,
          verificationType: true,
          isMember: true,
        },
      })
    : null;

  // 检查是否已解锁联系方式
  let contactUnlocked = false;
  if (session?.id) {
    const purchase = await prisma.contactPurchase.findUnique({
      where: { userId_targetKind_targetId: { userId: session.id, targetKind: "listing", targetId: id } },
    });
    if (purchase) contactUnlocked = true;
    if (!contactUnlocked && (session.role === "ADMIN" || session.role === "admin")) contactUnlocked = true;
    if (!contactUnlocked) {
      const vip = await prisma.userMembership.findFirst({ where: { userId: session.id, status: "ACTIVE" } });
      if (vip) contactUnlocked = true;
    }
    if (!contactUnlocked && item.authorId === session.id) contactUnlocked = true;
  }

  const rawPhone = item.contact || "";
  const maskedPhone = rawPhone ? rawPhone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : "同城面议";

  const rawProductImg = item.images && item.images[0];
  const productShareImg = rawProductImg
    ? rawProductImg.startsWith("http")
      ? rawProductImg
      : `https://iyanglin.com${rawProductImg.startsWith("/") ? "" : "/"}${rawProductImg}`
    : "https://iyanglin.com/share/v2/product.png?v=20260912";

  const productShareTitle = `【${catBadge.name}】${item.title}`;
  const productShareDesc =
    stripHtml(item.body).slice(0, 80) ||
    "杨林生活网同城便民信息与精选好物，点击查看详情与联系发布者。";

  return (
    <main
      className="support-page info-detail-page"
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        paddingBottom: "110px",
      }}
    >
      <WechatShareHiddenImage imageUrl={productShareImg} alt={productShareTitle} />
      <Navbar />
      {access.normalizedStatus !== "APPROVED" && (
        <div style={{ maxWidth: "840px", margin: "0 auto", padding: "0 1rem" }}>
          <ReviewStatusBanner
            status={access.normalizedStatus}
            moduleName="分类便民信息"
            channelUrl="/info"
            channelName="分类便民"
            isOwner={access.isOwner}
            isAdmin={access.isAdmin}
            createdAt={item.createdAt}
            adminReviewUrl="/admin/content?kind=listing"
          />
        </div>
      )}

      {/* 顶部面包屑与标题区 */}
      <section
        style={{
          background: "linear-gradient(135deg, #064E4B 0%, #0B7A75 100%)",
          color: "white",
          padding: "1.75rem 1rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          className="shell"
          style={{
            maxWidth: "840px",
            margin: "0 auto",
          }}
        >
          {/* 返回导航与操作 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <Link
              href="/info"
              style={{
                color: "#fde047",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>← 返回综合信息大厅</span>
            </Link>

            {/* 作者或管理员快捷管理 */}
            {(isAuthor || isAdmin) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <InfoDetailPromoteButton
                  listingId={item.id}
                  listingTitle={item.title}
                  isTop={item.isTop}
                  isFeatured={item.isFeatured}
                />
                <Link
                  href={`/info/${item.id}/edit`}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "14px",
                    fontSize: "12px",
                    fontWeight: "700",
                    textDecoration: "none",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                >
                  ✏️ 编辑信息与管理
                </Link>
              </div>
            )}
          </div>

          {/* 状态徽标行 */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "800",
              }}
            >
              {catBadge.name}
            </span>
            {item.subCategory && (
              <span
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              >
                {item.subCategory}
              </span>
            )}
            <span
              className={typeBadge.className}
              style={{
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              {typeBadge.label}
            </span>
            {isTop && (
              <span
                style={{
                  background: "#f59e0b",
                  color: "#78350f",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "900",
                }}
              >
                🔥 置顶推介
              </span>
            )}
          </div>

          <h1
            style={{
              fontSize: "clamp(20px, 3.5vw, 26px)",
              fontWeight: "900",
              margin: "0 0 10px 0",
              lineHeight: "1.3",
            }}
          >
            {item.title}
          </h1>

          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
              flexWrap: "wrap",
              fontSize: "12.5px",
              opacity: 0.9,
            }}
          >
            <span>📍 {item.area || "杨林本地"}</span>
            <span>📅 {formatPublishTime(item.refreshedAt || item.createdAt)}</span>
            <span>👁️ 浏览 <b>{item.viewsCount + 1}</b> 次</span>
          </div>
        </div>
      </section>

      {/* 主体容器 */}
      <section
        className="shell"
        style={{
          maxWidth: "840px",
          margin: "0 auto",
          padding: "0 1rem",
        }}
      >
        {/* 状态横幅提示 */}
        {isExpired && (
          <div
            style={{
              background: "#fef3c7",
              border: "1px solid #fcd34d",
              color: "#92400e",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13.5px",
              fontWeight: "700",
            }}
          >
            <AlertTriangle size={18} color="#b45309" />
            <span>⚠️ 本条信息已过期，内容仅供参考。若您仍有需求，可发布新信息或查看同类推荐。</span>
          </div>
        )}

        {isSold && (
          <div
            style={{
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              color: "#475569",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13.5px",
              fontWeight: "700",
            }}
          >
            <CheckCircle2 size={18} color="#64748b" />
            <span>📦 本物品已被买家接单并标记为【已售出】，感谢对杨林二手街坊的支持！</span>
          </div>
        )}

        {isResolved && (
          <div
            style={{
              background: "#dcfce7",
              border: "1px solid #86efac",
              color: "#166534",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13.5px",
              fontWeight: "700",
            }}
          >
            <CheckCircle2 size={18} color="#15803d" />
            <span>🎉 本便民需求已由热心街坊协助【圆满解决】！</span>
          </div>
        )}

        {isPending && (
          <div
            style={{
              background: "#e0f2fe",
              border: "1px solid #7dd3fc",
              color: "#0369a1",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13.5px",
              fontWeight: "700",
            }}
          >
            <Clock size={18} color="#0284c7" />
            <span>🕒 本条信息正在审核中（通常5~10分钟），仅作者及平台管理员可见。</span>
          </div>
        )}

        {isRejected && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              color: "#991b1b",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: "13.5px",
            }}
          >
            <AlertCircle size={18} color="#b91c1c" style={{ marginTop: "2px" }} />
            <div>
              <div style={{ fontWeight: "800" }}>❌ 审核未通过驳回说明：</div>
              <div style={{ marginTop: "4px" }}>{item.rejectReason || "发布内容不符合平台真实性规范，请修改后重新提交。"}</div>
              <Link
                href={`/info/${item.id}/edit`}
                style={{
                  display: "inline-block",
                  marginTop: "8px",
                  color: "#991b1b",
                  fontWeight: "800",
                  textDecoration: "underline",
                }}
              >
                点此修改信息重新提交审核 →
              </Link>
            </div>
          </div>
        )}

        {/* 顺风车行程大卡片 */}
        {isCarpool && (item.fromPlace || item.toPlace) && (
          <div
            style={{
              background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
              border: "2px solid #34d399",
              borderRadius: "16px",
              padding: "16px 20px",
              marginBottom: "14px",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  background: "#059669",
                  color: "white",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "900",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Car size={14} />
                <span>同城拼车 · 顺风车行程单</span>
              </span>
              <span style={{ fontSize: "12.5px", color: "#065f46", fontWeight: "700" }}>
                杨林生活网认证路线
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                gap: "12px",
                background: "white",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #a7f3d0",
                marginBottom: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>出发地</div>
                <div style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", marginTop: "2px" }}>
                  {item.fromPlace || "杨林"}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                <span style={{ fontSize: "20px", color: "#059669" }}>➔</span>
                <span style={{ fontSize: "11px", color: "#059669", fontWeight: "700" }}>直达/同城</span>
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>目的地</div>
                <div style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", marginTop: "2px" }}>
                  {item.toPlace || "昆明"}
                </div>
              </div>
            </div>

            {/* 行程细节参数 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px", fontSize: "12.5px" }}>
              {item.departureTime && (
                <div style={{ background: "white", padding: "8px 12px", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
                  <span style={{ color: "#64748b" }}>发车时间：</span>
                  <b style={{ color: "#059669" }}>{item.departureTime}</b>
                </div>
              )}
              {extra.seats && (
                <div style={{ background: "white", padding: "8px 12px", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
                  <span style={{ color: "#64748b" }}>剩余座位：</span>
                  <b style={{ color: "#0f172a" }}>{extra.seats} 位</b>
                </div>
              )}
              {extra.carModel && (
                <div style={{ background: "white", padding: "8px 12px", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
                  <span style={{ color: "#64748b" }}>车型：</span>
                  <b style={{ color: "#0f172a" }}>{extra.carModel}</b>
                </div>
              )}
              {extra.viaRoute && (
                <div style={{ background: "white", padding: "8px 12px", borderRadius: "8px", border: "1px solid #a7f3d0", gridColumn: "1 / -1" }}>
                  <span style={{ color: "#64748b" }}>途径路线：</span>
                  <b style={{ color: "#0f172a" }}>{extra.viaRoute}</b>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 动态专属参数盒子 (非拼车) */}
        {!isCarpool && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Tag size={16} color="#0B7A75" />
              <span>基本信息与分类参数</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", fontSize: "13px" }}>
              <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px" }}>
                <span style={{ color: "#64748b" }}>期望价格：</span>
                <b style={{ color: "#e11d48", fontSize: "15px" }}>
                  {item.price === "面议" ? "面议" : `¥${item.price} ${item.priceUnit || ""}`}
                </b>
              </div>

              <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px" }}>
                <span style={{ color: "#64748b" }}>所在区域：</span>
                <b style={{ color: "#0f172a" }}>{item.area || "杨林本地"}</b>
              </div>

              {item.condition && (
                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px" }}>
                  <span style={{ color: "#64748b" }}>物品成色：</span>
                  <b style={{ color: "#4338ca" }}>{item.condition}</b>
                </div>
              )}

              {extra.negotiable !== undefined && (
                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px" }}>
                  <span style={{ color: "#64748b" }}>能否议价：</span>
                  <b style={{ color: extra.negotiable ? "#10b981" : "#64748b" }}>
                    {extra.negotiable ? "可小刀诚心议价" : "一口价谢绝还价"}
                  </b>
                </div>
              )}

              {extra.isHomeService !== undefined && (
                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px" }}>
                  <span style={{ color: "#64748b" }}>上门服务：</span>
                  <b style={{ color: extra.isHomeService ? "#10b981" : "#64748b" }}>
                    {extra.isHomeService ? "支持上门服务" : "到店服务"}
                  </b>
                </div>
              )}

              {extra.serviceType && (
                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px" }}>
                  <span style={{ color: "#64748b" }}>服务类型：</span>
                  <b style={{ color: "#0f172a" }}>{extra.serviceType}</b>
                </div>
              )}

              {extra.petType && (
                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px" }}>
                  <span style={{ color: "#64748b" }}>宠物类别：</span>
                  <b style={{ color: "#0f172a" }}>{extra.petType} ({extra.petAge || "未知年龄"})</b>
                </div>
              )}

              {extra.subject && (
                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px" }}>
                  <span style={{ color: "#64748b" }}>辅导科目：</span>
                  <b style={{ color: "#0f172a" }}>{extra.subject}</b>
                </div>
              )}

              {extra.urgency && (
                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px" }}>
                  <span style={{ color: "#64748b" }}>紧急程度：</span>
                  <b style={{ color: extra.urgency.includes("紧急") ? "#e11d48" : "#0f172a" }}>
                    {extra.urgency}
                  </b>
                </div>
              )}

              {item.address && (
                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", gridColumn: "1 / -1" }}>
                  <span style={{ color: "#64748b" }}>详细地址：</span>
                  <b style={{ color: "#0f172a" }}>{item.address}</b>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 高清照片画廊 */}
        {item.images && item.images.length > 0 && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
              现场实拍照片 ({item.images.length}张)
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  item.images.length === 1
                    ? "1fr"
                    : item.images.length === 2
                    ? "1fr 1fr"
                    : "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "10px",
              }}
            >
              {item.images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    height: item.images.length === 1 ? "360px" : "240px",
                    background: "#f1f5f9",
                    position: "relative",
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={`${item.title} - 实拍图 ${idx + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    loading="lazy"
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "8px",
                      background: "rgba(0,0,0,0.65)",
                      color: "white",
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontWeight: "700",
                    }}
                  >
                    {idx + 1} / {item.images.length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 详细文字内容 */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
            详细描述说明
          </div>
          <div
            style={{
              fontSize: "15px",
              lineHeight: "1.75",
              color: "#334155",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {item.body}
          </div>
        </div>

        {/* 发布者真实可信度核验卡片 */}
        <PublisherTrustCard trustFacts={trustFacts} providerInfo={provider} />

        {/* 联系方式解密区 (ContactRevealer) */}
        {!isExpired && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
              联系方式与沟通渠道
            </div>

            <ContactRevealer
              targetKind="listing"
              targetId={item.id}
              contact={contactUnlocked ? (item.contact || "") : undefined}
              maskedPhone={maskedPhone}
              unlocked={contactUnlocked}
              isLoggedIn={!!session}
              coinCost={CONTACT_VIEW_COIN_COST}
              redirectUrl={`/info/${item.id}`}
            />

            {item.wechat && (
              <div style={{ marginTop: "12px", fontSize: "13px", color: "#475569" }}>
                微信号：<b style={{ color: "#0B7A75" }}>{item.wechat}</b>
              </div>
            )}
          </div>
        )}

        {/* 收藏、点赞、举报与分享操作 (DetailActions) */}
        <div style={{ marginBottom: "1.5rem" }}>
          <DetailActions
            targetType="LISTING"
            targetId={item.id}
            title={item.title}
            category="综合便民"
            shareText={`【杨林便民】${item.title} - 杨林生活网`}
          />
        </div>

        {/* 推荐同类信息 */}
        {relatedListings.length > 0 && (
          <div style={{ marginTop: "2rem" }}>
            <div style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a", marginBottom: "12px" }}>
              同类别精选推荐
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
              {relatedListings.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/info/${rel.id}`}
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "12px",
                    border: "1px solid #e2e8f0",
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", color: "#0B7A75", fontWeight: "700" }}>
                      {rel.category} · {rel.area || "杨林"}
                    </span>
                    <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>
                      {rel.title}
                    </h3>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "900", color: "#e11d48" }}>
                      {rel.price === "面议" ? "面议" : `¥${rel.price}`}
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>查看详情 →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 推荐附近同区域便民服务 */}
        {nearbyListings.length > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <div style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={16} color="#0B7A75" />
              <span>附近同区域其他便民服务 ({item.area || "杨林"})</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
              {nearbyListings.map((near) => (
                <Link
                  key={near.id}
                  href={`/info/${near.id}`}
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "12px",
                    border: "1px solid #e2e8f0",
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", color: "#0B7A75", fontWeight: "700" }}>
                      {near.category} · {near.area || "杨林"}
                    </span>
                    <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>
                      {near.title}
                    </h3>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "900", color: "#e11d48" }}>
                      {near.price === "面议" ? "面议" : `¥${near.price}`}
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>查看详情 →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 手机端悬浮吸底操作条 */}
      <InfoStickyContactBar
        rawPhone={rawPhone}
        wechat={item.wechat}
        isExpired={!!isExpired}
      />

      <style>{`
        .mobile-detail-sticky-bar {
          display: none;
        }

        @media (max-width: 768px) {
          .info-detail-page {
            padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .mobile-detail-sticky-bar {
            display: flex !important;
            align-items: center;
            justifyContent: space-between;
            gap: 10px;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            padding: 10px 16px calc(12px + env(safe-area-inset-bottom, 0px));
            border-top: 1px solid #e2e8f0;
            box-shadow: 0 -4px 16px rgba(0,0,0,0.06);
            z-index: 99;
          }
          .sticky-btn {
            flex: 1;
            display: inline-flex;
            align-items: center;
            justifyContent: center;
            gap: 6px;
            padding: 12px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 800;
            text-decoration: none;
            border: none;
            cursor: pointer;
          }
          .sticky-btn.phone {
            background: #0B7A75;
            color: white;
          }
          .sticky-btn.wechat {
            background: #10b981;
            color: white;
          }
          .sticky-btn.disabled {
            background: #cbd5e1;
            color: #64748b;
            cursor: not-allowed;
          }
        }
      `}</style>
    </main>
  );
}
