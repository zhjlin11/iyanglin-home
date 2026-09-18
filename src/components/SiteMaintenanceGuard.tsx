"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function SiteMaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [siteStatusData, setSiteStatusData] = useState<{
    siteStatus: string;
    closeReason: string;
    customerPhone: string;
    siteName: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/site-status")
      .then((res) => res.json())
      .then((data) => setSiteStatusData(data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exclude admin panel, login, register, and api routes from maintenance block
  const isAdminOrAuthRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api");

  if (!isAdminOrAuthRoute && siteStatusData && siteStatusData.siteStatus !== "ONLINE") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", fontFamily: "sans-serif" }}>
        <div style={{ background: "rgba(30, 41, 59, 0.8)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "20px", padding: "3rem 2rem", maxWidth: "600px", width: "100%", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
          
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: "36px", boxShadow: "0 10px 25px rgba(245, 158, 11, 0.3)" }}>
            🛠️
          </div>

          <h1 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "1rem", color: "#ffffff" }}>
            {siteStatusData.siteName || "杨林生活网"} · 例行关站维护中
          </h1>

          <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.3)", marginBottom: "2rem", textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.6", color: "#cbd5e1" }}>
              {siteStatusData.closeReason || "为了向您提供更优质、稳定的同城生活服务体验，系统正在进行全量数据架构与服务升级维护中。给您带来的不便敬请谅解！"}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <div style={{ fontSize: "14px", color: "#94a3b8" }}>
              📞 紧急联系客服电话：<a href={`tel:${siteStatusData.customerPhone}`} style={{ color: "#f59e0b", fontWeight: "bold", textDecoration: "none" }}>{siteStatusData.customerPhone}</a>
            </div>
            
            <a href="/admin/login" style={{ marginTop: "1rem", fontSize: "13px", color: "#64748b", textDecoration: "underline" }}>
              🔑 站长与管理员后台登录通道
            </a>
          </div>

        </div>
      </div>
    );
  }

  return <>{children}</>;
}
