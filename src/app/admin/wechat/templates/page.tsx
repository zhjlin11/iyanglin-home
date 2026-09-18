"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface Template {
  id: string;
  scene: string;
  name: string;
  templateId: string | null;
  contentMap: any;
  jumpUrl: string | null;
  description: string | null;
  enabled: boolean;
  createdAt: string;
}

interface RemoteTemplate {
  template_id: string;
  title: string;
  primary_industry: string;
  deputy_industry: string;
  content: string;
  example: string;
}

export default function WechatTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [remoteList, setRemoteList] = useState<RemoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTpl, setEditTpl] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchData = useCallback((sync = false) => {
    setLoading(true);
    const url = sync ? "/api/admin/wechat/templates?sync=1" : "/api/admin/wechat/templates";
    fetch(url)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setTemplates(res.data.local);
          if (res.data.remote?.length) setRemoteList(res.data.remote);
        }
      })
      .finally(() => { setLoading(false); setSyncing(false); });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSync = () => {
    setSyncing(true);
    fetchData(true);
  };

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/wechat/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) { alert(data.error); return; }
      setShowModal(false);
      setEditTpl(null);
      fetchData();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确认删除模板"${name}"？`)) return;
    const res = await fetch(`/api/admin/wechat/templates?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) fetchData();
    else alert(data.error);
  };

  const importRemote = (rt: RemoteTemplate) => {
    setEditTpl(null);
    setShowModal(true);
    // 预填充remote模板数据到modal中——通过延迟设置让modal先mount
    setTimeout(() => {
      const nameInput = document.getElementById("tpl-name") as HTMLInputElement;
      const idInput = document.getElementById("tpl-id") as HTMLInputElement;
      const sceneInput = document.getElementById("tpl-scene") as HTMLInputElement;
      if (nameInput) nameInput.value = rt.title;
      if (idInput) idInput.value = rt.template_id;
      if (sceneInput) sceneInput.value = rt.primary_industry;
    }, 100);
  };

  return (
    <AdminLayout title="消息模板">
      <div style={{ padding: "20px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937", margin: 0 }}>📨 消息通知模板</h2>
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>管理微信模板消息配置，用于订单通知、审核结果等场景</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{ padding: "8px 16px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", opacity: syncing ? 0.6 : 1 }}
            >
              {syncing ? "同步中..." : "🔄 从微信同步"}
            </button>
            <button
              onClick={() => { setEditTpl(null); setShowModal(true); }}
              style={{ padding: "8px 18px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
            >
              ＋ 添加模板
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px" }}>加载中...</div>
        ) : (
          <>
            {/* 本地已配置模板 */}
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#374151", margin: "0 0 12px" }}>已配置模板 ({templates.length})</h3>
            {templates.length === 0 ? (
              <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px", background: "white", borderRadius: "12px", marginBottom: "24px" }}>暂无已配置模板，点击"添加模板"或从微信同步后导入</div>
            ) : (
              <div style={{ overflowX: "auto", marginBottom: "24px" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      {["模板名称", "场景标识", "模板ID", "说明", "状态", "操作"].map((h) => (
                        <th key={h} style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, color: "#6b7280", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((tpl) => (
                      <tr key={tpl.id} style={{ borderBottom: "1px solid #f5f5f5", opacity: tpl.enabled ? 1 : 0.5 }}>
                        <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>{tpl.name}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <code style={{ fontSize: "11px", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px", color: "#6b7280" }}>{tpl.scene}</code>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "12px", color: "#6b7280", fontFamily: "monospace" }}>{tpl.templateId ? tpl.templateId.slice(0, 16) + "..." : "未配置"}</td>
                        <td style={{ padding: "12px 14px", fontSize: "12px", color: "#6b7280", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tpl.description || "—"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: tpl.enabled ? "#d1fae5" : "#f3f4f6", color: tpl.enabled ? "#059669" : "#6b7280" }}>
                            {tpl.enabled ? "启用" : "停用"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={() => { setEditTpl(tpl); setShowModal(true); }} style={{ fontSize: "12px", background: "none", border: "none", color: "#3b82f6", cursor: "pointer" }}>编辑</button>
                            <button onClick={() => handleDelete(tpl.id, tpl.name)} style={{ fontSize: "12px", background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>删除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 微信端模板列表 */}
            {remoteList.length > 0 && (
              <>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#374151", margin: "0 0 12px" }}>微信端模板 ({remoteList.length})</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
                  {remoteList.map((rt) => {
                    const isImported = templates.some((t) => t.templateId === rt.template_id || t.name === rt.title);
                    return (
                      <div key={rt.template_id} style={{ background: "white", borderRadius: "10px", padding: "14px", border: "1px solid #f0f0f0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>{rt.title}</span>
                          {isImported ? (
                            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#d1fae5", color: "#059669" }}>已导入</span>
                          ) : (
                            <button onClick={() => importRemote(rt)} style={{ fontSize: "11px", padding: "3px 10px", background: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>导入</button>
                          )}
                        </div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "4px" }}>行业: {rt.primary_industry} / {rt.deputy_industry}</div>
                        <div style={{ fontSize: "11px", color: "#6b7280", whiteSpace: "pre-wrap", maxHeight: "60px", overflow: "hidden" }}>{rt.content}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {showModal && (
        <TemplateModal
          template={editTpl}
          saving={saving}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTpl(null); }}
        />
      )}
    </AdminLayout>
  );
}

function TemplateModal({ template, saving, onSave, onClose }: { template: Template | null; saving: boolean; onSave: (d: any) => void; onClose: () => void }) {
  const [scene, setScene] = useState(template?.scene || "");
  const [name, setName] = useState(template?.name || "");
  const [templateId, setTemplateId] = useState(template?.templateId || "");
  const [description, setDescription] = useState(template?.description || "");
  const [enabled, setEnabled] = useState(template?.enabled !== false);

  const SCENE_OPTIONS = [
    "CONTENT_APPROVED", "CONTENT_REJECTED", "JOB_PUBLISHED", "HOUSE_PUBLISHED",
    "ORDER_PAID", "ORDER_SHIPPED", "AD_START", "AD_EXPIRING", "CUSTOM",
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: "14px", width: "460px", maxWidth: "90vw", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>{template ? "编辑模板" : "添加模板"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#9ca3af" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>场景标识 *</label>
            <select value={scene} onChange={(e) => setScene(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}>
              <option value="">请选择场景</option>
              {SCENE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>模板名称 *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：内容审核通过通知" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>微信模板ID</label>
            <input value={templateId} onChange={(e) => setTemplateId(e.target.value)} placeholder="从微信公众平台获取" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box", fontFamily: "monospace" }} />
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>描述</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="模板用途说明" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} id="tpl-enabled" />
            <label htmlFor="tpl-enabled" style={{ fontSize: "13px", color: "#374151" }}>启用该模板</label>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "22px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 18px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>取消</button>
          <button
            onClick={() => {
              if (!scene.trim() || !name.trim()) { alert("场景标识和名称不能为空"); return; }
              onSave({ scene, name, templateId: templateId || null, description: description || null, enabled });
            }}
            disabled={saving}
            style={{ padding: "8px 18px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
