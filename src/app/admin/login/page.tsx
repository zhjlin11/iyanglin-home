"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        window.location.href = "/admin";
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || "账号或密码错误，请检查输入");
      }
    } catch {
      setErrorMsg("网络请求异常，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #075e5a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "rgba(30, 41, 59, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
          padding: "2.5rem 2rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          boxSizing: "border-box",
        }}
      >
        {/* Header Icon & Title */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #0b7a75 0%, #149990 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              fontSize: "32px",
              boxShadow: "0 10px 25px rgba(11, 122, 117, 0.4)",
            }}
          >
            🛡️
          </div>
          <h1 style={{ color: "#ffffff", fontSize: "24px", fontWeight: "800", margin: "0 0 6px 0" }}>
            杨林生活网 · 管理后台
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
            请登录系统管理员账号以管理站点服务与数据
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fca5a5",
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: "13.5px",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", color: "#cbd5e1", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
              👤 管理员账号
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入管理员账号 (如 admin)"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(15, 23, 42, 0.6)",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "all 0.2s",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", color: "#cbd5e1", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
              🔒 登录密码
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入登录密码"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(15, 23, 42, 0.6)",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "all 0.2s",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: "12px",
              border: "none",
              background: loading ? "#64748b" : "linear-gradient(135deg, #0b7a75 0%, #149990 100%)",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 10px 20px rgba(11, 122, 117, 0.3)",
              marginTop: "0.5rem",
              transition: "all 0.2s",
            }}
          >
            {loading ? "正在验证登录..." : "安全登录管理后台 →"}
          </button>
        </form>

        {/* Footer Links */}
        <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)", textAlign: "center", display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
          <Link href="/" style={{ color: "#94a3b8", textDecoration: "none" }}>
            ← 返回网站首页
          </Link>
          <span style={{ color: "#64748b" }}>
            杨林生活网 v3.0
          </span>
        </div>
      </div>
    </main>
  );
}
