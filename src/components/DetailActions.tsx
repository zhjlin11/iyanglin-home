"use client";

import React, { useState, useEffect } from "react";
import { Heart, Share2, Flag, Copy, Check, X, QrCode } from "lucide-react";
import { isWechatBrowser, setupWechatShare } from "@/lib/wechat-jssdk";

export interface DetailActionsProps {
  resourceType?: "JOB" | "HOUSE" | "INDUSTRIAL" | "COMMUNITY_POST" | "MERCHANT" | "ARTICLE" | "PRODUCT" | "DATING" | "EVENT" | "LISTING";
  resourceId?: string;
  targetType?: string;
  targetId?: string;
  category?: string;
  shareText?: string;
  title?: string;
  desc?: string;
  link?: string;
  imageUrl?: string;
  className?: string;
}

// 对应资源专属的举报原因列表
const REPORT_REASONS: Record<string, string[]> = {
  JOB: ["收费招聘", "索要押金", "刷单兼职", "虚假公司", "薪资描述不符", "虚假信息", "垃圾广告", "其他违规"],
  LISTING: ["虚假信息", "诈骗欺诈", "违法违规", "垃圾广告", "联系方式异常", "信息已失效", "色情低俗", "其他"],
  PRODUCT: ["虚假信息", "诈骗欺诈", "违法违规", "垃圾广告", "联系方式异常", "信息已失效", "色情低俗", "其他"],
  INDUSTRIAL: ["虚假房源", "产权信息存疑", "虚假认证", "虚假信息", "中介冒充业主", "垃圾广告", "其他违规"],
  COMMUNITY_POST: ["辱骂攻击", "造谣抹黑", "恶意引战", "色情低俗", "违法违规", "垃圾广告", "泄露隐私", "其他"],
  DEFAULT: ["虚假信息", "垃圾广告", "诈骗欺诈", "色情低俗", "违法违规", "侵权内容", "泄露隐私", "其他"],
};

export default function DetailActions(props: DetailActionsProps) {
  const resourceId = props.resourceId || props.targetId;
  const resourceType = (props.resourceType || props.targetType || "LISTING") as any;
  const { title, desc, link, imageUrl, className = "" } = props;
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // 分享状态
  const [wxTipOpen, setWxTipOpen] = useState(false);
  const [pcModalOpen, setPcModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // 举报状态
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState("");

  const actualLink = typeof window !== "undefined" ? link || window.location.href : link || "";
  const currentTitle = title || (typeof document !== "undefined" ? document.title : "");

  // 1. 初始化检查微信JS-SDK分享配置
  useEffect(() => {
    if (!resourceId) return;

    // 优先：如果父级页面已经传入了图片与标题，直接初始化微信分享，免除额外的网络往返等待
    if (currentTitle && imageUrl) {
      setupWechatShare({
        title: currentTitle,
        desc: desc || currentTitle,
        link: actualLink,
        imgUrl: imageUrl,
      });
      return;
    }

    // 兜底：拉取统一 ShareService 配置并在微信环境注册
    fetch(`/api/share?type=${resourceType}&id=${resourceId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.share) {
          setupWechatShare({
            title: data.share.title,
            desc: data.share.description,
            link: data.share.url,
            imgUrl: data.share.imageUrl,
          });
        }
      })
      .catch(() => {});
  }, [resourceType, resourceId, currentTitle, desc, actualLink, imageUrl]);

  // 2. 初始化查询当前用户对该资源的收藏状态
  useEffect(() => {
    if (!resourceId) return;
    fetch(`/api/favorites?resourceType=${resourceType}&resourceId=${resourceId}`)
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && typeof data.isFavorited === "boolean") {
          setIsFavorited(data.isFavorited);
        }
      })
      .catch(() => {});
  }, [resourceType, resourceId]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2600);
  };

  // 3. 收藏 / 取消收藏交互
  const handleToggleFavorite = async () => {
    if (favLoading) return;
    if (!resourceId) {
      showToast("资源参数错误");
      return;
    }

    const previousState = isFavorited;
    // Optimistic Update
    setIsFavorited(!previousState);
    setFavLoading(true);

    try {
      if (!previousState) {
        // 执行收藏
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resourceType,
            resourceId,
            title: currentTitle,
            link: actualLink,
          }),
        });

        if (res.status === 401) {
          setIsFavorited(false);
          const currentPath = window.location.pathname + window.location.search;
          showToast("登录后可以收藏，方便以后查看。");
          setTimeout(() => {
            window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
          }, 1200);
          return;
        }

        if (!res.ok) {
          setIsFavorited(previousState);
          const err = await res.json().catch(() => ({}));
          showToast(err.error || "收藏失败，请重试");
          return;
        }

        showToast("❤️ 收藏成功");
      } else {
        // 执行取消收藏
        const res = await fetch(`/api/favorites?resourceType=${resourceType}&resourceId=${resourceId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          setIsFavorited(previousState);
          showToast("取消收藏失败");
          return;
        }

        showToast("已取消收藏");
      }
    } catch {
      setIsFavorited(previousState);
      showToast("网络异常，请重试");
    } finally {
      setFavLoading(false);
    }
  };

  // 4. 分享行为按环境精准区分
  const handleShareClick = async () => {
    // 微信内浏览器：弹出右上角分享提示遮罩
    if (isWechatBrowser()) {
      setWxTipOpen(true);
      return;
    }

    // 移动端普通手机浏览器（非微信）：优先调用 navigator.share
    const isMobile = typeof window !== "undefined" && /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile && typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: currentTitle,
          text: currentTitle,
          url: actualLink,
        });
        return;
      } catch (e: any) {
        // 用户取消分享不做处理
        if (e?.name === "AbortError") return;
      }
    }

    // PC 浏览器或不支持 navigator.share 的移动浏览器：弹出分享弹窗（含扫码与复制）
    setPcModalOpen(true);
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(actualLink);
      setCopied(true);
      showToast("链接已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 5. 举报提交
  const reasonsList = REPORT_REASONS[resourceType] || REPORT_REASONS.DEFAULT;

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setReportError("请选择一项举报原因");
      return;
    }
    setReportSubmitting(true);
    setReportError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId,
          title: currentTitle,
          reason: selectedReason,
          description: reportDesc.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        const currentPath = window.location.pathname + window.location.search;
        showToast("请先登录后再提交举报");
        setTimeout(() => {
          window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
        }, 1200);
        return;
      }

      if (!res.ok) {
        setReportError(data.error || "举报提交失败，请重试");
        return;
      }

      setReportSuccess(true);
      setTimeout(() => {
        setReportOpen(false);
        setReportSuccess(false);
        setSelectedReason("");
        setReportDesc("");
      }, 2200);
    } catch {
      setReportError("网络连接失败，请稍后重试");
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`detail-actions-bar ${className}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          margin: "16px 0 20px",
          flexWrap: "wrap",
        }}
      >
        {/* 收藏按钮 */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={favLoading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13.5px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.15s ease",
            border: isFavorited ? "1px solid #f87171" : "1px solid #cbd5e1",
            background: isFavorited ? "#fee2e2" : "#ffffff",
            color: isFavorited ? "#b91c1c" : "#475569",
          }}
        >
          <Heart
            size={16}
            style={{
              fill: isFavorited ? "#ef4444" : "none",
              color: isFavorited ? "#ef4444" : "currentColor",
              transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: isFavorited ? "scale(1.15)" : "scale(1)",
            }}
          />
          <span>{isFavorited ? "已收藏" : "收藏"}</span>
        </button>

        {/* 分享按钮 */}
        <button
          type="button"
          onClick={handleShareClick}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13.5px",
            fontWeight: "600",
            cursor: "pointer",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            color: "#334155",
            transition: "all 0.15s ease",
          }}
        >
          <Share2 size={16} color="#0b7a75" />
          <span>分享</span>
        </button>

        {/* 举报按钮 */}
        <button
          type="button"
          onClick={() => {
            setReportError("");
            setReportSuccess(false);
            setReportOpen(true);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            background: "transparent",
            border: "1px dashed #cbd5e1",
            color: "#64748b",
            marginLeft: "auto",
            transition: "all 0.15s ease",
          }}
        >
          <Flag size={14} color="#94a3b8" />
          <span>举报</span>
        </button>
      </div>

      {/* 浮动提示信息 */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.9)",
            color: "#ffffff",
            padding: "10px 20px",
            borderRadius: "24px",
            fontSize: "13.5px",
            fontWeight: "600",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            zIndex: 99999,
            pointerEvents: "none",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* 微信内点击分享引导遮罩 */}
      {wxTipOpen && (
        <div
          onClick={() => setWxTipOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.78)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            padding: "24px 28px",
            color: "#ffffff",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "8px", animation: "bounce 1s infinite" }}>
            ↗
          </div>
          <div style={{ fontSize: "17px", fontWeight: "800", marginBottom: "8px", textAlign: "right" }}>
            点击右上角 “···”
          </div>
          <div style={{ fontSize: "14px", color: "#e2e8f0", textAlign: "right", lineHeight: "1.6" }}>
            选择「发送给朋友」或「分享到朋友圈」<br />
            专属定制封面与精美摘要已准备就绪
          </div>
          <div
            style={{
              marginTop: "40px",
              alignSelf: "center",
              padding: "8px 24px",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.4)",
              fontSize: "13px",
              color: "#cbd5e1",
            }}
          >
            点击任意区域关闭
          </div>
        </div>
      )}

      {/* PC 端与普通浏览器分享模态框 */}
      {pcModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPcModalOpen(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => setPcModalOpen(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
              分享此内容
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#64748b" }}>
              微信扫码打开或复制链接分享给好友
            </p>

            {/* 二维码展示区 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "180px",
                  height: "180px",
                  background: "#ffffff",
                  padding: "10px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(actualLink)}`}
                  alt="微信扫码分享"
                  style={{ width: "100%", height: "100%", display: "block" }}
                />
              </div>
              <div style={{ marginTop: "12px", fontSize: "12.5px", color: "#475569", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                <QrCode size={16} color="#0b7a75" />
                <span>微信扫一扫即可手机打开与转发</span>
              </div>
            </div>

            {/* 链接复制区 */}
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                readOnly
                value={actualLink}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  background: "#f8fafc",
                  color: "#334155",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  background: copied ? "#059669" : "#0b7a75",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? "已复制" : "复制链接"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 违规举报弹窗 / Bottom Sheet */}
      {reportOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !reportSubmitting) setReportOpen(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              position: "relative",
            }}
          >
            <button
              type="button"
              disabled={reportSubmitting}
              onClick={() => setReportOpen(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Flag size={18} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
                违规内容举报
              </h3>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: "12.5px", color: "#64748b" }}>
              为维护健康清朗的杨林本地交流秩序，我们将严格核查每一笔举报。
            </p>

            {reportSuccess ? (
              <div
                style={{
                  padding: "24px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  textAlign: "center",
                  color: "#166534",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
                <div style={{ fontSize: "16px", fontWeight: "800", marginBottom: "4px" }}>
                  感谢您的监督与反馈！
                </div>
                <div style={{ fontSize: "13px", color: "#15803d" }}>
                  我们会尽快核实并按社区准则处理，核查期间内容保持审验状态。
                </div>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit}>
                {reportError && (
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      color: "#b91c1c",
                      fontSize: "13px",
                      fontWeight: "600",
                      marginBottom: "14px",
                    }}
                  >
                    {reportError}
                  </div>
                )}

                <div style={{ fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
                  请选择举报原因 <span style={{ color: "#ef4444" }}>*</span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                  {reasonsList.map((reason) => {
                    const active = selectedReason === reason;
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          setSelectedReason(reason);
                          setReportError("");
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "12.5px",
                          fontWeight: active ? "700" : "500",
                          cursor: "pointer",
                          border: active ? "1.5px solid #0b7a75" : "1px solid #e2e8f0",
                          background: active ? "#f0fdfa" : "#f8fafc",
                          color: active ? "#0b7a75" : "#475569",
                          transition: "all 0.12s ease",
                        }}
                      >
                        {reason}
                      </button>
                    );
                  })}
                </div>

                <div style={{ fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
                  补充说明（选填）
                </div>
                <textarea
                  rows={3}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="可在此描述具体涉嫌违规或欺诈的证据细节（限500字）..."
                  maxLength={500}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    outline: "none",
                    marginBottom: "20px",
                    fontFamily: "inherit",
                  }}
                />

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    disabled={reportSubmitting}
                    onClick={() => setReportOpen(false)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "8px",
                      background: "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: reportSubmitting ? "not-allowed" : "pointer",
                      opacity: reportSubmitting ? 0.7 : 1,
                    }}
                  >
                    {reportSubmitting ? "提交中..." : "提交举报"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
