"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import ReviewModal from "@/components/info/ReviewModal";

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [takingLead, setTakingLead] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/info/requests/${id}`);
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || "获取需求失败");
      } else {
        setRequest(data.data);
      }
    } catch (e: any) {
      setErrorMsg(e.message || "网络异常");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // 记录联系行为打点
  const trackContact = async (action: string, providerId?: string) => {
    try {
      await fetch("/api/info/contact-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: id,
          providerId,
          action,
          source: "REQUEST_MATCH",
        }),
      });
    } catch (err) {
      console.error("trackContact error:", err);
    }
  };

  // 拨打服务商电话
  const handleCallProvider = (provider: any) => {
    trackContact("CALL", provider.id);
    window.location.href = `tel:${provider.phone}`;
  };

  // 复制服务商微信
  const handleCopyWechat = (provider: any) => {
    if (!provider.wechat) {
      alert("该师傅暂未填写微信号，建议直接电话联系");
      return;
    }
    trackContact("COPY_WECHAT", provider.id);
    navigator.clipboard.writeText(provider.wechat);
    alert(`已复制师傅微信号：${provider.wechat}，请打开微信添加`);
  };

  // 服务商接单 / 解锁完整联系方式
  const handleTakeLead = async () => {
    setTakingLead(true);
    try {
      const res = await fetch(`/api/info/requests/${id}/lead`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "接单失败");
      } else {
        alert("🎉 恭喜接单成功！客户联系方式已解锁展示");
        fetchDetail();
      }
    } catch (err: any) {
      alert(err.message || "网络异常");
    } finally {
      setTakingLead(false);
    }
  };

  // 需求发布人更改需求状态
  const handleUpdateStatus = async (status: string, selectedProviderId?: string) => {
    if (status === "CANCELLED") {
      const reason = prompt("请输入取消原因（如：问题已自行解决、误发等）：");
      if (reason === null) return;
      await doPatchStatus(status, selectedProviderId, reason);
    } else {
      await doPatchStatus(status, selectedProviderId);
    }
  };

  const doPatchStatus = async (status: string, selectedProviderId?: string, cancelReason?: string) => {
    try {
      const res = await fetch(`/api/info/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, selectedProviderId, cancelReason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "操作失败");
      } else {
        if (status === "COMPLETED") {
          setShowReviewModal(true);
        }
        fetchDetail();
      }
    } catch (err: any) {
      alert(err.message || "网络异常");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
        正在载入需求详情与匹配师傅...
      </div>
    );
  }

  if (errorMsg || !request) {
    return (
      <div style={{ maxWidth: "600px", margin: "40px auto", padding: "24px", textAlign: "center", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⚠️</div>
        <h3 style={{ color: "#0f172a" }}>{errorMsg || "需求不存在"}</h3>
        <Link href="/info/requests" style={{ display: "inline-block", marginTop: "16px", color: "#2563eb", textDecoration: "none" }}>
          ‹ 返回需求大厅
        </Link>
      </div>
    );
  }

  const steps = [
    { title: "发布需求", done: true },
    { title: "智能匹配", done: ["MATCHED", "IN_PROGRESS", "COMPLETED"].includes(request.status) },
    { title: "师傅接单", done: ["IN_PROGRESS", "COMPLETED"].includes(request.status) },
    { title: "服务完工", done: request.status === "COMPLETED" },
    { title: "双方评价", done: !!request.review },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", paddingBottom: "80px" }}>
      {/* 顶部导航 */}
      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "12px 16px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/info/requests" style={{ color: "#475569", textDecoration: "none", fontSize: "0.85rem" }}>
            ‹ 需求大厅
          </Link>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>需求撮合详情</div>
          <Link href="/info/request/new" style={{ color: "#2563eb", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
            + 发新需求
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "16px auto", padding: "0 16px" }}>
        {/* 状态时间轴 */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid #e2e8f0",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {steps.map((st, idx) => (
              <div key={st.title} style={{ display: "flex", alignItems: "center", flex: idx < steps.length - 1 ? 1 : "initial" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: st.done ? "#2563eb" : "#f1f5f9",
                      color: st.done ? "#ffffff" : "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    {st.done ? "✓" : idx + 1}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: st.done ? "#1e293b" : "#94a3b8", fontWeight: st.done ? 600 : 400 }}>
                    {st.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: "2px",
                      backgroundColor: steps[idx + 1].done ? "#2563eb" : "#e2e8f0",
                      margin: "0 6px 16px 6px",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 需求主体卡片 */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
          }}
        >
          {/* 标签栏 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
              <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600 }}>
                {request.category}
              </span>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>📍 {request.area}</span>
              {request.urgency === "URGENT" && (
                <span style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                  🔥 非常紧急
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>单号：{request.requestNo}</span>
          </div>

          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: "0 0 12px 0" }}>
            {request.title}
          </h1>

          <div
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              padding: "14px",
              fontSize: "0.9rem",
              color: "#334155",
              lineHeight: 1.6,
              marginBottom: "16px",
            }}
          >
            {request.description}
          </div>

          {/* 详细参数表格 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", fontSize: "0.85rem", color: "#475569", marginBottom: "16px" }}>
            <div>⏰ 期望时间：<strong style={{ color: "#1e293b" }}>{request.preferredTime}</strong></div>
            <div>💰 预算：<strong style={{ color: "#d97706" }}>{request.budgetMin || request.budgetMax ? `¥${(request.budgetMin || 0) / 100} - ¥${(request.budgetMax || 0) / 100}` : "面议"}</strong></div>
            <div>👤 称呼：<strong style={{ color: "#1e293b" }}>{request.contactName}</strong></div>
            <div>
              📞 电话：
              <strong style={{ color: request.canViewFullContact ? "#2563eb" : "#64748b" }}>
                {request.contactPhone}
              </strong>
            </div>
          </div>

          {/* 隐私提示或接单提示 */}
          {!request.canViewFullContact && (
            <div
              style={{
                backgroundColor: "#fefce8",
                border: "1px solid #fef08a",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "0.85rem",
                color: "#854d0e",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>🔒 电话号码已脱敏保护，认证师傅接单后可查看完整手机号</div>
              <button
                type="button"
                onClick={handleTakeLead}
                disabled={takingLead}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {takingLead ? "接单中..." : "我是师傅·立即接单"}
              </button>
            </div>
          )}

          {/* 需求状态变更操作条 */}
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #f1f5f9", display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {request.status !== "COMPLETED" && request.status !== "CANCELLED" && (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("IN_PROGRESS")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    fontSize: "0.85rem",
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  已在沟通服务中
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("COMPLETED")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#16a34a",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  ✓ 确认服务已完工
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("CANCELLED")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "transparent",
                    fontSize: "0.85rem",
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  取消需求
                </button>
              </>
            )}

            {request.status === "COMPLETED" && !request.review && (
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "6px",
                  backgroundColor: "#f59e0b",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ⭐ 为师傅撰写真实评价
              </button>
            )}
          </div>
        </div>

        {/* 完工评价卡片 (如果已有评价) */}
        {request.review && (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid #e2e8f0",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                ⭐ 客户真实履约评价
              </h3>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                {new Date(request.review.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <div style={{ color: "#f59e0b", fontSize: "1.1rem" }}>
                {"★".repeat(request.review.rating)}
                {"☆".repeat(5 - request.review.rating)}
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#d97706" }}>
                {request.review.rating} 星好评
              </span>
            </div>

            {/* 标签 */}
            {request.review.tags && request.review.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                {request.review.tags.map((t: string) => (
                  <span
                    key={t}
                    style={{
                      backgroundColor: "#fef3c7",
                      color: "#92400e",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <p style={{ fontSize: "0.9rem", color: "#334155", margin: "0 0 12px 0", lineHeight: 1.6 }}>
              “{request.review.content}”
            </p>

            {/* 师傅公开回复 */}
            {request.review.replyContent && (
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  borderLeft: "3px solid #2563eb",
                  padding: "8px 12px",
                  borderRadius: "0 6px 6px 0",
                  fontSize: "0.85rem",
                  color: "#475569",
                }}
              >
                <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "2px" }}>👨‍🔧 师傅回复：</div>
                <div>{request.review.replyContent}</div>
              </div>
            )}
          </div>
        )}

        {/* 智能匹配服务商推荐板块 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                🤖 系统为您匹配的本地靠谱师傅
              </h2>
              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "2px 0 0 0" }}>
                根据分类匹配度、区域覆盖、平台实名认证与真实口碑综合推荐
              </p>
            </div>
            <span style={{ fontSize: "0.85rem", color: "#2563eb", fontWeight: 600 }}>
              共匹配 {request.matchedProviders?.length || 0} 位
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {request.matchedProviders && request.matchedProviders.length > 0 ? (
              request.matchedProviders.map((m: any) => {
                const p = m.provider;
                return (
                  <div
                    key={p.id}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      {/* 头像 */}
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "10px",
                          backgroundColor: "#eff6ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem",
                          flexShrink: 0,
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt={p.name}
                            style={{ width: "100%", height: "100%", borderRadius: "10px", objectFit: "cover" }}
                          />
                        ) : (
                          "👨‍🔧"
                        )}
                      </div>

                      {/* 师傅信息 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>{p.name}</span>
                          <span style={{ backgroundColor: "#dcfce7", color: "#15803d", fontSize: "0.7rem", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>
                            ✓ 平台认证
                          </span>
                          {p.isMember && (
                            <span style={{ backgroundColor: "#fef3c7", color: "#b45309", fontSize: "0.7rem", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>
                              ⭐ 金牌商家
                            </span>
                          )}
                          <span style={{ backgroundColor: "#f1f5f9", color: "#475569", fontSize: "0.7rem", padding: "1px 6px", borderRadius: "4px" }}>
                            {p.yearsOfService || "多年经验"}
                          </span>
                        </div>

                        {/* 评分与评价 */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", fontSize: "0.8rem" }}>
                          {p.ratingCount >= 3 ? (
                            <span style={{ color: "#d97706", fontWeight: 700 }}>
                              ★ {p.ratingAvg?.toFixed(1)}分 ({p.ratingCount}条真实评价)
                            </span>
                          ) : (
                            <span style={{ color: "#64748b" }}>
                              🌱 新入驻 · 真实评价积累中
                            </span>
                          )}
                          <span style={{ color: "#94a3b8" }}>·</span>
                          <span style={{ color: "#64748b" }}>已完工 {p.completedOrders || 0} 单</span>
                        </div>

                        {/* 匹配原因标签 */}
                        {m.reasons && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                            {m.reasons.map((r: string) => (
                              <span
                                key={r}
                                style={{
                                  backgroundColor: "#f0fdf4",
                                  border: "1px solid #bbf7d0",
                                  color: "#166534",
                                  fontSize: "0.7rem",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                }}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮组 */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px dashed #f1f5f9",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Link
                        href={`/provider/${p.id}`}
                        onClick={() => trackContact("VIEW_PROFILE", p.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          color: "#475569",
                          textDecoration: "none",
                          fontSize: "0.85rem",
                        }}
                      >
                        师傅主页
                      </Link>
                      {p.wechat && (
                        <button
                          type="button"
                          onClick={() => handleCopyWechat(p)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #86efac",
                            backgroundColor: "#f0fdf4",
                            color: "#166534",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          💬 复制微信
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCallProvider(p)}
                        style={{
                          padding: "6px 16px",
                          borderRadius: "6px",
                          border: "none",
                          backgroundColor: "#2563eb",
                          color: "#ffffff",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        📞 一键拨号
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "24px",
                  textAlign: "center",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                  fontSize: "0.9rem",
                }}
              >
                正在全区通知匹配师傅，师傅接单后将第一时间与您联系！
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 评价弹窗 */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        requestId={request.id}
        providerId={request.selectedProviderId || (request.matchedProviders?.[0]?.provider?.id)}
        providerName={request.selectedProvider?.name || (request.matchedProviders?.[0]?.provider?.name || "接单师傅")}
        requestTitle={request.title}
        onSuccess={() => {
          fetchDetail();
        }}
      />
    </div>
  );
}
