"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface ReportItem {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  user?: {
    username: string;
    phone?: string;
  };
}

interface AfterSaleItem {
  id: string;
  orderId: string;
  reason: string;
  status: string;
  createdAt: string;
  applicant?: {
    username: string;
    phone?: string;
  };
}

interface RefundItem {
  id: string;
  orderId: string;
  amountCents: number;
  reason?: string;
  status: string;
  createdAt: string;
  user?: {
    username: string;
    phone?: string;
  };
}

export default function AdminRiskPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [openAfterSales, setOpenAfterSales] = useState<AfterSaleItem[]>([]);
  const [pendingRefunds, setPendingRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"reports" | "afterSales" | "refunds">("reports");
  const [actionMsg, setActionMsg] = useState("");

  const loadData = () => {
    setLoading(true);
    setError("");
    fetch("/api/admin/risk")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReports(data.reports || []);
          setOpenAfterSales(data.openAfterSales || []);
          setPendingRefunds(data.pendingRefunds || []);
        } else {
          setError(data.error || "获取风控监控数据失败");
        }
      })
      .catch(() => setError("网络请求异常"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReportAction = async (reportId: string, action: "RESOLVED" | "REJECTED") => {
    setActionMsg("");
    try {
      const res = await fetch("/api/admin/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMsg(`✅ ${data.message}`);
        loadData();
      } else {
        setError(data.error || "操作失败");
      }
    } catch {
      setError("网络错误，提交风控仲裁失败");
    }
  };

  return (
    <AdminLayout
      title="🛡️ 统一风控与异常告警中心"
      subtitle="全站恶意刷帖、虚假欺诈违规举报、售后履约争议与退款防刷监控"
      actionButton={
        <button
          onClick={loadData}
          style={{
            padding: "8px 16px",
            background: "#0B7A75",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🔄 刷新风控队列
        </button>
      }
    >
      {/* 顶部风控指标 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ background: "white", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>⚠️ 违规与纠纷举报</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: reports.length > 0 ? "#dc2626" : "#16a34a" }}>
            {reports.length} 件
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>内容与用户违规</div>
        </div>

        <div style={{ background: "white", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>🛡️ 售后履约争议</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: openAfterSales.length > 0 ? "#ea580c" : "#16a34a" }}>
            {openAfterSales.length} 笔
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>商家服务工单仲裁</div>
        </div>

        <div style={{ background: "white", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>💸 待审核退款单</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: pendingRefunds.length > 0 ? "#ca8a04" : "#16a34a" }}>
            {pendingRefunds.length} 笔
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>资金原路返还拦截</div>
        </div>

        <div style={{ background: "white", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>🟢 平台风控引擎状态</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#16a34a", display: "flex", alignItems: "center", gap: "6px" }}>
            实时防护中
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>50积分单日防刷限额生效中</div>
        </div>
      </div>

      {actionMsg && (
        <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", borderRadius: "8px", marginBottom: "16px", fontSize: "13.5px", fontWeight: 600 }}>
          {actionMsg}
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", marginBottom: "16px", fontSize: "13.5px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* 选项卡切换 */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("reports")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            background: activeTab === "reports" ? "#0f172a" : "#f1f5f9",
            color: activeTab === "reports" ? "white" : "#475569",
          }}
        >
          ⚠️ 违规与欺诈举报 ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab("afterSales")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            background: activeTab === "afterSales" ? "#0f172a" : "#f1f5f9",
            color: activeTab === "afterSales" ? "white" : "#475569",
          }}
        >
          🛡️ 售后争议工单 ({openAfterSales.length})
        </button>
        <button
          onClick={() => setActiveTab("refunds")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            background: activeTab === "refunds" ? "#0f172a" : "#f1f5f9",
            color: activeTab === "refunds" ? "white" : "#475569",
          }}
        >
          💸 待审核退款单 ({pendingRefunds.length})
        </button>
      </div>

      {/* 列表渲染 */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>正在检索全站风控事件...</div>
        ) : activeTab === "reports" ? (
          reports.length === 0 ? (
            <div style={{ padding: "30px 0", textAlign: "center", color: "#94a3b8" }}>🎉 暂无待处理的违规举报记录</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  style={{
                    padding: "16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                        {rep.targetType} 违规
                      </span>
                      <StatusBadge status={rep.status.toLowerCase()} />
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        {new Date(rep.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                      举报理由：{rep.reason}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      举报人：<b>{rep.user?.username || "实名用户"}</b> {rep.user?.phone && `(联系电话: ${rep.user.phone})`} · 目标ID: <code style={{ fontSize: "11px" }}>{rep.targetId}</code>
                    </div>
                  </div>

                  {rep.status === "PENDING" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleReportAction(rep.id, "RESOLVED")}
                        style={{
                          padding: "6px 12px",
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        下线违规内容
                      </button>
                      <button
                        onClick={() => handleReportAction(rep.id, "REJECTED")}
                        style={{
                          padding: "6px 12px",
                          background: "#f1f5f9",
                          color: "#475569",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        驳回举报
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : activeTab === "afterSales" ? (
          openAfterSales.length === 0 ? (
            <div style={{ padding: "30px 0", textAlign: "center", color: "#94a3b8" }}>暂无进行中的售后争议工单</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {openAfterSales.map((item) => (
                <div key={item.id} style={{ padding: "16px", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>订单号：{item.orderId}</span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
                  </div>
                  <div style={{ fontSize: "13.5px", color: "#475569", marginBottom: "4px" }}>争议诉求：{item.reason}</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>申请人：{item.applicant?.username || "消费者"}</div>
                </div>
              ))}
            </div>
          )
        ) : (
          pendingRefunds.length === 0 ? (
            <div style={{ padding: "30px 0", textAlign: "center", color: "#94a3b8" }}>暂无待审核退款记录</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {pendingRefunds.map((item) => (
                <div key={item.id} style={{ padding: "16px", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>关联订单：{item.orderId}</span>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "#dc2626" }}>¥{(item.amountCents / 100).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: "13.5px", color: "#475569", marginBottom: "4px" }}>退款原因：{item.reason || "协商退款"}</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>申请人：{item.user?.username || "消费者"}</div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </AdminLayout>
  );
}
