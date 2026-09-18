"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface FlowStep {
  id?: string;
  order: number;
  type: string;
  content: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  mediaId: string | null;
  enabled: boolean;
  delayMs: number;
}

interface WelcomeFlow {
  id: string;
  name: string;
  scene: string | null;
  description: string | null;
  enabled: boolean;
  isDefault: boolean;
  priority: number;
  steps: FlowStep[];
  createdAt: string;
  updatedAt: string;
}

const STEP_TYPES = [
  { value: "TEXT", label: "📝 文本消息", desc: "支持<a>超链接" },
  { value: "NEWS", label: "📰 图文卡片", desc: "标题+描述+封面+链接" },
  { value: "IMAGE", label: "🖼 图片消息", desc: "需要微信素材ID" },
  { value: "LINK", label: "🔗 链接消息", desc: "标题+链接（文本形式）" },
];

function emptyStep(order: number): FlowStep {
  return { order, type: "TEXT", content: "", title: null, description: null, imageUrl: null, linkUrl: null, mediaId: null, enabled: true, delayMs: 0 };
}

export default function WelcomeFlowsPage() {
  const [flows, setFlows] = useState<WelcomeFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editFlow, setEditFlow] = useState<WelcomeFlow | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/wechat/welcome-flows")
      .then((r) => r.json())
      .then((res) => { if (res.success) setFlows(res.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确认删除流程"${name}"？步骤将一并删除。`)) return;
    const res = await fetch(`/api/admin/wechat/welcome-flows?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) fetchData();
    else alert(data.error);
  };

  const handleNew = () => {
    setEditFlow(null);
    setShowEditor(true);
  };

  const handleEdit = (flow: WelcomeFlow) => {
    setEditFlow(flow);
    setShowEditor(true);
  };

  const handleDuplicate = (flow: WelcomeFlow) => {
    setEditFlow({
      ...flow,
      id: "",
      name: flow.name + " (副本)",
      isDefault: false,
      scene: null,
      steps: flow.steps.map((s) => ({ ...s, id: undefined })),
    } as any);
    setShowEditor(true);
  };

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/wechat/welcome-flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) { alert(data.error); return; }
      setShowEditor(false);
      setEditFlow(null);
      fetchData();
    } finally { setSaving(false); }
  };

  const handleToggle = async (flow: WelcomeFlow) => {
    await fetch("/api/admin/wechat/welcome-flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: flow.id, name: flow.name, enabled: !flow.enabled, steps: flow.steps }),
    });
    fetchData();
  };

  return (
    <AdminLayout title="欢迎流程">
      <div style={{ padding: "20px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937", margin: 0 }}>🎉 欢迎流程管理</h2>
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>管理用户关注后的多步骤消息编排，支持文本+图文卡片组合</p>
          </div>
          <button onClick={handleNew} style={{ padding: "8px 18px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            ＋ 新建流程
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px" }}>加载中...</div>
        ) : flows.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "60px", background: "white", borderRadius: "12px" }}>
            <p style={{ fontSize: "16px", marginBottom: "8px" }}>暂无欢迎流程</p>
            <p style={{ fontSize: "13px" }}>点击"新建流程"创建第一个欢迎流程</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {flows.map((flow) => (
              <div key={flow.id} style={{ background: "white", borderRadius: "12px", padding: "16px 20px", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", opacity: flow.enabled ? 1 : 0.6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "#1f2937" }}>{flow.name}</span>
                      {flow.isDefault && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#dbeafe", color: "#2563eb" }}>默认</span>}
                      {flow.scene && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#f0fdf4", color: "#16a34a" }}>渠道: {flow.scene}</span>}
                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: flow.enabled ? "#d1fae5" : "#f3f4f6", color: flow.enabled ? "#059669" : "#6b7280" }}>
                        {flow.enabled ? "启用" : "停用"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      {flow.description || "无描述"} · {flow.steps.length} 个步骤 · {flow.steps.map((s) => STEP_TYPES.find((t) => t.value === s.type)?.label.slice(0, 2) || s.type).join(" → ")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button onClick={() => handleToggle(flow)} style={{ fontSize: "12px", padding: "4px 10px", background: "#f3f4f6", border: "none", borderRadius: "6px", cursor: "pointer", color: "#374151" }}>
                      {flow.enabled ? "停用" : "启用"}
                    </button>
                    <button onClick={() => handleEdit(flow)} style={{ fontSize: "12px", padding: "4px 10px", background: "#eff6ff", border: "none", borderRadius: "6px", cursor: "pointer", color: "#3b82f6" }}>编辑</button>
                    <button onClick={() => handleDuplicate(flow)} style={{ fontSize: "12px", padding: "4px 10px", background: "#f0fdf4", border: "none", borderRadius: "6px", cursor: "pointer", color: "#16a34a" }}>复制</button>
                    <button onClick={() => handleDelete(flow.id, flow.name)} style={{ fontSize: "12px", padding: "4px 10px", background: "#fef2f2", border: "none", borderRadius: "6px", cursor: "pointer", color: "#ef4444" }}>删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditor && (
        <FlowEditor
          flow={editFlow}
          saving={saving}
          onSave={handleSave}
          onClose={() => { setShowEditor(false); setEditFlow(null); }}
        />
      )}
    </AdminLayout>
  );
}

// ============ 流程编辑器 ============

function FlowEditor({ flow, saving, onSave, onClose }: {
  flow: WelcomeFlow | null;
  saving: boolean;
  onSave: (d: any) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(flow?.name || "");
  const [scene, setScene] = useState(flow?.scene || "");
  const [description, setDescription] = useState(flow?.description || "");
  const [enabled, setEnabled] = useState(flow?.enabled !== false);
  const [isDefault, setIsDefault] = useState(flow?.isDefault || false);
  const [steps, setSteps] = useState<FlowStep[]>(
    flow?.steps?.length ? flow.steps : [emptyStep(0)]
  );
  const [showPreview, setShowPreview] = useState(false);

  const addStep = () => {
    if (steps.length >= 5) { alert("最多5个步骤"); return; }
    setSteps([...steps, emptyStep(steps.length)]);
  };

  const removeStep = (idx: number) => {
    if (steps.length <= 1) { alert("至少保留1个步骤"); return; }
    setSteps(steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })));
  };

  const updateStep = (idx: number, field: string, value: any) => {
    setSteps(steps.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= steps.length) return;
    const arr = [...steps];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setSteps(arr.map((s, i) => ({ ...s, order: i })));
  };

  const handleSubmit = () => {
    if (!name.trim()) { alert("请填写流程名称"); return; }
    if (steps.length === 0) { alert("至少需要一个步骤"); return; }
    onSave({
      ...(flow?.id ? { id: flow.id } : {}),
      name, scene: scene || null, description: description || null,
      enabled, isDefault, priority: 0, steps,
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", overflow: "auto" }}>
      <div style={{ display: "flex", margin: "20px auto", maxWidth: "1100px", width: "95%", gap: "16px", alignItems: "flex-start" }}>

        {/* 左侧：编辑区 */}
        <div style={{ flex: 1, background: "white", borderRadius: "14px", padding: "24px", maxHeight: "90vh", overflow: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>{flow?.id ? "编辑流程" : "新建流程"}</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setShowPreview(!showPreview)} style={{ fontSize: "12px", padding: "4px 12px", background: "#f3f4f6", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                {showPreview ? "隐藏预览" : "👁 预览"}
              </button>
              <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
          </div>

          {/* 基本信息 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>流程名称 *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：默认欢迎流程" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>渠道场景值</label>
              <input value={scene} onChange={(e) => setScene(e.target.value)} placeholder="留空=通用，填写=渠道专属" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>描述</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="流程用途说明" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> 启用
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> 设为默认流程
              </label>
            </div>
          </div>

          {/* 步骤列表 */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "#374151" }}>消息步骤 ({steps.length}/5)</h4>
              <button onClick={addStep} disabled={steps.length >= 5} style={{ fontSize: "12px", padding: "4px 12px", background: "#eff6ff", color: "#3b82f6", border: "none", borderRadius: "6px", cursor: "pointer", opacity: steps.length >= 5 ? 0.5 : 1 }}>＋ 添加步骤</button>
            </div>

            {steps.map((step, idx) => (
              <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px", marginBottom: "10px", background: "#fafafa" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", background: "#e5e7eb", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center" }}>{idx + 1}</span>
                    <select value={step.type} onChange={(e) => updateStep(idx, "type", e.target.value)} style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}>
                      {STEP_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>{STEP_TYPES.find((t) => t.value === step.type)?.desc}</span>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={() => moveStep(idx, -1)} disabled={idx === 0} style={{ fontSize: "14px", background: "none", border: "none", cursor: "pointer", opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                    <button onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1} style={{ fontSize: "14px", background: "none", border: "none", cursor: "pointer", opacity: idx === steps.length - 1 ? 0.3 : 1 }}>↓</button>
                    <button onClick={() => removeStep(idx)} style={{ fontSize: "12px", background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>删除</button>
                  </div>
                </div>

                {/* TEXT */}
                {step.type === "TEXT" && (
                  <textarea
                    value={step.content || ""}
                    onChange={(e) => updateStep(idx, "content", e.target.value)}
                    placeholder={'文本内容，支持 <a href="https://...">链接文字</a>'}
                    rows={4}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
                  />
                )}

                {/* NEWS */}
                {step.type === "NEWS" && (
                  <div style={{ display: "grid", gap: "8px" }}>
                    <input value={step.title || ""} onChange={(e) => updateStep(idx, "title", e.target.value)} placeholder="图文标题 *" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
                    <input value={step.description || ""} onChange={(e) => updateStep(idx, "description", e.target.value)} placeholder="图文描述" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
                    <input value={step.imageUrl || ""} onChange={(e) => updateStep(idx, "imageUrl", e.target.value)} placeholder="封面图URL（如 /uploads/xxx.jpg）" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
                    <input value={step.linkUrl || ""} onChange={(e) => updateStep(idx, "linkUrl", e.target.value)} placeholder="点击跳转链接 *（如 https://iyanglin.com/jobs）" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
                  </div>
                )}

                {/* IMAGE */}
                {step.type === "IMAGE" && (
                  <input value={step.mediaId || ""} onChange={(e) => updateStep(idx, "mediaId", e.target.value)} placeholder="微信素材 media_id" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
                )}

                {/* LINK */}
                {step.type === "LINK" && (
                  <div style={{ display: "grid", gap: "8px" }}>
                    <input value={step.title || ""} onChange={(e) => updateStep(idx, "title", e.target.value)} placeholder="链接标题 *" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
                    <input value={step.description || ""} onChange={(e) => updateStep(idx, "description", e.target.value)} placeholder="链接描述" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
                    <input value={step.linkUrl || ""} onChange={(e) => updateStep(idx, "linkUrl", e.target.value)} placeholder="链接URL *" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }} />
                  </div>
                )}

                {/* 延迟 */}
                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>发送延迟：</span>
                  <select value={step.delayMs} onChange={(e) => updateStep(idx, "delayMs", Number(e.target.value))} style={{ padding: "3px 8px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "12px" }}>
                    <option value={0}>无延迟</option>
                    <option value={300}>300ms</option>
                    <option value={500}>500ms</option>
                    <option value={1000}>1秒</option>
                    <option value={2000}>2秒</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* 操作按钮 */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "8px 18px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>取消</button>
            <button onClick={handleSubmit} disabled={saving} style={{ padding: "8px 22px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>

        {/* 右侧：微信聊天预览 */}
        {showPreview && (
          <div style={{ width: "320px", flexShrink: 0 }}>
            <WechatPreview steps={steps} flowName={name} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============ 微信聊天预览 ============

function WechatPreview({ steps, flowName }: { steps: FlowStep[]; flowName: string }) {
  return (
    <div style={{ background: "#ededed", borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
      {/* 顶栏 */}
      <div style={{ background: "#2e2e2e", color: "white", padding: "12px 16px", textAlign: "center", fontSize: "14px", fontWeight: 500 }}>
        杨林生活圈
      </div>

      {/* 聊天区 */}
      <div style={{ padding: "16px 12px", minHeight: "400px", maxHeight: "65vh", overflow: "auto" }}>
        <div style={{ textAlign: "center", fontSize: "11px", color: "#999", marginBottom: "16px" }}>
          {flowName || "欢迎流程"} 预览
        </div>

        {steps.filter((s) => s.enabled).map((step, idx) => (
          <div key={idx} style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              {/* 头像 */}
              <div style={{ width: "36px", height: "36px", borderRadius: "4px", background: "#4caf50", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "white", flexShrink: 0 }}>
                YL
              </div>

              {/* 消息气泡 */}
              <div style={{ flex: 1, maxWidth: "230px" }}>
                {step.type === "TEXT" && (
                  <div style={{ background: "white", borderRadius: "4px", padding: "10px 12px", fontSize: "13px", lineHeight: 1.6, color: "#333", wordBreak: "break-all", whiteSpace: "pre-wrap", boxShadow: "0 1px 1px rgba(0,0,0,0.05)" }}>
                    {(step.content || "").replace(/<a[^>]*>/g, "").replace(/<\/a>/g, "").slice(0, 300)}
                    {(step.content || "").length > 300 && "..."}
                  </div>
                )}

                {step.type === "NEWS" && (
                  <div style={{ background: "white", borderRadius: "4px", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }}>
                    {step.imageUrl && (
                      <div style={{ height: "120px", background: `url(${step.imageUrl}) center/cover no-repeat, #e5e7eb`, position: "relative" }}>
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.6))", padding: "20px 10px 8px", color: "white", fontSize: "14px", fontWeight: 500 }}>
                          {step.title || "图文标题"}
                        </div>
                      </div>
                    )}
                    {!step.imageUrl && (
                      <div style={{ padding: "10px 12px", fontSize: "14px", fontWeight: 500, color: "#1f2937", borderBottom: "1px solid #f0f0f0" }}>
                        {step.title || "图文标题"}
                      </div>
                    )}
                    <div style={{ padding: "8px 12px", fontSize: "12px", color: "#6b7280" }}>
                      {(step.description || "图文描述").slice(0, 60)}
                    </div>
                    <div style={{ padding: "6px 12px 10px", fontSize: "11px", color: "#3b82f6", display: "flex", justifyContent: "space-between" }}>
                      <span>查看全文</span>
                      <span>›</span>
                    </div>
                  </div>
                )}

                {step.type === "IMAGE" && (
                  <div style={{ background: "#e5e7eb", borderRadius: "4px", padding: "30px", textAlign: "center", fontSize: "12px", color: "#9ca3af" }}>
                    🖼 图片消息
                  </div>
                )}

                {step.type === "LINK" && (
                  <div style={{ background: "white", borderRadius: "4px", padding: "10px 12px", fontSize: "13px", lineHeight: 1.6, color: "#333", boxShadow: "0 1px 1px rgba(0,0,0,0.05)" }}>
                    {step.title || "链接标题"}{"\n"}
                    <span style={{ color: "#6b7280", fontSize: "12px" }}>{step.description || ""}</span>{"\n\n"}
                    <span style={{ color: "#3b82f6" }}>👉 点击查看</span>
                  </div>
                )}
              </div>
            </div>

            {step.delayMs > 0 && (
              <div style={{ textAlign: "center", fontSize: "10px", color: "#bbb", margin: "4px 0" }}>
                ↓ 延迟 {step.delayMs}ms
              </div>
            )}
          </div>
        ))}

        {steps.length === 0 && (
          <div style={{ textAlign: "center", color: "#999", fontSize: "12px", padding: "40px 0" }}>添加步骤后即可预览</div>
        )}
      </div>

      {/* 底部菜单 */}
      <div style={{ borderTop: "1px solid #d9d9d9", display: "flex", background: "#f7f7f7" }}>
        {["找信息", "发布·服务", "我的"].map((m) => (
          <div key={m} style={{ flex: 1, textAlign: "center", padding: "10px 0", fontSize: "12px", color: "#333", borderRight: "1px solid #e5e5e5" }}>
            {m}
          </div>
        ))}
      </div>
    </div>
  );
}
