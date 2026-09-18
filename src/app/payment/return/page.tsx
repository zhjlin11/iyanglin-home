"use client";

import { useEffect, useState, useCallback, useRef } from "react";

/**
 * H5 支付回跳页 — 微信 H5 支付完成后跳回此页面
 */
export default function PaymentReturnPage() {
  const [status, setStatus] = useState<"checking" | "success" | "failed">("checking");
  const [message, setMessage] = useState("正在确认支付结果...");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const getOrderNo = useCallback(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("orderNo");
  }, []);

  useEffect(() => {
    const orderNo = getOrderNo();
    if (!orderNo) {
      setStatus("failed");
      setMessage("缺少订单信息");
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/payment/status?orderNo=" + encodeURIComponent(orderNo));
        const data = await res.json();
        if (data.paid) {
          setStatus("success");
          setMessage("支付成功！");
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          setTimeout(() => { window.location.href = "/profile"; }, 2000);
          return;
        }
      } catch {}

      pollCountRef.current++;
      if (pollCountRef.current >= 60) {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        try {
          const verifyRes = await fetch("/api/payment/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderNo }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.paid) {
            setStatus("success");
            setMessage("支付成功！");
            setTimeout(() => { window.location.href = "/profile"; }, 2000);
            return;
          }
        } catch {}
        setStatus("failed");
        setMessage("未检测到支付结果，如已支付请返回查看");
      }
    };

    checkStatus();
    pollRef.current = setInterval(checkStatus, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [getOrderNo]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "40px 30px", textAlign: "center", maxWidth: "340px", width: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        {status === "checking" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
            <h2 style={{ fontSize: "18px", color: "#333", marginBottom: "8px" }}>正在确认支付结果</h2>
            <p style={{ color: "#999", fontSize: "14px" }}>{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h2 style={{ fontSize: "18px", color: "#16a34a", marginBottom: "8px" }}>支付成功</h2>
            <p style={{ color: "#999", fontSize: "14px" }}>正在跳转...</p>
          </>
        )}
        {status === "failed" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h2 style={{ fontSize: "18px", color: "#f59e0b", marginBottom: "8px" }}>{message}</h2>
            <button onClick={() => { window.location.href = "/profile"; }}
              style={{ marginTop: "16px", padding: "10px 24px", background: "#07c160", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", cursor: "pointer" }}>
              返回个人中心
            </button>
          </>
        )}
      </div>
    </div>
  );
}
