import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { listDatingProfiles } from "@/lib/love-store";
import { getImageUrl } from "@/lib/image-url";
import { cleanText } from "@/lib/strip-html";
import Pagination from "@/components/Pagination";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

export const metadata: Metadata = {
  title: "杨林单身相亲交友 - 大学城青年与本地单身男女",
  description: "杨林生活网相亲大厅，汇聚杨林镇、杨林大学城与经开区真实本地嘉宾资料。",
  keywords: ["杨林相亲", "杨林交友", "杨林大学城脱单", "嵩明单身男女", "本地生活"],
  openGraph: {
    title: "杨林单身相亲交友 - 嵩明杨林真实交友大厅",
    description: "寻找有缘的另一半，真实身份认证与择偶需求匹配。",
    url: "https://iyanglin.com/love",
  },
  alternates: {
    canonical: "https://iyanglin.com/love",
  },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ gender?: string; q?: string; page?: string }>;
};

const currentYear = new Date().getFullYear();

export default async function DatingListPage({ searchParams }: PageProps) {
  const { gender, q, page } = await searchParams;
  const currentGender = gender || "all";
  const searchQuery = q || "";
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const pageSize = 16;

  const allProfiles = await listDatingProfiles({
    gender: currentGender !== "all" ? currentGender : undefined,
    status: "approved",
    search: searchQuery || undefined,
  });

  const totalItems = allProfiles.length;
  const paginatedProfiles = allProfiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const buildUrl = (targetPage: number) => {
    const p = new URLSearchParams();
    if (gender && gender !== "all") p.set("gender", gender);
    if (q) p.set("q", q);
    if (targetPage > 1) p.set("page", String(targetPage));
    return `/love?${p.toString()}`;
  };


  return (
    <main className="page-layout support-page love-channel" style={{ background: "#f8fafc" }}>
      <Navbar />

      {/* Hero Banner */}
      <section className="hero-compact" style={{ background: "linear-gradient(135deg, #0b7a75 0%, #075e5a 100%)", color: "#ffffff", padding: "28px 0 24px" }}>
        <div className="shell">
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "9999px", background: "rgba(255, 255, 255, 0.15)", fontSize: "12px", fontWeight: "600", color: "#d9f7f0", marginBottom: "10px" }}>
            <span>💕 真实本地嘉客人认证 · 大学城与本地精英专区</span>
          </div>
          <div className="hero-header" style={{ flexWrap: "wrap", gap: "12px" }}>
            <div className="hero-title-group">
              <h1 style={{ color: "#ffffff", fontSize: "26px", margin: "0 0 4px" }}>杨林优质单身男女</h1>
              <p style={{ color: "#d9f7f0", fontSize: "14px" }}>寻找有缘的另一半，杨林大学城教师、企业精英与本地单身青年大厅</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Link href="/love/new" className="button button-primary" style={{ background: "#f59e0b", color: "#0f172a", fontWeight: "700", border: "none" }}>
                + 免费登记交友资料
              </Link>
            </div>
          </div>

          <form className="search-box-compact" action="/love" style={{ marginTop: "14px", background: "#ffffff", maxWidth: "100%" }}>
            <input aria-label="搜索" name="q" defaultValue={searchQuery} placeholder="搜索昵称、职业、学历或心仪条件..." style={{ color: "#0f172a", fontSize: "14px" }} />
            {currentGender !== "all" && <input type="hidden" name="gender" value={currentGender} />}
            <button className="button button-primary" type="submit" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>搜索嘉宾</button>
          </form>
        </div>
      </section>

      {/* 相亲频道广告位 */}
      <AdBanner placementKey="LISTING_TOP" maxItems={1} hidePlaceholder />

      <div className="shell content-shell" style={{ marginTop: "1.5rem", paddingBottom: "4rem", width: "100%", maxWidth: "1240px", boxSizing: "border-box" }}>
        
        {/* Filter Tabs */}
        <div style={{ background: "white", padding: "1rem 1.25rem", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="no-scrollbar" style={{ display: "flex", gap: "8px", overflowX: "auto", whiteSpace: "nowrap", paddingBottom: "2px" }}>
            <Link
              href="/love"
              style={{
                padding: "6px 18px",
                borderRadius: "9999px",
                background: currentGender === "all" ? "var(--brand)" : "#f1f5f9",
                color: currentGender === "all" ? "white" : "var(--ink-secondary)",
                textDecoration: "none",
                fontWeight: currentGender === "all" ? "bold" : "normal",
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              全部嘉宾
            </Link>
            <Link
              href={`/love?gender=female${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
              style={{
                padding: "6px 18px",
                borderRadius: "9999px",
                background: currentGender === "female" ? "#ec4899" : "#f1f5f9",
                color: currentGender === "female" ? "white" : "var(--ink-secondary)",
                textDecoration: "none",
                fontWeight: currentGender === "female" ? "bold" : "normal",
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              👩 女嘉宾
            </Link>
            <Link
              href={`/love?gender=male${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
              style={{
                padding: "6px 18px",
                borderRadius: "9999px",
                background: currentGender === "male" ? "#3b82f6" : "#f1f5f9",
                color: currentGender === "male" ? "white" : "var(--ink-secondary)",
                textDecoration: "none",
                fontWeight: currentGender === "male" ? "bold" : "normal",
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              👨 男嘉宾
            </Link>
          </div>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>找到 {totalItems} 位对应嘉宾</span>
        </div>

        {/* Profile Grid */}
        {paginatedProfiles.length === 0 ? (
          <div className="op-empty-card" style={{ gridColumn: "1 / -1" }}>
            <h4>暂无符合条件的嘉宾资料</h4>
            <p>当前筛选条件下未找到相关嘉宾，欢迎率先登记成为首批嘉宾！</p>
            <Link href="/love/new" className="button button-primary">+ 免费登记交友资料</Link>
          </div>
        ) : (
          <div className="content-grid-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {paginatedProfiles.map((p) => {
              const age = currentYear - (p.birthYear || 1996);
              const rawPhoto = p.photos && p.photos.length > 0 ? p.photos[0] : null;
              const photoUrl = getImageUrl(rawPhoto);
              const cleanNickname = cleanText(p.nickname);
              const isFemale = p.gender === "female";

              const formattedOccupation = formatOccupation(p.occupation);
              const formattedIntro = formatIntro(p.intro, p.nickname);

              return (
                <Link
                  key={p.id}
                  href={`/love/${p.id}`}
                  className="modern-card glass-card-hover"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    overflow: "hidden",
                    border: "1px solid rgba(0,0,0,0.06)",
                    background: "#ffffff",
                    borderRadius: "16px",
                  }}
                >
                  <div>
                    {photoUrl ? (
                      <div style={{ width: "100%", height: "220px", overflow: "hidden", background: "#fdf2f8", borderRadius: "10px", marginBottom: "12px", position: "relative" }}>
                        <img src={photoUrl} alt={cleanNickname} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(4px)", transform: "scale(1.08)" }} />
                        <span
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            background: isFemale ? "linear-gradient(135deg, #ec4899, #db2777)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                            color: "white",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          }}
                        >
                          {isFemale ? "🌸 女嘉宾" : "👔 男嘉宾"} · {age}岁
                        </span>

                        <span
                          style={{
                            position: "absolute",
                            bottom: "8px",
                            right: "8px",
                            background: "rgba(15, 23, 42, 0.75)",
                            backdropFilter: "blur(4px)",
                            color: "white",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "10.5px",
                            fontWeight: "bold",
                          }}
                        >
                          🔒 隐私写真
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "220px",
                          borderRadius: "10px",
                          marginBottom: "12px",
                          background: isFemale ? "linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%)" : "linear-gradient(135deg, #bfdbfe 0%, #60a5fa 100%)",
                          color: "white",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "16px",
                          textAlign: "center",
                          boxSizing: "border-box",
                          position: "relative",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            background: "rgba(0,0,0,0.25)",
                            color: "white",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "bold",
                          }}
                        >
                          {isFemale ? "女嘉宾" : "男嘉宾"} · {age}岁
                        </span>
                        <span style={{ fontSize: "42px", marginBottom: "4px" }}>{isFemale ? "👩‍🦰" : "👨‍💼"}</span>
                        <span style={{ fontSize: "16px", fontWeight: "800", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>{cleanNickname}</span>
                        <span style={{ fontSize: "11.5px", opacity: 0.9, marginTop: "4px" }}>{formattedOccupation}</span>
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
                      <h3 className="modern-card-title" style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>{cleanNickname}</h3>
                      <span className={isFemale ? "badge-pink" : "badge-blue"} style={{ flexShrink: 0, fontSize: "11px" }}>
                        {p.maritalStatus || "未婚"}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                      <span className="badge-gray" style={{ fontSize: "11px" }}>📏 {p.heightCm || 165}cm</span>
                      <span className="badge-gray" style={{ fontSize: "11px" }}>🎓 {cleanText(p.education) || "本科"}</span>
                      <span className="badge-gray" style={{ fontSize: "11px" }}>💼 {formattedOccupation}</span>
                    </div>

                    <p className="modern-card-desc" style={{ fontSize: "12.5px", color: "var(--muted)", marginBottom: "12px", WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      💬 {formattedIntro}
                    </p>
                  </div>

                  <div className="modern-card-meta" style={{ paddingTop: "10px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>💰 {p.income || "面议"}</span>
                    <span className="button button-small button-secondary" style={{ fontSize: "12px" }}>💖 查看TA的资料</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* 分页组件 */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          buildUrl={buildUrl}
        />

      </div>
    </main>
  );
}

function formatOccupation(occ?: string | null) {
  if (!occ) return "企事业单位/文职";
  const cleaned = occ.replace(/["'\\]/g, "").trim();
  if (cleaned === "0" || cleaned === "职业代码 0" || cleaned === "职业代码0") return "企事业单位/文职";
  if (cleaned === "1" || cleaned === "职业代码 1" || cleaned === "职业代码1") return "教育培训/高校教师";
  if (cleaned === "2" || cleaned === "职业代码 2" || cleaned === "职业代码2") return "医疗卫生/医护工作";
  if (cleaned === "3" || cleaned === "职业代码 3" || cleaned === "职业代码3") return "企业白领/金融财务";
  if (cleaned === "4" || cleaned === "职业代码 4" || cleaned === "职业代码4") return "IT互联网/技术研发";
  if (cleaned === "5" || cleaned === "职业代码 5" || cleaned === "职业代码5") return "经商/自主创业";
  return cleaned;
}

function formatIntro(intro?: string | null, nickname?: string) {
  if (!intro) return "诚意交友，期待遇见三观相合、真诚踏实的TA。";
  const cleaned = intro.replace(/["'\\]/g, "").trim();
  if (cleaned.includes("的相亲资料") || cleaned.length < 4) {
    return "诚意交友，期待寻找一位性格温和、共同奋斗的另一半。";
  }
  return cleaned;
}
