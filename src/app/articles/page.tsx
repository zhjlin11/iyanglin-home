import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { getImageUrl } from "@/lib/image-url";
import AdBanner from "@/components/AdBanner";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const categoryLabels: Record<string, string> = {
  recommend: "🔥 推荐热点",
  yanglin: "🏛️ 杨林本地",
  songming: "🌲 嵩明周边",
  minsheng: "🏡 民生服务",
  traffic: "🚗 交通出行",
  education: "🎓 教育动态",
  business: "💼 商业经济",
};

export default async function ArticlesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = (params.category as string) || "all";
  const query = (params.q as string) || "";

  const whereClause: any = {
    status: "APPROVED",
  };

  if (category && category !== "all") {
    whereClause.category = category;
  }

  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { body: { contains: query, mode: "insensitive" } },
    ];
  }

  const articles = await prisma.article.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      category: true,
      images: true,
      createdAt: true,
      status: true,
    },
  });

  const heroArticle = articles.length > 0 ? articles[0] : null;
  const listArticles = articles.length > 1 ? articles.slice(1) : [];

  const formatDate = (dateStr: any) => {
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    } catch {
      return "今天";
    }
  };

  const querySuffix = query ? `&q=${encodeURIComponent(query)}` : "";

  return (
    <div className="support-page news-channel" style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <Navbar />

      {/* 顶部现代化大气质感 Banner */}
      <section
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F766E 100%)",
          color: "white",
          padding: "32px 0 28px 0",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(52, 211, 153, 0.2)",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#34D399",
                  marginBottom: "8px",
                }}
              >
                <span>📰</span> 官方资讯 · 实时更新
              </div>
              <h1 style={{ fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: "900", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
                杨林今天发生了什么？
              </h1>
              <p style={{ color: "#cbd5e1", fontSize: "14px", margin: 0, maxWidth: "600px", lineHeight: "1.5" }}>
                杨林镇、大学城与经开区民生热点、交通教育与本地新鲜事
              </p>
            </div>

            <div className="desktop-only" style={{ width: "360px" }}>
              <form action="/articles" style={{ display: "flex", gap: "8px" }}>
                <div
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.95)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 12px",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "15px" }}>🔍</span>
                  <input
                    type="text"
                    name="q"
                    defaultValue={query}
                    placeholder="搜杨林身边事 / 政策 / 交通..."
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: "13.5px",
                      width: "100%",
                      color: "#1F2937",
                    }}
                  />
                </div>
                {category !== "all" && <input type="hidden" name="category" value={category} />}
                <button
                  type="submit"
                  style={{
                    background: "#16A67A",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    fontSize: "13.5px",
                    fontWeight: "800",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  搜索
                </button>
              </form>
            </div>
          </div>

          {/* 移动端搜索 */}
          <div className="mobile-only" style={{ marginTop: "14px" }}>
            <form action="/articles" style={{ display: "flex", gap: "8px" }}>
              <div
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 12px",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "15px" }}>🔍</span>
                <input
                  type="text"
                  name="q"
                  defaultValue={params.q || ""}
                  placeholder="搜杨林身边事 / 政策 / 交通..."
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "13.5px",
                    width: "100%",
                    color: "#1F2937",
                  }}
                />
              </div>
              {category !== "all" && <input type="hidden" name="category" value={category} />}
              <button
                type="submit"
                style={{
                  background: "#16A67A",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13.5px",
                  fontWeight: "800",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                搜索
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 资讯频道广告位 */}
      <AdBanner placementKey="LISTING_TOP" maxItems={2} hidePlaceholder />

      {/* 分类 Tab: 推荐 ｜ 杨林 ｜ 嵩明 ｜ 民生 ｜ 交通 ｜ 教育 ｜ 商业 */}
      <section style={{ maxWidth: "1240px", margin: "14px auto 0 auto", padding: "0 1.25rem" }}>
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            padding: "10px 14px",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            scrollbarWidth: "none",
          }}
        >
          {[
            { key: "all", label: "全部资讯" },
            { key: "recommend", label: "🔥 推荐热点" },
            { key: "yanglin", label: "🏛️ 杨林本地" },
            { key: "songming", label: "🌲 嵩明周边" },
            { key: "minsheng", label: "🏡 民生服务" },
            { key: "traffic", label: "🚗 交通出行" },
            { key: "education", label: "🎓 教育动态" },
            { key: "business", label: "💼 商业经济" },
          ].map((tab) => {
            const active = category === tab.key;
            return (
              <a
                key={tab.key}
                href={tab.key === "all" ? `/articles${query ? `?q=${encodeURIComponent(query)}` : ""}` : `/articles?category=${tab.key}${querySuffix}`}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  background: active ? "#16A67A" : "#F8FAFC",
                  color: active ? "#ffffff" : "#4B5563",
                  fontSize: "13px",
                  fontWeight: active ? "800" : "600",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  boxShadow: active ? "0 2px 8px rgba(22, 166, 122, 0.3)" : "none",
                  border: active ? "none" : "1px solid #E5E7EB",
                }}
              >
                {tab.label}
              </a>
            );
          })}
        </div>
      </section>

      {/* 资讯主体流：PC 1240px 双栏 + 移动端单列流 */}
      <section style={{ maxWidth: "1240px", margin: "14px auto 4rem auto", padding: "0 1.25rem" }}>
        <div className="pc-layout-split" style={{ display: "grid", gap: "1.5rem", alignItems: "start" }}>
          
          {/* 左侧：资讯列表 */}
          <div style={{ minWidth: 0 }}>
            {/* 1. 首条置顶大图新闻 (Hero News Card) */}
            {heroArticle && (
              <a
                href={`/articles/${heroArticle.id}`}
                style={{
                  display: "block",
                  background: "#ffffff",
                  borderRadius: "16px",
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid #F3F4F6",
                  marginBottom: "14px",
                }}
              >
                <div style={{ width: "100%", height: "200px", background: "#E2E8F0", position: "relative" }}>
                  {heroArticle.images && heroArticle.images[0] ? (
                    <img src={getImageUrl(heroArticle.images[0]) || ""} alt={heroArticle.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", background: "#EEF2F6" }}>
                      📰
                    </div>
                  )}
                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: "800",
                      padding: "3px 10px",
                      borderRadius: "12px",
                      boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4)",
                    }}
                  >
                    🔥 头条热点
                  </span>
                </div>

                <div style={{ padding: "16px" }}>
                  <h2 style={{ fontSize: "17px", fontWeight: "900", color: "#1F2937", margin: "0 0 8px 0", lineHeight: "1.4" }}>
                    {heroArticle.title}
                  </h2>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#6B7280" }}>
                    <span>{categoryLabels[heroArticle.category || ""] || "本地生活"} · 杨林生活网</span>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span>👁️ 890</span>
                      <span>💬 12</span>
                    </div>
                  </div>
                </div>
              </a>
            )}

            {/* 2. 小图资讯信息流列表 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {listArticles.map((article) => {
                const coverImg = article.images && article.images[0] ? getImageUrl(article.images[0]) : null;
                return (
                  <a
                    key={article.id}
                    href={`/articles/${article.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      background: "#ffffff",
                      borderRadius: "14px",
                      padding: "14px 16px",
                      textDecoration: "none",
                      color: "inherit",
                      border: "1px solid #F3F4F6",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "72px" }}>
                      <h3
                        style={{
                          fontSize: "14.5px",
                          fontWeight: "800",
                          color: "#1F2937",
                          margin: 0,
                          lineHeight: "1.4",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {article.title}
                      </h3>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", color: "#9CA3AF" }}>
                        <span>{categoryLabels[article.category || ""] || "本地资讯"} · {formatDate(article.createdAt)}</span>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span>👁️ 320</span>
                          <span>💬 4</span>
                        </div>
                      </div>
                    </div>

                    {coverImg ? (
                      <div style={{ width: "96px", height: "72px", borderRadius: "10px", overflow: "hidden", background: "#F3F4F6", flexShrink: 0 }}>
                        <img src={coverImg} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ) : null}
                  </a>
                );
              })}
            </div>
          </div>

          {/* 右侧：PC 专属侧边栏 (热搜关注 / 官方公告) */}
          <div className="pc-sidebar" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* 1. 今日热度 TOP 榜 */}
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0F2937", margin: 0 }}>
                  🔥 今日资讯热榜
                </h3>
                <span style={{ fontSize: "11px", color: "#16A67A", fontWeight: "700" }}>24小时速递</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { rank: "1", title: "杨林经开区重点项目开工与用工政策解读" },
                  { rank: "2", title: "嵩明至杨林大学城定制快线运营班次优化" },
                  { rank: "3", title: "杨林现代农业产业园时鲜水果采摘季启幕" },
                  { rank: "4", title: "本地生活服务好店免费入驻通道全面开启" },
                  { rank: "5", title: "大学城各高校新生开学交通与租房指南" },
                ].map((item) => (
                  <div key={item.rank} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "4px",
                        background: item.rank === "1" ? "#EF4444" : item.rank === "2" ? "#F97316" : item.rank === "3" ? "#F59E0B" : "#F1F5F9",
                        color: item.rank === "1" || item.rank === "2" || item.rank === "3" ? "#ffffff" : "#64748B",
                        fontSize: "11px",
                        fontWeight: "800",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.rank}
                    </span>
                    <span style={{ color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. 官方投稿爆料 */}
            <div style={{ background: "linear-gradient(135deg, #0B7A75 0%, #075E5A 100%)", borderRadius: "16px", padding: "1.25rem", color: "#ffffff" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "800", margin: "0 0 6px 0" }}>📢 身边事投稿与新闻报料</h3>
              <p style={{ fontSize: "12px", opacity: 0.9, lineHeight: "1.5", margin: "0 0 12px 0" }}>
                杨林街坊如有本地突发、民生求助或正能量新闻，欢迎向生活网官方编辑部报料。
              </p>
              <a
                href="/articles/new"
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "#ffffff",
                  color: "#0B7A75",
                  padding: "8px 0",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "800",
                  textDecoration: "none",
                }}
              >
                + 我要新闻报料
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
