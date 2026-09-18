"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface Tag {
  id: string;
  name: string;
  category: string;
  color: string;
  description: string | null;
  autoRule: any;
  enabled: boolean;
  usageCount: number;
  _count?: { relations: number };
  createdAt: string;
}

const CATEGORIES = [
  { value: "CHANNEL", label: "渠道来源" },
  { value: "BEHAVIOR", label: "行为特征" },
  { value: "INTEREST", label: "兴趣偏好" },
  { value: "CUSTOM", label: "自定义" },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export default function WechatTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTags = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/wechat/tags")
      .then((r) => r.json())
      .then((res) => { if (res.success) setTags(res.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const handleSave = async (formData: Partial<Tag>) => {
    setSaving(true);
    try {
      const method = editTag ? "PUT" : "POST";
      const body = editTag ? { ...formData, id: editTag.id } : formData;
      const res = await fetch("/api/admin/wechat/tags", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) { alert(data.error); return; }
      setShowModal(false);
      setEditTag(null);
      fetchTags();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确认删除标签"${name}"？关联的用户标签也会被移除。`)) return;
    const res = await fetch(`/api/admin/wechat/tags?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) fetchTags();
    else alert(data.error);
  };

  const handleToggle = async (tag: Tag) => {
    await fetch("/api/admin/wechat/tags", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tag.id, enabled: !tag.enabled }),
    });
    fetchTags();
  };

  return (
    <AdminLayout title="用户标签">
      <div style={{ padding: "20px", maxWidth: "1100px" }}>
        {/* 头部 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937", margin: 0 }}>🏷️ 用户标签管理</h2>
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>为微信用户打标签，支持手动标记和渠道二维码自动标记</p>
          </div>
          <button
            onClick={() => { setEditTag(null); setShowModal(true); }}
            style={{ padding: "8px 18px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
          >
            ＋ 新建标签
          </button>
        </div>

        {/* 标签卡片网格 */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px" }}>加载中...</div>
        ) : tags.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "60px", background: "white", borderRadius: "12px" }}>暂无标签，点击"新建标签"创建</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {tags.map((tag) => (
              <div
                key={tag.id}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "16px",
                  border: "1px solid #f0f0f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  opacity: tag.enabled ? 1 : 0.55,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "15px", fontWeight: 600, color: "#1f2937" }}>{tag.name}</span>
                  </div>
                  <span style={{ fontSize: "11px", background: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: "4px" }}>
                    {CATEGORIES.find((c) => c.value === tag.category)?.label || tag.category}
                  </span>
                </div>
                {tag.description && <p style={{ fontSize: "12px", color: "#9ca3af", margin: "8px 0 0" }}>{tag.description}</p>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    {tag._count?.relations || 0} 人使用
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => handleToggle(tag)} style={{ fontSize: "12px", background: "none", border: "none", color: tag.enabled ? "#10b981" : "#9ca3af", cursor: "pointer" }}>
                      {tag.enabled ? "✅ 启用" : "⏸ 停用"}
                    </button>
                    <button onClick={() => { setEditTag(tag); setShowModal(true); }} style={{ fontSize: "12px", background: "none", border: "none", color: "#3b82f6", cursor: "pointer" }}>编辑</button>
                    <button onClick={() => handleDelete(tag.id, tag.name)} style={{ fontSize: "12px", background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新建/编辑弹窗 */}
      {showModal && (
        <TagModal
          tag={editTag}
          saving={saving}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTag(null); }}
        />
      )}
    </AdminLayout>
  );
}

function TagModal({ tag, saving, onSave, onClose }: { tag: Tag | null; saving: boolean; onSave: (d: Partial<Tag>) => void; onClose: () => void }) {
  const [name, setName] = useState(tag?.name || "");
  const [category, setCategory] = useState(tag?.category || "CUSTOM");
  const [color, setColor] = useState(tag?.color || "#3b82f6");
  const [description, setDescription] = useState(tag?.description || "");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: "14px", width: "420px", maxWidth: "90vw", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>{tag ? "编辑标签" : "新建标签"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#9ca3af" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>标签名 *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：抖音来源" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>分类</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "6px" }}>颜色</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: "28px", height: "28px", borderRadius: "50%", background: c, border: color === c ? "3px solid #1f2937" : "2px solid #e5e7eb", cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>描述 (可选)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="标签用途说明" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "22px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 18px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>取消</button>
          <button
            onClick={() => onSave({ name, category, color, description: description || null })}
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
