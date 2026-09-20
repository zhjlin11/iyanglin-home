"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function MobileFloatingDock() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPublishSheet, setShowPublishSheet] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);

  // 检查用户登录状态
  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => {
        setIsLoggedIn(!!data.user);
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  // 监听全站事件唤起发布弹层（如分类页等入口）
  useEffect(() => {
    const handleOpenSheet = (e: CustomEvent<{ category?: string; type?: string }>) => {
      if (e.detail?.category) {
        setHighlightedCategory(e.detail.category);
      }
      setShowPublishSheet(true);
    };

    window.addEventListener("open-global-publish-sheet", handleOpenSheet as EventListener);
    return () => {
      window.removeEventListener("open-global-publish-sheet", handleOpenSheet as EventListener);
    };
  }, []);

  // 智能推断当前页面上下文与高亮意图
  const getCurrentContextKey = useCallback(() => {
    if (highlightedCategory) return highlightedCategory;
    const catQuery = searchParams.get("cat") || searchParams.get("category");
    if (catQuery === "service" || pathname.startsWith("/services")) return "service";
    if (catQuery === "used" || catQuery === "phone" || catQuery === "digital") return "used";
    if (pathname.startsWith("/info/requests") || pathname === "/info/request/new") return "request";
    if (pathname.startsWith("/info")) return "info";
    return null;
  }, [highlightedCategory, searchParams, pathname]);

  // 管理员后台、登录、注册、独立工作台、小程序页面、自营商城、配送员工作台以及 AI 助手沉浸页不显示通用底部导航
  if (
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/workspace") ||
    pathname.startsWith("/mp") ||
    pathname.startsWith("/mall") ||
    pathname.startsWith("/courier") ||
    pathname.startsWith("/assistant")
  ) {
    return null;
  }

  // 点击发布项：直接进入对应发布页，各页面由 AuthGuard 或提交表单统一校验
  const handleOptionClick = (targetHref: string) => {
    setShowPublishSheet(false);
    router.push(targetHref);
  };

  // 4 大核心便民发布意图
  const corePublishOptions = [
    {
      id: "info",
      title: "发布便民信息",
      tag: "快速发布",
      desc: "拼车出行、生活求助、转让租赁等通用便民信息",
      icon: "📝",
      href: "/info/new",
      themeBg: "#F0FDF4",
      borderColor: "#86EFAC",
      iconBg: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      titleColor: "#065F46",
    },
    {
      id: "service",
      title: "发布本地服务",
      tag: "师傅接单",
      desc: "家政保洁、水电维修、开锁疏通等本地师傅服务上架",
      icon: "🛠️",
      href: "/info/new?cat=service",
      themeBg: "#EFF6FF",
      borderColor: "#93C5FD",
      iconBg: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
      titleColor: "#1E40AF",
    },
    {
      id: "request",
      title: "发布需求撮合",
      tag: "15分响应",
      desc: "我需要修水管、找保洁或搬家，智能匹配认证师傅",
      icon: "⚡",
      href: "/info/request/new",
      themeBg: "#FFFBEB",
      borderColor: "#FCD34D",
      iconBg: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
      titleColor: "#92400E",
    },
    {
      id: "used",
      title: "发布闲置转让",
      tag: "二手回血",
      desc: "二手手机、代步电车、学生教材、宿舍家具同城面交",
      icon: "📦",
      href: "/info/new?cat=used",
      themeBg: "#FAF5FF",
      borderColor: "#D8B4FE",
      iconBg: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
      titleColor: "#5B21B6",
    },
  ];

  // 更多专属频道快捷入口
  const otherChannels = [
    { label: "招聘求职", icon: "💼", href: "/jobs/new" },
    { label: "房屋租售", icon: "🏠", href: "/house/new" },
    { label: "园区招商", icon: "🏭", href: "/industrial/publish" },
    { label: "相亲脱单", icon: "💖", href: "/love/new" },
    { label: "社区发帖", icon: "💬", href: "/community/new" },
  ];

  const items = [
    {
      label: "首页",
      href: "/",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      label: "分类",
      href: "/categories",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="7" x="3" y="3" rx="1.5"/>
          <rect width="7" height="7" x="14" y="3" rx="1.5"/>
          <rect width="7" height="7" x="14" y="14" rx="1.5"/>
          <rect width="7" height="7" x="3" y="14" rx="1.5"/>
        </svg>
      ),
    },
    {
      label: "发布",
      isCenter: true,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      ),
    },
    {
      label: "消息",
      href: "/messages",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      label: "我的",
      href: "/profile",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ];

  const activeContextKey = getCurrentContextKey();

  return (
    <>
      {/* 手机端吸底 5 槽位导航栏 */}
      <nav
        className="mobile-floating-dock"
        aria-label="移动端底部快捷导航栏"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
          height: "calc(58px + env(safe-area-inset-bottom, 0px))",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(229, 231, 235, 0.85)",
          boxShadow: "0 -4px 16px rgba(15, 23, 42, 0.05)",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          margin: 0,
        }}
      >
        {items.map((item, idx) => {
          const isActive = item.href ? (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) : false;

          // 中间主 Action：“+ 发布”
          if (item.isCenter) {
            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  height: "100%",
                }}
              >
                <Link
                  href="/publish"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "absolute",
                    top: "-18px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    outline: "none",
                    width: "64px",
                    height: "64px",
                    zIndex: 52,
                    textDecoration: "none",
                  }}
                  aria-label="发布中心"
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #16A67A 0%, #0B7A75 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 22px rgba(22, 166, 122, 0.38)",
                      border: "3.5px solid #ffffff",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    }}
                  >
                    {item.icon}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "800",
                      color: pathname === "/publish" ? "#EA580C" : "#0B7A75",
                      marginTop: "2px",
                      letterSpacing: "0.2px",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={idx}
              href={item.href || "/"}
              prefetch={false}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                flex: 1,
                color: isActive ? "#16A67A" : "#6B7280",
                fontWeight: isActive ? "800" : "500",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
            >
              <div style={{ transform: isActive ? "scale(1.06)" : "scale(1)", transition: "transform 0.15s ease" }}>
                {item.icon}
              </div>
              <span style={{ fontSize: "11px", marginTop: "3px", letterSpacing: "-0.2px" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* 现代极简移动端发布抽屉 (Bottom Sheet) */}
      {showPublishSheet && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => setShowPublishSheet(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderTopLeftRadius: "28px",
              borderTopRightRadius: "28px",
              padding: "20px 18px calc(24px + env(safe-area-inset-bottom, 0px))",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.18)",
              maxWidth: "520px",
              width: "100%",
              margin: "0 auto",
              animation: "sheetSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部长条拉手 */}
            <div
              style={{
                width: "40px",
                height: "4.5px",
                background: "#E2E8F0",
                borderRadius: "3px",
                margin: "0 auto 14px",
              }}
            />

            {/* 标题与副标题 */}
            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <h3
                style={{
                  margin: "0 0 4px",
                  fontSize: "18px",
                  fontWeight: "900",
                  color: "#111827",
                  letterSpacing: "-0.3px",
                }}
              >
                你想发布什么？
              </h3>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#6B7280" }}>
                选择对应类型，让你的信息更快被杨林街坊看到
              </p>
            </div>

            {/* 4 大核心意图卡片列表 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
              {corePublishOptions.map((opt) => {
                const isRecommended = activeContextKey === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => handleOptionClick(opt.href)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 14px",
                      borderRadius: "16px",
                      background: isRecommended ? opt.themeBg : "#F9FAFB",
                      border: isRecommended ? `2px solid ${opt.borderColor}` : "1.5px solid #F3F4F6",
                      cursor: "pointer",
                      position: "relative",
                      transition: "transform 0.12s ease, box-shadow 0.12s ease",
                    }}
                  >
                    {/* 左侧大图标 */}
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: opt.iconBg,
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        flexShrink: 0,
                        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                      }}
                    >
                      {opt.icon}
                    </div>

                    {/* 文案说明 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "15px", fontWeight: "800", color: opt.titleColor }}>
                          {opt.title}
                        </span>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: "700",
                            padding: "1.5px 6px",
                            borderRadius: "10px",
                            background: isRecommended ? "#16A67A" : "rgba(0,0,0,0.06)",
                            color: isRecommended ? "#ffffff" : "#4B5563",
                          }}
                        >
                          {isRecommended ? "💡 推荐" : opt.tag}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "11.5px",
                          color: "#6B7280",
                          lineHeight: "1.4",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {opt.desc}
                      </p>
                    </div>

                    {/* 右侧箭头 */}
                    <div style={{ color: "#9CA3AF", fontSize: "16px", fontWeight: "bold" }}>
                      ›
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 其他专属频道快速直达 */}
            <div style={{ marginBottom: "16px", background: "#F8FAFC", padding: "10px 12px", borderRadius: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", marginBottom: "8px", textAlign: "left" }}>
                其他专区快捷发布
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {otherChannels.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleOptionClick(c.href)}
                    style={{
                      background: "transparent",
                      border: "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "2px",
                      cursor: "pointer",
                      padding: "4px 6px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{c.icon}</span>
                    <span style={{ fontSize: "11px", fontWeight: "600", color: "#475569" }}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 取消关闭按钮 */}
            <button
              type="button"
              onClick={() => setShowPublishSheet(false)}
              style={{
                width: "100%",
                height: "46px",
                borderRadius: "23px",
                background: "#F3F4F6",
                border: "none",
                color: "#4B5563",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              ✕ 取消
            </button>
          </div>
        </div>
      )}

      {/* 进场动画定义 */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
