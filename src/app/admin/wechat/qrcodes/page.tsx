"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface QrCode {
  id: string;
  name: string;
  scene: string;
  type: string;
  qrUrl: string | null;
  wechatTicket: string | null;
  welcomeMsg: string | null;
  autoTagIds: string[];
  targetType: string;
  targetValue: string | null;
  enabled: boolean;
  scanCount: number;
  followCount: number;
  expireAt: string | null;
  createdAt: string;
}

export default function WechatQrcodesPage() {
  const [qrcodes, setQrcodes] = useState<QrCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/wechat/qrcodes")
      .then((r) => r.json())
      .then((res) => { if (res.success) setQrcodes(res.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (formData: any) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/wechat/qrcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) { alert(data.error); return; }
      setShowModal(false);
      fetchData();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确认删除渠道"${name}"的二维码？`)) return;
    const res = await fetch(`/api/admin/wechat/qrcodes?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) fetchData();
    else alert(data.error);
  };

  const handleToggle = async (qr: QrCode) => {
    await fetch("/api/admin/wechat/qrcodes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: qr.id, enabled: !qr.enabled }),
    });
    fetchData();
  };

  return (
    <AdminLayout title="渠道二维码">
      <div style={{ padding: "20px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937", margin: 0 }}>📱 渠道二维码管理</h2>
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>不同渠道专属二维码，支持差异化欢迎语和自动打标签</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: "8px 18px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
          >
            ＋ 创建二维码
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px" }}>加载中...</div>
        ) : qrcodes.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "60px", background: "white", borderRadius: "12px" }}>暂无渠道二维码</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["二维码", "渠道名称", "场景值", "类型", "欢迎语", "扫码/关注", "状态", "操作"].map((h) => (
                    <th key={h} style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, color: "#6b7280", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {qrcodes.map((qr) => (
                  <tr key={qr.id} style={{ borderBottom: "1px solid #f5f5f5", opacity: qr.enabled ? 1 : 0.5 }}>
                    <td style={{ padding: "12px 14px" }}>
                      {qr.qrUrl ? (
                        <a href={qr.qrUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block" }}>
                          <img src={qr.qrUrl} alt="QR" style={{ width: "48px", height: "48px", borderRadius: "4px", border: "1px solid #e5e7eb" }} />
                        </a>
                      ) : <span style={{ color: "#9ca3af", fontSize: "12px" }}>无</span>}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>{qr.name}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <code style={{ fontSize: "12px", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px", color: "#6b7280" }}>{qr.scene}</code>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: qr.type === "PERM" ? "#dbeafe" : "#fef3c7", color: qr.type === "PERM" ? "#1d4ed8" : "#92400e" }}>
                        {qr.type === "PERM" ? "永久" : "临时"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "12px", color: "#6b7280", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {qr.welcomeMsg || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "13px", fontVariantNumeric: "tabular-nums" }}>
                      <span style={{ color: "#06b6d4" }}>{qr.scanCount}</span> / <span style={{ color: "#10b981" }}>{qr.followCount}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <button onClick={() => handleToggle(qr)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: qr.enabled ? "#10b981" : "#9ca3af" }}>
                        {qr.enabled ? "✅ 启用" : "⏸ 停用"}
                      </button>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <button onClick={() => handleDelete(qr.id, qr.name)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CreateQrModal
          saving={saving}
          onCreate={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
    </AdminLayout>
  );
}

function CreateQrModal({ saving, onCreate, onClose }: { saving: boolean; onCreate: (d: any) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [scene, setScene] = useState("");
  const [type, setType] = useState("PERM");
  const [welcomeMsg, setWelcomeMsg] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: "14px", width: "440px", maxWidth: "90vw", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>创建渠道二维码</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#9ca3af" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>渠道名称 *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：抖音推广" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>场景值 *</label>
            <input value={scene} onChange={(e) => setScene(e.target.value)} placeholder="如：douyin_2024 (英文+下划线)" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>用于区分不同渠道，创建后不可修改</div>
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>类型</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}>
              <option value="PERM">永久二维码</option>
              <option value="TEMP">临时二维码 (30天)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>差异化欢迎语 (可选)</label>
            <textarea
              value={welcomeMsg}
              onChange={(e) => setWelcomeMsg(e.target.value)}
              placeholder="通过此二维码关注时的专属欢迎消息"
              rows={3}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", resize: "vertical" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "22px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 18px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>取消</button>
          <button
            onClick={() => {
              if (!name.trim() || !scene.trim()) { alert("请填写渠道名称和场景值"); return; }
              onCreate({ name, scene, type, welcomeMsg: welcomeMsg || null });
            }}
            disabled={saving}
            style={{ padding: "8px 18px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "创建中..." : "创建"}
          </button>
        </div>
      </div>
    </div>
  );
}
