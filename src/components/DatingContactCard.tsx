"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { DatingContactInfo } from "@/lib/dating-contact-utils";

interface Props {
  profileId: string;
  nickname: string;
  gender: string;
  contactInfo: DatingContactInfo;
  isLoggedIn?: boolean;
  initialUnlocked?: boolean;
  initialRealContact?: string | null;
}

export default function DatingContactCard({
  profileId,
  nickname,
  gender,
  contactInfo,
  isLoggedIn = false,
  initialUnlocked = false,
  initialRealContact = null,
}: Props) {
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [realContact, setRealContact] = useState<string | null>(initialRealContact);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isFemale = gender === "female";
  const redirectUrl = `/login?redirect=${encodeURIComponent(`/love/${profileId}`)}`;

  const handleRevealClick = async () => {
    // 1. 如果未登录，直接拦截弹出登录提示并可跳转
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    // 2. 如果已解锁且有真实联系方式
    if (unlocked && realContact) {
      return;
    }

    // 3. 发起安全鉴权请求调取
    setLoading(true);
    try {
      const res = await fetch(`/api/love/${profileId}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.status === 401 || data.loginRequired) {
        setShowLoginModal(true);
      } else if (data.success && data.unlocked && data.contactInfo?.realContact) {
        setUnlocked(true);
        setRealContact(data.contactInfo.realContact);
      } else {
        // 需要解锁/申请牵线
        setShowUnlockModal(true);
      }
    } catch {
      setShowUnlockModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // 1. 未登录拦截弹窗 (使用 React Portal 渲染至 document.body)
  const loginModal = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        boxSizing: "border-box",
      }}
      onClick={() => setShowLoginModal(false)}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          maxWidth: "420px",
          width: "100%",
          padding: "2.25rem 2rem",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          border: "1px solid #e2e8f0",
          boxSizing: "border-box",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#fee2e2",
            color: "#e11d48",
            fontSize: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem auto",
            boxShadow: "0 4px 14px rgba(225, 29, 72, 0.2)",
          }}
        >
          🔒
        </div>

        <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", margin: "0 0 8px 0" }}>
          请先登录后申请牵线
        </h3>

        <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", margin: "0 0 1.75rem 0" }}>
          为保障相亲嘉宾 【<strong>{nickname}</strong>】 的隐私安全与防恶意骚扰，平台严格实行实名鉴权，请先登录您的账号。
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <a
            href={redirectUrl}
            style={{
              background: "linear-gradient(135deg, #e11d48, #be123c)",
              color: "white",
              padding: "13px",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: "800",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(225, 29, 72, 0.3)",
              display: "block",
            }}
          >
            🔐 立即登录 / 注册
          </a>

          <button
            type="button"
            onClick={() => setShowLoginModal(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "13px",
              cursor: "pointer",
              padding: "8px",
            }}
          >
            暂不查看，返回浏览
          </button>
        </div>
      </div>
    </div>
  );

  // 2. 申请红娘牵线/解锁弹窗 (使用 React Portal 渲染至 document.body)
  const unlockModal = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        boxSizing: "border-box",
      }}
      onClick={() => setShowUnlockModal(false)}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          maxWidth: "440px",
          width: "100%",
          padding: "2.25rem 2rem",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          border: "1px solid #e2e8f0",
          boxSizing: "border-box",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#f0fdf4",
            color: "#16a34a",
            fontSize: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem auto",
            boxShadow: "0 4px 14px rgba(22, 163, 74, 0.2)",
          }}
        >
          💌
        </div>

        <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", margin: "0 0 6px 0" }}>
          申请牵线嘉宾：{nickname}
        </h3>

        <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: "1.6", margin: "0 0 1.25rem 0" }}>
          平台已开启官方专属红娘一对一破冰牵线服务，助您轻松迈出第一步！
        </p>

        <div
          style={{
            background: "#f8fafc",
            borderRadius: "16px",
            padding: "16px",
            border: "1px solid #e2e8f0",
            textAlign: "left",
            marginBottom: "1.5rem",
            fontSize: "13px",
          }}
        >
          <div style={{ fontWeight: "800", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>👩‍💼</span> 官方红娘专属牵线权益：
          </div>
          <div style={{ color: "#475569", lineHeight: "1.7" }}>
            1. 专属红娘向对方转达您的诚意意向与个人档案；<br />
            2. 协助双方破冰沟通，经同意后互换微信直通方式；<br />
            3. 全程保护个人隐私，杜绝电话打扰与虚假信息。
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={() => {
              alert("🎉 牵线申请已提交！官方红娘将在 2 小时内与您联系协助牵线！");
              setShowUnlockModal(false);
            }}
            style={{
              background: isFemale ? "linear-gradient(135deg, #ec4899, #e11d48)" : "linear-gradient(135deg, #0284c7, #2563eb)",
              color: "white",
              border: "none",
              padding: "13px",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: "800",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(225, 29, 72, 0.25)",
            }}
          >
            💌 免费申请红娘一对一牵线
          </button>

          <button
            type="button"
            onClick={() => setShowUnlockModal(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "13px",
              cursor: "pointer",
              padding: "6px",
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ width: "100%" }}>
      {/* 联系方式展示卡片 */}
      <div
        style={{
          background: "#f8fafc",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "1.25rem",
          marginBottom: "1rem",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px" }}>
            <span>🔒</span> {contactInfo.label} {unlocked ? "（已解锁）" : "（已隐私脱敏）"}
          </div>
          <div
            style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "10px",
              background: unlocked ? "#dcfce7" : "#fee2e2",
              color: unlocked ? "#15803d" : "#b91c1c",
              fontWeight: "700",
            }}
          >
            {unlocked ? "✓ 正常调取" : isLoggedIn ? "登录用户专享" : "🔒 登录后申请"}
          </div>
        </div>

        {/* 号码/牵线专线内容展示区 */}
        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              fontWeight: "900",
              color: unlocked ? "#0f172a" : "#1e293b",
              fontFamily: "monospace",
              letterSpacing: "1px",
              overflowWrap: "break-word" as const,
              wordBreak: "break-all" as const,
              marginBottom: "4px",
            }}
          >
            {unlocked && realContact ? realContact : contactInfo.maskedDisplay}
          </div>

          <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.5", marginBottom: "14px" }}>
            {contactInfo.hint}
          </div>

          {/* 主交互按钮 */}
          <div>
            {!unlocked ? (
              <button
                type="button"
                onClick={handleRevealClick}
                disabled={loading}
                style={{
                  width: "100%",
                  background: isFemale ? "linear-gradient(135deg, #ec4899, #e11d48)" : "linear-gradient(135deg, #0284c7, #2563eb)",
                  color: "white",
                  border: "none",
                  padding: "11px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: isFemale ? "0 4px 14px rgba(225,29,72,0.28)" : "0 4px 14px rgba(2,132,199,0.28)",
                  transition: "all 0.2s ease",
                }}
              >
                <span>{loading ? "⌛ 查询鉴权中..." : "👁️ 查看完整号码 / 申请牵线"}</span>
              </button>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                {realContact && /^1[3-9]\d{9}$/.test(realContact) && (
                  <a
                    href={`tel:${realContact}`}
                    style={{
                      flex: 1,
                      background: "#16a34a",
                      color: "white",
                      padding: "10px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: "800",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)",
                    }}
                  >
                    <span>📞 立即拨打</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => realContact && handleCopy(realContact)}
                  style={{
                    flex: 1,
                    background: copied ? "#16a34a" : "#f1f5f9",
                    color: copied ? "white" : "#0f172a",
                    border: "1px solid #cbd5e1",
                    padding: "10px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: "800",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {copied ? "已复制 ✓" : "📋 复制号码/微信"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 弹窗挂载到 document.body */}
      {mounted && showLoginModal && typeof document !== "undefined" && createPortal(loginModal, document.body)}
      {mounted && showUnlockModal && typeof document !== "undefined" && createPortal(unlockModal, document.body)}
    </div>
  );
}
