"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Lock, Phone, ArrowRight, AlertCircle } from "lucide-react";

export default function CourierLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("13888001001");
  const [accessCode, setAccessCode] = useState("888888");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/courier/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, accessCode }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "登录失败，请核对手机号与授权码");
        setLoading(false);
        return;
      }

      router.push("/courier");
    } catch {
      setError("网络连接异常");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px", background: "#1E293B", borderRadius: "16px", padding: "28px 24px", color: "#ffffff", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#0B7A75", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#ffffff", marginBottom: "12px" }}>
            <Truck size={28} />
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: "900", margin: "0 0 6px" }}>配送员专属工作台</h1>
          <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>杨林生活网自营便利店 · 专人配送终端</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12.5px", color: "#94A3B8", fontWeight: "600", marginBottom: "6px" }}>
              配送员手机号
            </label>
            <div style={{ display: "flex", alignItems: "center", background: "#334155", borderRadius: "8px", padding: "0 12px" }}>
              <Phone size={16} style={{ color: "#94A3B8" }} />
              <input
                type="text"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ flex: 1, background: "transparent", border: "none", color: "#ffffff", padding: "12px 10px", outline: "none", fontSize: "14px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12.5px", color: "#94A3B8", fontWeight: "600", marginBottom: "6px" }}>
              配送授权码
            </label>
            <div style={{ display: "flex", alignItems: "center", background: "#334155", borderRadius: "8px", padding: "0 12px" }}>
              <Lock size={16} style={{ color: "#94A3B8" }} />
              <input
                type="password"
                placeholder="默认授权码 888888"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                style={{ flex: 1, background: "transparent", border: "none", color: "#ffffff", padding: "12px 10px", outline: "none", fontSize: "14px" }}
              />
            </div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>测试骑手：张师傅 (13888001001) / 码 888888</div>
          </div>

          {error && (
            <div style={{ background: "#7F1D1D", color: "#FCA5A5", padding: "10px", borderRadius: "8px", fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: "#0B7A75",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "900",
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginTop: "8px",
            }}
          >
            <span>{loading ? "正在验证..." : "进入配送工作台"}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
