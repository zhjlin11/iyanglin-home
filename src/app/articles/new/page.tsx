"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";
import AuthGuard from "@/components/AuthGuard";

export default function NewArticlePage() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const title = String(data.get("title") || "").trim();
    const summary = String(data.get("summary") || "").trim();
    const body = String(data.get("body") || "").trim();
    const category = String(data.get("category") || "life").trim();

    if (!title || !body) {
      setMessage("⚠️ 请填写文章标题与正文详情");
      return;
    }

    setSubmitting(true);
    setMessage("正在发布文章...");

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "article",
          title,
          summary,
          body,
          category,
          status: "pending",
          images,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `/login?from=${encodeURIComponent("/articles/new")}`;
          return;
        }
        const res = await response.json().catch(() => ({}));
        setMessage(res.error || "发布失败，请稍后重试");
        setSubmitting(false);
        return;
      }

      setMessage("🎉 本地资讯已成功发布！正在等待平台审核...");
      setTimeout(() => {
        window.location.href = "/articles";
      }, 1000);
    } catch (err: any) {
      setMessage("网络异常，请检查连接后重试");
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14.5px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "700" as const,
    fontSize: "13.5px",
    color: "#334155",
    marginBottom: "6px",
  };

  return (
    <AuthGuard pageTitle="投稿本地资讯">
      <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <Navbar />

        {/* 顶部现代化 Hero Banner */}
      <section
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #0d9488 60%, #0284c7 100%)",
          color: "white",
          padding: "2.5rem 1rem 3rem 1rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.18)", padding: "4px 12px", borderRadius: "20px", fontSize: "12.5px", fontWeight: "bold", backdropFilter: "blur(10px)", marginBottom: "0.75rem", border: "1px solid rgba(255,255,255,0.25)" }}>
            <span>📰</span> 嵩明·杨林本地资讯投稿创作中心
          </div>
          <h1 style={{ fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: "800", margin: "0 0 0.5rem 0" }}>
            发布杨林本地生活资讯
          </h1>
          <p style={{ fontSize: "14px", opacity: 0.9, margin: 0, lineHeight: "1.6" }}>
            分享杨林镇、大学城与经开区本地新闻动态、商家探店、吃喝玩乐与实用攻略指南
          </p>
        </div>
      </section>

      {/* 主体表单区域 */}
      <main style={{ maxWidth: "1120px", margin: "-1.5rem auto 4rem auto", padding: "0 1rem" }}>
        {message && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              fontSize: "14px",
              fontWeight: "600",
              background: message.includes("成功") ? "#dcfce7" : "#fee2e2",
              color: message.includes("成功") ? "#166534" : "#991b1b",
              border: message.includes("成功") ? "1px solid #bbf7d0" : "1px solid #fecaca",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
            
            {/* 左栏：核心文稿内容 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ background: "white", borderRadius: "16px", padding: "1.75rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "18px" }}>📝</span>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "#0f172a" }}>
                    资讯正文编辑
                  </h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label style={labelStyle}>
                      文章标题 <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      name="title"
                      required
                      placeholder="例如：杨林大学城周末美食夜市全攻略推荐"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      文章摘要 / 核心导读
                    </label>
                    <textarea
                      name="summary"
                      rows={3}
                      placeholder="用一两句话概括文章核心看点（选填，不填自动截取正文前段）"
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                        lineHeight: "1.5",
                      }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      上传资讯配图 / 封面（最多 6 张）
                    </label>
                    <div style={{ marginTop: "6px" }}>
                      <ImageUpload value={images} onChange={setImages} maxCount={6} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>
                      正文详细内容 <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <textarea
                      name="body"
                      required
                      rows={14}
                      placeholder="请输入详细的资讯内容、活动细则、攻略步骤或新闻报道..."
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                        lineHeight: "1.7",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 右栏：分类与提交 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ background: "white", borderRadius: "16px", padding: "1.75rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "18px" }}>⚙️</span>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "#0f172a" }}>
                    资讯发布分类
                  </h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
                  <div>
                    <label style={labelStyle}>
                      资讯分类 <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select name="category" defaultValue="life" style={inputStyle}>
                      <option value="life">🌆 本地生活与动态</option>
                      <option value="guide">📖 实用攻略与指南</option>
                      <option value="news">📰 本地新闻与速递</option>
                      <option value="food">🍱 美食探店与好味</option>
                      <option value="notice">📢 社区通告与启事</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 提交卡片 */}
              <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: submitting ? "#94a3b8" : "linear-gradient(135deg, #047857 0%, #0d9488 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "800",
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: "0 6px 18px rgba(4, 120, 87, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.15s",
                  }}
                >
                  <span>{submitting ? "⏳" : "🚀"}</span>
                  <span>{submitting ? "正在提交中..." : "立即发布资讯"}</span>
                </button>

                <div style={{ marginTop: "1rem", fontSize: "12px", color: "#94a3b8", lineHeight: "1.5", textAlign: "center" }}>
                  💡 资讯发布后将进入审核队列，审核通过后即在全站资讯频道首页展示。
                </div>
              </div>
            </div>

          </div>
        </form>
      </main>
      </div>
    </AuthGuard>
  );
}
