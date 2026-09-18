import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { listPosts } from "@/lib/community-store";
import { stripHtml } from "@/lib/strip-html";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  return {
    title: `#${decoded} - 杨林社区话题讨论 | 杨林生活网`,
    description: `查看关于 #${decoded} 的全部杨林本地生活讨论、街坊观点与新鲜事。`,
  };
}

export default async function TopicDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const topicName = decodeURIComponent(slug);

  const [posts, topicMeta] = await Promise.all([
    listPosts({
      topic: topicName,
      status: "approved",
    }),
    prisma.topic.findUnique({
      where: { slug: topicName },
    }),
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <Navbar />

      {/* 话题 Header */}
      <section
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #134E4A 100%)",
          color: "white",
          padding: "36px 0 32px 0",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8", marginBottom: "12px" }}>
            <Link href="/community" style={{ color: "#34d399", textDecoration: "none", fontWeight: "700" }}>
              ← 返回社区广场
            </Link>
            <span>/</span>
            <span>话题专区</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(52, 211, 153, 0.2)", padding: "4px 12px", borderRadius: "16px", color: "#34d399", fontSize: "13px", fontWeight: "800", marginBottom: "8px" }}>
                <span>🔥</span> 热门话题聚焦
              </div>
              <h1 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: "900", margin: "0 0 8px 0" }}>
                #{topicName}
              </h1>
              <p style={{ color: "#cbd5e1", fontSize: "14px", margin: 0 }}>
                {topicMeta?.description || `汇聚所有关于「${topicName}」的杨林本地生活交流、求助与街坊讨论。`}
              </p>
            </div>

            <div>
              <Link
                href={`/community/new`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#10b981",
                  color: "white",
                  padding: "10px 24px",
                  borderRadius: "20px",
                  fontWeight: "800",
                  fontSize: "14px",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                }}
              >
                <span>✍️</span> 参与此话题发帖
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 话题下内容流 */}
      <main style={{ maxWidth: "1100px", margin: "2rem auto 4rem auto", padding: "0 1.25rem" }}>
        <div style={{ fontSize: "14.5px", fontWeight: "800", color: "#334155", marginBottom: "1rem" }}>
          💬 该话题下共有 <span style={{ color: "#0f766e" }}>{posts.length}</span> 条社区讨论
        </div>

        {posts.length === 0 ? (
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
              暂无该话题相关的帖子
            </h3>
            <p style={{ fontSize: "13.5px", color: "#94a3b8", marginBottom: "1.5rem" }}>
              快来发表第一篇关于 #{topicName} 的讨论吧！
            </p>
            <Link
              href="/community/new"
              style={{
                display: "inline-block",
                padding: "8px 22px",
                background: "#0f766e",
                color: "white",
                borderRadius: "20px",
                textDecoration: "none",
                fontWeight: "700",
                fontSize: "13.5px",
              }}
            >
              + 立即发帖
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {posts.map((post) => {
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
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#0f766e" }}>
                      {post.authorName || "杨林街坊"}
                    </span>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>

                  <h2 style={{ fontSize: "16.5px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                    {post.title}
                  </h2>

                  {cleanBody && (
                    <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: "1.6", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {cleanBody}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                    <span>👀 {post.viewsCount} 阅读</span>
                    <span>💬 {post.repliesCount} 回复</span>
                    <span>❤️ {post.likesCount} 赞同</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
