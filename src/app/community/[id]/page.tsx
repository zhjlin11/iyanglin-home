import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { getPost } from "@/lib/community-store";
import { formatRichHtml } from "@/lib/rich-text";
import { cleanText } from "@/lib/strip-html";
import CommunityCommentSection from "@/components/CommunityCommentSection";
import CommunityPostActions from "@/components/CommunityPostActions";
import Link from "next/link";
import { notFound } from "next/navigation";
import WechatShareHiddenImage from "@/components/WechatShareHiddenImage";
import { getSession } from "@/lib/auth";
import { canViewResource } from "@/lib/resource-access";
import ReviewStatusBanner, { VisitorPendingCard } from "@/components/common/ReviewStatusBanner";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const boardLabels: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  yanglin: { label: "杨林专区", icon: "🏛️", color: "#047857", bg: "#ecfdf5" },
  news: { label: "曝光爆料", icon: "📢", color: "#b91c1c", bg: "#fef2f2" },
  help: { label: "我要求助", icon: "🆘", color: "#b45309", bg: "#fffbeb" },
  life: { label: "兴趣生活", icon: "🎉", color: "#6d28d9", bg: "#f5f3ff" },
  college: { label: "大学城专区", icon: "🎓", color: "#0369a1", bg: "#f0f9ff" },
  trade: { label: "闲置转让", icon: "🏷️", color: "#0f766e", bg: "#f0fdfa" },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) {
    return { title: "贴子不存在 - 杨林生活网社区" };
  }
  const cleanTitle = cleanText(post.title);
  return {
    title: `${cleanTitle} - 杨林生活网社区论坛`,
    description: cleanText(post.body).slice(0, 120),
    openGraph: {
      title: `${cleanTitle} - 杨林生活网`,
      description: cleanText(post.body).slice(0, 120),
      url: `https://iyanglin.com/community/${post.id}`,
      siteName: "杨林生活网",
      images: [
        {
          url: (post.images && post.images[0]) || "https://iyanglin.com/share/v2/community.png?v=20260912",
          width: 600,
          height: 600,
        },
      ],
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  const session = await getSession();
  const access = canViewResource({
    status: post.status,
    authorId: post.authorId,
    currentUser: session,
  });

  if (!access.canView) {
    return (
      <VisitorPendingCard
        moduleName="社区贴子"
        channelUrl="/community"
        channelName="社区论坛"
        status={access.normalizedStatus}
      />
    );
  }

  const bInfo = boardLabels[post.board] || { label: "讨论", icon: "💬", color: "#0f766e", bg: "#f0fdfa" };
  const author = post.authorName || "杨林街坊";
  const richHtml = formatRichHtml(post.body);

  const rawCommunityImg = post.images && post.images[0];
  const communityShareImg = rawCommunityImg
    ? (rawCommunityImg.startsWith("http") ? rawCommunityImg : `https://iyanglin.com${rawCommunityImg.startsWith("/") ? "" : "/"}${rawCommunityImg}`)
    : "https://iyanglin.com/share/v2/community.png?v=20260912";
  const communityShareTitle = `【杨林社区】${cleanText(post.title)}`;
  const communityShareDesc = cleanText(post.body).slice(0, 100) || "来自杨林生活网同城社区论坛的精彩讨论，点击查看详情。";

  return (
    <div className="support-page community-detail-page" style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* 微信与社交分享爬虫首图兜底 */}
      <WechatShareHiddenImage imageUrl={communityShareImg} alt={communityShareTitle} />
      <Navbar />
      {access.normalizedStatus !== "APPROVED" && (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1rem" }}>
          <ReviewStatusBanner
            status={access.normalizedStatus}
            moduleName="社区贴子"
            channelUrl="/community"
            channelName="社区论坛"
            isOwner={access.isOwner}
            isAdmin={access.isAdmin}
            createdAt={post.createdAt}
            adminReviewUrl="/admin/community"
          />
        </div>
      )}

      {/* 面包屑导航 */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "12px 1rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <Link
            href="/community"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#0f766e",
              fontWeight: "700",
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            <span>←</span> 返回社区论坛
          </Link>

          <div style={{ fontSize: "13px", color: "#64748b" }}>
            <span>杨林生活网</span> / <span>社区贴吧</span> / <span style={{ color: "#0f172a", fontWeight: "600" }}>{bInfo.label}</span>
          </div>
        </div>
      </div>

      {/* 主体双栏内容 */}
      <main style={{ maxWidth: "1100px", margin: "2rem auto 5rem auto", padding: "0 1rem" }}>
        <div className="community-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.75rem", alignItems: "start" }}>
          
          {/* 左侧主帖与回复 */}
          <div style={{ minWidth: 0 }}>
            <article
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                padding: "clamp(1.5rem, 4vw, 2.5rem)",
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)",
                marginBottom: "1.5rem",
              }}
            >
              {/* 头部元数据 */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                <span
                  style={{
                    background: bInfo.bg,
                    color: bInfo.color,
                    fontSize: "12.5px",
                    fontWeight: "800",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    border: `1px solid ${bInfo.color}30`,
                  }}
                >
                  {bInfo.icon} {bInfo.label}
                </span>

                <span style={{ fontSize: "13.5px", color: "#64748b" }}>
                  作者：<b style={{ color: "#0f172a" }}>{author}</b>
                </span>

                <span style={{ fontSize: "13.5px", color: "#94a3b8" }}>·</span>

                <time style={{ fontSize: "13.5px", color: "#64748b" }}>
                  📅 {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                </time>

                <div style={{ marginLeft: "auto", display: "flex", gap: "10px", fontSize: "12.5px", color: "#94a3b8" }}>
                  <span>👀 {post.viewsCount} 次阅读</span>
                  <span>💬 {post.comments?.length || 0} 条回复</span>
                </div>
              </div>

              {/* 帖子标题 */}
              <h1
                style={{
                  fontSize: "clamp(20px, 3.5vw, 28px)",
                  fontWeight: "900",
                  color: "#0f172a",
                  lineHeight: "1.4",
                  margin: "0 0 1.5rem 0",
                  letterSpacing: "-0.5px",
                }}
              >
                {post.title}
              </h1>

              <div style={{ height: "1px", background: "#f1f5f9", margin: "1.25rem 0 1.5rem 0" }} />

              {/* 正文渲染区 (支持富文本与老站图文) */}
              <div
                className="community-rich-content"
                style={{
                  fontSize: "16px",
                  lineHeight: "1.85",
                  color: "#334155",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
                dangerouslySetInnerHTML={{ __html: richHtml }}
              />

              {/* 独立附图（如果有） */}
              {post.images && post.images.length > 0 && (
                <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #f1f5f9" }}>
                  <h4 style={{ fontSize: "14.5px", fontWeight: "800", color: "#0f172a", marginBottom: "10px" }}>
                    📸 附带图片 ({post.images.length} 张)
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                    {post.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`插图 ${i + 1}`}
                        style={{
                          width: "100%",
                          height: "180px",
                          objectFit: "cover",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 帖子点赞、分享与快捷举报交互栏 */}
              <CommunityPostActions
                postId={post.id}
                postTitle={communityShareTitle}
                postDesc={communityShareDesc}
                imageUrl={communityShareImg}
                initialLiked={Boolean(post.isLiked)}
                initialLikesCount={post.likesCount || 0}
              />
            </article>

            {/* 讨论回复专区 (现代化去楼层组件) */}
            <CommunityCommentSection
              postId={post.id}
              postAuthorId={post.authorId}
              initialComments={post.comments || []}
            />
          </div>

          {/* 右侧：版规与发帖引导 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* 1. 快捷发帖 */}
            <div
              style={{
                background: "linear-gradient(135deg, #0f766e 0%, #047857 100%)",
                borderRadius: "18px",
                padding: "1.5rem",
                color: "white",
                boxShadow: "0 4px 16px rgba(15, 118, 110, 0.2)",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "900", margin: "0 0 6px 0" }}>
                也有身边事想要分享？
              </h3>
              <p style={{ fontSize: "12.5px", opacity: 0.9, lineHeight: "1.5", margin: "0 0 1rem 0" }}>
                杨林经开区、大学城与嵩明本地生活广场，自由发声，互帮互助。
              </p>
              <Link
                href="/community/new"
                style={{
                  display: "block",
                  background: "#ffffff",
                  color: "#047857",
                  textAlign: "center",
                  padding: "9px",
                  borderRadius: "10px",
                  fontSize: "13.5px",
                  fontWeight: "800",
                  textDecoration: "none",
                }}
              >
                + 立即发布新话题
              </Link>
            </div>

            {/* 2. 社区版规公约 */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "18px",
                border: "1px solid #e2e8f0",
                padding: "1.25rem",
                fontSize: "12.5px",
                color: "#475569",
                lineHeight: "1.6",
              }}
            >
              <div style={{ fontWeight: "800", color: "#0f172a", marginBottom: "8px", fontSize: "14px" }}>
                🛡️ 社区文明交流规范
              </div>
              <div>• 倡导真诚友善交流，尊重不同观点；</div>
              <div>• 严禁发布未经证实的恶意谣言、人身攻击；</div>
              <div>• 严禁发布涉黄、涉赌、刷单及违规兼职广告；</div>
              <div>• 如发现违规内容，欢迎向平台客服或管理员举报。</div>
            </div>
          </div>
        </div>
      </main>

      {/* 底部吸底写评论栏 (移动端专属，PC端隐藏) */}
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
        <input
          type="text"
          placeholder="参与街坊讨论，发表友善评论..."
          style={{
            flex: 1,
            background: "#F3F4F6",
            border: "none",
            borderRadius: "20px",
            padding: "10px 16px",
            fontSize: "13.5px",
            outline: "none",
          }}
        />
        <button
          type="button"
          style={{
            background: "#16A67A",
            color: "#ffffff",
            border: "none",
            borderRadius: "20px",
            padding: "10px 18px",
            fontSize: "13.5px",
            fontWeight: "800",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          发评论
        </button>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .community-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .community-rich-content img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 10px;
          margin: 12px 0;
          display: block;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        .community-rich-content p {
          margin-bottom: 1rem;
          line-height: 1.85;
        }
        .community-rich-content strong, .community-rich-content b {
          color: #0f172a;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
