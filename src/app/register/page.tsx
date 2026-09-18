"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

type RegisterTab = "account" | "sms";

export default function RegisterPage() {
  const [tab, setTab] = useState<RegisterTab>("account");

  // Account register state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // SMS register state
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsCooldown, setSmsCooldown] = useState(0);
  const [smsSending, setSmsSending] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Common state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // WeChat QR modal state
  const [showQr, setShowQr] = useState(false);
  const [qrSvg, setQrSvg] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [qrStatus, setQrStatus] = useState<
    "loading" | "pending" | "scanned" | "confirmed" | "expired"
  >("loading");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const switchTab = (t: RegisterTab) => {
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

  /* ---- SMS 快捷注册提交 ---- */
  const handleSmsRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("请勾选同意《用户服务协议》与《隐私保护指引》");
      return;
    }
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
        window.location.href = "/profile";
      } else {
        setError(data.error || "验证码错误或已失效");
      }
    } catch {
      setError("网络请求异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  /* ---- 账号密码注册提交 ---- */
  const handleAccountRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("请勾选同意《用户服务协议》与《隐私保护指引》");
      return;
    }
    if (username.trim().length < 2) {
      setError("用户名至少2个字符");
      return;
    }
    if (password.length < 6) {
      setError("登录密码至少需要6位字符");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致，请核对");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        window.location.href = "/profile";
      } else {
        setError(data.error || "注册失败，该用户名可能已被占用");
      }
    } catch {
      setError("网络请求异常，请稍后重试");
    } finally {
      setLoading(false);
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
              window.location.href = "/profile";
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
  }, []);

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

  const handleWeChatClick = (e: React.MouseEvent) => {
    if (isWeChat) {
      window.location.href = "/api/auth/wechat";
      return;
    }
    e.preventDefault();
    startQrLogin();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #f0fdfa 0%, #e6f4f3 35%, #f8fafc 100%)" }}>
      <Navbar />

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px 80px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "960px",
            background: "#ffffff",
            borderRadius: "28px",
            boxShadow: "0 25px 60px -15px rgba(11, 122, 117, 0.15), 0 0 0 1px rgba(226, 232, 240, 0.8)",
            display: "flex",
            flexWrap: "wrap",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* 左侧：新用户专属权益与品牌氛围卡片 */}
          <div
            className="register-brand-panel"
            style={{
              flex: "1 1 420px",
              background: "linear-gradient(145deg, #0b7a75 0%, #075e5a 100%)",
              padding: "48px 40px",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* 装饰光斑 */}
            <div
              style={{
                position: "absolute",
                top: "-20%",
                right: "-20%",
                width: "280px",
                height: "280px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255) 70%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-15%",
                left: "-15%",
                width: "240px",
                height: "240px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(255,255,255,0) 70%)",
                pointerEvents: "none",
              }}
            />

            {/* 顶部权益介绍 */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(8px)", padding: "6px 14px", borderRadius: "20px", fontSize: "12.5px", fontWeight: "700", marginBottom: "20px", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
                <span>✨ 新会员专属特权与保障</span>
              </div>

              <h2 style={{ fontSize: "28px", fontWeight: "900", lineHeight: "1.3", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
                加入杨林生活网<br />
                <span style={{ color: "#a7f3d0", fontSize: "22px", fontWeight: "700" }}>享受杨林全城便民服务</span>
              </h2>

              <p style={{ fontSize: "14px", color: "#e6f4f3", lineHeight: "1.6", margin: "0 0 32px" }}>
                免费发布便民资讯、租房求职直联房东与HR、结识同城真实好友。
              </p>

              {/* 4 大新会员权益胶囊 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  { icon: "🎁", title: "全免费信息发布", desc: "招聘、房屋出租、二手闲置、顺风拼车零门槛免费发" },
                  { icon: "⚡", title: "同城极速精准曝光", desc: "覆盖杨林经开区与大学城数万师生居民精准触达" },
                  { icon: "📱", title: "一键电话直联沟通", desc: "查看真实联系电话，极速达成合作与招工招租" },
                  { icon: "🛡️", title: "官方实名安全防护", desc: "全站敏感信息过滤，杜绝骚扰与虚假诈骗" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(10px)",
                      padding: "12px 16px",
                      borderRadius: "14px",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "rgba(255, 255, 255, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: "#ffffff" }}>{item.title}</div>
                      <div style={{ fontSize: "12px", color: "#d1fae5", marginTop: "2px" }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 底部保障与统计 */}
            <div style={{ position: "relative", zIndex: 1, marginTop: "36px", paddingTop: "20px", borderTop: "1px solid rgba(255, 255, 255, 0.15)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#a7f3d0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🔒</span>
                <span>平台严格隐私加密</span>
              </div>
              <div style={{ fontWeight: "700" }}>4,490+ 真实会员已加入</div>
            </div>
          </div>

          {/* 右侧：注册操作面板 */}
          <div
            style={{
              flex: "1 1 420px",
              padding: "44px 36px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: "320px",
              boxSizing: "border-box",
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #0b7a75 0%, #10b981 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "900",
                    fontSize: "18px",
                    boxShadow: "0 4px 10px rgba(11, 122, 117, 0.2)",
                  }}
                >
                  杨
                </div>
                <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                  用户注册
                </h1>
              </div>
              <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
                创建您的专属账号，畅享杨林本地智慧生活服务
              </p>
            </div>

            {/* Tab 切换 */}
            <div
              style={{
                display: "flex",
                background: "#f1f5f9",
                padding: "4px",
                borderRadius: "12px",
                marginBottom: "20px",
                gap: "4px",
              }}
            >
              {[
                { key: "account", label: "📝 账号密码注册" },
                { key: "sms", label: "📱 手机验证码注册" },
              ].map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => switchTab(t.key as RegisterTab)}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      border: "none",
                      borderRadius: "9px",
                      fontSize: "13px",
                      fontWeight: active ? "800" : "600",
                      color: active ? "#0B7A75" : "#64748b",
                      background: active ? "#ffffff" : "transparent",
                      boxShadow: active ? "0 2px 6px rgba(15, 23, 42, 0.08)" : "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* 错误提示条 */}
            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  marginBottom: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* ====== 1. 账号密码注册 ====== */}
            {tab === "account" && (
              <form onSubmit={handleAccountRegister} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "5px" }}>
                    用户名 / 昵称
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "15px" }}>
                      👤
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="设置您的账号或个性昵称"
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 16px 0 40px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "12px",
                        fontSize: "14px",
                        color: "#0f172a",
                        outline: "none",
                        transition: "all 0.15s",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "#0B7A75"; e.target.style.boxShadow = "0 0 0 3px rgba(11, 122, 117, 0.15)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "5px" }}>
                    设置登录密码
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "15px" }}>
                      🔒
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="至少6位密码"
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 44px 0 40px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "12px",
                        fontSize: "14px",
                        color: "#0f172a",
                        outline: "none",
                        transition: "all 0.15s",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "#0B7A75"; e.target.style.boxShadow = "0 0 0 3px rgba(11, 122, 117, 0.15)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
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
                        fontSize: "16px",
                        color: "#94a3b8",
                        padding: "4px",
                      }}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "5px" }}>
                    确认登录密码
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "15px" }}>
                      🔐
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入上述密码"
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 44px 0 40px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "12px",
                        fontSize: "14px",
                        color: "#0f172a",
                        outline: "none",
                        transition: "all 0.15s",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "#0B7A75"; e.target.style.boxShadow = "0 0 0 3px rgba(11, 122, 117, 0.15)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        color: "#94a3b8",
                        padding: "4px",
                      }}
                    >
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {/* 勾选协议 */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "#64748b", cursor: "pointer", margin: "4px 0" }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{ marginTop: "2px", accentColor: "#0B7A75" }}
                  />
                  <span>
                    我已阅读并同意{" "}
                    <Link href="/articles/user-agreement" style={{ color: "#0B7A75", textDecoration: "underline" }} target="_blank">
                      《用户服务协议》
                    </Link>{" "}
                    与{" "}
                    <Link href="/articles/privacy-policy" style={{ color: "#0B7A75", textDecoration: "underline" }} target="_blank">
                      《隐私保护指引》
                    </Link>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: "46px",
                    background: "linear-gradient(135deg, #0b7a75 0%, #075e5a 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: "800",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(11, 122, 117, 0.3)",
                    marginTop: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {loading ? "正在创建账号..." : "立即注册账号 →"}
                </button>
              </form>
            )}

            {/* ====== 2. 手机验证码快捷注册 ====== */}
            {tab === "sms" && (
              <form onSubmit={handleSmsRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    手机号码
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "15px" }}>
                      📱
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="请输入11位中国大陆手机号"
                      maxLength={11}
                      style={{
                        width: "100%",
                        height: "46px",
                        padding: "0 16px 0 40px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "12px",
                        fontSize: "14px",
                        color: "#0f172a",
                        outline: "none",
                        transition: "all 0.15s",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "#0B7A75"; e.target.style.boxShadow = "0 0 0 3px rgba(11, 122, 117, 0.15)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    短信验证码
                  </label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "15px" }}>
                        🛡️
                      </span>
                      <input
                        type="text"
                        required
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="请输入6位验证码"
                        maxLength={6}
                        inputMode="numeric"
                        style={{
                          width: "100%",
                          height: "46px",
                          padding: "0 16px 0 40px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "12px",
                          fontSize: "14px",
                          color: "#0f172a",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                        onFocus={(e) => { e.target.style.borderColor = "#0B7A75"; e.target.style.boxShadow = "0 0 0 3px rgba(11, 122, 117, 0.15)"; }}
                        onBlur={(e) => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={sendSmsCode}
                      disabled={smsSending || smsCooldown > 0}
                      style={{
                        height: "46px",
                        padding: "0 16px",
                        background: smsSending || smsCooldown > 0 ? "#e2e8f0" : "#e6f4f3",
                        color: smsSending || smsCooldown > 0 ? "#94a3b8" : "#0B7A75",
                        border: smsSending || smsCooldown > 0 ? "1px solid #cbd5e1" : "1px solid #9bd5cc",
                        borderRadius: "12px",
                        cursor: smsSending || smsCooldown > 0 ? "not-allowed" : "pointer",
                        fontSize: "13px",
                        fontWeight: "700",
                        whiteSpace: "nowrap",
                        minWidth: "110px",
                        transition: "all 0.15s",
                      }}
                    >
                      {smsSending
                        ? "发送中..."
                        : smsCooldown > 0
                          ? `${smsCooldown}s 后重发`
                          : "获取验证码"}
                    </button>
                  </div>
                </div>

                {/* 勾选协议 */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "#64748b", cursor: "pointer", margin: "2px 0" }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{ marginTop: "2px", accentColor: "#0B7A75" }}
                  />
                  <span>
                    我已阅读并同意{" "}
                    <Link href="/articles/user-agreement" style={{ color: "#0B7A75", textDecoration: "underline" }} target="_blank">
                      《用户服务协议》
                    </Link>{" "}
                    与{" "}
                    <Link href="/articles/privacy-policy" style={{ color: "#0B7A75", textDecoration: "underline" }} target="_blank">
                      《隐私保护指引》
                    </Link>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: "46px",
                    background: "linear-gradient(135deg, #0b7a75 0%, #075e5a 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: "800",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(11, 122, 117, 0.3)",
                    marginTop: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {loading ? "正在验证创建..." : "验证手机号并完成注册 →"}
                </button>
              </form>
            )}

            {/* 第三方快捷注册/登录通道 */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0 16px" }}>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>或使用微信一键授权注册</span>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            </div>

            <button
              type="button"
              onClick={handleWeChatClick}
              style={{
                width: "100%",
                height: "44px",
                background: "#f0fdf4",
                color: "#166534",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "13.5px",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#dcfce7"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0fdf4"; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#07c160">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.13 6.13 0 0 1-.246-1.72c0-3.56 3.143-6.45 7.02-6.45.233 0 .462.015.69.032C16.058 4.738 12.667 2.188 8.691 2.188zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.97 2.885c-3.47 0-6.287 2.588-6.287 5.783 0 3.195 2.817 5.784 6.287 5.784.618 0 1.222-.085 1.804-.246a.714.714 0 0 1 .574.079l1.523.89a.263.263 0 0 0 .135.044c.13 0 .233-.108.233-.236 0-.058-.023-.114-.039-.17l-.312-1.183a.477.477 0 0 1 .171-.533c1.463-1.076 2.399-2.67 2.399-4.429 0-3.195-2.817-5.783-6.288-5.783zm-2.154 3.07c.516 0 .934.424.934.946a.94.94 0 0 1-.934.946.94.94 0 0 1-.935-.946c0-.522.418-.946.935-.946zm4.307 0c.516 0 .934.424.934.946a.94.94 0 0 1-.934.946.94.94 0 0 1-.935-.946c0-.522.418-.946.935-.946z" />
              </svg>
              <span>微信扫码 / 一键快捷注册</span>
            </button>

            {/* 登录引导 */}
            <div style={{ marginTop: "24px", textAlign: "center", fontSize: "13.5px", color: "#64748b" }}>
              已有杨林生活网账号？{" "}
              <Link href="/login" style={{ color: "#0B7A75", fontWeight: "800", textDecoration: "none" }}>
                直接登录 →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 微信扫码登录/注册专属弹窗 */}
      {showQr && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
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
              background: "#ffffff",
              borderRadius: "24px",
              padding: "36px 32px",
              maxWidth: "380px",
              width: "100%",
              textAlign: "center",
              position: "relative",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.25)",
            }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={closeQr}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#f1f5f9",
                border: "none",
                fontSize: "18px",
                color: "#64748b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>

            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "16px",
                background: "#07c160",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.13 6.13 0 0 1-.246-1.72c0-3.56 3.143-6.45 7.02-6.45.233 0 .462.015.69.032C16.058 4.738 12.667 2.188 8.691 2.188zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.97 2.885c-3.47 0-6.287 2.588-6.287 5.783 0 3.195 2.817 5.784 6.287 5.784.618 0 1.222-.085 1.804-.246a.714.714 0 0 1 .574.079l1.523.89a.263.263 0 0 0 .135.044c.13 0 .233-.108.233-.236 0-.058-.023-.114-.039-.17l-.312-1.183a.477.477 0 0 1 .171-.533c1.463-1.076 2.399-2.67 2.399-4.429 0-3.195-2.817-5.783-6.288-5.783zm-2.154 3.07c.516 0 .934.424.934.946a.94.94 0 0 1-.934.946.94.94 0 0 1-.935-.946c0-.522.418-.946.935-.946zm4.307 0c.516 0 .934.424.934.946a.94.94 0 0 1-.934.946.94.94 0 0 1-.935-.946c0-.522.418-.946.935-.946z" />
              </svg>
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", margin: "0 0 6px" }}>
              微信扫码一键注册 / 登录
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
              请使用微信 App 扫描下方二维码授权直接创建账号
            </p>

            {/* 二维码容器 */}
            <div
              style={{
                width: "200px",
                height: "200px",
                margin: "0 auto 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8fafc",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {qrStatus === "loading" && (
                <div style={{ color: "#64748b", fontSize: "13px" }}>
                  ⏳ 正在生成二维码...
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
                    style={{ width: "180px", height: "180px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  />
                )
              )}

              {qrStatus === "scanned" && (
                <div style={{ textAlign: "center", padding: "16px" }}>
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>📱</div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#07c160" }}>已在手机端扫码</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>请在手机微信上点击【确认授权】</div>
                </div>
              )}

              {qrStatus === "confirmed" && (
                <div style={{ textAlign: "center", padding: "16px" }}>
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>✅</div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#07c160" }}>注册并授权成功</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>正在为您跳转...</div>
                </div>
              )}

              {qrStatus === "expired" && (
                <div style={{ textAlign: "center", padding: "16px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "6px" }}>⌛</div>
                  <div style={{ fontSize: "13px", color: "#ef4444", fontWeight: "700", marginBottom: "8px" }}>二维码已过期</div>
                  <button
                    type="button"
                    onClick={startQrLogin}
                    style={{
                      padding: "6px 14px",
                      background: "#0B7A75",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    🔄 刷新二维码
                  </button>
                </div>
              )}
            </div>

            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
              💡 首次扫码将自动为您创建杨林生活网账号并同步微信头像
            </div>
          </div>
        </div>
      )}

      {/* 响应式样式注入 */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .register-brand-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
