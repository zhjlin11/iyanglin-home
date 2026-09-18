"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

type Flag = {
  key: string;
  name: string;
  enabled: boolean;
  description: string;
};

export default function FeaturesPage() {
  const [flags, setFlags] = useState<Flag[]>([
    { key: "allow_registration", name: "开放新用户注册", enabled: true, description: "允许新用户在前台注册新账号" },
    { key: "allow_publishing", name: "便民内容发布", enabled: true, description: "允许用户发布求职、租房与二手分类" },
    { key: "allow_commenting", name: "社区评论互动", enabled: true, description: "允许用户在贴子下发表评论" },
    { key: "allow_contact_reveal", name: "号码查看解封", enabled: true, description: "允许登录用户解封完整联系电话" },
    { key: "allow_paid_promotion", name: "付费置顶申请", enabled: true, description: "允许提交 7 天黄金置顶订单" },
    { key: "allow_dating_publish", name: "相亲嘉宾登记", enabled: true, description: "允许用户提交个人相亲交友资料" },
  ]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [targetFlag, setTargetFlag] = useState<Flag | null>(null);

  const loadFlags = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d.featureFlags) && d.featureFlags.length > 0) {
          setFlags((prev) =>
            prev.map((pf) => {
              const found = d.featureFlags.find((f: any) => f.key === pf.key);
              return found ? { ...pf, enabled: found.enabled } : pf;
            })
          );
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const toggleFlag = async () => {
    if (!targetFlag) return;
    setMessage("");
    setError("");

    const updatedFlags = flags.map((f) => (f.key === targetFlag.key ? { ...f, enabled: !f.enabled } : f));
    setFlags(updatedFlags);
    setTargetFlag(null);

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureFlags: updatedFlags }),
    });

    if (res.ok) {
      setMessage(`功能开关「${targetFlag.name}」已成功更新为 ${!targetFlag.enabled ? "启用" : "关闭"}`);
      loadFlags();
    } else {
      setError("更新失败，请检查账号权限");
    }
  };

  return (
    <AdminLayout
      title="🎛️ Feature Flags 功能开关大厅"
      subtitle="实时控制全站注册、发布、评论、号码解封与付费置顶开关。"
    >
      {message && <div className="notice-success" style={{ marginBottom: "1.5rem" }}>{message}</div>}
      {error && <div className="notice-error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {flags.map((flag) => (
          <div
            key={flag.key}
            style={{
              background: "white",
              padding: "1.25rem",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "bold", color: "#0f172a" }}>{flag.name}</h4>
                <StatusBadge status={flag.enabled ? "ACTIVE" : "DISABLED"} customLabel={flag.enabled ? "已开启" : "已关闭"} />
              </div>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 1rem 0" }}>{flag.description}</p>
              <div style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>Key: {flag.key}</div>
            </div>

            <button
              onClick={() => setTargetFlag(flag)}
              style={{
                marginTop: "1rem",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                background: flag.enabled ? "#ef4444" : "#10b981",
                color: "white",
                fontWeight: "bold",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {flag.enabled ? "🔴 立即关闭该功能" : "🟢 开启该功能"}
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!targetFlag}
        title={`⚠️ 确认切换「${targetFlag?.name}」功能开关状态？`}
        description={`操作后，对应功能将实时对全站前台用户${targetFlag?.enabled ? "停止访问" : "恢复开放"}。操作将被写入审计日志。`}
        onConfirm={toggleFlag}
        onCancel={() => setTargetFlag(null)}
      />
    </AdminLayout>
  );
}
