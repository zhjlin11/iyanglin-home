"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "待审核处理", color: "#D97706", bg: "#FEF3C7" },
  APPROVED: { label: "已同意退款", color: "#166534", bg: "#DCFCE7" },
  REJECTED: { label: "已驳回拒绝", color: "#991B1B", bg: "#FEE2E2" },
  REFUNDED: { label: "退款已原路到账", color: "#0B7A75", bg: "#E0F2FE" },
};

export default function AdminMallAftersalesPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Review modal
  const [currentTicket, setCurrentTicket] = useState<any | null>(null);
  const [revertStock, setRevertStock] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/mall/aftersales?status=${statusFilter}`);
      if (res.ok) {
        const d = await res.json();
        setTickets(d.aftersales || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleAction = async (action: "APPROVE" | "REJECT") => {
    if (!currentTicket) return;
    if (action === "REJECT" && !rejectReason.trim()) {
      alert("请输入驳回原因");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/mall/aftersales/${currentTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          revertStock: action === "APPROVE" ? revertStock : false,
          rejectReason: action === "REJECT" ? rejectReason : undefined,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setCurrentTicket(null);
        loadData();
      } else {
        alert(d.error || "处理失败");
      }
    } catch (e: any) {
      alert(e.message || "请求失败");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout
      title="🔄 自营便利店 · 售后与退款审核"
      subtitle="处理自营便利店用户的退款与售后诉求，支持审核同意并自动将商品回滚补齐库存。"
    >
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        {[
          { key: "all", label: "全部申请" },
          { key: "PENDING", label: "待处理 (PENDING)" },
          { key: "APPROVED", label: "已通过 (APPROVED)" },
          { key: "REJECTED", label: "已驳回 (REJECTED)" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setStatusFilter(t.key)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "none",
              background: statusFilter === t.key ? "#0B7A75" : "#E5E7EB",
              color: statusFilter === t.key ? "#fff" : "#4B5563",
              fontWeight: statusFilter === t.key ? "800" : "500",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", color: "#4B5563", fontWeight: "700" }}>
              <th style={{ padding: "12px 16px" }}>服务单号 / 关联订单</th>
              <th style={{ padding: "12px 16px" }}>申请人</th>
              <th style={{ padding: "12px 16px" }}>申请类型 / 原因</th>
              <th style={{ padding: "12px 16px", width: "100px" }}>申请退款额</th>
              <th style={{ padding: "12px 16px", width: "100px" }}>状态</th>
              <th style={{ padding: "12px 16px", width: "120px", textAlign: "right" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "#9CA3AF" }}>
                  售后数据加载中...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "#9CA3AF" }}>
                  暂无售后申请
                </td>
              </tr>
            ) : (
              tickets.map((t) => {
                const statusMeta = STATUS_MAP[t.status] || { label: t.status, color: "#6B7280", bg: "#F3F4F6" };
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: "700", color: "#111827", fontFamily: "monospace" }}>{t.ticketNo}</div>
                      <div style={{ fontSize: "11px", color: "#0B7A75", marginTop: "2px" }}>
                        关联单: {t.order?.orderNo}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div>{t.user?.nickname || t.user?.username || "顾客"}</div>
                      <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{t.user?.phone || ""}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: "600", color: "#374151" }}>{t.reason}</div>
                      {t.description && <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>{t.description}</div>}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: "800", color: "#EF4444" }}>
                      ¥{(t.refundAmountCents / 100).toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: statusMeta.bg,
                          color: statusMeta.color,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      {t.status === "PENDING" ? (
                        <button
                          onClick={() => {
                            setCurrentTicket(t);
                            setRejectReason("");
                            setRevertStock(true);
                          }}
                          style={{ padding: "4px 10px", background: "#0B7A75", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                        >
                          审核处理
                        </button>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#9CA3AF" }}>已结单</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {currentTicket && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setCurrentTicket(null);
          }}
        >
          <div style={{ background: "#fff", borderRadius: "14px", width: "100%", maxWidth: "460px", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "900", marginBottom: "12px" }}>
              ⚖️ 审核售后服务单 #{currentTicket.ticketNo}
            </h3>

            <div style={{ padding: "12px", background: "#F9FAFB", borderRadius: "8px", fontSize: "12px", marginBottom: "14px" }}>
              <div><strong>退款金额：</strong><span style={{ color: "#EF4444", fontSize: "14px", fontWeight: "800" }}>¥{(currentTicket.refundAmountCents / 100).toFixed(2)}</span></div>
              <div style={{ marginTop: "4px" }}><strong>售后原因：</strong>{currentTicket.reason}</div>
              {currentTicket.description && <div style={{ marginTop: "4px" }}><strong>具体说明：</strong>{currentTicket.description}</div>}
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={revertStock}
                  onChange={(e) => setRevertStock(e.target.checked)}
                />
                <span>同意退款时，同时将未损耗商品回滚补回真实库存</span>
              </label>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700" }}>若驳回，请输入驳回原因：</label>
              <input
                type="text"
                placeholder="例如：商品包装已拆封且完好，不符合退货退款标准"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12px", marginTop: "4px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setCurrentTicket(null)}
                style={{ padding: "8px 14px", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
              >
                取消
              </button>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleAction("REJECT")}
                  style={{ padding: "8px 14px", background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
                >
                  驳回申请
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleAction("APPROVE")}
                  style={{ padding: "8px 18px", background: "#0B7A75", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
                >
                  {processing ? "处理中..." : "同意退款"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
