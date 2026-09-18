"use client";

import React, { useState, useEffect } from "react";
import { Star, Check, UserPlus } from "lucide-react";

interface FollowProviderButtonProps {
  providerId: string;
  initialFollowed?: boolean;
  initialCount?: number;
}

export default function FollowProviderButton({
  providerId,
  initialFollowed = false,
  initialCount = 0,
}: FollowProviderButtonProps) {
  const [isFollowed, setIsFollowed] = useState(initialFollowed);
  const [followersCount, setFollowersCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 异步拉取当前用户的真实关注状态与粉丝数
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/provider/${providerId}/follow`);
        const json = await res.json();
        if (json.success && json.data) {
          setIsFollowed(json.data.isFollowed);
          setFollowersCount(json.data.followersCount);
        }
      } catch {
        // ignore fetch error
      }
    };
    checkStatus();
  }, [providerId]);

  const handleToggleFollow = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/provider/${providerId}/follow`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success && json.data) {
        setIsFollowed(json.data.isFollowed);
        setFollowersCount(json.data.followersCount);
      } else {
        alert(json.error || "关注操作失败，请登录后重试");
      }
    } catch {
      alert("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleFollow}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        borderRadius: "20px",
        border: isFollowed ? "1px solid #cbd5e1" : "1px solid #f59e0b",
        backgroundColor: isFollowed ? "#f8fafc" : "#fffbeb",
        color: isFollowed ? "#64748b" : "#b45309",
        fontSize: "0.85rem",
        fontWeight: 700,
        cursor: loading ? "wait" : "pointer",
        transition: "all 0.2s ease",
        boxShadow: isFollowed ? "none" : "0 2px 6px rgba(245, 158, 11, 0.15)",
      }}
    >
      {isFollowed ? (
        <>
          <Check size={15} color="#16a34a" />
          <span>已关注 ({followersCount})</span>
        </>
      ) : (
        <>
          <Star size={15} color="#f59e0b" fill="#f59e0b" />
          <span>+ 关注服务商 ({followersCount})</span>
        </>
      )}
    </button>
  );
}
