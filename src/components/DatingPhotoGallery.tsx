"use client";

import { useState, useEffect, useRef } from "react";
import { detectPaymentScene, invokeWeixinPay } from "@/lib/payment-utils";
import { createPortal } from "react-dom";

type DatingPhotoGalleryProps = {
  photos: string[];
  profileId: string;
  nickname: string;
  gender: string;
  isOwner?: boolean;
  isLoggedIn?: boolean;
};

function saveUnlock(pId: string) {
  if (!pId) return;
  try {
    const raw = localStorage.getItem("yl_unlocked_dating_photos");
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(pId)) {
      list.push(pId);
      localStorage.setItem("yl_unlocked_dating_photos", JSON.stringify(list));
    }
  } catch {}
}

function checkIsUnlockedLocally(pId: string): boolean {
  if (!pId) return false;
  try {
    const raw = localStorage.getItem("yl_unlocked_dating_photos");
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(pId);
  } catch {
    return false;
  }
}

export default function DatingPhotoGallery({
  photos = [],
  profileId,
  nickname,
  gender,
  isOwner = false,
  isLoggedIn = false,
}: DatingPhotoGalleryProps) {
  const [codeUrl, setCodeUrl] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(isOwner);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [currentOrderNo, setCurrentOrderNo] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [pollError, setPollError] = useState("");
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isFemale = gender === "female";
  const redirectUrl = `/login?redirect=${encodeURIComponent(`/love/${profileId}`)}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  // 页面初次加载时：1. 检查设备本地持久化；2. 异步校验后端数据库已支付订单
  useEffect(() => {
    if (isOwner) {
      setUnlocked(true);
      return;
    }
    // 安全防线：未登录访客绝对禁止解锁！
    if (!isLoggedIn) {
      setUnlocked(false);
      return;
    }
    if (profileId && checkIsUnlockedLocally(profileId)) {
      setUnlocked(true);
    }

    if (profileId) {
      fetch(`/api/user/dating/unlocked?profileId=${encodeURIComponent(profileId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.unlocked) {
            saveUnlock(profileId);
            setUnlocked(true);
          } else {
            setUnlocked(false);
          }
        })
        .catch(() => {});
    }
  }, [profileId, isOwner, isLoggedIn]);

  // 清除轮询定时器
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // 轮询检查真实订单支付状态
  const startPolling = (orderNo: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?orderNo=${encodeURIComponent(orderNo)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paid === true) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            saveUnlock(profileId);
            setUnlocked(true);
            setShowModal(false);
            setCurrentOrderNo(null);
            setCodeUrl(null);
            alert("🎉 支付成功！已为您永久解锁该嘉宾全套高清写真！");
          }
        }
      } catch {
        // Continue polling
      }
    }, 2000);
  };

  // 点击解锁写真按钮
  const handleUnlockClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setShowModal(true);
    handleCreateOrderAndPay();
  };

  // 点击开通VIP按钮
  const handleVipClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    window.location.href = "/billing/promote";
  };

  // 创建真实订单并展示支付二维码
  const handleCreateOrderAndPay = async () => {
    setQrLoading(true);
    setPollError("");
    setCodeUrl(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKind: "dating_photo",
          targetId: profileId,
          targetTitle: `${nickname} 相亲写真解锁`,
          amountCents: 200,
          planName: `相亲嘉宾【${nickname}】全套写真解锁`,
        }),
      });

      if (!res.ok) {
        throw new Error("创建支付订单失败");
      }

      const orderData = await res.json();
      setCurrentOrderNo(orderData.orderNo);

      // 请求腾讯微信支付官方统一下单获取实时真实 codeUrl
      try {
        const payRes = await fetch("/api/payment/wechat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNo: orderData.orderNo, paymentScene: detectPaymentScene() }),
        });
        if (payRes.ok) {
          const payData = await payRes.json();

          if (payData.needOAuth && payData.oauthUrl) {
            window.location.href = payData.oauthUrl;
            return;
          }

          if (payData.jsapiParams) {
            try {
              const payResult = await invokeWeixinPay(payData.jsapiParams);
              if (payResult === "success") {
                startPolling(orderData.orderNo);
              } else if (payResult === "cancel") {
                setPollError("您已取消支付");
              } else {
                setPollError("支付未完成");
              }
            } catch { setPollError("拉起微信支付失败"); }
            return;
          }

          if (payData.mwebUrl) {
            window.location.href = payData.mwebUrl;
            return;
          }

          if (payData.codeUrl) {
            setCodeUrl(payData.codeUrl);
          }
        }
      } catch {
        // 统一下单备用降级
      }

      startPolling(orderData.orderNo);
    } catch (err: any) {
      setPollError(err.message || "创建支付订单异常，请重试");
    } finally {
      setQrLoading(false);
    }
  };

  // 手动点击检查支付状态
  const handleManualCheck = async () => {
    if (!currentOrderNo) return;
    setPaying(true);
    setPollError("");

    try {
      const res = await fetch(`/api/payment/status?orderNo=${encodeURIComponent(currentOrderNo)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.paid === true) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          saveUnlock(profileId);
          setUnlocked(true);
          setShowModal(false);
          setCurrentOrderNo(null);
          alert("🎉 支付验证成功！已为您永久解锁该嘉宾全套高清写真！");
          return;
        } else {
          setPollError("⚠️ 系统尚未检测到该订单完成到账。请使用微信扫码完成支付后再试。");
        }
      }
    } catch {
      setPollError("查询订单状态遇到网络问题，请稍后重试");
    } finally {
      setPaying(false);
    }
  };



  // 0 张图片时的展示卡
  if (!photos || photos.length === 0) {
    return (
      <div
        style={{
          background: isFemale ? "linear-gradient(135deg, #fff1f2 0%, #fdf2f8 100%)" : "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
          border: isFemale ? "1px solid #fecdd3" : "1px solid #bfdbfe",
          borderRadius: "20px",
          padding: "2rem 1.5rem",
          textAlign: "center",
          marginBottom: "2rem",
          position: "relative",
          overflow: "hidden",
          boxShadow: isFemale ? "0 4px 20px rgba(244, 63, 94, 0.06)" : "0 4px 20px rgba(59, 130, 246, 0.06)",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: isFemale ? "linear-gradient(135deg, #ec4899, #f43f5e)" : "linear-gradient(135deg, #3b82f6, #0d9488)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
            margin: "0 auto 12px auto",
            boxShadow: isFemale ? "0 8px 20px rgba(244, 63, 94, 0.25)" : "0 8px 20px rgba(59, 130, 246, 0.25)",
          }}
        >
          {isFemale ? "👩‍🦰" : "👨‍💼"}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a" }}>{nickname}</span>
          <span
            style={{
              background: isFemale ? "#f43f5e" : "#0284c7",
              color: "white",
              fontSize: "11px",
              fontWeight: "bold",
              padding: "2px 8px",
              borderRadius: "12px",
            }}
          >
            🛡️ 官方实名嘉宾
          </span>
          <span
            style={{
              background: "#dcfce7",
              color: "#15803d",
              fontSize: "11px",
              fontWeight: "bold",
              padding: "2px 8px",
              borderRadius: "12px",
            }}
          >
            ✓ 诚意征婚
          </span>
        </div>

        <p style={{ fontSize: "13px", color: "#64748b", maxWidth: "460px", margin: "0 auto 1.25rem auto", lineHeight: "1.6" }}>
          该嘉宾已通过杨林生活网婚恋审核。为保护个人肖像隐私暂未上传公开照片，您可通过右侧申请牵线直接互换联系方式与生活近照。
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#ffffff",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            color: "#e11d48",
            fontWeight: "700",
            border: "1px solid #ffe4e6",
          }}
        >
          <span>💌 真实资料已核验 · 支持红娘协助私密索照</span>
        </div>
      </div>
    );
  }

  // 1. 未登录拦截弹窗 (使用 React Portal 挂载到 document.body)
  const loginModal = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        boxSizing: "border-box",
      }}
      onClick={() => setShowLoginModal(false)}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          maxWidth: "420px",
          width: "100%",
          padding: "2.25rem 2rem",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          border: "1px solid #e2e8f0",
          boxSizing: "border-box",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#fee2e2",
            color: "#e11d48",
            fontSize: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem auto",
            boxShadow: "0 4px 14px rgba(225, 29, 72, 0.2)",
          }}
        >
          🔒
        </div>

        <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", margin: "0 0 8px 0" }}>
          请先登录后解锁写真
        </h3>

        <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", margin: "0 0 1.75rem 0" }}>
          为保障相亲嘉宾 【<strong>{nickname}</strong>】 的个人肖像隐私安全，并确保支付权益与您的账号永久绑定，请先登录您的账号。
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <a
            href={redirectUrl}
            style={{
              background: "linear-gradient(135deg, #e11d48, #be123c)",
              color: "white",
              padding: "13px",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: "800",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(225, 29, 72, 0.3)",
              display: "block",
            }}
          >
            🔐 立即登录 / 注册
          </a>

          <button
            type="button"
            onClick={() => setShowLoginModal(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "13px",
              cursor: "pointer",
              padding: "8px",
            }}
          >
            暂不解锁，返回浏览
          </button>
        </div>
      </div>
    </div>
  );

  // 2. 真实微信支付收银台 Modal (使用 React Portal 挂载到 document.body)
  const payModal = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        boxSizing: "border-box",
      }}
      onClick={() => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setShowModal(false);
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          maxWidth: "400px",
          width: "100%",
          padding: "2rem 1.75rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          position: "relative",
          textAlign: "center",
          border: "1px solid #e2e8f0",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setShowModal(false);
          }}
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "#f1f5f9",
            border: "none",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            cursor: "pointer",
            fontWeight: "bold",
            color: "#64748b",
          }}
        >
          ✕
        </button>

        {/* 微信支付头部 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "8px" }}>
          <span style={{ fontSize: "20px" }}>🟢</span>
          <span style={{ fontSize: "16px", fontWeight: "800", color: "#047857" }}>微信安全支付收银台</span>
        </div>

        <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0" }}>
          解锁【{nickname}】全套写真
        </h3>

        <div style={{ fontSize: "28px", fontWeight: "900", color: "#e11d48", margin: "10px 0 4px 0" }}>
          ¥2.00
        </div>

        {currentOrderNo && (
          <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "12px" }}>
            订单号: <code style={{ color: "#64748b" }}>{currentOrderNo}</code>
          </div>
        )}

        {/* 动态二维码展示区 */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "16px",
            margin: "0 auto 16px auto",
            display: "inline-block",
          }}
        >
          {qrLoading ? (
            <div style={{ width: "180px", height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "13px" }}>
              ⏳ 正在生成微信支付二维码...
            </div>
          ) : currentOrderNo ? (
            <img
              src={`/api/payment/qrcode?text=${encodeURIComponent(codeUrl || `weixin://wxpay/bizpayurl?pr=${currentOrderNo}`)}`}
              alt="微信支付二维码"
              style={{ width: "180px", height: "180px", display: "block" }}
            />
          ) : (
            <div style={{ width: "180px", height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontSize: "13px" }}>
              二维码生成失败，请重试
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", color: "#047857", fontWeight: "700", marginBottom: "12px" }}>
          <span className="animate-spin">⏳</span> 正在等待微信扫码支付中...
        </div>

        {pollError && (
          <div style={{ padding: "8px 12px", background: "#fff1f2", color: "#be123c", fontSize: "12px", borderRadius: "8px", marginBottom: "12px", textAlign: "left" }}>
            {pollError}
          </div>
        )}

        {/* 手动验证到账按钮 */}
        <button
          type="button"
          disabled={paying || !currentOrderNo}
          onClick={handleManualCheck}
          style={{
            width: "100%",
            padding: "11px",
            borderRadius: "12px",
            background: "#047857",
            color: "white",
            fontSize: "14px",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
            marginBottom: "8px",
            boxShadow: "0 4px 12px rgba(4, 120, 87, 0.25)",
          }}
        >
          {paying ? "正在核验订单..." : "✓ 我已完成微信支付"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          <span>📷</span> 嘉宾风采写真 ({photos.length} 张)
        </h2>
        
        {unlocked ? (
          <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>✓</span> 已永久解锁高清
          </span>
        ) : (
          <span style={{ fontSize: "12px", color: "#e11d48", fontWeight: "bold", background: "#fff1f2", padding: "2px 8px", borderRadius: "10px", border: "1px solid #fecdd3" }}>
            🔒 隐私保护模式
          </span>
        )}
      </div>

      {/* 照片画廊网格 */}
      <div
        style={{
          position: "relative",
          borderRadius: "20px",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          background: "#0f172a",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "10px",
            padding: "10px",
            filter: unlocked ? "none" : "blur(18px) saturate(1.2)",
            transform: unlocked ? "none" : "scale(1.03)",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: unlocked ? "auto" : "none",
            userSelect: "none",
          }}
        >
          {photos.map((img, i) => (
            <div
              key={i}
              onClick={() => unlocked && setSelectedImg(img)}
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                height: "260px",
                background: "#1e293b",
                cursor: unlocked ? "zoom-in" : "default",
              }}
            >
              <img
                src={img}
                alt={`嘉宾照片 ${i + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          ))}
        </div>

        {/* 未解锁时的全屏居中悬浮卡片 */}
        {!unlocked && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15, 23, 42, 0.55)",
              backdropFilter: "blur(4px)",
              padding: "1.5rem",
              textAlign: "center",
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                color: "white",
                marginBottom: "12px",
                boxShadow: "0 8px 24px rgba(244, 63, 94, 0.4)",
              }}
            >
              🔒
            </div>

            <h3 style={{ color: "white", fontSize: "18px", fontWeight: "800", margin: "0 0 6px 0" }}>
              嘉宾风采写真已开启隐私保护
            </h3>
            
            <p style={{ color: "#cbd5e1", fontSize: "13px", maxWidth: "380px", margin: "0 0 16px 0", lineHeight: "1.5" }}>
              {!isLoggedIn
                ? `为保障${isFemale ? "女" : "男"}嘉宾【${nickname}】的个人肖像与相亲隐私安全，请先登录账号后查阅。`
                : `为保障${isFemale ? "女" : "男"}嘉宾【${nickname}】的真实个人隐私安全，全套清晰生活照片需扫码付费后查阅。`}
            </p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
              {!isLoggedIn ? (
                <>
                  <a
                    href={redirectUrl}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "24px",
                      background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "800",
                      textDecoration: "none",
                      boxShadow: "0 6px 20px rgba(225, 29, 72, 0.45)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>🔑 立即登录查看写真</span>
                  </a>
                  <a
                    href="/register"
                    style={{
                      padding: "10px 18px",
                      borderRadius: "24px",
                      background: "rgba(255, 255, 255, 0.15)",
                      color: "white",
                      fontSize: "13.5px",
                      fontWeight: "700",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      textDecoration: "none",
                      backdropFilter: "blur(6px)",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    ✨ 免费注册账号
                  </a>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleUnlockClick}
                    style={{
                      padding: "10px 22px",
                      borderRadius: "24px",
                      background: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "800",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 6px 20px rgba(244, 63, 94, 0.45)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <span>💖 立即扫码解锁全套写真 (¥2.00)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleVipClick}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "24px",
                      background: "rgba(255, 255, 255, 0.15)",
                      color: "white",
                      fontSize: "13.5px",
                      fontWeight: "700",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      cursor: "pointer",
                      backdropFilter: "blur(6px)",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    👑 开通相亲VIP免付费
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 弹窗通过 Portal 挂载到 document.body */}
      {mounted && showLoginModal && typeof document !== "undefined" && createPortal(loginModal, document.body)}
      {mounted && showModal && typeof document !== "undefined" && createPortal(payModal, document.body)}

      {/* 大图预览 Modal (Portal) */}
      {mounted && selectedImg && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.9)",
            backdropFilter: "blur(8px)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            boxSizing: "border-box",
          }}
          onClick={() => setSelectedImg(null)}
        >
          <img
            src={selectedImg}
            alt="大图预览"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              objectFit: "contain",
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
