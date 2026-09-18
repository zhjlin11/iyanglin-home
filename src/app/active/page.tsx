import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { listEvents } from "@/lib/event-store";
import {
  parseActivityBody,
  formatActivityDateRange,
  formatActivityLocation,
  calculateEventStatus,
} from "@/lib/activity-parser";
import CategoryFilterGrid from "@/components/CategoryFilterGrid";
import EventPlaceholderCover from "@/components/EventPlaceholderCover";
import AdBanner from "@/components/AdBanner";

export const metadata: Metadata = {
  title: "杨林同城活动平台 - 户外露营 | 电竞交流 | 聚会交友",
  description: "杨林生活网同城活动频道，提供杨林大学城与镇上周末聚会、精致露营、桌游比赛与沙龙交流活动。",
  keywords: ["杨林活动", "杨林同城聚会", "杨林大学城活动", "嵩明组队", "本地生活"],
  openGraph: {
    title: "杨林同城活动平台 - 嵩明杨林同城生活圈",
    description: "探索丰富同城活动，一键在线报名参与。",
    url: "https://iyanglin.com/active",
  },
  alternates: {
    canonical: "https://iyanglin.com/active",
  },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ category?: string; q?: string; area?: string; fee?: string }>;
};

const allCategories: Record<string, string> = {
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

export default async function EventListPage({ searchParams }: PageProps) {
  const { category, q, area, fee } = await searchParams;
  const currentCategory = category || "all";
  const searchQuery = q || "";
  const areaFilter = area || "all";
  const feeFilter = fee || "all";

  const rawEvents = await listEvents({
    category: currentCategory !== "all" ? currentCategory : undefined,
    status: "approved",
    search: searchQuery || undefined,
  });

  const events = rawEvents
    .map((ev) => {
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
      const locInfo = formatActivityLocation(undefined, parsed.location || ev.location);
      const formattedDate = formatActivityDateRange(parsed.startTime || ev.eventTime, parsed.endTime);

      return {
        ...ev,
        parsed,
        signupCount,
        statusInfo,
        locInfo,
        formattedDate,
      };
    })
    .filter((item) => {
      // Area filter
      if (areaFilter !== "all") {
        const loc = item.locInfo.listText.toLowerCase();
        if (areaFilter === "yanglin" && !loc.includes("杨林镇")) return false;
        if (areaFilter === "jingkai" && !loc.includes("经开区")) return false;
        if (areaFilter === "daxuecheng" && !loc.includes("大学城")) return false;
        if (areaFilter === "songming" && !loc.includes("嵩明")) return false;
      }

      // Fee filter
      if (feeFilter !== "all") {
        const feeStr = (item.parsed.feeType || item.fee || "").toLowerCase();
        if (feeFilter === "free" && !feeStr.includes("免费") && feeStr !== "0") return false;
        if (feeFilter === "aa" && !feeStr.includes("aa")) return false;
        if (feeFilter === "paid" && (feeStr.includes("免费") || feeStr === "0")) return false;
      }

      return true;
    });

  return (
    <main className="page-layout support-page active-channel" style={{ background: "#f8fafc" }}>
      <Navbar />

      {/* Compressed Hero Section for Mobile */}
      <div style={{ background: "linear-gradient(135deg, #0B7A75, #149990)", padding: "2.5rem 1rem", textAlign: "center", color: "white" }}>
        <h1 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: "bold", marginBottom: "0.5rem" }}>杨林同城活动</h1>
        <p style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "1.5rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          徒步、露营、聚会、读书与电竞丰富多样
        </p>

        <form action="/active" method="GET" style={{ maxWidth: "540px", margin: "0 auto", display: "flex", background: "white", padding: "3px", borderRadius: "30px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}>
          {currentCategory !== "all" && <input type="hidden" name="category" value={currentCategory} />}
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="搜索活动名称、地点或组织者..."
            style={{ flex: 1, height: "44px", padding: "0 1rem", border: "none", outline: "none", fontSize: "14px", borderRadius: "30px", minWidth: 0 }}
          />
          <button type="submit" className="button button-primary" style={{ borderRadius: "24px", minHeight: "44px", padding: "0 1.25rem", fontSize: "14px", background: "#0B7A75", borderColor: "#0B7A75", whiteSpace: "nowrap" }}>
            搜索
          </button>
        </form>
      </div>

      {/* 活动频道广告位 */}
      <AdBanner placementKey="LISTING_TOP" maxItems={1} hidePlaceholder />

      <div className="shell content-shell" style={{ marginTop: "-1.25rem", paddingBottom: "4rem", width: "100%", maxWidth: "1240px", boxSizing: "border-box" }}>

        {/* Responsive 4-column Category Filter Grid */}
        <CategoryFilterGrid currentCategory={currentCategory} />

        {/* Multi-Dimensional Filter Bar with Horizontal Scroll */}
        <div style={{ background: "white", padding: "1rem", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
          
          {/* Area Filter Row */}
          <div className="no-scrollbar" style={{ display: "flex", alignItems: "center", gap: "10px", overflowX: "auto", whiteSpace: "nowrap", paddingBottom: "2px" }}>
            <span style={{ color: "var(--text-muted)", fontWeight: "bold", flexShrink: 0 }}>举办区域:</span>
            {[
              { key: "all", label: "全部" },
              { key: "daxuecheng", label: "大学城" },
              { key: "yanglin", label: "杨林镇" },
              { key: "jingkai", label: "经开区" },
              { key: "songming", label: "嵩明周边" },
            ].map((item) => (
              <a
                key={item.key}
                href={`/active?category=${currentCategory}&area=${item.key}&fee=${feeFilter}`}
                style={{
                  padding: "3px 10px",
                  borderRadius: "6px",
                  background: areaFilter === item.key ? "#0B7A75" : "transparent",
                  color: areaFilter === item.key ? "white" : "#334155",
                  textDecoration: "none",
                  fontWeight: areaFilter === item.key ? "bold" : "normal",
                  flexShrink: 0,
                }}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Fee Filter Row */}
          <div className="no-scrollbar" style={{ display: "flex", alignItems: "center", gap: "10px", overflowX: "auto", whiteSpace: "nowrap", paddingBottom: "2px" }}>
            <span style={{ color: "var(--text-muted)", fontWeight: "bold", flexShrink: 0 }}>活动费用:</span>
            {[
              { key: "all", label: "全部" },
              { key: "free", label: "免费" },
              { key: "aa", label: "AA制" },
              { key: "paid", label: "收费" },
            ].map((item) => (
              <a
                key={item.key}
                href={`/active?category=${currentCategory}&area=${areaFilter}&fee=${item.key}`}
                style={{
                  padding: "3px 10px",
                  borderRadius: "6px",
                  background: feeFilter === item.key ? "#0B7A75" : "transparent",
                  color: feeFilter === item.key ? "white" : "#334155",
                  textDecoration: "none",
                  fontWeight: feeFilter === item.key ? "bold" : "normal",
                  flexShrink: 0,
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Section Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>
            {searchQuery ? `搜索 ("${searchQuery}")` : "最新活动招募"}
          </h2>
          <a href="/active/new" className="button button-primary" style={{ textDecoration: "none", padding: "0.4rem 1rem", borderRadius: "20px", background: "#0B7A75", borderColor: "#0B7A75", fontSize: "13px", whiteSpace: "nowrap" }}>
            + 发起活动
          </a>
        </div>

        {/* Event Cards Grid (Single Column on Mobile) */}
        {events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", background: "white", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>暂无匹配的同城活动</p>
            <a href="/active/new" style={{ marginTop: "0.5rem", display: "inline-block", color: "#0B7A75", fontWeight: "bold" }}>成为第一个发起活动的人 →</a>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {events.map((ev) => {
              const coverImg = ev.parsed.coverImage || (ev.images && ev.images.length > 0 ? ev.images[0] : null);

              return (
                <a
                  key={ev.id}
                  href={`/active/${ev.id}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "16px",
                    textDecoration: "none",
                    color: "inherit",
                    background: "white",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    border: "1px solid #F3F4F6",
                    width: "100%",
                  }}
                >
                  <div style={{ width: "100%", height: "160px", background: "#F1F5F9", position: "relative", overflow: "hidden" }}>
                    {coverImg ? (
                      <img src={coverImg} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <EventPlaceholderCover title={ev.title} category={ev.category} height={160} />
                    )}

                    <span
                      style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        background: "rgba(0,0,0,0.65)",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {allCategories[ev.category] || ev.parsed.activityType || "同城活动"}
                    </span>

                    <span
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: ev.statusInfo.badgeColor || "#16A67A",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                      }}
                    >
                      {ev.statusInfo.statusText || "报名中"}
                    </span>
                  </div>

                  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
                    <div>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "900", lineHeight: "1.4", color: "#1F2937", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {ev.title}
                      </h3>
                      <div style={{ fontSize: "12.5px", color: "#6B7280", margin: "4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>📅</span>
                        <span>{ev.formattedDate}</span>
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#6B7280", margin: "4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>📍</span>
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.locInfo.listText}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "12px", color: "#6B7280" }}>
                        已报名 <b style={{ color: "#16A67A", fontSize: "14px" }}>{ev.signupCount}</b> 人 / 上限 {ev.parsed.quota || ev.quota || "不限"}
                      </div>
                      <span
                        style={{
                          background: "#EAF8F3",
                          color: "#16A67A",
                          padding: "4px 12px",
                          borderRadius: "16px",
                          fontSize: "12px",
                          fontWeight: "800",
                        }}
                      >
                        立即报名 →
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
