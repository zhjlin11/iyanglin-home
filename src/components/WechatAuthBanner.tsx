"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function WechatAuthBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [bannerType, setBannerType] = useState<"login" | "sync" | null>(null);

  useEffect(() => {
    // 仅在微信内置浏览器中运行
    if (typeof navigator === "undefined" || !/MicroMessenger/i.test(navigator.userAgent)) {
      return;
    }

    // 在登录页、注册页、管理后台等不显示
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/wechat/follow")
    ) {
      return;
    }

    // 如果当前会话已手动关闭过，则暂不展示
    if (sessionStorage.getItem("dismiss_wechat_auth_banner") === "1") {
      return;
    }

    // 检查登录状态与昵称
    fetch("/api/user/profile")
      .then((res) => {
        if (!res.ok) {
          // 未登录：提示一键微信登录与同步
          setBannerType("login");
          setVisible(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data || !data.user) return;
        const nickname = data.user.nickname || "";
        const avatar = data.user.avatar;
        // 如果已登录但仍为临时昵称或无头像
        if (nickname.startsWith("微信用户_") || nickname === "微信用户" || !avatar) {
          setBannerType("sync");
          setVisible(true);
        }
      })
      .catch(() => {});
  }, [pathname]);

  if (!visible || !bannerType) return null;

  const handleAuthorize = () => {
    const currentUrl = window.location.pathname + window.location.search;
    window.location.href = `/api/auth/wechat?redirect=${encodeURIComponent(currentUrl)}`;
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("dismiss_wechat_auth_banner", "1");
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "68px",
        left: "12px",
        right: "12px",
        zIndex: 9999,
        background: "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(12px)",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0,0,0,0.08)",
        border: "1px solid #BBF7D0",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        animation: "wechatSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style jsx>{`
        @keyframes wechatSlideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>

      {/* 微信图标与文字 */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#07C160",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(7, 193, 96, 0.3)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M8.5 3C4.36 3 1 6.03 1 9.77c0 2.05 1.01 3.88 2.6 5.12L2.8 18l3.37-1.12c.74.22 1.53.35 2.33.35.25 0 .5-.02.74-.05C9.09 16.63 9 16.08 9 15.5c0-3.59 3.58-6.5 8-6.5.4 0 .8.03 1.18.08C17.65 5.56 13.51 3 8.5 3z"
              fill="#FFFFFF"
            />
            <path
              d="M17 10.5c-3.87 0-7 2.46-7 5.5s3.13 5.5 7 5.5c.7 0 1.39-.1 2.03-.29L22 22.5l-.71-2.12c1.47-1.07 2.41-2.65 2.41-4.38 0-3.04-3.13-5.5-7-5.5z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#111827", lineHeight: "1.3" }}>
            {bannerType === "login" ? "微信一键快捷登录" : "同步微信头像与昵称"}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#6B7280",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: "1.3",
              marginTop: "2px",
            }}
          >
            {bannerType === "login"
              ? "点击授权即可同步您的微信真实头像昵称"
              : "检测到临时昵称，点击即可拉取微信最新资料"}
          </div>
        </div>
      </div>

      {/* 按钮与关闭 */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleAuthorize}
          style={{
            background: "#07C160",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "20px",
            padding: "6px 14px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(7, 193, 96, 0.35)",
            whiteSpace: "nowrap",
          }}
        >
          {bannerType === "login" ? "立即登录" : "立即同步"}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: "transparent",
            border: "none",
            color: "#9CA3AF",
            padding: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="关闭"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
