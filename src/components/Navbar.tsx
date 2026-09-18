"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export interface NavbarProps {
  hideSearch?: boolean;
}

export default function Navbar({ hideSearch }: NavbarProps = {}) {
  const [open, setOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; nickname?: string; displayName?: string; avatar?: string; role: string } | null>(null);
  const pathname = usePathname();
  const isIndustrial = pathname?.startsWith("/industrial") ?? false;
  
  // 默认搜索类型：在园区招商频道默认 industrial，其它频道根据路由推断
  const initialSearchType = isIndustrial
    ? "industrial"
    : pathname?.startsWith("/jobs")
    ? "jobs"
    : pathname?.startsWith("/house")
    ? "house"
    : pathname?.startsWith("/articles")
    ? "articles"
    : pathname?.startsWith("/haodian")
    ? "haodian"
    : pathname?.startsWith("/community")
    ? "community"
    : "info";

  const [searchType, setSearchType] = useState(initialSearchType);

  // 同步路由变化
  useEffect(() => {
    if (pathname?.startsWith("/industrial")) setSearchType("industrial");
    else if (pathname?.startsWith("/jobs")) setSearchType("jobs");
    else if (pathname?.startsWith("/house")) setSearchType("house");
    else if (pathname?.startsWith("/articles")) setSearchType("articles");
    else if (pathname?.startsWith("/haodian")) setSearchType("haodian");
    else if (pathname?.startsWith("/community")) setSearchType("community");
  }, [pathname]);

  const shouldHideSearch = hideSearch ?? false;

  // 微信扫码登录弹窗状态
  const [showWechatModal, setShowWechatModal] = useState(false);
  const [qrSvg, setQrSvg] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [qrStatus, setQrStatus] = useState<"loading" | "pending" | "scanned" | "confirmed" | "expired">("loading");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.reload();
    }
  };

  // 触发微信登录
  const handleWechatLoginClick = () => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("micromessenger")) {
      // 手机微信内置浏览器：直接跳服务号网页授权
      const target = pathname && pathname !== "/login" ? pathname : "/";
      window.location.href = `/api/auth/wechat?redirect=${encodeURIComponent(target)}`;
      return;
    }
    // 电脑或普通手机浏览器：弹出微信二维码扫码登录
    openWechatModal();
  };

  const openWechatModal = useCallback(async () => {
    setShowWechatModal(true);
    setQrStatus("loading");
    setQrSvg("");
    setQrImageUrl("");
    setQrToken("");

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    try {
      const res = await fetch("/api/auth/wechat/qr", { method: "POST" });
      const data = await res.json();
      if (!data.token || (!data.svg && !data.qrImageUrl)) {
        setQrStatus("expired");
        return;
      }
      setQrToken(data.token);
      if (data.qrImageUrl) setQrImageUrl(data.qrImageUrl);
      if (data.svg) setQrSvg(data.svg);
      setQrStatus("pending");

      // 轮询检查扫码状态
      pollRef.current = setInterval(async () => {
        try {
          const checkRes = await fetch(`/api/auth/wechat/qr/check?token=${data.token}`);
          const checkData = await checkRes.json();
          if (checkData.status === "scanned") {
            setQrStatus("scanned");
          } else if (checkData.status === "confirmed") {
            setQrStatus("confirmed");
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setTimeout(() => {
              window.location.reload();
            }, 800);
          } else if (checkData.status === "expired") {
            setQrStatus("expired");
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } catch {
          // ignore poll error
        }
      }, 1500);
    } catch {
      setQrStatus("expired");
    }
  }, []);

  const closeWechatModal = () => {
    setShowWechatModal(false);
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const navItems = [
    { label: "首页", href: "/", isHome: true },
    { label: "🤖 问问AI", href: "/assistant" },
    { label: "综合信息", href: "/info" },
    { label: "求职招聘", href: "/jobs" },
    { label: "房产楼市", href: "/house" },
    { label: "园区招商", href: "/industrial" },
    { label: "本地资讯", href: "/articles" },
    { label: "自营商城", href: "/mall" },
    { label: "好店名录", href: "/haodian" },
    { label: "相亲交友", href: "/love" },
    { label: "同城活动", href: "/active" },
    { label: "社区论坛", href: "/community" },
    { label: "便民电话", href: "/bianmin" },
  ];

  const isNavActive = (item: { href: string; isHome?: boolean }) => {
    if (item.isHome) {
      return pathname === "/";
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const loginUrl =
    pathname && pathname !== "/login" && !pathname.startsWith("/login")
      ? `/login?redirect=${encodeURIComponent(pathname)}`
      : "/login";

  return (
    <>
      {/* =========================================================================
          PC 顶部小灰条 Utility Bar (桌面端专属，高度还原老站)
          ========================================================================= */}
      <div className="desktop-only" style={{ background: "#F3F4F6", borderBottom: "1px solid #E5E7EB", fontSize: "12px", color: "#6B7280" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "6px 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {user ? (
              <>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      referrerPolicy="no-referrer"
                      alt="头像"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                      style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover", border: "1px solid #D1D5DB" }}
                    />
                  ) : null}
                  <span>你好，<strong style={{ color: "#0B7A75" }}>{user.displayName || user.nickname || user.username}</strong>！欢迎来到杨林生活网</span>
                </div>
                <span style={{ color: "#D1D5DB" }}>|</span>
                <Link href={user.role === "ADMIN" ? "/admin" : "/profile"} style={{ color: "#0B7A75", fontWeight: "700" }}>
                  {user.role === "ADMIN" ? "⚙️ 进入管理后台" : "👤 个人中心"}
                </Link>
                <span style={{ color: "#D1D5DB" }}>|</span>
                <button
                  onClick={handleLogout}
                  style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "12px", padding: 0 }}
                >
                  安全退出
                </button>
              </>
            ) : (
              <>
                <span>你好，欢迎来到杨林生活网！</span>
                <Link href={loginUrl} style={{ color: "#0B7A75", fontWeight: "700" }}>请登录</Link>
                <span style={{ color: "#D1D5DB" }}>|</span>
                <Link href="/register" style={{ color: "#0B7A75" }}>免费注册</Link>
                <span style={{ color: "#D1D5DB" }}>|</span>
                {/* 微信一键登录可点击按钮 */}
                <button
                  type="button"
                  onClick={handleWechatLoginClick}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#059669",
                    fontWeight: "600",
                    fontSize: "12px",
                  }}
                  title="点击使用微信扫码一键登录"
                >
                  <span style={{ color: "#10B981" }}>🟢</span> 微信一键登录
                </button>
              </>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/" style={{ color: pathname === "/" ? "#0B7A75" : "#4B5563", fontWeight: pathname === "/" ? "700" : "500" }}>网站首页</Link>
            <Link href="/mp" style={{ color: "#2563EB", fontWeight: "700" }}>⚡ 微信小程序</Link>
            <Link href="/workspace" style={{ color: "#7C3AED", fontWeight: "700" }}>💼 工作平台</Link>
            <Link href="/categories" style={{ color: "#4B5563" }}>📱 手机端</Link>
            <Link href="/profile" style={{ color: "#4B5563" }}>👤 个人中心</Link>
            {user?.role === "ADMIN" && (
              <Link href="/admin" style={{ color: "#DC2626", fontWeight: "700" }}>⚙️ 管理员后台</Link>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          PC 顶部 Logo + 综合搜索中枢 + 我要发布按钮 (桌面端专属)
          ========================================================================= */}
      <div className="desktop-only" style={{ background: "#ffffff", padding: "18px 0 16px 0", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
          {/* 品牌 Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
            <img
              src="/images/logo/yanglin_brand_perfect_v2.png"
              alt="杨林生活网"
              style={{ height: "48px", width: "auto", objectFit: "contain", display: "block" }}
            />
          </Link>

          {/* 经典门户多频道下拉搜索中枢 (Logo、搜索、发布按钮一条线，紧凑间距 24~32px) */}
          <form
            action={searchType === "industrial" ? "/industrial" : "/search"}
            method="GET"
            style={{
              flex: 1,
              maxWidth: "580px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              background: "#ffffff",
              border: "2px solid #0B7A75",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(11, 122, 117, 0.08)",
            }}
          >
            {/* 左侧频道选择：约 110px */}
            <select
              name="type"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              style={{
                width: "108px",
                height: "100%",
                border: "none",
                outline: "none",
                background: "#F9FAFB",
                padding: "0 10px",
                fontSize: "13.5px",
                fontWeight: "700",
                color: "#1E293B",
                borderRight: "1px solid #E5E7EB",
                cursor: "pointer",
              }}
            >
              <option value="industrial">园区招商</option>
              <option value="info">全站</option>
              <option value="jobs">招聘</option>
              <option value="house">房产</option>
              <option value="haodian">商家</option>
              <option value="articles">资讯</option>
            </select>
            {/* 搜索输入：flex: 1 */}
            <input
              type="text"
              name="q"
              placeholder={
                searchType === "industrial"
                  ? "搜索园区、厂房、面积、层高、电力、行车、用途……"
                  : searchType === "jobs"
                  ? "搜索岗位、企业、薪资要求……"
                  : searchType === "house"
                  ? "搜索小区、户型、租金、商铺……"
                  : searchType === "haodian"
                  ? "搜索本地商家、美食、建材、服务……"
                  : "搜索招聘、房源、园区、商家、资讯……"
              }
              style={{
                flex: 1,
                minWidth: 0,
                height: "100%",
                border: "none",
                outline: "none",
                padding: "0 12px",
                fontSize: "13.5px",
                color: "#1F2937",
              }}
            />
            {/* 搜索按钮：90～100px */}
            <button
              type="submit"
              style={{
                width: "92px",
                height: "100%",
                background: "#0B7A75",
                color: "#ffffff",
                border: "none",
                fontSize: "14px",
                fontWeight: "800",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                flexShrink: 0,
              }}
            >
              <span>🔍</span>
              <span>搜索</span>
            </button>
          </form>

          {/* 右侧醒目【我要发布信息】 */}
          <Link
            href={isIndustrial ? "/industrial/publish" : "/publish"}
            style={{
              background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
              color: "#ffffff",
              fontWeight: "900",
              fontSize: "14.5px",
              padding: "11px 22px",
              borderRadius: "8px",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(249, 115, 22, 0.35)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span>✍️</span> 我要发布信息
          </Link>
        </div>
      </div>

      {/* =========================================================================
          PC 经典绿色主导航栏 (桌面端专属，全站所有页面统一度，防折行)
          ========================================================================= */}
      <nav className="desktop-only" style={{ background: "#0B7A75", color: "#ffffff", boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}>
        <div className="desktop-main-nav">
          {navItems.map((item, idx) => {
            const active = isNavActive(item);
            return (
              <Link
                key={idx}
                href={item.href}
                className={`desktop-main-nav-item ${active ? "active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* =========================================================================
          移动端专享沉浸式 Header (手机端专属)
          ========================================================================= */}
      <div className="mobile-only" style={{ background: "linear-gradient(135deg, #0B7A75 0%, #075E5A 100%)", color: "#ffffff", padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "#ffffff" }}>
            <span style={{ fontSize: "12px", background: "rgba(255,255,255,0.2)", padding: "2px 6px", borderRadius: "10px", fontWeight: "800" }}>📍 杨林镇</span>
            <span style={{ fontSize: "17px", fontWeight: "900" }}>杨林生活网</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* 移动端搜索展开切换按钮 */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="搜索"
              style={{ background: "none", border: "none", color: "#ffffff", fontSize: "16px", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              🔍
            </button>
            <Link href={isIndustrial ? "/industrial/publish" : "/publish"} style={{ background: "#F97316", color: "#ffffff", padding: "3px 10px", borderRadius: "14px", fontSize: "12px", fontWeight: "800", textDecoration: "none" }}>
              + 发布
            </Link>
            {user ? (
              <Link href="/profile" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    referrerPolicy="no-referrer"
                    alt="头像"
                    onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover", border: "1.5px solid #ffffff" }}
                  />
                ) : (
                  <span style={{ fontSize: "16px", color: "#ffffff" }}>👤</span>
                )}
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleWechatLoginClick}
                style={{ background: "none", border: "none", color: "#ffffff", fontSize: "13px", fontWeight: "700", padding: 0, cursor: "pointer" }}
              >
                登录
              </button>
            )}
            <button
              onClick={() => setOpen(!open)}
              aria-label="菜单"
              style={{ background: "transparent", border: "none", color: "#ffffff", fontSize: "18px", padding: 0, cursor: "pointer" }}
            >
              ☰
            </button>
          </div>
        </div>

        {/* 移动端搜索框 (在普通页面常显，在 industrial 页面支持点击搜索图标全宽展开或常态输入) */}
        {(!isIndustrial || mobileSearchOpen) && (
          <form
            action={isIndustrial ? "/industrial" : "/search"}
            method="GET"
            style={{
              display: "flex",
              background: "#ffffff",
              borderRadius: "18px",
              padding: "6px 12px",
              alignItems: "center",
              gap: "6px",
              marginTop: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            {isIndustrial && <input type="hidden" name="type" value="industrial" />}
            <span style={{ fontSize: "13px", color: "#9CA3AF" }}>🔍</span>
            <input
              name="q"
              placeholder={isIndustrial ? "搜厂房、仓库、土地、面积、园区……" : "搜招聘 / 房源 / 二手 / 好店..."}
              autoFocus={isIndustrial && mobileSearchOpen}
              style={{ border: "none", outline: "none", background: "transparent", fontSize: "13px", width: "100%", color: "#1F2937" }}
            />
            {isIndustrial && mobileSearchOpen && (
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: "12px", cursor: "pointer", padding: "0 4px" }}
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              style={{ background: "#0B7A75", border: "none", color: "#ffffff", borderRadius: "12px", padding: "3px 10px", fontSize: "12px", fontWeight: "700", cursor: "pointer", flexShrink: 0 }}
            >
              搜索
            </button>
          </form>
        )}

        {/* 移动端横滑 Tab */}
        <div style={{ display: "flex", gap: "12px", overflowX: "auto", marginTop: (!isIndustrial || mobileSearchOpen) ? "8px" : "4px", paddingBottom: "2px", scrollbarWidth: "none", fontSize: "13px", fontWeight: "700" }}>
          {navItems.map((item, i) => {
            const active = isNavActive(item);
            return (
              <Link
                key={i}
                href={item.href}
                style={{
                  color: active ? "#ffffff" : "rgba(255,255,255,0.8)",
                  borderBottom: active ? "2px solid #ffffff" : "2px solid transparent",
                  paddingBottom: "2px",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          微信快捷扫码登录弹窗 Modal
          ========================================================================= */}
      {showWechatModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeWechatModal();
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "380px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              position: "relative",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            {/* 弹窗顶部 */}
            <div
              style={{
                background: "linear-gradient(135deg, #075E5A 0%, #0B7A75 100%)",
                padding: "20px 24px",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "24px" }}>💬</span>
                <div>
                  <div style={{ fontSize: "17px", fontWeight: "900", letterSpacing: "0.5px" }}>微信快捷扫码登录</div>
                  <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "2px" }}>免密码 · 自动绑定 · 极速进入</div>
                </div>
              </div>
              <button
                onClick={closeWechatModal}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "14px",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* 弹窗内容 */}
            <div style={{ padding: "30px 24px 24px 24px", textAlign: "center" }}>
              {/* 二维码容器 */}
              <div
                style={{
                  width: "210px",
                  height: "210px",
                  margin: "0 auto 18px auto",
                  padding: "10px",
                  background: "#FAFAFA",
                  border: "2px dashed #0B7A75",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {qrStatus === "loading" && (
                  <div style={{ color: "#0B7A75", fontSize: "14px", fontWeight: "600" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>⏳</div>
                    正在生成安全登录码...
                  </div>
                )}

                {qrStatus === "pending" && (qrImageUrl || qrSvg) && (
                  qrImageUrl ? (
                    <img
                      src={qrImageUrl}
                      alt="\u5fae\u4fe1\u626b\u7801\u767b\u5f55"
                      style={{ width: "190px", height: "190px", objectFit: "contain" }}
                    />
                  ) : (
                    <div
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                      style={{ width: "190px", height: "190px" }}
                    />
                  )
                )}

                {qrStatus === "scanned" && (
                  <div style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>📱</div>
                    已成功扫码！<br />请在手机微信上点击【确认登录】
                  </div>
                )}

                {qrStatus === "confirmed" && (
                  <div style={{ color: "#16A34A", fontSize: "14px", fontWeight: "800" }}>
                    <div style={{ fontSize: "40px", marginBottom: "8px" }}>✅</div>
                    登录成功！<br />正在进入杨林生活网...
                  </div>
                )}

                {qrStatus === "expired" && (
                  <div style={{ color: "#DC2626", fontSize: "13px" }}>
                    <div style={{ fontSize: "32px", marginBottom: "6px" }}>⚠️</div>
                    二维码已失效<br />
                    <button
                      onClick={openWechatModal}
                      style={{
                        marginTop: "10px",
                        background: "#0B7A75",
                        color: "#ffffff",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      重新刷新
                    </button>
                  </div>
                )}
              </div>

              {/* 扫码指引说明 */}
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#1F2937", marginBottom: "6px" }}>
                打开手机微信，扫一扫上方二维码
              </div>
              <div style={{ fontSize: "12px", color: "#6B7280", lineHeight: "1.5" }}>
                首次登录自动注册为杨林生活网会员并赠送积分
              </div>

              {/* 底部其他登录方式链接 */}
              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "16px",
                  borderTop: "1px solid #F3F4F6",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                }}
              >
                <Link
                  href={loginUrl}
                  onClick={closeWechatModal}
                  style={{ color: "#0B7A75", fontWeight: "700", textDecoration: "none" }}
                >
                  账号密码登录 &gt;
                </Link>
                <Link
                  href="/register"
                  onClick={closeWechatModal}
                  style={{ color: "#6B7280", textDecoration: "none" }}
                >
                  没有账号？免费注册
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 移动端侧边抽屉 */}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex" }}>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ position: "relative", width: "260px", background: "#ffffff", height: "100%", zIndex: 1, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "900", color: "#0B7A75", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid #E5E7EB" }}>
                杨林生活网 · 快捷导航
              </div>
              {user && (
                <div style={{ padding: "10px 12px", background: "#F0FDF4", borderRadius: "8px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid #DCFCE7" }}>
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      referrerPolicy="no-referrer"
                      alt="头像"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                      style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", border: "1px solid #86EFAC" }}
                    />
                  ) : (
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#0B7A75", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                      {(user.displayName || user.nickname || user.username).slice(0, 1)}
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: "800", color: "#065F46", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.displayName || user.nickname || user.username}
                    </div>
                    <Link href="/profile" onClick={() => setOpen(false)} style={{ fontSize: "11px", color: "#0B7A75", fontWeight: "600", textDecoration: "none" }}>
                      进入个人中心 &gt;
                    </Link>
                  </div>
                </div>
              )}
              {!user && (
                <div style={{ padding: "10px 12px", background: "#F0FDF4", borderRadius: "8px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #DCFCE7" }}>
                  <span style={{ fontSize: "12.5px", color: "#065F46", fontWeight: 600 }}>杨林生活网会员服务</span>
                  <Link href={loginUrl} onClick={() => setOpen(false)} style={{ fontSize: "12px", color: "#0B7A75", fontWeight: "800", textDecoration: "none" }}>
                    立即登录 &gt;
                  </Link>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {navItems.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: isNavActive(item) ? "#F0FDF4" : "transparent",
                      color: isNavActive(item) ? "#0B7A75" : "#374151",
                      fontWeight: isNavActive(item) ? "800" : "500",
                      fontSize: "14px",
                      textDecoration: "none",
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div style={{ paddingTop: "14px", borderTop: "1px solid #E5E7EB", fontSize: "12px", color: "#6B7280" }}>
              <div>客服电话：13619694207</div>
              <div style={{ marginTop: "4px" }}>滇ICP备2020000102号-2</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
