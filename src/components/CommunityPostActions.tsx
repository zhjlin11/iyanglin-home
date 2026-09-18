"use client";

import React, { useState } from "react";
import { Heart } from "lucide-react";
import DetailActions from "@/components/DetailActions";

export default function CommunityPostActions({
  postId,
  postTitle,
  postDesc,
  imageUrl,
  initialLiked = false,
  initialLikesCount = 0,
}: {
  postId: string;
  postTitle: string;
  postDesc?: string;
  imageUrl?: string;
  initialLiked?: boolean;
  initialLikesCount?: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [likeLoading, setLikeLoading] = useState(false);

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch("/api/community/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.status === 401) {
        location.href = `/login?from=${encodeURIComponent(`/community/${postId}`)}`;
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch {
      // ignore
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 0",
        borderTop: "1px solid #f1f5f9",
        borderBottom: "1px solid #f1f5f9",
        margin: "1.5rem 0",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        {/* 社区专属点赞按钮 */}
        <button
          type="button"
          onClick={handleLike}
          disabled={likeLoading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "8px",
            background: liked ? "#fef2f2" : "#ffffff",
            border: liked ? "1px solid #fca5a5" : "1px solid #cbd5e1",
            color: liked ? "#dc2626" : "#475569",
            fontSize: "13.5px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Heart
            size={16}
            style={{
              fill: liked ? "#ef4444" : "none",
              color: liked ? "#ef4444" : "currentColor",
              transform: liked ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            }}
          />
          <span>{liked ? "已赞" : "点赞"}</span>
          <span style={{ color: liked ? "#dc2626" : "#94a3b8" }}>{likesCount}</span>
        </button>

        {/* 统一 收藏、分享与违规举报能力 */}
        <DetailActions
          resourceType="COMMUNITY_POST"
          resourceId={postId}
          title={postTitle}
          desc={postDesc}
          link={`https://iyanglin.com/community/${postId}`}
          imageUrl={imageUrl}
        />
      </div>
    </div>
  );
}
