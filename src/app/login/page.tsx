"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type LoginTab = "password" | "sms";

function getSafeRedirect(target: string | null | undefined): string | null {
  if (!target) return null;
  try {
    const decoded = decodeURIComponent(target).trim();
    if (
      decoded.startsWith("/") &&
      !decoded.startsWith("//") &&
      !decoded.includes("://") &&
      !decoded.startsWith("/login")
    ) {
      return decoded;
    }
  } catch {}
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || searchParams.get("returnUrl") || searchParams.get("from");
  const safeRedirect = getSafeRedirect(rawRedirect);

  const [tab, setTab] = useState<LoginTab>("password");

  // Password login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // SMS login state
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsCooldown, setSmsCooldown] = useState(0);
  const [smsSending, setSmsSending] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Common state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // QR scan login state (for desktop WeChat)
  const [showQr, setShowQr] = useState(false);
  const [qrSvg, setQrSvg] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [qrStatus, setQrStatus] = useState<
    "loading" | "pending" | "scanned" | "confirmed" | "expired"
  >("loading");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Focus state for inputs
  const [focusField, setFocusField] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wxError = params.get("error");
    if (wxError) {
      const errorMessages: Record<string, string> = {
        wechat_cancelled: "微信授权已取消",
        wechat_state_mismatch: "安全验证失败，请重试",
        wechat_not_configured: "微信登录尚未配置",
        wechat_token_failed: "微信授权失败，请重试",
        wechat_userinfo_failed: "获取微信信息失败，请重试",
        wechat_server_error: "服务器错误，请稍后再试",
      };
      setError(errorMessages[wxError] || "微信登录失败");
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const switchTab = (t: LoginTab) => {
    setTab(t);
    setError("");
  };

  /* ---- SMS 发送验证码 ---- */
  const sendSmsCode = async () => {
    if (smsSending || smsCooldown > 0) return;
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError("请输入正确的11位手机号码");
      return;
    }
    setError("");
    setSmsSending(true);

    try {
      const res = await fetch("/api/auth/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "验证码发送失败，请稍后重试");
        setSmsSending(false);
        return;
      }

      setSmsCooldown(60);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      cooldownRef.current = setInterval(() => {
        setSmsCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError("网络请求异常，请检查网络后重试");
    } finally {
      setSmsSending(false);
    }
  };

  /* ---- SMS 登录提交 ---- */
  const handleSmsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError("请输入正确的11位手机号码");
      return;
    }
    if (!/^\d{6}$/.test(smsCode)) {
      setError("请输入收到的6位数字验证码");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: smsCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const target = safeRedirect || "/profile";
        window.location.href = target;
      } else {
        setError(data.error || "验证码错误或已失效");
      }
    } catch {
      setError("网络请求异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  /* ---- 密码登录提交 ---- */
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const defaultTarget = data.user?.role === "USER" ? "/profile" : "/admin";
        const target = safeRedirect || defaultTarget;
        window.location.href = target;
      } else {
        setError(data.error || "用户名或密码错误，请核对后重试");
      }
    } catch {
      setError("网络请求异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  /* ---- 返回上一页（防死循环/防开放重定向，全网移动端与微信浏览器兼容） ---- */
  const handleBack = () => {
    if (safeRedirect) {
      window.location.href = safeRedirect;
      return;
    }
    if (typeof window !== "undefined") {
      if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
        window.history.back();
        setTimeout(() => {
          window.location.href = "/";
        }, 350);
        return;
      }
      window.location.href = "/";
    }
  };

  /* ---- 微信扫码 ---- */
  const startQrLogin = useCallback(async () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    setShowQr(true);
    setQrStatus("loading");
    setQrSvg("");
    setQrImageUrl("");
    setQrToken("");

    try {
      const res = await fetch("/api/auth/wechat/qr", { method: "POST" });
      const data = await res.json();

      if (!data.token || (!data.qrImageUrl && !data.svg)) {
        setQrStatus("expired");
        return;
      }

      setQrToken(data.token);
      if (data.qrImageUrl) setQrImageUrl(data.qrImageUrl);
      if (data.svg) setQrSvg(data.svg);
      setQrStatus("pending");

      pollRef.current = setInterval(async () => {
        try {
          const checkRes = await fetch(
            `/api/auth/wechat/qr/check?token=${data.token}`
          );
          const checkData = await checkRes.json();

          if (checkData.status === "scanned") {
            setQrStatus("scanned");
          } else if (checkData.status === "confirmed") {
            setQrStatus("confirmed");
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setTimeout(() => {
              const target = safeRedirect || "/profile";
              window.location.href = target;
            }, 800);
          } else if (checkData.status === "expired") {
            setQrStatus("expired");
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } catch {
          // Network error — keep polling
        }
      }, 2500);
    } catch {
      setQrStatus("expired");
    }
  }, [safeRedirect]);

  const closeQr = useCallback(() => {
    setShowQr(false);
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const isWeChat =
    typeof navigator !== "undefined" &&
    /MicroMessenger/i.test(navigator.userAgent);

  const handleWeChatClick = () => {
    if (isWeChat) {
      const target = safeRedirect || "/profile";
      window.location.href = `/api/auth/wechat?redirect=${encodeURIComponent(target)}`;
      return;
    }
    startQrLogin();
  };

  // 判断主按钮是否可点击
  const isPasswordFormValid = username.trim() !== "" && password.trim() !== "";
  const isSmsFormValid = /^1[3-9]\d{9}$/.test(phone) && /^\d{6}$/.test(smsCode);

  const PRIMARY = "#0F8F7B";
  const PRIMARY_LIGHT = "rgba(15, 143, 123, 0.10)";
  const BG = "#F5F7FB";
  const TEXT_PRIMARY = "#1A1A1A";
  const TEXT_SECONDARY = "#666666";
  const TEXT_MUTED = "#999999";
  const BORDER = "#E8E8E8";
  const BORDER_FOCUS = PRIMARY;
  const ERROR_RED = "#FF4D4F";
  const WECHAT_GREEN = "#07C160";

  return (
    <div
      className="login-page"
      style={{
        minHeight: "100vh",
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <style jsx>{`
        .login-brand-panel { display: none; }
        .login-topbar, .login-page-title, .login-site-footer { display: none; }
        .login-card-intro { display: none; }
        .login-mobile-topbar { display: flex; }
        @media (min-width: 768px) and (max-width: 1023px) {
          .login-page { justify-content: center; padding: 48px 24px; box-sizing: border-box; }
          .login-mobile-header { max-width: 480px !important; }
          .login-mobile-topbar { max-width: 480px !important; }
          .login-form-card { flex: initial !important; max-width: 480px !important; background: #fff; border: 1px solid #e3eaf1; border-radius: 18px; padding: 36px !important; box-shadow: 0 16px 38px rgba(15, 23, 42, .08); }
          .login-card-intro { display: block; margin-bottom: 26px; }
          .login-mobile-header { display: none; }
        }
        @media (min-width: 1024px) {
          .login-mobile-topbar { display: none !important; }
          .login-page { flex-direction: row !important; align-items: center !important; justify-content: center; gap: clamp(32px, 3.2vw, 48px); padding: 124px clamp(36px, 7vw, 150px) 94px; box-sizing: border-box; background: #f5f7fb !important; position: relative; }
          .login-topbar { display: flex !important; position: absolute; top: 0; left: 0; right: 0; height: 44px; padding: 0 clamp(36px, 7vw, 150px); align-items: center; justify-content: space-between; box-sizing: border-box; background: rgba(255,255,255,.82); border-bottom: 1px solid #e8eef3; color: #7b8794; font-size: 13px; z-index: 10; }
          .login-topbar a { color: inherit; text-decoration: none; transition: color 0.15s ease; cursor: pointer; }
          .login-topbar a:hover { color: #0F8F7B; }
          .topbar-btn { transition: opacity 0.15s ease; cursor: pointer; }
          .topbar-btn:hover { opacity: 0.8; }
          .login-page-title { display: flex !important; position: absolute; top: 68px; left: clamp(36px, 7vw, 150px); right: clamp(36px, 7vw, 150px); align-items: center; justify-content: space-between; color: #475569; font-size: 24px; font-weight: 500; }
          .login-title-identity { display: flex; align-items: center; }
          .login-title-brand { display: inline-flex; align-items: center; gap: 9px; padding-right: 20px; margin-right: 20px; border-right: 1px solid #dfe7ed; font-size: 15px; color: #173b39; font-weight: 750; }
          .login-title-brand img { width: 29px; height: 29px; object-fit: contain; }
          .login-page-title > .login-title-home { font-size: 14px; color: #0f8f7b; text-decoration: none; font-weight: 600; }
          .login-site-footer { display: block !important; position: absolute; left: clamp(36px, 7vw, 150px); right: clamp(36px, 7vw, 150px); bottom: 18px; text-align: center; color: #8a97a6; font-size: 12px; line-height: 1.7; }
          .login-site-footer nav { display: flex; justify-content: center; gap: 20px; margin-bottom: 5px; }
          .login-site-footer a { color: #64748b; text-decoration: none; }
          .login-brand-panel { width: min(60%, 748px); min-height: 520px; display: flex; flex-direction: column; justify-content: center; padding: 54px clamp(44px, 4.5vw, 68px); box-sizing: border-box; color: #fff; border-radius: 20px; background: linear-gradient(135deg, #087a70 0%, #0d9b84 50%, #22ba90 100%); position: relative; overflow: hidden; box-shadow: 0 24px 52px rgba(10, 115, 100, .18); }
          .login-brand-panel::before { content: ''; position: absolute; width: 500px; height: 500px; border-radius: 50%; right: -195px; top: -250px; border: 72px solid rgba(255,255,255,.075); }
          .login-brand-panel::after { content: ''; position: absolute; width: 460px; height: 460px; border-radius: 50%; left: -255px; bottom: -260px; border: 62px solid rgba(255,255,255,.07); }
          .brand-content { position: relative; z-index: 1; max-width: 500px; }
          .brand-logo { display: flex; align-items: center; gap: 12px; font-weight: 750; font-size: 19px; letter-spacing: -.02em; }
          .brand-logo img { width: 42px; height: 42px; object-fit: contain; border-radius: 13px; background: rgba(255,255,255,.96); padding: 3px; box-shadow: 0 8px 18px rgba(0,0,0,.1); }
          .brand-title { margin: 46px 0 16px; font-size: clamp(36px, 3.15vw, 50px); line-height: 1.16; letter-spacing: -.05em; }
          .brand-copy { margin: 0; max-width: 446px; color: rgba(255,255,255,.84); font-size: 16px; line-height: 1.8; }
          .brand-points { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 28px; }
          .brand-points span { padding: 7px 12px; border: 1px solid rgba(255,255,255,.2); border-radius: 999px; background: rgba(255,255,255,.1); backdrop-filter: blur(4px); font-size: 13px; }
          .brand-region { margin-top: 28px; color: rgba(255,255,255,.68); font-size: 13px; letter-spacing: .04em; }
          .login-mobile-header { display: none !important; }
          .login-form-card { flex: 0 0 430px !important; width: 430px !important; max-width: none !important; min-width: 400px; min-height: 520px; box-sizing: border-box; margin: 0; padding: 40px 42px 30px !important; justify-content: flex-start; align-items: stretch; background: #fff; border: 1px solid rgba(226,232,240,.9); border-radius: 18px; box-shadow: 0 20px 48px rgba(15,23,42,.10); }
          .login-card-intro { display: block; margin-top: 0; margin-bottom: 28px; }
          .login-card-intro h1 { margin: 0 0 8px; font-size: 27px; color: #152a38; letter-spacing: -.04em; }
          .login-card-intro p { margin: 0; color: #728093; font-size: 14px; }
          .third-party-divider { margin-top: 28px !important; }
        }
        @media (max-width: 767px) {
          .login-mobile-topbar { max-width: 420px !important; }
          .login-mobile-header { max-width: 420px !important; }
          .login-form-card { max-width: 420px !important; padding-left: 18px !important; padding-right: 18px !important; }
          .third-party-divider { margin-top: 28px !important; }
        }
      `}</style>
      <div className="login-topbar">
        <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
          <span>你好，请登录</span>
          <span style={{ color: "#cbd5e1" }}>·</span>
          <Link href="/register" className="topbar-link" style={{ color: "#0F8F7B", fontWeight: 600 }}>免费注册</Link>
          <span style={{ color: "#cbd5e1" }}>·</span>
          <button
            type="button"
            onClick={handleWeChatClick}
            className="topbar-btn"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "#059669",
              fontWeight: 600,
              fontSize: "13px",
            }}
            title="微信扫码登录"
          >
            <span style={{ color: "#10B981" }}>🟢</span> 微信登录
          </button>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "12px" }}>
          <Link href="/" className="topbar-link">网站首页</Link>
          <span style={{ color: "#cbd5e1" }}>｜</span>
          <Link href="/categories" className="topbar-link" title="手机端全部分类与服务">手机端</Link>
          <span style={{ color: "#cbd5e1" }}>｜</span>
          <Link href="/profile" className="topbar-link">个人中心</Link>
        </span>
      </div>
      <div className="login-page-title">
        <div className="login-title-identity"><div className="login-title-brand"><img src="/images/logo/yanglin_icon_v2_64px.png" alt="杨林生活网"/>杨林生活网</div><span>会员登录</span></div>
        <Link className="login-title-home" href="/">返回首页</Link>
      </div>
      <aside className="login-brand-panel" aria-label="杨林生活网介绍">
        <div className="brand-content">
          <div className="brand-logo"><img src="/images/logo/yanglin_icon_v2_64px.png" alt="杨林生活网"/>杨林生活网</div>
          <h1 className="brand-title">杨林人的<br/>本地生活入口</h1>
          <p className="brand-copy">找工作、找房子、找商家、看资讯、发信息，让本地生活服务更直接。</p>
          <div className="brand-points"><span>招聘</span><span>房产</span><span>商家</span><span>本地资讯</span><span>社区</span><span>便民</span></div>
          <div className="brand-region">杨林镇 · 杨林大学城 · 杨林经开区</div>
        </div>
      </aside>

      {/* ====== 移动端专属返回顶栏 ====== */}
      <header
        className="login-mobile-topbar"
        style={{
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 18px 6px",
          paddingTop: "calc(10px + env(safe-area-inset-top, 0px))",
          boxSizing: "border-box",
          background: "transparent",
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            background: "transparent",
            border: "none",
            color: "#334155",
            fontSize: "14.5px",
            fontWeight: "700",
            cursor: "pointer",
            padding: "8px 6px",
            margin: "-8px -6px",
            outline: "none",
            WebkitTapHighlightColor: "transparent",
          }}
          aria-label="返回上一页"
        >
          <ArrowLeft style={{ width: "19px", height: "19px", strokeWidth: 2.4 }} />
          <span>返回</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <img
            src="/images/logo/yanglin_icon_v2_64px.png"
            alt="杨林生活网"
            style={{ width: "22px", height: "22px", objectFit: "contain" }}
          />
          <span style={{ fontSize: "14.5px", fontWeight: "800", color: "#1E293B" }}>
            杨林生活网
          </span>
        </div>

        <Link
          href="/"
          style={{
            fontSize: "13px",
            color: PRIMARY,
            fontWeight: "700",
            textDecoration: "none",
            padding: "8px 6px",
            margin: "-8px -6px",
          }}
        >
          首页
        </Link>
      </header>

      {/* ====== 移动端品牌欢迎区域 ====== */}
      <div
        className="login-mobile-header"
        style={{
          width: "100%",
          maxWidth: "420px",
        }}
      >
        <div
          style={{
            padding: "14px 24px 18px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          {/* 欢迎语 */}
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: TEXT_PRIMARY,
              margin: "0 0 4px",
              letterSpacing: "-0.02em",
              lineHeight: "1.3",
            }}
          >
            欢迎回来
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: TEXT_SECONDARY,
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            登录杨林生活网，发现本地好服务
          </p>
        </div>
      </div>

      {/* ====== 主体区域 ====== */}
      <div
        className="login-form-card"
        style={{
          flex: 1,
          padding: "0 24px 32px",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "420px",
          boxSizing: "border-box",
        }}
      >
        <div className="login-card-intro">
          <h1>欢迎回来</h1>
          <p>登录杨林生活网，发现本地好服务</p>
        </div>
        {/* Tab 切换器 */}
        <div
          style={{
            display: "flex",
            gap: "0",
            marginBottom: "28px",
            position: "relative",
          }}
        >
          {[
            { key: "password" as LoginTab, label: "账号登录" },
            { key: "sms" as LoginTab, label: "手机验证码" },
          ].map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => switchTab(t.key)}
                style={{
                  flex: "none",
                  padding: "10px 0",
                  marginRight: "32px",
                  border: "none",
                  borderBottom: `2px solid ${active ? PRIMARY : "transparent"}`,
                  fontSize: "16px",
                  fontWeight: active ? "700" : "400",
                  color: active ? TEXT_PRIMARY : TEXT_MUTED,
                  background: "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 错误提示 */}
        {error && (
          <div
            style={{
              background: "#FFF2F0",
              border: "1px solid #FFCCC7",
              color: ERROR_RED,
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "500",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              lineHeight: "1.4",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="8" cy="8" r="7" stroke={ERROR_RED} strokeWidth="1.5" />
              <path d="M8 4.5V9" stroke={ERROR_RED} strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11.5" r="0.75" fill={ERROR_RED} />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ====== 账号密码登录 ====== */}
        {tab === "password" && (
          <form
            onSubmit={handlePasswordLogin}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* 用户名输入 */}
            <div>
              <div
                style={{
                  position: "relative",
                  height: "48px",
                  borderRadius: "12px",
                  border: `1px solid ${focusField === "username" ? BORDER_FOCUS : BORDER}`,
                  background: "#FFFFFF",
                  transition: "all 0.2s ease",
                  boxShadow: focusField === "username" ? `0 0 0 2px ${PRIMARY_LIGHT}` : "none",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                >
                  <circle cx="9" cy="5.5" r="3.5" stroke={focusField === "username" ? PRIMARY : "#C0C0C0"} strokeWidth="1.5" />
                  <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke={focusField === "username" ? PRIMARY : "#C0C0C0"} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名或手机号"
                  onFocus={() => setFocusField("username")}
                  onBlur={() => setFocusField(null)}
                  style={{
                    width: "100%",
                    height: "100%",
                    padding: "0 16px 0 42px",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "15px",
                    color: TEXT_PRIMARY,
                    background: "transparent",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div>
              <div
                style={{
                  position: "relative",
                  height: "48px",
                  borderRadius: "12px",
                  border: `1px solid ${focusField === "password" ? BORDER_FOCUS : BORDER}`,
                  background: "#FFFFFF",
                  transition: "all 0.2s ease",
                  boxShadow: focusField === "password" ? `0 0 0 2px ${PRIMARY_LIGHT}` : "none",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                >
                  <rect x="3" y="8" width="12" height="8" rx="2" stroke={focusField === "password" ? PRIMARY : "#C0C0C0"} strokeWidth="1.5" />
                  <path d="M6 8V5.5a3 3 0 016 0V8" stroke={focusField === "password" ? PRIMARY : "#C0C0C0"} strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="9" cy="12.5" r="1" fill={focusField === "password" ? PRIMARY : "#C0C0C0"} />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入登录密码"
                  onFocus={() => setFocusField("password")}
                  onBlur={() => setFocusField(null)}
                  style={{
                    width: "100%",
                    height: "100%",
                    padding: "0 46px 0 42px",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "15px",
                    color: TEXT_PRIMARY,
                    background: "transparent",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    outline: "none",
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M2.5 10s3-6 7.5-6 7.5 6 7.5 6-3 6-7.5 6S2.5 10 2.5 10z" stroke="#999" strokeWidth="1.5" />
                      <circle cx="10" cy="10" r="2.5" stroke="#999" strokeWidth="1.5" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M2.5 10s3-6 7.5-6 7.5 6 7.5 6-3 6-7.5 6S2.5 10 2.5 10z" stroke="#C0C0C0" strokeWidth="1.5" />
                      <circle cx="10" cy="10" r="2.5" stroke="#C0C0C0" strokeWidth="1.5" />
                      <line x1="3" y1="3" x2="17" y2="17" stroke="#C0C0C0" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>
              <div style={{ textAlign: "right", marginTop: "8px" }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setError("如忘记密码，请使用手机验证码直接登录或联系客服");
                  }}
                  style={{
                    fontSize: "13px",
                    color: PRIMARY,
                    textDecoration: "none",
                    fontWeight: "500",
                  }}
                >
                  忘记密码？
                </a>
              </div>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading || !isPasswordFormValid}
              style={{
                width: "100%",
                height: "48px",
                background: loading || !isPasswordFormValid ? "#9CCFC5" : PRIMARY,
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading || !isPasswordFormValid ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                letterSpacing: "0.02em",
              }}
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>
        )}

        {/* ====== 手机验证码登录 ====== */}
        {tab === "sms" && (
          <form
            onSubmit={handleSmsLogin}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* 手机号 */}
            <div
              style={{
                position: "relative",
                height: "48px",
                borderRadius: "12px",
                border: `1px solid ${focusField === "phone" ? BORDER_FOCUS : BORDER}`,
                background: "#FFFFFF",
                transition: "all 0.2s ease",
                boxShadow: focusField === "phone" ? `0 0 0 2px ${PRIMARY_LIGHT}` : "none",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <rect x="4.5" y="1.5" width="9" height="15" rx="2" stroke={focusField === "phone" ? PRIMARY : "#C0C0C0"} strokeWidth="1.5" />
                <line x1="7" y1="14" x2="11" y2="14" stroke={focusField === "phone" ? PRIMARY : "#C0C0C0"} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="请输入手机号"
                maxLength={11}
                onFocus={() => setFocusField("phone")}
                onBlur={() => setFocusField(null)}
                style={{
                  width: "100%",
                  height: "100%",
                  padding: "0 16px 0 42px",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  color: TEXT_PRIMARY,
                  background: "transparent",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* 验证码 */}
            <div style={{ display: "flex", gap: "12px" }}>
              <div
                style={{
                  flex: 1,
                  position: "relative",
                  height: "48px",
                  borderRadius: "12px",
                  border: `1px solid ${focusField === "smsCode" ? BORDER_FOCUS : BORDER}`,
                  background: "#FFFFFF",
                  transition: "all 0.2s ease",
                  boxShadow: focusField === "smsCode" ? `0 0 0 2px ${PRIMARY_LIGHT}` : "none",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                >
                  <path d="M9 1.5L3 4v4.5c0 4 2.5 6.5 6 8 3.5-1.5 6-4 6-8V4L9 1.5z" stroke={focusField === "smsCode" ? PRIMARY : "#C0C0C0"} strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M6.5 9.5l2 2 3.5-4" stroke={focusField === "smsCode" ? PRIMARY : "#C0C0C0"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="text"
                  required
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="验证码"
                  maxLength={6}
                  inputMode="numeric"
                  onFocus={() => setFocusField("smsCode")}
                  onBlur={() => setFocusField(null)}
                  style={{
                    width: "100%",
                    height: "100%",
                    padding: "0 16px 0 42px",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "15px",
                    color: TEXT_PRIMARY,
                    background: "transparent",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={sendSmsCode}
                disabled={smsSending || smsCooldown > 0}
                style={{
                  height: "48px",
                  padding: "0 16px",
                  background: smsSending || smsCooldown > 0 ? "#F5F5F5" : PRIMARY_LIGHT,
                  color: smsSending || smsCooldown > 0 ? TEXT_MUTED : PRIMARY,
                  border: `1px solid ${smsSending || smsCooldown > 0 ? BORDER : "rgba(15, 143, 123, 0.24)"}`,
                  borderRadius: "12px",
                  cursor: smsSending || smsCooldown > 0 ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  minWidth: "108px",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
              >
                {smsSending
                  ? "发送中..."
                  : smsCooldown > 0
                    ? `${smsCooldown}s`
                    : "获取验证码"}
              </button>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading || !isSmsFormValid}
              style={{
                width: "100%",
                height: "48px",
                background: loading || !isSmsFormValid ? "#9CCFC5" : PRIMARY,
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading || !isSmsFormValid ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                letterSpacing: "0.02em",
              }}
            >
              {loading ? "验证中..." : "登录"}
            </button>

            <p
              style={{
                fontSize: "12px",
                color: TEXT_MUTED,
                textAlign: "center",
                margin: "0",
              }}
            >
              未注册手机号验证通过后将自动创建账号
            </p>
          </form>
        )}

        {/* ====== 其他登录方式分隔线 ====== */}
        <div
          className="third-party-divider"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            margin: "32px 0 20px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#E8E8E8" }} />
          <span
            style={{
              fontSize: "13px",
              color: TEXT_MUTED,
              whiteSpace: "nowrap",
            }}
          >
            其他登录方式
          </span>
          <div style={{ flex: 1, height: "1px", background: "#E8E8E8" }} />
        </div>

        {/* ====== 微信快捷登录 ====== */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <button
            type="button"
            onClick={handleWeChatClick}
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: WECHAT_GREEN,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(7, 193, 96, 0.25)",
              transition: "transform 0.15s ease",
              outline: "none",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.13 6.13 0 0 1-.246-1.72c0-3.56 3.143-6.45 7.02-6.45.233 0 .462.015.69.032C16.058 4.738 12.667 2.188 8.691 2.188zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.97 2.885c-3.47 0-6.287 2.588-6.287 5.783 0 3.195 2.817 5.784 6.287 5.784.618 0 1.222-.085 1.804-.246a.714.714 0 0 1 .574.079l1.523.89a.263.263 0 0 0 .135.044c.13 0 .233-.108.233-.236 0-.058-.023-.114-.039-.17l-.312-1.183a.477.477 0 0 1 .171-.533c1.463-1.076 2.399-2.67 2.399-4.429 0-3.195-2.817-5.783-6.288-5.783zm-2.154 3.07c.516 0 .934.424.934.946a.94.94 0 0 1-.934.946.94.94 0 0 1-.935-.946c0-.522.418-.946.935-.946zm4.307 0c.516 0 .934.424.934.946a.94.94 0 0 1-.934.946.94.94 0 0 1-.935-.946c0-.522.418-.946.935-.946z" />
            </svg>
          </button>
          <span style={{ fontSize: "12px", color: TEXT_SECONDARY }}>
            {isWeChat ? "微信快捷登录" : "微信扫码登录"}
          </span>
        </div>

        {/* ====== 底部注册引导 ====== */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "36px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: TEXT_SECONDARY,
              marginBottom: "16px",
            }}
          >
            可使用账号密码或手机验证码登录
          </div>

          {/* 用户协议 */}
          <div
            style={{
              fontSize: "12px",
              color: TEXT_MUTED,
              lineHeight: "1.6",
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
            }}
          >
            登录即代表您已同意{" "}
            <Link
              href="/articles/user-agreement"
              style={{ color: TEXT_SECONDARY, textDecoration: "underline" }}
            >
              《用户协议》
            </Link>{" "}
            与{" "}
            <Link
              href="/articles/privacy-policy"
              style={{ color: TEXT_SECONDARY, textDecoration: "underline" }}
            >
              《隐私政策》
            </Link>
          </div>

          {/* 移动端底部返回网站首页 */}
          <div style={{ marginTop: "14px", marginBottom: "4px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#0B7A75",
                background: "#E6F4F3",
                padding: "6px 14px",
                borderRadius: "20px",
                textDecoration: "none",
              }}
            >
              <ArrowLeft style={{ width: "13px", height: "13px" }} />
              <span>返回网站首页</span>
            </Link>
          </div>

          <div
            style={{
              fontSize: "11px",
              color: "#D1D5DB",
              marginTop: "8px",
            }}
          >
            © {new Date().getFullYear()} 杨林生活网
          </div>
        </div>
      </div>
      <footer className="login-site-footer">
        <nav><Link href="/">网站首页</Link><Link href="/jobs">招聘信息</Link><Link href="/house">房产楼市</Link><Link href="/contact">联系我们</Link><Link href="/articles/user-agreement">服务条款</Link></nav>
        <div>杨林生活网，为杨林镇、杨林大学城和杨林经开区提供本地生活服务。</div>
        <div>© {new Date().getFullYear()} 杨林生活网　滇ICP备2022000102号-2</div>
      </footer>

      {/* ====== 微信扫码弹窗（桌面端） ====== */}
      {showQr && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeQr();
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              padding: "32px 28px",
              maxWidth: "360px",
              width: "100%",
              textAlign: "center",
              position: "relative",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
            }}
          >
            <button
              onClick={closeQr}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "#F5F5F5",
                border: "none",
                fontSize: "16px",
                color: "#999",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                outline: "none",
              }}
            >
              ×
            </button>

            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: WECHAT_GREEN,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.13 6.13 0 0 1-.246-1.72c0-3.56 3.143-6.45 7.02-6.45.233 0 .462.015.69.032C16.058 4.738 12.667 2.188 8.691 2.188zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.97 2.885c-3.47 0-6.287 2.588-6.287 5.783 0 3.195 2.817 5.784 6.287 5.784.618 0 1.222-.085 1.804-.246a.714.714 0 0 1 .574.079l1.523.89a.263.263 0 0 0 .135.044c.13 0 .233-.108.233-.236 0-.058-.023-.114-.039-.17l-.312-1.183a.477.477 0 0 1 .171-.533c1.463-1.076 2.399-2.67 2.399-4.429 0-3.195-2.817-5.783-6.288-5.783zm-2.154 3.07c.516 0 .934.424.934.946a.94.94 0 0 1-.934.946.94.94 0 0 1-.935-.946c0-.522.418-.946.935-.946zm4.307 0c.516 0 .934.424.934.946a.94.94 0 0 1-.934.946.94.94 0 0 1-.935-.946c0-.522.418-.946.935-.946z" />
              </svg>
            </div>

            <h3
              style={{
                fontSize: "17px",
                fontWeight: "700",
                color: TEXT_PRIMARY,
                margin: "0 0 4px",
              }}
            >
              微信扫码登录
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: TEXT_MUTED,
                margin: "0 0 20px",
              }}
            >
              请使用微信扫描下方二维码
            </p>

            <div
              style={{
                width: "200px",
                height: "200px",
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#FAFAFA",
                borderRadius: "14px",
                border: "1px solid #F0F0F0",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {qrStatus === "loading" && (
                <div style={{ color: TEXT_MUTED, fontSize: "13px" }}>
                  正在生成...
                </div>
              )}

              {qrStatus === "pending" && (qrImageUrl || qrSvg) && (
                qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="微信扫码登录"
                    style={{
                      width: "180px",
                      height: "180px",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                    style={{
                      width: "180px",
                      height: "180px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                )
              )}

              {qrStatus === "scanned" && (
                <div style={{ textAlign: "center", padding: "16px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>📱</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: WECHAT_GREEN }}>
                    扫描成功
                  </div>
                  <div style={{ fontSize: "12px", color: TEXT_MUTED, marginTop: "4px" }}>
                    请在微信中确认登录
                  </div>
                </div>
              )}

              {qrStatus === "confirmed" && (
                <div style={{ textAlign: "center", padding: "16px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: WECHAT_GREEN }}>
                    授权成功
                  </div>
                  <div style={{ fontSize: "12px", color: TEXT_MUTED, marginTop: "4px" }}>
                    正在跳转...
                  </div>
                </div>
              )}

              {qrStatus === "expired" && (
                <div style={{ textAlign: "center", padding: "16px" }}>
                  <div style={{ fontSize: "13px", color: ERROR_RED, fontWeight: "600", marginBottom: "10px" }}>
                    二维码已过期
                  </div>
                  <button
                    type="button"
                    onClick={startQrLogin}
                    style={{
                      padding: "6px 16px",
                      background: PRIMARY,
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    点击刷新
                  </button>
                </div>
              )}
            </div>

            <div style={{ fontSize: "12px", color: TEXT_MUTED }}>
              首次登录将自动注册账号
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
