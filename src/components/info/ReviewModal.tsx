"use client";

import React, { useState } from "react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  providerId: string;
  providerName: string;
  requestTitle: string;
  onSuccess?: () => void;
}

const POSITIVE_TAGS = ["响应迅速", "收费合理", "准时到达", "技术专业", "干活细致", "服务热情"];
const NEGATIVE_TAGS = ["迟到延误", "价格不符", "技术有待提高", "沟通不畅"];

const RATING_TEXTS = ["", "非常差 😡", "不太满意 🙁", "一般般 😐", "比较满意 😊", "非常满意 🌟 极力推荐"];

export default function ReviewModal({
  isOpen,
  onClose,
  requestId,
  providerId,
  providerName,
  requestTitle,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(["响应迅速", "技术专业"]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 5) {
      setErrorMsg("评价内容请至少输入 5 个字");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/provider/${providerId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          rating,
          tags: selectedTags,
          content: content.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "提交评价失败");
      }

      alert("🎉 评价提交成功！感谢您支持杨林诚信本地服务！");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "网络异常，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;
  const tagsPool = displayRating >= 4 ? POSITIVE_TAGS : NEGATIVE_TAGS;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          padding: "24px",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题与关闭 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              真实服务体验评价
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 0 0" }}>
              对师傅【{providerName}】的服务做出客观反馈
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.25rem",
              cursor: "pointer",
              color: "#94a3b8",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* 需求名称胶囊 */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "0.85rem",
            color: "#475569",
            marginBottom: "20px",
          }}
        >
          📋 服务需求：<span style={{ fontWeight: 600, color: "#1e293b" }}>{requestTitle}</span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 星级打分 */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "8px" }}>总体满意度</div>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", fontSize: "2rem", cursor: "pointer" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  style={{
                    color: star <= displayRating ? "#f59e0b" : "#cbd5e1",
                    transition: "transform 0.1s, color 0.15s",
                    transform: star <= displayRating ? "scale(1.15)" : "scale(1)",
                    userSelect: "none",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#d97706", marginTop: "6px", minHeight: "20px" }}>
              {RATING_TEXTS[displayRating]}
            </div>
          </div>

          {/* 快捷标签 */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
              快捷服务印象标签 (点击选择)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {tagsPool.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "9999px",
                      fontSize: "0.8rem",
                      border: isSelected ? "1px solid #2563eb" : "1px solid #e2e8f0",
                      backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
                      color: isSelected ? "#1d4ed8" : "#64748b",
                      cursor: "pointer",
                      fontWeight: isSelected ? 600 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 评价详细内容 */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                详细体验反馈 <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{content.length}/500</span>
            </div>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="师傅技术怎么样？准时上门吗？收费是否合理透明？您的真实评价将帮助更多杨林街坊邻居！"
              maxLength={500}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "0.9rem",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* 错误提示 */}
          {errorMsg && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "0.85rem",
                marginBottom: "16px",
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {/* 底部提交按钮 */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#64748b",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              稍后再评
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "正在提交..." : "发布真实评价"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
