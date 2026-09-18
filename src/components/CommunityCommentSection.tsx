"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostCommentItem } from "@/lib/community-store";

export default function CommunityCommentSection({
  postId,
  postAuthorId,
  initialComments,
}: {
  postId: string;
  postAuthorId?: string;
  initialComments: PostCommentItem[];
}) {
  const router = useRouter();
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ id: string; authorName: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [message, setMessage] = useState("");

  const submitComment = async (e: React.FormEvent, parentId?: string, text?: string) => {
    e.preventDefault();
    const content = text || commentText;
    if (!content.trim()) return;

    setCommenting(true);
    setMessage("");

    try {
      const response = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: content.trim(), parentId }),
      });

      setCommenting(false);

      if (!response.ok) {
        if (response.status === 401) {
          location.href = `/login?from=${encodeURIComponent(`/community/${postId}`)}`;
          return;
        }
        const err = await response.json().catch(() => ({}));
        setMessage(err.error || "发表回复失败，请稍后重试");
        return;
      }

      setCommentText("");
      setReplyText("");
      setReplyTarget(null);
      setMessage("✅ 回复已发表！");
      router.refresh();
    } catch {
      setCommenting(false);
      setMessage("网络异常，请重试");
    }
  };

  const renderCommentItem = (c: PostCommentItem, isReply = false) => {
    const isLandlord = postAuthorId && c.authorId === postAuthorId;
    const initial = (c.authorName || "友").slice(0, 1).toUpperCase();

    return (
      <div
        key={c.id}
        style={{
          padding: isReply ? "10px 14px" : "14px 16px",
          background: isReply ? "#ffffff" : "#f8fafc",
          borderRadius: "14px",
          border: "1px solid #f1f5f9",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
        }}
      >
        {/* 头像 */}
        <div
          style={{
            width: isReply ? "32px" : "38px",
            height: isReply ? "32px" : "38px",
            borderRadius: "50%",
            background: isLandlord
              ? "linear-gradient(135deg, #0d9488 0%, #047857 100%)"
              : "linear-gradient(135deg, #64748b 0%, #475569 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isReply ? "12px" : "14px",
            fontWeight: "800",
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          }}
        >
          {initial}
        </div>

        {/* 内容区 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#1e293b" }}>
                {c.authorName || "杨林网友"}
              </span>

              {isLandlord && (
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: "800",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    background: "#047857",
                    color: "#ffffff",
                  }}
                >
                  楼主
                </span>
              )}

              {c.authorBadge && (
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: "700",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    background: "#e0f2fe",
                    color: "#0369a1",
                  }}
                >
                  {c.authorBadge}
                </span>
              )}
            </div>

            <time style={{ fontSize: "11.5px", color: "#94a3b8" }}>
              {new Date(c.createdAt).toLocaleDateString("zh-CN", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>

          {/* 回复内容 */}
          <div style={{ fontSize: "14px", color: "#334155", lineHeight: "1.65", wordBreak: "break-word" }}>
            {c.content}
          </div>

          {/* 底部操作条 */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
            <button
              type="button"
              onClick={() => {
                if (replyTarget?.id === c.id) {
                  setReplyTarget(null);
                } else {
                  setReplyTarget({ id: c.id, authorName: c.authorName || "杨林网友" });
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                color: replyTarget?.id === c.id ? "#0f766e" : "#64748b",
                fontWeight: "700",
                cursor: "pointer",
                padding: "2px 4px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>↩️</span> {replyTarget?.id === c.id ? "取消回复" : "回复"}
            </button>
          </div>

          {/* 展开的二级回复输入框 */}
          {replyTarget?.id === c.id && (
            <form
              onSubmit={(e) => submitComment(e, c.id, replyText)}
              style={{
                marginTop: "10px",
                padding: "10px",
                background: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
              }}
            >
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
                回复 @{replyTarget.authorName}：
              </div>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="善意回复，文明互动..."
                required
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: "8px",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  style={{
                    padding: "4px 10px",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={commenting}
                  style={{
                    padding: "4px 12px",
                    background: "#0f766e",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: commenting ? "not-allowed" : "pointer",
                  }}
                >
                  {commenting ? "发送中..." : "发表回复"}
                </button>
              </div>
            </form>
          )}

          {/* 嵌套二级回复列表 */}
          {c.replies && c.replies.length > 0 && (
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px", borderLeft: "2px solid #e2e8f0", paddingLeft: "12px" }}>
              {c.replies.map((reply) => renderCommentItem(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const totalCommentCount = initialComments.reduce((acc, cur) => acc + 1 + (cur.replies ? cur.replies.length : 0), 0);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        border: "1px solid #e2e8f0",
        padding: "clamp(1.25rem, 3vw, 2rem)",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#0f172a", margin: 0 }}>
          💬 街坊讨论交流 ({totalCommentCount})
        </h3>
        <span style={{ fontSize: "12px", color: "#64748b" }}>倡导友善发言，共建美好杨林</span>
      </div>

      {initialComments.length === 0 ? (
        <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "12px", marginBottom: "1.5rem" }}>
          🛋️ 暂无回复，快来抢占第一个观点发言吧！
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "2rem" }}>
          {initialComments.map((c) => renderCommentItem(c, false))}
        </div>
      )}

      {/* 底部回复表单 */}
      <form onSubmit={(e) => submitComment(e)} style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
            ✍️ 发表你的街坊观点
          </h4>
          <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>严禁人身攻击与商业广告</span>
        </div>

        {message && (
          <div style={{ marginBottom: "10px", fontSize: "13px", color: message.includes("失败") || message.includes("异常") ? "#dc2626" : "#16a34a", fontWeight: "700" }}>
            {message}
          </div>
        )}

        <textarea
          rows={3}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="畅所欲言，理性讨论，请遵守杨林文明交流公约..."
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            outline: "none",
            marginBottom: "10px",
            fontSize: "14px",
            boxSizing: "border-box",
            background: "white",
            lineHeight: "1.6",
          }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={commenting}
            style={{
              background: "#0f766e",
              color: "white",
              border: "none",
              padding: "9px 24px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "800",
              cursor: commenting ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(15, 118, 110, 0.2)",
            }}
          >
            {commenting ? "提交中..." : "发表观点"}
          </button>
        </div>
      </form>
    </div>
  );
}
