import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getEvent } from "@/lib/event-store";
import {
  parseActivityBody,
  formatActivityDateTime,
  formatActivityLocation,
  calculateEventStatus,
} from "@/lib/activity-parser";
import DetailActions from "@/components/DetailActions";
import EventSignupSection from "@/components/EventSignupSection";
import EventGallery from "@/components/EventGallery";
import WechatShareHiddenImage from "@/components/WechatShareHiddenImage";
import type { Metadata, ResolvingMetadata } from "next";
import { getSession } from "@/lib/auth";
import { canViewResource } from "@/lib/resource-access";
import ReviewStatusBanner, { VisitorPendingCard } from "@/components/common/ReviewStatusBanner";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const categoryLabels: Record<string, string> = {
  outdoor: "户外拓展",
  sport: "体育运动",
  party: "同城聚餐",
  family: "亲子活动",
  training: "技能培训",
  charity: "公益爱心",
  jobfair: "招聘双选",
  camping: "精致露营",
  hiking: "徒步登山",
  cycling: "骑行车友",
  reading: "读书沙龙",
  show: "演出音乐",
  exhibit: "艺术展览",
  salon: "创业交流",
  esports: "电竞比赛",
  photo: "摄影采风",
};

// SEO generateMetadata
export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const ev = await getEvent(id);

  if (!ev || ev.status !== "approved") {
    return { title: "同城活动未找到 | 杨林生活网" };
  }

  const parsed = parseActivityBody(ev.intro);
  const catLabel = categoryLabels[ev.category] || parsed.activityType || "活动";
  const locInfo = formatActivityLocation(undefined, parsed.location || ev.location);

  return {
    title: `${ev.title} - 杨林${catLabel} | 杨林生活网`,
    description: `举办地点：${locInfo.listText}。${parsed.intro.slice(0, 80).replace(/\n/g, "")}...`,
    keywords: `${ev.title}, 杨林${catLabel}, 杨林同城活动, 杨林社团, 杨林周末去哪儿`,
    openGraph: {
      title: `${ev.title} - 杨林同城活动`,
      description: parsed.intro.slice(0, 100),
      images: [
        {
          url: (ev.images && ev.images[0]) || "https://iyanglin.com/share/v2/default.png?v=20260912",
          width: 600,
          height: 600,
        },
      ],
    },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ev = await getEvent(id);

  if (!ev) {
    notFound();
  }

  const session = await getSession();
  const access = canViewResource({
    status: ev.status,
    authorId: ev.authorId,
    currentUser: session,
  });

  if (!access.canView) {
    return (
      <VisitorPendingCard
        moduleName="同城活动"
        channelUrl="/active"
        channelName="同城活动专区"
        status={access.normalizedStatus}
      />
    );
  }

  const parsed = parseActivityBody(ev.intro);
  const signupCount = (ev.signups || []).reduce((sum, s) => sum + (s.numPeople || 1), 0);
  const statusInfo = calculateEventStatus(
    parsed.startTime || ev.eventTime,
    parsed.endTime,
    parsed.deadline,
    signupCount,
    parsed.quota || ev.quota,
    parsed.eventStatus
  );

  const formattedTime = formatActivityDateTime(parsed.startTime || ev.eventTime, parsed.endTime);
  const locInfo = formatActivityLocation(undefined, parsed.location || ev.location);

  // Gather images
  let allImages = ev.images || [];
  if (parsed.activityImages && parsed.activityImages.length > 0) {
    allImages = Array.from(new Set([...allImages, ...parsed.activityImages]));
  }

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": ev.title,
    "startDate": parsed.startTime || ev.eventTime,
    "endDate": parsed.endTime,
    "eventStatus": parsed.eventStatus === "已取消" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    "location": {
      "@type": "Place",
      "name": locInfo.listText,
      "address": locInfo.listText
    },
    "image": allImages.length > 0 ? [allImages[0]] : [],
    "description": parsed.intro.slice(0, 200),
    "organizer": {
      "@type": "Organization",
      "name": parsed.organizer || ev.contact || "杨林同城活动组委会"
    }
  };

  const rawEvImg = (allImages && allImages[0]) || (ev.images && ev.images[0]);
  const evShareImg = rawEvImg
    ? (rawEvImg.startsWith("http") ? rawEvImg : `https://iyanglin.com${rawEvImg.startsWith("/") ? "" : "/"}${rawEvImg}`)
    : "https://iyanglin.com/share/v2/default.png?v=20260912";
  const evShareTitle = `【同城活动】${ev.title} - 杨林生活网`;
  const evShareDesc = `活动地点：${parsed.location || ev.location || "杨林"}。时间：${parsed.startTime || ev.eventTime || "详见活动介绍"}。立即报名参与同城精彩活动！`;

  return (
    <main className="page-layout support-page active-detail-page" style={{ background: "#f8fafc" }}>
      {/* 微信与社交分享爬虫首图兜底 */}
      <WechatShareHiddenImage imageUrl={evShareImg} alt={evShareTitle} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      {/* 待审核或非公开提示条 */}
      {access.normalizedStatus !== "APPROVED" && (
        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.25rem" }}>
          <ReviewStatusBanner
            status={access.normalizedStatus}
            moduleName="同城活动"
            channelUrl="/active"
            channelName="同城活动"
            isOwner={access.isOwner}
            isAdmin={access.isAdmin}
            createdAt={ev.createdAt}
            adminReviewUrl="/admin/content?kind=event"
          />
        </div>
      )}

      <div className="shell content-shell" style={{ marginTop: "1.5rem", paddingBottom: "4rem", width: "100%", maxWidth: "1240px", boxSizing: "border-box" }}>
        
        <a className="back-link" href="/active" style={{ textDecoration: "none", color: "var(--text-muted)", marginBottom: "1rem", display: "inline-block" }}>
          ← 返回同城活动列表
        </a>

        {/* Top Responsive Gallery */}
        <EventGallery title={ev.title} category={ev.category} images={allImages} />

        {/* Layout Grid: 2-column on desktop (>=1024px), 1-column on mobile (<1024px) */}
        <div className="event-detail-layout">
          
          {/* Main Content Area */}
          <div style={{ minWidth: 0, width: "100%" }}>
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "1rem" }}>
                <h1
                  style={{
                    fontSize: "clamp(20px, 4vw, 26px)",
                    fontWeight: "bold",
                    margin: 0,
                    color: "#1e293b",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    lineHeight: "1.4",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {ev.title}
                </h1>
                <span
                  style={{
                    background: statusInfo.badgeColor,
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {statusInfo.statusText}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "1.25rem", fontSize: "13px" }}>
                <span style={{ background: "#0B7A75", color: "white", padding: "2px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                  {categoryLabels[ev.category] || parsed.activityType || "同城活动"}
                </span>
                <span style={{ color: "var(--text-muted)" }}>|</span>
                <span style={{ color: "var(--text-muted)" }}>
                  组织者：<strong style={{ color: "#334155" }}>{parsed.organizer || ev.contact}</strong> ({parsed.organizerType || "个人发起"})
                </span>
              </div>

              {/* Specs Box */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", color: "#334155", fontSize: "14px", background: "#f8fafc", padding: "1.1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <span style={{ color: "var(--text-muted)", width: "80px", flexShrink: 0 }}>📅 活动时间：</span>
                  <span style={{ flex: 1, fontWeight: "500", color: "#1e293b", wordBreak: "break-word" }}>{formattedTime}</span>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <span style={{ color: "var(--text-muted)", width: "80px", flexShrink: 0 }}>📍 举办地点：</span>
                  <span style={{ flex: 1, fontWeight: "500", wordBreak: "break-word" }}>{locInfo.listText}</span>
                  <a
                    href={`https://uri.amap.com/search?keyword=${encodeURIComponent(ev.title + " " + locInfo.listText)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#0B7A75", textDecoration: "none", fontSize: "12px", background: "#e6f4f1", padding: "3px 10px", borderRadius: "6px", fontWeight: "bold", whiteSpace: "nowrap" }}
                  >
                    🗺️ 地图导航
                  </a>
                </div>

                {parsed.assemblyPoint && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span style={{ color: "var(--text-muted)", width: "80px", flexShrink: 0 }}>🚩 集合地点：</span>
                    <span style={{ flex: 1, wordBreak: "break-word" }}>{parsed.assemblyPoint}</span>
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                  <span style={{ color: "var(--text-muted)", width: "80px", flexShrink: 0 }}>💰 活动费用：</span>
                  <span style={{ flex: 1, color: "#0B7A75", fontWeight: "bold" }}>{parsed.feeType || ev.fee} {parsed.feeDetail ? `(${parsed.feeDetail})` : ""}</span>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <span style={{ color: "var(--text-muted)", width: "80px", flexShrink: 0 }}>👥 人数限制：</span>
                  <span style={{ flex: 1 }}>{parsed.quota || ev.quota} (已报名 {signupCount} 人)</span>
                </div>
              </div>

              {parsed.tags && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed var(--border)" }}>
                  {parsed.tags.split(" ").filter((t) => t.trim()).map((tag, i) => (
                    <span key={i} style={{ fontSize: "12px", color: "#0B7A75", background: "#e6f4f1", padding: "3px 10px", borderRadius: "20px" }}>
                      ✨ {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile-Friendly Signup Component placed in single-column flow */}
            <div className="mobile-signup-wrapper" style={{ marginBottom: "1.5rem" }}>
              <EventSignupSection
                eventId={ev.id}
                eventTitle={ev.title}
                startTime={parsed.startTime || ev.eventTime}
                endTime={parsed.endTime}
                deadline={parsed.deadline}
                quota={parsed.quota || ev.quota}
                eventStatus={parsed.eventStatus}
                signupMethod={parsed.signupMethod}
                contactPhone={parsed.phone || ev.contact}
                wechat={parsed.wechat}
                externalLink={parsed.externalLink}
                initialSignups={ev.signups || []}
              />
            </div>

            {/* Agenda */}
            {parsed.agenda && (
              <div style={{ background: "white", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>⏰ 活动行程与流程</h3>
                <div style={{ fontSize: "15px", lineHeight: "1.8", whiteSpace: "pre-wrap", color: "#334155", wordBreak: "break-word" }}>
                  {parsed.agenda}
                </div>
              </div>
            )}

            {/* Intro */}
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>📝 活动详细说明</h3>
              <div style={{ fontSize: "15px", lineHeight: "1.8", whiteSpace: "pre-wrap", color: "#334155", wordBreak: "break-word" }}>
                {parsed.intro}
              </div>
            </div>

            {/* Suitable For & Notes */}
            {(parsed.suitableFor || parsed.notes) && (
              <div style={{ background: "white", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}>
                {parsed.suitableFor && (
                  <div style={{ marginBottom: "1rem" }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: "bold", color: "#334155", marginBottom: "0.5rem" }}>🎯 适合人群</h4>
                    <p style={{ fontSize: "14px", color: "#475569", margin: 0, wordBreak: "break-word" }}>{parsed.suitableFor}</p>
                  </div>
                )}

                {parsed.notes && (
                  <div>
                    <h4 style={{ fontSize: "1rem", fontWeight: "bold", color: "#e11d48", marginBottom: "0.5rem" }}>⚠️ 注意事项与须知</h4>
                    <p style={{ fontSize: "14px", color: "#be123c", margin: 0, whiteSpace: "pre-wrap", background: "#fef2f2", padding: "0.85rem", borderRadius: "8px", border: "1px solid #fecdd3", wordBreak: "break-word" }}>
                      {parsed.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Anti-fraud Warning Box */}
            <div style={{ padding: "1rem", background: "#fef2f2", color: "#b91c1c", fontSize: "13px", borderRadius: "12px", marginBottom: "1.5rem", border: "1px solid #fecdd3" }}>
              <strong>防骗与安全提示：</strong> 在参与同城活动时，请切勿提前向私人账户支付大额押金。户外活动请注意人身安全并自备个人安全保障保险。
            </div>

            <DetailActions
              resourceType="EVENT"
              resourceId={ev.id}
              title={evShareTitle}
              desc={evShareDesc}
              link={`https://iyanglin.com/active/${ev.id}`}
              imageUrl={evShareImg}
            />
          </div>

          {/* Desktop Right Sidebar Form (Shown only >= 1024px) */}
          <div className="desktop-signup-sidebar">
            <EventSignupSection
              eventId={ev.id}
              eventTitle={ev.title}
              startTime={parsed.startTime || ev.eventTime}
              endTime={parsed.endTime}
              deadline={parsed.deadline}
              quota={parsed.quota || ev.quota}
              eventStatus={parsed.eventStatus}
              signupMethod={parsed.signupMethod}
              contactPhone={parsed.phone || ev.contact}
              wechat={parsed.wechat}
              externalLink={parsed.externalLink}
              initialSignups={ev.signups || []}
            />
          </div>

        </div>
      </div>

      {/* 底部固定吸底操作栏 (收藏 ｜ 咨询 ｜ 立即报名 - 移动端专属，PC端隐藏) */}
      <div
        className="mobile-sticky-action-bar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid #E5E7EB",
          padding: "10px 16px",
          paddingBottom: "max(10px, env(safe-area-inset-bottom))",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          zIndex: 999,
          boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <button
          type="button"
          aria-label="收藏活动"
          style={{
            width: "48px",
            height: "44px",
            background: "#F3F4F6",
            border: "none",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            color: "#6B7280",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <span>🤍</span>
          <span style={{ fontSize: "9px", marginTop: "1px" }}>收藏</span>
        </button>

        <a
          href={`tel:${parsed.phone || ev.contact || "18006778483"}`}
          style={{
            width: "48px",
            height: "44px",
            background: "#EAF8F3",
            border: "none",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            color: "#16A67A",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <span>📞</span>
          <span style={{ fontSize: "9px", marginTop: "1px" }}>咨询</span>
        </a>

        <a
          href="#signup-form"
          style={{
            flex: 1,
            background: "#16A67A",
            color: "#ffffff",
            textAlign: "center",
            padding: "12px 0",
            borderRadius: "12px",
            fontWeight: "800",
            fontSize: "14.5px",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            boxShadow: "0 4px 12px rgba(22, 166, 122, 0.25)",
          }}
        >
          <span>🎉</span>
          <span>立即报名参与 ({signupCount}人已报)</span>
        </a>
      </div>
    </main>
  );
}
