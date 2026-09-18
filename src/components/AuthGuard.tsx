"use client";

import { useEffect, useState, ReactNode } from "react";
import Navbar from "@/components/Navbar";

interface AuthGuardProps {
  children: ReactNode;
  pageTitle?: string;
  requiredRole?: string[];
}

export default function AuthGuard({ children, pageTitle = "发布信息", requiredRole }: AuthGuardProps) {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => {
        if (!res.ok) throw new Error("unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          if (requiredRole && requiredRole.length > 0 && !requiredRole.includes(data.user.role)) {
            setUser(null);
          } else {
            setUser(data.user);
          }
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setChecking(false);
      });
  }, [requiredRole]);

  if (checking) {
    return (
      <main className="page-layout">
        <Navbar />
        <div style={{ maxWidth: "600px", margin: "4rem auto", padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "1rem" }} className="animate-spin">
            ⏳
          </div>
          <p style={{ color: "#64748b", fontSize: "14px", fontWeight: "600" }}>正在校验用户登录状态，请稍候...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    const redirectUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;

    return (
      <main className="page-layout">
        <Navbar />
        <div
          style={{
            maxWidth: "480px",
            margin: "3.5rem auto",
            padding: "2.5rem 2rem",
            background: "#ffffff",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.06)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#e11d48",
              fontSize: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem auto",
              boxShadow: "0 8px 20px rgba(225, 29, 72, 0.2)",
            }}
          >
            🔒
          </div>

          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", margin: "0 0 8px 0" }}>
            请先登录后再{pageTitle}
          </h2>

          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", margin: "0 0 2rem 0" }}>
            杨林生活网实行实名认证与内容安全管理。登录后您可随时在【个人中心】修改、刷新、置顶和下线您发布的信息。
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <a
              href={redirectUrl}
              style={{
                background: "linear-gradient(135deg, #0B7A75, #085f5b)",
                color: "white",
                padding: "13px",
                borderRadius: "14px",
                fontSize: "15px",
                fontWeight: "800",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(11, 122, 117, 0.3)",
                display: "block",
              }}
            >
              🔐 立即登录 / 免费注册
            </a>

            <a
              href="/publish"
              style={{
                background: "#f1f5f9",
                color: "#475569",
                padding: "11px",
                borderRadius: "14px",
                fontSize: "14px",
                fontWeight: "700",
                textDecoration: "none",
              }}
            >
              返回发布中心
            </a>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
