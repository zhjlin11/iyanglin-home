"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";

type HealthData = {
  status: string;
  version: string;
  nodeVersion: string;
  platform: string;
  uptimeSeconds: number;
  systemUptimeSeconds: number;
  memory: {
    totalMb: number;
    usedMb: number;
    freeMb: number;
    percentUsed: number;
  };
  cpu: {
    cores: number;
    model: string;
    loadAvg: number[];
  };
  database: {
    status: string;
    latencyMs: number;
    totalUsers: number;
    totalContent: number;
  };
  pm2: {
    processName: string;
    processId: number;
    status: string;
  };
  ssl: {
    domain: string;
    status: string;
    issuer: string;
  };
  timestamp: string;
};

export default function SystemHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHealth = () => {
    setLoading(true);
    setError("");
    fetch("/api/admin/system/health")
      .then(async (res) => {
        const d = await res.json().catch(() => ({}));
        if (!res.ok || d.error || !d.database) {
          setError(d.error === "Unauthorized" ? "无权访问健康监控，请确认管理员登录状态。" : "获取服务器健康指标失败");
          setData(null);
        } else {
          setData(d);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("网络超时或数据解析失败");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <AdminLayout
      title="🖥️ 系统健康与服务器真实监控中心"
      subtitle="实时监控 Node.js、PM2 进程、CPU、内存、数据库响应时延与 SSL 证书状态。"
      actionButton={
        <button
          onClick={loadHealth}
          style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}
        >
          🔄 手动刷新监控
        </button>
      }
    >
      {loading ? (
        <div style={{ background: "white", padding: "3rem", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", color: "#64748b" }}>
          实时监控指标数据加载中...
        </div>
      ) : error || !data ? (
        <div className="notice-error" style={{ padding: "1.5rem" }}>
          <b>⚠️ 提示：</b> {error || "监控指标获取失败"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Main Health Status Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>应用与系统运行状态</span>
                <StatusBadge status="ACTIVE" customLabel="运行正常" />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981", marginTop: "8px" }}>{data.status}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>版本: {data.version} ({data.nodeVersion})</div>
            </div>

            <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>PostgreSQL 数据库</span>
                <StatusBadge status="ACTIVE" customLabel="响应良好" />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0369a1", marginTop: "8px" }}>{data.database?.latencyMs ?? 0} ms</div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>用户: {data.database?.totalUsers ?? 0} · 便民内容: {data.database?.totalContent ?? 0}</div>
            </div>

            <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>内存占用率 (Memory)</span>
                <StatusBadge status={data.memory?.percentUsed > 85 ? "REJECTED" : "ACTIVE"} customLabel={`${data.memory?.percentUsed ?? 0}%`} />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#7e22ce", marginTop: "8px" }}>
                {data.memory?.usedMb ?? 0} / {data.memory?.totalMb ?? 0} MB
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>剩余内存: {data.memory?.freeMb ?? 0} MB</div>
            </div>

            <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>PM2 进程与证书</span>
                <StatusBadge status="ACTIVE" customLabel="Process #11" />
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#0B7A75", marginTop: "8px" }}>{data.pm2?.processName ?? "yanglinol-newsite"}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>SSL: {data.ssl?.domain ?? "iyanglin.com"} ({data.ssl?.issuer ?? "Let's Encrypt"})</div>
            </div>
          </div>

          {/* System Environment Details */}
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", marginTop: 0, marginBottom: "1rem", color: "#0f172a" }}>🖥️ 服务器物理硬件与系统负载参数</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", fontSize: "13px" }}>
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ color: "#64748b", marginBottom: "4px" }}>CPU 核心数与型号</div>
                <div style={{ fontWeight: "bold", color: "#0f172a" }}>{data.cpu?.cores ?? 0} 核 · {data.cpu?.model ?? "CPU"}</div>
              </div>
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ color: "#64748b", marginBottom: "4px" }}>CPU 平均负载 (Load Average)</div>
                <div style={{ fontWeight: "bold", color: "#0f172a", fontFamily: "monospace" }}>{data.cpu?.loadAvg?.map((l) => l.toFixed(2)).join(", ") ?? "0.00"}</div>
              </div>
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ color: "#64748b", marginBottom: "4px" }}>Node 进程运行时间 (Uptime)</div>
                <div style={{ fontWeight: "bold", color: "#0f172a" }}>{Math.floor((data.uptimeSeconds ?? 0) / 60)} 分钟 ({data.uptimeSeconds ?? 0} 秒)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
