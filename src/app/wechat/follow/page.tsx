"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WechatFollowPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");

  const checkSubscription = async () => {
    setChecking(true);
    setMessage("");
    try {
      const response = await fetch("/api/users/me/wechat-follow", {
        method: "POST",
        cache: "no-store",
      });
      const result = await response.json();
      if (result.subscribed) {
        router.replace("/profile");
        router.refresh();
        return;
      }
      setMessage(result.error || "暂未检测到关注，请关注后再点击一次。微信状态同步可能需要几秒。" );
    } catch {
      setMessage("网络繁忙，请稍后重新检测。登录已经成功，不会受到影响。");
    } finally {
      setChecking(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(160deg, #ecfdf5 0%, #f8fafc 46%, #eff6ff 100%)", padding: "28px 16px", display: "grid", placeItems: "center" }}>
      <section style={{ width: "100%", maxWidth: "480px", background: "rgba(255,255,255,0.96)", border: "1px solid #dbeafe", borderRadius: "24px", boxShadow: "0 24px 70px rgba(15, 118, 110, 0.14)", padding: "30px 24px", textAlign: "center" }}>
        <div style={{ width: "58px", height: "58px", borderRadius: "18px", background: "#07c160", color: "white", display: "grid", placeItems: "center", fontSize: "30px", margin: "0 auto 16px" }}>✓</div>
        <h1 style={{ margin: 0, color: "#0f172a", fontSize: "24px", lineHeight: 1.35 }}>微信登录成功</h1>
        <p style={{ margin: "10px auto 20px", color: "#475569", fontSize: "14px", lineHeight: 1.8, maxWidth: "370px" }}>
          登录授权不等于关注公众号。请长按识别下方二维码并关注“杨林生活圈”，即可及时接收本地资讯与服务通知。
        </p>

        <div style={{ width: "246px", maxWidth: "100%", margin: "0 auto", padding: "12px", background: "white", border: "1px solid #dcfce7", borderRadius: "18px", boxShadow: "0 8px 24px rgba(15,23,42,0.08)" }}>
          <img src="/images/wechat_official_qr.jpg" alt="杨林生活圈微信公众号二维码" style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px" }} />
        </div>

        <div style={{ margin: "16px 0", padding: "11px 12px", borderRadius: "12px", background: "#f0fdf4", color: "#166534", fontSize: "13px", lineHeight: 1.6 }}>
          微信内：长按二维码 → 识别图中二维码 → 关注公众号
        </div>

        {message && (
          <p role="status" style={{ margin: "0 0 12px", color: "#b45309", fontSize: "13px", lineHeight: 1.6 }}>
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={checkSubscription}
          disabled={checking}
          style={{ width: "100%", border: 0, borderRadius: "12px", padding: "13px 18px", background: checking ? "#94a3b8" : "#07c160", color: "white", fontWeight: 800, fontSize: "15px", cursor: checking ? "wait" : "pointer" }}
        >
          {checking ? "正在核验关注状态…" : "我已关注，重新检测"}
        </button>

        <Link href="/profile" style={{ display: "inline-block", marginTop: "16px", color: "#64748b", fontSize: "13px", textDecoration: "none" }}>
          暂时跳过，进入个人中心
        </Link>
        <p style={{ margin: "18px 0 0", color: "#94a3b8", fontSize: "12px", lineHeight: 1.6 }}>
          根据微信规则，网站不能代替用户自动关注，关注操作需要由本人确认。
        </p>
      </section>
    </main>
  );
}
