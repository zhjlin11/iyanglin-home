"use client";

import React, { useState, useEffect } from "react";
import { isBookmarked, toggleBookmark, BookmarkItem } from "@/lib/bookmark-store";

interface BookmarkButtonProps {
  id: string;
  kind: "listing" | "house" | "shop" | "event" | "job" | "love" | "community" | "article";
  title: string;
  url: string;
}

export default function BookmarkButton({ id, kind, title, url }: BookmarkButtonProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isBookmarked(id));
  }, [id]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const payload: BookmarkItem = {
      id,
      kind,
      title,
      url,
      createdAt: new Date().toISOString(),
    };

    const isAdded = toggleBookmark(payload);
    setActive(isAdded);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="button button-small button-secondary"
      style={{
        padding: "0 10px",
        fontSize: "12px",
        height: "30px",
        borderRadius: "15px",
        color: active ? "#ef4444" : "var(--ink-secondary)",
        borderColor: active ? "#fca5a5" : "var(--line-strong)",
        background: active ? "#fef2f2" : "#ffffff",
        fontWeight: active ? "bold" : "normal",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <span>{active ? "❤️ 已收藏" : "🤍 收藏"}</span>
    </button>
  );
}
