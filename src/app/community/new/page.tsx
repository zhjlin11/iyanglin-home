"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";

const CATEGORIES = [
  { key: "share", label: "💡 身边新鲜事", desc: "杨林日常、吃喝玩乐、生活见闻", board: "yanglin" },
  { key: "help", label: "❓ 问答求助", desc: "找人打听、政策办事、找猫找狗、交通咨询", board: "help" },
  { key: "trade", label: "🏷️ 闲置二手", desc: "个人物品转让、大学城教材/数码出闲置", board: "trade" },
  { key: "news", label: "📢 曝光爆料", desc: "消费维权、不公现象、违规现象曝光 (需实名核验)", board: "news" },
  { key: "college", label: "🎓 大学城专区", desc: "校园活动、社团招新、考研交流、拼车搭子", board: "college" },
];

const PRESET_TOPICS = [
  "大学城美食", "杨林经开区", "嵩明城际公交", "租房求助", "二手转让", "考研考证", "本地招聘探讨", "宠物领养"
];

export default function NewPostPage() {
  const [selectedCategory, setSelectedCategory] = useState("share");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [exposeAgreed, setExposeAgreed] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      if (selectedTopics.length >= 3) {
        setMessage("每个帖子最多可关联 3 个话题标签");
        return;
      }
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const addCustomTopic = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const clean = customTopic.trim().replace(/^#/, "");
    if (!clean) return;
    if (selectedTopics.includes(clean)) {
      setCustomTopic("");
      return;
    }
    if (selectedTopics.length >= 3) {
      setMessage("每个帖子最多可关联 3 个话题标签");
      return;
    }
    setSelectedTopics([...selectedTopics, clean]);
    setCustomTopic("");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const title = String(data.get("title") || "").trim();
    const body = String(data.get("body") || "").trim();
    const targetCat = CATEGORIES.find((c) => c.key === selectedCategory) || CATEGORIES[0];

    if (!title || !body) {
      setMessage("请填写帖子标题和正文描述");
      return;
    }

    if (selectedCategory === "news" && !exposeAgreed) {
      setMessage("发布曝光爆料前，请务必阅读并勾选《杨林社区实名真实性与防侵权承诺》");
      return;
    }

    setSubmitting(true);
    setMessage("正在提交发布...");

    try {
      const response = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category: targetCat.key,
          board: targetCat.board,
          body,
          status: "pending",
          images,
          topics: selectedTopics,
        }),
      });

      setSubmitting(false);

      if (!response.ok) {
        if (response.status === 401) {
          location.href = `/login?from=${encodeURIComponent("/community/new")}`;
          return;
        }
        const res = await response.json().catch(() => ({}));
        setMessage(res.error || "发布失败，请稍后重试");
        return;
      }

      setMessage("✅ 帖子发布成功，等待审核通过后上线展示！");
      setTimeout(() => {
        location.href = "/community";
      }, 1000);
    } catch {
      setSubmitting(false);
      setMessage("网络错误，发布失败");
    }
  };

  return (
    <AuthGuard pageTitle="发表社区帖子">
      <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <Navbar />

        {/* 顶部发布类型引导区 */}
        <div style={{ maxWidth: "900px", margin: "1.5rem auto 0 auto", padding: "0 1rem" }}>
          
          {/* 业务分流温馨提示 */}
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "14px",
              padding: "12px 16px",
              marginBottom: "1.25rem",
              fontSize: "13px",
              color: "#1e40af",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>💡</span>
              <span>
                <b>发招聘还是租房？</b> 社区讨论请勿直接发布企业全职招聘或整套商用房源：
              </span>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Link href="/jobs/new" style={{ color: "#2563eb", fontWeight: "700", textDecoration: "none" }}>
                💼 前往发布招聘岗位 →
              </Link>
              <Link href="/house/new" style={{ color: "#2563eb", fontWeight: "700", textDecoration: "none" }}>
                🏠 前往发布正规房源 →
              </Link>
            </div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "1.75rem", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "17px", fontWeight: "900", margin: "0 0 12px 0", color: "#0f172a" }}>
              第一步：选择你的帖子类型
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    style={{
                      background: active ? "#f0fdfa" : "#f8fafc",
                      border: active ? "2px solid #0f766e" : "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "12px 10px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: "800", color: active ? "#0f766e" : "#1e293b", marginBottom: "4px" }}>
                      {cat.label}
                    </div>
                    <div style={{ fontSize: "11.5px", color: active ? "#047857" : "#64748b", lineHeight: "1.4" }}>
                      {cat.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 表单主体 */}
          <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "1.75rem", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "17px", fontWeight: "900", margin: "0 0 1.25rem 0", color: "#0f172a" }}>
              第二步：编辑帖子内容
            </h2>

            {message && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: message.includes("成功") ? "#f0fdf4" : "#fef2f2",
                  border: message.includes("成功") ? "1px solid #bbf7d0" : "1px solid #fecaca",
                  color: message.includes("成功") ? "#166534" : "#991b1b",
                  marginBottom: "1.25rem",
                  fontSize: "13.5px",
                  fontWeight: "700",
                }}
              >
                {message}
              </div>
            )}

            <form onSubmit={submit}>
              {/* 标题 */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                  帖子标题 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  name="title"
                  required
                  placeholder="简洁明了描述您要讨论或求助的事情（如：大学城周边有没有推荐的周末自习室？）"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14.5px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* 话题标签 */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                  关联话题标签 (最多可选 3 个)
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  {PRESET_TOPICS.map((topic) => {
                    const active = selectedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        style={{
                          padding: "4px 12px",
                          borderRadius: "16px",
                          fontSize: "12.5px",
                          fontWeight: active ? "700" : "500",
                          background: active ? "#0f766e" : "#f1f5f9",
                          color: active ? "#ffffff" : "#475569",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        #{topic}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: "8px", maxWidth: "340px" }}>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onKeyDown={addCustomTopic}
                    placeholder="输入自定义话题 (回车添加)"
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12.5px",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCustomTopic}
                    style={{
                      padding: "6px 12px",
                      background: "#e2e8f0",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    + 添加
                  </button>
                </div>
              </div>

              {/* 正文 */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                  帖子正文详情 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  name="body"
                  required
                  rows={8}
                  placeholder="详细描述具体经过、事实情况、您的问题或者想与街坊交流的心得..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14.5px",
                    lineHeight: "1.7",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* 上传图片 */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                  上传配图 (最多 9 张，清晰真实图片更能吸引关注)
                </label>
                <ImageUpload value={images} onChange={setImages} maxCount={9} />
              </div>

              {/* 曝光爆料免责承诺 */}
              {selectedCategory === "news" && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "12px",
                    padding: "1rem",
                    marginBottom: "1.5rem",
                    fontSize: "13px",
                    color: "#991b1b",
                    lineHeight: "1.6",
                  }}
                >
                  <div style={{ fontWeight: "800", marginBottom: "4px" }}>
                    ⚠️ 《杨林社区曝光爆料合规与法律责任警示》
                  </div>
                  <div>1. 发布人保证所反映情况客观真实，严禁捏造事实、歪曲真相或恶意诽谤他人；</div>
                  <div>2. 严禁发布未经授权泄露他人身份证、住址、私人微信聊天记录等隐私信息；</div>
                  <div>3. 涉及法律纠纷的，发布者须自行承担相应民事及刑事责任。平台保留移交执法机关调查权利。</div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontWeight: "800", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={exposeAgreed}
                      onChange={(e) => setExposeAgreed(e.target.checked)}
                      required
                    />
                    <span>我已阅读并完全知晓，并对我发布的全部内容真实性负责</span>
                  </label>
                </div>
              )}

              {/* 提交按钮 */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <Link
                  href="/community"
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    background: "#f1f5f9",
                    color: "#475569",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: "700",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  取消返回
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 32px",
                    borderRadius: "10px",
                    background: "#0f766e",
                    color: "white",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: "800",
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(15, 118, 110, 0.3)",
                  }}
                >
                  {submitting ? "正在提交..." : "立即发表帖子"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
