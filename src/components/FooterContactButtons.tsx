"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface FooterContactButtonsProps {
  customerPhone?: string;
  customerWechat?: string;
  officialAccountName?: string;
  qrCodeUrl?: string;
  email?: string;
  serviceHours?: string;
  compact?: boolean;
}

export default function FooterContactButtons({
  customerPhone = "13619694207",
  customerWechat = "13619694207",
  officialAccountName = "杨林生活圈",
  qrCodeUrl = "/images/wechat_official_qr.jpg",
  email = "123035946@qq.com",
  serviceHours = "09:00 - 21:00",
  compact = false,
}: FooterContactButtonsProps) {
  const [activeTab, setActiveTab] = useState<"wechat_mp" | "wechat_cs" | "phone" | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveTab(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopyFeedback(label + "已复制");
        setTimeout(() => setCopyFeedback(null), 2000);
      }).catch(() => {
        fallbackCopy(text, label);
      });
    } else {
      fallbackCopy(text, label);
    }
  };

  const fallbackCopy = (text: string, label: string) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopyFeedback(label + "已复制");
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback("请手动复制: " + text);
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  const buttons = [
    {
      id: "wechat_mp" as const,
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.691 2.188C3.891 2.188 0 5.478 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.858-2.454.123-5.238 2.502-6.526 1.74-.942 3.79-1.07 5.626-.532-.78-4.32-4.685-7.578-8.932-7.578zm-2.457 4.5c.613 0 1.11.497 1.11 1.11 0 .614-.497 1.11-1.11 1.11a1.11 1.11 0 0 1-1.11-1.11c0-.613.497-1.11 1.11-1.11zm5.556 0c.614 0 1.11.497 1.11 1.11 0 .614-.496 1.11-1.11 1.11a1.11 1.11 0 0 1-1.111-1.11c0-.613.497-1.11 1.11-1.11zm3.894 3.738c-3.927 0-7.11 2.686-7.11 6.002 0 1.808.956 3.436 2.454 4.536a.48.48 0 0 1 .174.544l-.319 1.21c-.015.057-.039.115-.039.174 0 .133.106.241.237.241a.267.267 0 0 0 .137-.044l1.555-.91a.707.707 0 0 1 .586-.08 8.303 8.303 0 0 0 2.32.329c3.928 0 7.11-2.686 7.11-6.002 0-3.316-3.182-6.002-7.11-6.002zm-2.222 3.68c.5 0 .907.406.907.907 0 .5-.407.907-.907.907a.908.908 0 0 1-.908-.907c0-.501.407-.907.908-.907zm4.444 0c.5 0 .907.406.907.907 0 .5-.407.907-.907.907a.908.908 0 0 1-.908-.907c0-.501.407-.907.908-.907z"/>
        </svg>
      ),
      label: "微信公众号",
      shortLabel: "公众号",
      color: "#07C160",
      bgHover: "#E8F8EE",
    },
    {
      id: "wechat_cs" as const,
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      ),
      label: "微信客服",
      shortLabel: "客服微信",
      color: "#1677FF",
      bgHover: "#E6F4FF",
    },
    {
      id: "phone" as const,
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
      label: "电话咨询",
      shortLabel: "客服电话",
      color: "#FA8C16",
      bgHover: "#FFF7E6",
    },
  ];

  return (
    <div ref={containerRef} style={{ position: "relative", marginTop: "12px", width: "100%" }}>
      {/* 3个交互式图标按钮 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {buttons.map((b) => {
          const isActive = activeTab === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setActiveTab(isActive ? null : b.id)}
              onMouseEnter={() => setActiveTab(b.id)}
              title={b.label + "（点击查看详情）"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 11px",
                borderRadius: "8px",
                border: isActive ? ("1.5px solid " + b.color) : "1.5px solid #E5E7EB",
                background: isActive ? b.bgHover : "#FFFFFF",
                color: isActive ? b.color : "#374151",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.08)" : "0 1px 2px rgba(0,0,0,0.04)",
                transform: isActive ? "translateY(-1px)" : "none",
                outline: "none",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", color: b.color }}>
                {b.icon}
              </span>
              <span>{b.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 展开的详情浮层 (Popover Card) */}
      {activeTab && (
        <div
          onMouseEnter={() => {}}
          onMouseLeave={() => setActiveTab(null)}
          style={{
            position: "absolute",
            left: 0,
            bottom: "calc(100% + 10px)",
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 16px 36px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)",
            border: "1px solid #E5E7EB",
            zIndex: 60,
            width: "300px",
            animation: "footerFadeInUp 0.18s ease-out",
          }}
        >
          {/* 三角箭头 */}
          <div
            style={{
              position: "absolute",
              bottom: "-6px",
              left:
                activeTab === "wechat_mp" ? "32px" : activeTab === "wechat_cs" ? "116px" : "200px",
              width: "11px",
              height: "11px",
              background: "#FFFFFF",
              borderRight: "1px solid #E5E7EB",
              borderBottom: "1px solid #E5E7EB",
              transform: "rotate(45deg)",
            }}
          />

          {/* 选项卡1：微信公众号 */}
          {activeTab === "wechat_mp" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#111827" }}>{officialAccountName}</span>
                  <span style={{ fontSize: "10px", background: "#E8F8EE", color: "#07C160", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                    官方公众号
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  style={{ border: "none", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "18px", padding: 0, lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>

              <div style={{ display: "inline-block", padding: "6px", background: "#F9FAFB", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                <Image
                  src={qrCodeUrl}
                  alt="杨林生活圈官方微信公众号二维码"
                  width={140}
                  height={140}
                  style={{ display: "block", borderRadius: "4px" }}
                  unoptimized
                />
              </div>

              <p style={{ margin: "8px 0 4px 0", fontSize: "12px", color: "#374151", fontWeight: "600" }}>
                微信扫一扫 · 关注官方公众号
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#6B7280", lineHeight: "1.4" }}>
                实时获取杨林本地求职招聘、房屋出租、转让求购及民生热点
              </p>

              <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "center" }}>
                <Link
                  prefetch={false}
                  href="/wechat/official"
                  style={{ fontSize: "11.5px", color: "#2563EB", textDecoration: "none", fontWeight: "600" }}
                >
                  查看公众号专属主页 &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* 选项卡2：微信客服 */}
          {activeTab === "wechat_cs" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#111827" }}>官方微信客服</span>
                  <span style={{ fontSize: "10px", background: "#E6F4FF", color: "#1677FF", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                    在线咨询
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  style={{ border: "none", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "18px", padding: 0, lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>

              <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: "10px 12px", border: "1px solid #E5E7EB", marginBottom: "10px" }}>
                <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "3px" }}>微信号 / 手机号</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "15px", fontWeight: "700", color: "#111827", fontFamily: "monospace" }}>
                    {customerWechat}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(customerWechat, "微信号")}
                    style={{
                      padding: "3px 8px",
                      background: copyFeedback && copyFeedback.indexOf("微信号") !== -1 ? "#07C160" : "#1677FF",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                  >
                    {copyFeedback && copyFeedback.indexOf("微信号") !== -1 ? "已复制" : "复制"}
                  </button>
                </div>
              </div>

              <p style={{ margin: "0 0 10px 0", fontSize: "11.5px", color: "#4B5563", lineHeight: "1.5" }}>
                💬 添加客服微信，咨询便民发布审核、同城置顶、广告投放合作、认证入驻与信息纠错。
              </p>

              <div style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid #F3F4F6" }}>
                <Link
                  prefetch={false}
                  href="/contact"
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "6px 0",
                    background: "#F3F4F6",
                    color: "#374151",
                    borderRadius: "6px",
                    fontSize: "12px",
                    textDecoration: "none",
                    fontWeight: "500",
                  }}
                >
                  在线留言反馈
                </Link>
                <button
                  type="button"
                  onClick={() => handleCopy(customerWechat, "微信号")}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    background: "#1677FF",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  复制微信号
                </button>
              </div>
            </div>
          )}

          {/* 选项卡3：电话咨询 */}
          {activeTab === "phone" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#111827" }}>客服服务热线</span>
                  <span style={{ fontSize: "10px", background: "#FFF7E6", color: "#FA8C16", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                    直通专线
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  style={{ border: "none", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "18px", padding: 0, lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>

              <div style={{ background: "#FFFBEB", borderRadius: "8px", padding: "10px 12px", border: "1px solid #FDE68A", marginBottom: "10px" }}>
                <div style={{ fontSize: "11px", color: "#92400E", marginBottom: "3px" }}>官方咨询热线</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <a
                    href={"tel:" + customerPhone}
                    style={{ fontSize: "16px", fontWeight: "800", color: "#B45309", textDecoration: "none", fontFamily: "monospace" }}
                  >
                    {customerPhone}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(customerPhone, "电话")}
                    style={{
                      padding: "3px 8px",
                      background: copyFeedback && copyFeedback.indexOf("电话") !== -1 ? "#07C160" : "#D97706",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                  >
                    {copyFeedback && copyFeedback.indexOf("电话") !== -1 ? "已复制" : "复制"}
                  </button>
                </div>
              </div>

              <div style={{ fontSize: "11.5px", color: "#6B7280", lineHeight: "1.6", marginBottom: "10px" }}>
                <div>⏰ 服务时间：{serviceHours}（周一至周日）</div>
                <div>📍 服务范围：嵩明杨林职教园区及周边地区</div>
              </div>

              <div style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid #F3F4F6" }}>
                <button
                  type="button"
                  onClick={() => handleCopy(customerPhone, "电话")}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    background: "#F3F4F6",
                    color: "#374151",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  复制号码
                </button>
                <a
                  href={"tel:" + customerPhone}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "6px 0",
                    background: "#10B981",
                    color: "#FFFFFF",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  一键拨打 📞
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 常驻真实联系信息栏 (Permanent Contact Information Box) */}
      {!compact && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px 14px",
            background: "rgba(249, 250, 251, 0.8)",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#4B5563",
            lineHeight: "1.7",
            maxWidth: "320px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
            <span style={{ fontWeight: "600", color: "#1F2937" }}>
              📞 客服专线：
              <a
                href={"tel:" + customerPhone}
                style={{ color: "#2563EB", textDecoration: "none", fontWeight: "700", marginLeft: "2px" }}
              >
                {customerPhone}
              </a>
            </span>
            <span
              onClick={() => handleCopy(customerPhone, "联系电话")}
              style={{
                fontSize: "11px",
                color: copyFeedback && copyFeedback.indexOf("联系电话") !== -1 ? "#059669" : "#6B7280",
                cursor: "pointer",
                textDecoration: "underline",
                userSelect: "none",
              }}
            >
              {copyFeedback && copyFeedback.indexOf("联系电话") !== -1 ? "✓已复制" : "复制"}
            </span>
          </div>

          <div style={{ fontSize: "11.5px", color: "#6B7280" }}>
            💬 微信同号 · ⏰ 服务时间：{serviceHours}
          </div>

          {email && (
            <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>
              ✉️ 客服邮箱：
              <a href={"mailto:" + email} style={{ color: "#6B7280", textDecoration: "none" }}>
                {email}
              </a>
            </div>
          )}
        </div>
      )}

      {/* 复制成功浮动轻量提示 (Toast) */}
      {copyFeedback && (
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(17, 24, 39, 0.92)",
            color: "#FFFFFF",
            padding: "8px 18px",
            borderRadius: "24px",
            fontSize: "13px",
            fontWeight: "500",
            zIndex: 9999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            animation: "footerFadeIn 0.2s ease-out",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backdropFilter: "blur(4px)",
          }}
        >
          <span>✓</span>
          <span>{copyFeedback}</span>
        </div>
      )}

      <style>{`
        @keyframes footerFadeInUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes footerFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
