import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { listPosts } from "@/lib/community-store";
import { stripHtml } from "@/lib/strip-html";
import Pagination from "@/components/Pagination";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "杨林人都在聊什么？- 杨林本地生活社区交流论坛 | 大学城与经开区贴吧",
  description: "杨林生活网真实社区讨论广场，连接杨林经开区产业工人、大学城师生与嵩明本地居民。涵盖身边见闻、生活求助、闲置转让、消费避坑与曝光爆料。",
  keywords: ["杨林论坛", "杨林贴吧", "杨林大学城交流群", "杨林经开区讨论", "嵩明生活圈", "杨林求助"],
  openGraph: {
    title: "杨林人都在聊什么？- 杨林本地真实生活讨论社区",
    description: "发现杨林大小事，真实街坊交流互动广场。",
    url: "https://iyanglin.com/community",
  },
  alternates: {
    canonical: "https://iyanglin.com/community",
  },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ board?: string; category?: string; topic?: string; q?: string; sort?: string; page?: string }>;
};

const categoryLabels: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  share: { label: "生活分享", icon: "💡", color: "#047857", bg: "#ecfdf5" },
  help: { label: "问答求助", icon: "❓", color: "#b45309", bg: "#fffbeb" },
  trade: { label: "闲置转让", icon: "🏷️", color: "#0f766e", bg: "#f0fdfa" },
  news: { label: "曝光爆料", icon: "📢", color: "#b91c1c", bg: "#fef2f2" },
  college: { label: "大学城专区", icon: "🎓", color: "#0369a1", bg: "#f0f9ff" },
  yanglin: { label: "杨林本地", icon: "🏛️", color: "#4338ca", bg: "#eef2ff" },
  topic: { label: "话题讨论", icon: "💬", color: "#6d28d9", bg: "#f5f3ff" },
};

const boardLabels: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  yanglin: { label: "杨林专区", icon: "🏛️", color: "#047857", bg: "#ecfdf5" },
  news: { label: "曝光爆料", icon: "📢", color: "#b91c1c", bg: "#fef2f2" },
  help: { label: "我要求助", icon: "🆘", color: "#b45309", bg: "#fffbeb" },
  life: { label: "兴趣生活", icon: "🎉", color: "#6d28d9", bg: "#f5f3ff" },
  college: { label: "大学城专区", icon: "🎓", color: "#0369a1", bg: "#f0f9ff" },
  trade: { label: "闲置转让", icon: "🏷️", color: "#0f766e", bg: "#f0fdfa" },
};

export default async function CommunityListPage({ searchParams }: PageProps) {
  const { board, category, topic, q, sort, page } = await searchParams;
  const currentBoard = board || "all";
  const currentCategory = category || "all";
  const currentTopic = topic || "";
  const searchQuery = (q || "").trim().toLowerCase();
  const currentSort = (sort as "recommend" | "latest" | "hot" | "featured" | "unanswered") || "recommend";
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const pageSize = 12;

  const [posts, dbHotPosts, dbHotTopics] = await Promise.all([
    listPosts({
      board: currentBoard !== "all" ? currentBoard : undefined,
      category: currentCategory !== "all" ? currentCategory : undefined,
      topic: currentTopic || undefined,
      status: "approved",
      search: searchQuery || undefined,
      sort: currentSort,
    }),
    prisma.post.findMany({
      where: { status: "APPROVED" },
      orderBy: [{ viewsCount: "desc" }, { repliesCount: "desc" }],
      take: 5,
      select: { id: true, title: true, viewsCount: true, repliesCount: true, likesCount: true },
    }),
    prisma.topic.findMany({
      orderBy: [{ postsCount: "desc" }, { viewsCount: "desc" }],
      take: 6,
      select: { slug: true, name: true, postsCount: true },
    }),
  ]);

  const totalPosts = posts.length;
  const paginatedPosts = posts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const buildUrl = (targetPage: number) => {
    const p = new URLSearchParams();
    if (currentBoard !== "all") p.set("board", currentBoard);
    if (currentCategory !== "all") p.set("category", currentCategory);
    if (currentTopic) p.set("topic", currentTopic);
    if (searchQuery) p.set("q", searchQuery);
    if (currentSort !== "latest") p.set("sort", currentSort);
    if (targetPage > 1) p.set("page", String(targetPage));
    return `/community?${p.toString()}`;
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diffSec < 60) return "刚刚";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`;
      if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400)} 天前`;
      return d.toLocaleDateString("zh-CN");
    } catch {
      return dateStr;
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "linear-gradient(135deg, #0d9488 0%, #047857 100%)",
      "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
      "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <div className="support-page community-channel" style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <Navbar />

      {/* 紧凑气质现代化社区 Hero Banner (PC 190px, 手机 140px) */}
      <section
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #0F766E 100%)",
          color: "white",
          padding: "26px 0 24px 0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <div className="pc-container" style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(52, 211, 153, 0.18)",
                  padding: "3px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#34D399",
                  marginBottom: "6px",
                }}
              >
                <span>💬</span> 杨林生活论坛 · 真实街坊生活讨论社区
              </div>
              <h1 style={{ fontSize: "clamp(22px, 3.2vw, 30px)", fontWeight: "900", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
                杨林人都在聊什么？
              </h1>
              <p style={{ color: "#cbd5e1", fontSize: "13.5px", margin: 0, maxWidth: "620px", lineHeight: "1.5" }}>
                连接杨林经开区产业工人、大学城师生与本地居民，分享生活故事、办事打听、闲置转让与真实求助。
              </p>
            </div>

            <div className="desktop-only" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Link
                href="/community/new"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  fontWeight: "900",
                  fontSize: "14.5px",
                  padding: "10px 24px",
                  borderRadius: "22px",
                  textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(16, 185, 129, 0.35)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ fontSize: "16px" }}>✍️</span> + 发布新帖
              </Link>
            </div>
          </div>

          {/* 移动端搜索 */}
          <div className="mobile-only" style={{ marginTop: "12px" }}>
            <form action="/community" style={{ display: "flex", gap: "8px" }}>
              <div
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  padding: "7px 12px",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "14px" }}>🔍</span>
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="搜索帖子、话题、用户..."
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "13px",
                    width: "100%",
                    color: "#1F2937",
                  }}
                />
              </div>
              {currentBoard !== "all" && <input type="hidden" name="board" value={currentBoard} />}
              {currentCategory !== "all" && <input type="hidden" name="category" value={currentCategory} />}
              <button
                type="submit"
                style={{
                  background: "#16A67A",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "7px 14px",
                  fontSize: "13px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                搜索
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 社区论坛广告位 */}
      <AdBanner placementKey="LISTING_TOP" maxItems={1} hidePlaceholder />

      {/* 二级联动导航：第一层排序 + 专属搜索，第二层分类胶囊 */}
      <section style={{ maxWidth: "1240px", margin: "14px auto 0 auto", padding: "0 1.25rem" }}>
        <div
          style={{
            background: "#ffffff",
            padding: "14px 16px",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* 第一层：排序模式（推荐 / 最新 / 热门） + 社区专属搜索 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              paddingBottom: "10px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {[
                { label: "🌟 综合推荐", sortVal: "recommend" },
                { label: "⚡ 最新发布", sortVal: "latest" },
                { label: "🔥 热门讨论", sortVal: "hot" },
              ].map((sTab) => {
                const isActive = (currentSort === sTab.sortVal) || (!sort && sTab.sortVal === "recommend");
                const p = new URLSearchParams();
                if (currentBoard !== "all") p.set("board", currentBoard);
                if (currentCategory !== "all") p.set("category", currentCategory);
                if (currentTopic) p.set("topic", currentTopic);
                if (searchQuery) p.set("q", searchQuery);
                p.set("sort", sTab.sortVal);

                return (
                  <Link
                    key={sTab.sortVal}
                    href={`/community?${p.toString()}`}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "10px",
                      background: isActive ? "#0f766e" : "#f8fafc",
                      color: isActive ? "#ffffff" : "#475569",
                      fontSize: "13.5px",
                      fontWeight: isActive ? "800" : "600",
                      textDecoration: "none",
                      boxShadow: isActive ? "0 2px 8px rgba(15, 118, 110, 0.25)" : "none",
                      border: isActive ? "none" : "1px solid #e2e8f0",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {sTab.label}
                  </Link>
                );
              })}
            </div>

            {/* PC 端社区专属搜索框 */}
            <div className="desktop-only">
              <form action="/community" method="GET" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {currentBoard !== "all" && <input type="hidden" name="board" value={currentBoard} />}
                {currentCategory !== "all" && <input type="hidden" name="category" value={currentCategory} />}
                {currentSort !== "recommend" && <input type="hidden" name="sort" value={currentSort} />}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#f8fafc",
                    border: "1px solid #CBD5E1",
                    borderRadius: "10px",
                    padding: "4px 10px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>🔍</span>
                  <input
                    type="text"
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="搜索帖子、话题、用户..."
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: "13px",
                      outline: "none",
                      width: "190px",
                      color: "#1e293b",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    background: "#0F766E",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "6px 14px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  搜索
                </button>
              </form>
            </div>
          </div>

          {/* 第二层：分类板块胶囊（全部 / 问答 / 闲置 / 曝光 / 大学城 / 杨林专区） */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "2px",
              scrollbarWidth: "none",
            }}
          >
            {[
              { label: "全部版块", boardVal: "all" },
              { label: "❓ 问答求助", boardVal: "help" },
              { label: "🏷️ 闲置转让", boardVal: "trade" },
              { label: "📢 曝光爆料", boardVal: "news" },
              { label: "🎓 大学城专区", boardVal: "college" },
              { label: "🏛️ 杨林专区", boardVal: "yanglin" },
            ].map((tab) => {
              const isActive = currentBoard === tab.boardVal;
              const p = new URLSearchParams();
              if (tab.boardVal !== "all") p.set("board", tab.boardVal);
              if (currentSort !== "recommend") p.set("sort", currentSort);
              if (searchQuery) p.set("q", searchQuery);

              return (
                <Link
                  key={tab.boardVal}
                  href={`/community${p.toString() ? `?${p.toString()}` : ""}`}
                  style={{
                    padding: "5px 13px",
                    borderRadius: "20px",
                    background: isActive ? "#f0fdf4" : "#f8fafc",
                    color: isActive ? "#166534" : "#64748b",
                    fontSize: "13px",
                    fontWeight: isActive ? "800" : "500",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    border: isActive ? "1.5px solid #86efac" : "1px solid #e2e8f0",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 主体区域：PC 宽屏 1240px 双栏 + 移动端自适应流 */}
      <main style={{ maxWidth: "1240px", margin: "1.25rem auto 4rem auto", padding: "0 1.25rem" }}>
        <div className="pc-layout-split" style={{ display: "grid", gap: "1.5rem", alignItems: "start" }}>
          {/* 帖子信息流 */}
          <div style={{ minWidth: 0 }}>
            {/* 统计提示条 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <div style={{ fontSize: "14px", fontWeight: "800", color: "#334155" }}>
                💬 共有 <span style={{ color: "#0f766e" }}>{posts.length}</span> 条社区生活讨论
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                根据时间新鲜度与互动热度智能推荐
              </div>
            </div>

            {/* 帖子列表 */}
            {posts.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "3.5rem 2rem",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                <div style={{ fontSize: "42px", marginBottom: "12px" }}>📭</div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
                  暂无匹配的讨论帖子
                </h3>
                <p style={{ fontSize: "14px", color: "#94a3b8", margin: "0 0 1.25rem 0" }}>
                  快来抢先占座，发表第一篇杨林街坊讨论帖吧！
                </p>
                <Link
                  href="/community/new"
                  style={{
                    display: "inline-block",
                    padding: "9px 24px",
                    background: "#0f766e",
                    color: "white",
                    borderRadius: "20px",
                    textDecoration: "none",
                    fontWeight: "800",
                    fontSize: "14px",
                  }}
                >
                  ✍️ 我要发表新帖
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {paginatedPosts.map((post) => {
                  const bInfo = boardLabels[post.board] || { label: "生活讨论", icon: "💬", color: "#475569", bg: "#f1f5f9" };
                  const author = post.authorName || "杨林街坊";
                  const avatarColor = getAvatarColor(author);
                  const cleanBody = stripHtml(post.body);

                  return (
                    <Link
                      key={post.id}
                      href={`/community/${post.id}`}
                      style={{
                        background: "#ffffff",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        padding: "1.25rem 1.5rem",
                        textDecoration: "none",
                        color: "inherit",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                      className="community-post-card-hover"
                    >
                      {/* 用户头部信息栏 */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {/* 真实头像 / 个性化首字头像 */}
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "50%",
                              background: avatarColor,
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                              fontWeight: "800",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                              flexShrink: 0,
                            }}
                          >
                            <span>{author.slice(0, 1).toUpperCase()}</span>
                          </div>

                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#1e293b" }}>
                                {author}
                              </span>
                              {post.authorBadge && (
                                <span
                                  style={{
                                    fontSize: "10.5px",
                                    padding: "1px 5px",
                                    borderRadius: "4px",
                                    background: "#fef3c7",
                                    color: "#92400e",
                                    fontWeight: "700",
                                  }}
                                >
                                  {post.authorBadge}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#94a3b8" }}>
                              {formatTime(post.createdAt)}
                            </div>
                          </div>
                        </div>

                        {/* 板块胶囊徽章 */}
                        <span
                          style={{
                            fontSize: "12px",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            background: bInfo.bg,
                            color: bInfo.color,
                            fontWeight: "800",
                            border: `1px solid ${bInfo.color}20`,
                          }}
                        >
                          {bInfo.icon} {bInfo.label}
                        </span>
                      </div>

                      {/* 帖子标题（前置分类胶囊） */}
                      <h2
                        style={{
                          fontSize: "16.5px",
                          fontWeight: "800",
                          color: "#0f172a",
                          margin: 0,
                          lineHeight: "1.45",
                          letterSpacing: "-0.2px",
                          display: "flex",
                          alignItems: "baseline",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {post.isTop && (
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "#ef4444",
                              color: "#ffffff",
                              fontWeight: "900",
                              verticalAlign: "middle",
                            }}
                          >
                            置顶
                          </span>
                        )}
                        <span>{post.title}</span>
                      </h2>

                      {/* 正文摘要 */}
                      {cleanBody && (
                        <p
                          style={{
                            fontSize: "13.5px",
                            color: "#475569",
                            lineHeight: "1.6",
                            margin: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {cleanBody}
                        </p>
                      )}

                      {/* 精致缩略图网格（1~3张） */}
                      {post.images && post.images.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", marginTop: "2px", overflowX: "auto", paddingBottom: "2px" }}>
                          {post.images.slice(0, 3).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt=""
                              loading="lazy"
                              style={{
                                width: "120px",
                                height: "85px",
                                objectFit: "cover",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* 现代化社交互动图标栏（去除老式 BBS 文案） */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingTop: "10px",
                          borderTop: "1px solid #f1f5f9",
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: "2px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <span>👀</span> 浏览 {post.viewsCount}
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: post.repliesCount > 0 ? "#0f766e" : "#64748b", fontWeight: post.repliesCount > 0 ? "700" : "500" }}>
                            <span>💬</span> 评论 {post.repliesCount}
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <span>❤️</span> 点赞 {post.likesCount}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#94a3b8", fontSize: "12px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>🔖 收藏</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>🔗 分享</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* 分页组件 */}
            <Pagination
              currentPage={currentPage}
              totalItems={totalPosts}
              pageSize={pageSize}
              buildUrl={buildUrl}
            />
          </div>

          {/* 右侧：社区工具箱 & 热门榜单 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* 1. 快捷发帖直通卡（自然亲切文案） */}
            <div
              style={{
                background: "linear-gradient(135deg, #0f766e 0%, #047857 100%)",
                borderRadius: "20px",
                padding: "1.5rem",
                color: "white",
                boxShadow: "0 6px 20px rgba(15, 118, 110, 0.2)",
              }}
            >
              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#99f6e4", marginBottom: "4px" }}>
                💬 杨林街坊在线茶座
              </div>
              <h3 style={{ fontSize: "17.5px", fontWeight: "900", margin: "0 0 6px 0" }}>
                有话想和杨林人聊聊？
              </h3>
              <p style={{ fontSize: "12.5px", opacity: 0.9, lineHeight: "1.5", margin: "0 0 1.25rem 0" }}>
                分享身边新鲜事、办事打听求助、闲置转让或避坑爆料，邻里都在听。
              </p>
              <Link
                href="/community/new"
                style={{
                  display: "block",
                  background: "#ffffff",
                  color: "#047857",
                  textAlign: "center",
                  padding: "10px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "900",
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                + 发布新帖
              </Link>
            </div>

            {/* 2. 今日热门榜（基于真实浏览+互动综合排序） */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                padding: "1.5rem",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "15.5px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  🔥 今日热门
                </h3>
                <span style={{ fontSize: "11px", color: "#0f766e", fontWeight: "700" }}>全站高热讨论</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {dbHotPosts.map((t, idx) => (
                  <Link
                    key={t.id}
                    href={`/community/${t.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      textDecoration: "none",
                      color: "inherit",
                      fontSize: "13px",
                      padding: "6px 4px",
                      borderRadius: "8px",
                      transition: "background 0.15s",
                    }}
                  >
                    <span
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "6px",
                        background: idx === 0 ? "#ef4444" : idx === 1 ? "#f97316" : idx === 2 ? "#f59e0b" : "#f1f5f9",
                        color: idx <= 2 ? "white" : "#64748b",
                        fontSize: "11px",
                        fontWeight: "800",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "600", color: "#334155" }}>
                      {t.title}
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", flexShrink: 0 }}>
                      {t.repliesCount > 0 ? `💬 ${t.repliesCount}` : `👀 ${t.viewsCount}`}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 3. 热门话题标签广场 */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                padding: "1.25rem 1.5rem",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "10px" }}>
                🏷️ 热门话题广场
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(dbHotTopics.length > 0 ? dbHotTopics : [
                  { slug: "大学城美食", name: "大学城美食", postsCount: 18 },
                  { slug: "杨林经开区", name: "杨林经开区", postsCount: 25 },
                  { slug: "嵩明城际公交", name: "嵩明城际公交", postsCount: 12 },
                  { slug: "租房求助", name: "租房求助", postsCount: 15 },
                  { slug: "二手转让", name: "二手转让", postsCount: 30 },
                  { slug: "考研考证", name: "考研考证", postsCount: 8 },
                ]).map((tp) => (
                  <Link
                    key={tp.slug}
                    href={`/community/topic/${encodeURIComponent(tp.slug)}`}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "14px",
                      background: "#f0fdfa",
                      border: "1px solid #ccfbf1",
                      color: "#0f766e",
                      fontSize: "12px",
                      fontWeight: "700",
                      textDecoration: "none",
                    }}
                  >
                    #{tp.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* 4. 社区文明公约 */}
            <div
              style={{
                background: "#f0fdf4",
                borderRadius: "16px",
                border: "1px solid #bbf7d0",
                padding: "1.25rem",
                fontSize: "12px",
                color: "#166534",
                lineHeight: "1.6",
              }}
            >
              <div style={{ fontWeight: "800", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                <span>🛡️</span> 杨林生活网社区文明交流公约：
              </div>
              <div>• 倡导友善互助，共建真实健康的同城交流空间；</div>
              <div>• 严禁发布任何违规引流、刷单、博彩及未经核实的谣言；</div>
              <div>• 涉及商业广告或招商，请发布至好店名录或置顶推广。</div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 860px) {
          .pc-layout-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
