"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";
import { Drawer } from "@/components/admin/Drawer";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import Link from "next/link";

type ReportUser = {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
};

type Report = {
  id: string;
  userId: string;
  user?: ReportUser;
  resourceType: string;
  resourceId: string;
  title: string;
  reason: string;
  status: "PENDING" | "PROCESSING" | "RESOLVED" | "REJECTED";
  createdAt: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    report: Report;
    nextStatus: string;
    action?: string;
    title: string;
    desc: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    const res = await fetch("/api/admin/reports");
    if (res.ok) {
      const d = await res.json();
      setReports(d.reports || []);
    } else {
      setError("举报列表加载失败，请检查账号权限");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleExecuteAction = async () => {
    if (!confirmTarget) return;
    setMessage("");
    setError("");
    const res = await fetch("/api/admin/reports", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId: confirmTarget.report.id,
        status: confirmTarget.nextStatus,
        action: confirmTarget.action,
      }),
    });

    if (res.ok) {
      setMessage(`举报工单「${confirmTarget.report.title}」已处置完成：${confirmTarget.title}`);
      setConfirmTarget(null);
      if (activeReport?.id === confirmTarget.report.id) {
        setActiveReport(null);
      }
      load();
    } else {
      setError("状态更新或处置失败");
    }
  };

  const getResourceDetailUrl = (type: string, id: string) => {
    const t = type.toUpperCase();
    switch (t) {
      case "JOB": return `/jobs/${id}`;
      case "HOUSE": return `/house/${id}`;
      case "INDUSTRIAL": return `/industrial/${id}`;
      case "COMMUNITY_POST":
      case "POST": return `/community/${id}`;
      case "MERCHANT":
      case "SHOP": return `/haodian/${id}`;
      case "ARTICLE": return `/articles/${id}`;
      case "PRODUCT":
      case "LISTING": return `/info/${id}`;
      case "DATING": return `/love/${id}`;
      case "EVENT": return `/active/${id}`;
      default: return "#";
    }
  };

  const columns: Column<Report>[] = [
    {
      key: "resourceType",
      header: "模块类型",
      width: "110px",
      render: (r) => (
        <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
          {r.resourceType.toUpperCase()}
        </span>
      ),
    },
    {
      key: "title",
      header: "被举报标题 / 标识",
      render: (r) => (
        <div>
          <div style={{ fontWeight: "bold", color: "#0f172a" }}>{r.title}</div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>关联ID: {r.resourceId.slice(-8)}</div>
        </div>
      ),
    },
    {
      key: "reason",
      header: "举报原因与说明",
      render: (r) => <span style={{ fontSize: "13px", color: "#334155" }}>{r.reason}</span>,
    },
    {
      key: "user",
      header: "举报人",
      width: "120px",
      render: (r) => (
        <span style={{ fontSize: "12.5px", color: "#475569" }}>
          {r.user?.nickname || r.user?.username || r.userId.slice(-6)}
        </span>
      ),
    },
    {
      key: "status",
      header: "处理状态",
      width: "110px",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "createdAt",
      header: "举报时间",
      width: "120px",
      render: (r) => <span style={{ fontSize: "12px", color: "#64748b" }}>{new Date(r.createdAt).toLocaleDateString("zh-CN")}</span>,
    },
    {
      key: "actions",
      header: "处置操作",
      width: "240px",
      render: (r) => (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveReport(r)}
            style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "12px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", cursor: "pointer" }}
          >
            详情
          </button>
          <Link
            href={getResourceDetailUrl(r.resourceType, r.resourceId)}
            target="_blank"
            style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "12px", background: "#ffffff", color: "#0B7A75", border: "1px solid #0B7A75", textDecoration: "none" }}
          >
            原内容 ↗
          </Link>
          {r.status === "PENDING" && (
            <>
              <button
                type="button"
                onClick={() => setConfirmTarget({
                  report: r,
                  nextStatus: "RESOLVED",
                  title: "标记为已处理",
                  desc: `确认将举报工单「${r.title}」标记为已核实处理？`,
                })}
                style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "12px", background: "#10b981", color: "white", border: "none", cursor: "pointer" }}
              >
                已核实
              </button>
              <button
                type="button"
                onClick={() => setConfirmTarget({
                  report: r,
                  nextStatus: "REJECTED",
                  title: "驳回无效举报",
                  desc: `确认驳回该举报？内容核验为正常无违规。`,
                })}
                style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "12px", background: "#64748b", color: "white", border: "none", cursor: "pointer" }}
              >
                驳回
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title="⚠️ 违规举报与工单处理中心"
      subtitle="集中审验用户提交的内容违规举报，支持核查原内容、下架违规资源与状态流转。"
    >
      {message && <div className="notice-success" style={{ marginBottom: "1rem" }}>{message}</div>}
      {error && <div className="notice-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <DataTable columns={columns} data={reports} keyExtractor={(r) => r.id} emptyText="暂无违规举报记录" />

      {/* Drawer */}
      <Drawer isOpen={!!activeReport} title="⚠️ 举报工单核验详情" onClose={() => setActiveReport(null)}>
        {activeReport && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "14px" }}>
            <div>
              <span style={{ color: "#64748b", fontSize: "12px" }}>工单 ID</span>
              <div style={{ fontWeight: "bold", fontFamily: "monospace" }}>{activeReport.id}</div>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "12px" }}>模块类型 / 关联 ID</span>
              <div style={{ fontWeight: "bold" }}>{activeReport.resourceType} · {activeReport.resourceId}</div>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "12px" }}>被举报标题</span>
              <div style={{ fontWeight: "bold", color: "#0f172a" }}>{activeReport.title}</div>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "12px" }}>举报原因与补充说明</span>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "4px", lineHeight: "1.6" }}>
                {activeReport.reason}
              </div>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "12px" }}>举报人信息</span>
              <div style={{ marginTop: "4px" }}>
                <b>{activeReport.user?.nickname || activeReport.user?.username || "匿名用户"}</b>
                {activeReport.user?.phone && <span style={{ color: "#64748b", marginLeft: "8px" }}>({activeReport.user.phone})</span>}
              </div>
            </div>
            <div>
              <span style={{ color: "#64748b", fontSize: "12px" }}>当前状态</span>
              <div style={{ marginTop: "4px" }}><StatusBadge status={activeReport.status} /></div>
            </div>

            {/* 危险操作区：违规下架 */}
            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px dashed #cbd5e1" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#ef4444", marginBottom: "8px" }}>
                🛡️ 高级处置（二次确认）
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Link
                  href={getResourceDetailUrl(activeReport.resourceType, activeReport.resourceId)}
                  target="_blank"
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: "#0B7A75",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: "600",
                    textDecoration: "none",
                  }}
                >
                  前往前台核实原内容 ↗
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmTarget({
                    report: activeReport,
                    nextStatus: "RESOLVED",
                    action: "OFFLINE_CONTENT",
                    title: "下架违规内容",
                    desc: `警告：确认将「${activeReport.title}」下架处理？该操作将即刻在前台隐藏该内容并记录审计日志。`,
                  })}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: "#fee2e2",
                    color: "#b91c1c",
                    border: "1px solid #f87171",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  🚫 确认违规并立即下架
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ConfirmDialog */}
      <ConfirmDialog
        isOpen={!!confirmTarget}
        title={`⚠️ ${confirmTarget?.title}`}
        description={confirmTarget?.desc || ""}
        onConfirm={handleExecuteAction}
        onCancel={() => setConfirmTarget(null)}
      />
    </AdminLayout>
  );
}
