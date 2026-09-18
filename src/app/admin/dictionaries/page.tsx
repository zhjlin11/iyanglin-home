"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";

type DictItem = {
  id: string;
  label: string;
  value: string;
  sort: number;
  enabled: boolean;
};

type DictType = {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  items: DictItem[];
};

export default function DictionariesPage() {
  const [types, setTypes] = useState<DictType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editType, setEditType] = useState<DictType | null>(null);
  const [typeForm, setTypeForm] = useState({ key: "", name: "", description: "" });
  const [typeErr, setTypeErr] = useState("");

  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState<DictItem | null>(null);
  const [itemParentId, setItemParentId] = useState("");
  const [itemForm, setItemForm] = useState({ label: "", value: "", sort: 0 });
  const [itemErr, setItemErr] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/admin/dictionaries");
      if (res.ok) {
        const d = await res.json();
        setTypes(d.types || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreateType = () => {
    setEditType(null);
    setTypeForm({ key: "", name: "", description: "" });
    setTypeErr("");
    setShowTypeForm(true);
  };

  const openEditType = (t: DictType) => {
    setEditType(t);
    setTypeForm({ key: t.key, name: t.name, description: t.description || "" });
    setTypeErr("");
    setShowTypeForm(true);
  };

  const handleTypeSubmit = async () => {
    setTypeErr("");
    if (!typeForm.key.trim() || !typeForm.name.trim()) {
      setTypeErr("key 和名称为必填");
      return;
    }
    const body = editType
      ? { action: "update_type", id: editType.id, name: typeForm.name.trim(), description: typeForm.description.trim() }
      : { action: "create_type", key: typeForm.key.trim(), name: typeForm.name.trim(), description: typeForm.description.trim() };

    const res = await fetch("/api/admin/dictionaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json();
      setTypeErr(d.error || "操作失败");
      return;
    }
    setShowTypeForm(false);
    load();
  };

  const handleDeleteType = async (t: DictType) => {
    if (!window.confirm(`确定删除字典类型「${t.name}」及其所有枚举项？此操作不可恢复。`)) return;
    await fetch("/api/admin/dictionaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_type", id: t.id }),
    });
    if (expandedId === t.id) setExpandedId(null);
    load();
  };

  const openCreateItem = (typeId: string) => {
    setEditItem(null);
    setItemParentId(typeId);
    setItemForm({ label: "", value: "", sort: 0 });
    setItemErr("");
    setShowItemForm(true);
  };

  const openEditItem = (typeId: string, item: DictItem) => {
    setEditItem(item);
    setItemParentId(typeId);
    setItemForm({ label: item.label, value: item.value, sort: item.sort });
    setItemErr("");
    setShowItemForm(true);
  };

  const handleItemSubmit = async () => {
    setItemErr("");
    if (!itemForm.label.trim() || !itemForm.value.trim()) {
      setItemErr("标签和值为必填");
      return;
    }
    const body = editItem
      ? { action: "update_item", id: editItem.id, label: itemForm.label.trim(), value: itemForm.value.trim(), sort: itemForm.sort }
      : { typeId: itemParentId, label: itemForm.label.trim(), value: itemForm.value.trim(), sort: itemForm.sort };

    const res = await fetch("/api/admin/dictionaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json();
      setItemErr(d.error || "操作失败");
      return;
    }
    setShowItemForm(false);
    load();
  };

  const handleDeleteItem = async (item: DictItem) => {
    if (!window.confirm(`确定删除枚举项「${item.label}」？`)) return;
    await fetch("/api/admin/dictionaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_item", id: item.id }),
    });
    load();
  };

  const handleToggleItem = async (item: DictItem) => {
    await fetch("/api/admin/dictionaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_item", id: item.id, enabled: !item.enabled }),
    });
    load();
  };

  return (
    <AdminLayout
      title="数据字典与动态枚举配置中心"
      subtitle="集中维护全站招聘分类、房产类型、商家分类、学历与婚姻状况字典。"
      actionButton={
        <button onClick={openCreateType} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#0B7A75", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>
          + 新建字典类型
        </button>
      }
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>加载中...</div>
      ) : types.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
          暂无字典数据，点击「+ 新建字典类型」创建
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {types.map((t) => (
            <div key={t.id} style={{ background: "white", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", cursor: "pointer", background: expandedId === t.id ? "#f0fdfa" : "white" }}
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: "bold", fontSize: "15px", color: "#0f172a" }}>{t.name}</span>
                    <code style={{ fontSize: "11px", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", color: "#0369a1" }}>{t.key}</code>
                    <StatusBadge status={t.enabled ? "ACTIVE" : "DISABLED"} />
                  </div>
                  {t.description && <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>{t.description}</p>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "13px", color: "#0B7A75", fontWeight: "bold" }}>{t.items.length} 项</span>
                  <span style={{ fontSize: "18px", color: "#94a3b8", transform: expandedId === t.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>
                </div>
              </div>

              {expandedId === t.id && (
                <div style={{ borderTop: "1px solid #e2e8f0", padding: "16px 20px", background: "#fafbfc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => openEditType(t)} style={{ padding: "4px 12px", fontSize: "12px", borderRadius: "4px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>编辑类型</button>
                      <button onClick={() => handleDeleteType(t)} style={{ padding: "4px 12px", fontSize: "12px", borderRadius: "4px", border: "none", background: "#fee2e2", color: "#991b1b", cursor: "pointer" }}>删除类型</button>
                    </div>
                    <button onClick={() => openCreateItem(t.id)} style={{ padding: "4px 14px", fontSize: "12px", borderRadius: "4px", border: "none", background: "#0B7A75", color: "white", fontWeight: "bold", cursor: "pointer" }}>+ 添加枚举项</button>
                  </div>

                  {t.items.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", padding: "1rem 0" }}>暂无枚举项</p>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontWeight: "600" }}>标签</th>
                          <th style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontWeight: "600" }}>值 (value)</th>
                          <th style={{ textAlign: "center", padding: "8px 12px", color: "#64748b", fontWeight: "600", width: "60px" }}>排序</th>
                          <th style={{ textAlign: "center", padding: "8px 12px", color: "#64748b", fontWeight: "600", width: "60px" }}>状态</th>
                          <th style={{ textAlign: "right", padding: "8px 12px", color: "#64748b", fontWeight: "600", width: "160px" }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.items.map((item) => (
                          <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px 12px", fontWeight: "bold", color: "#1e293b" }}>{item.label}</td>
                            <td style={{ padding: "8px 12px" }}><code style={{ fontSize: "12px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "3px" }}>{item.value}</code></td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>{item.sort}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: item.enabled ? "#d1fae5" : "#fee2e2", color: item.enabled ? "#065f46" : "#991b1b", fontWeight: "bold" }}>
                                {item.enabled ? "启用" : "禁用"}
                              </span>
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                <button onClick={() => openEditItem(t.id, item)} style={{ padding: "3px 8px", fontSize: "11px", borderRadius: "3px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>编辑</button>
                                <button onClick={() => handleToggleItem(item)} style={{ padding: "3px 8px", fontSize: "11px", borderRadius: "3px", border: "none", background: item.enabled ? "#fef3c7" : "#d1fae5", color: item.enabled ? "#92400e" : "#065f46", cursor: "pointer" }}>
                                  {item.enabled ? "禁用" : "启用"}
                                </button>
                                <button onClick={() => handleDeleteItem(item)} style={{ padding: "3px 8px", fontSize: "11px", borderRadius: "3px", border: "none", background: "#fee2e2", color: "#991b1b", cursor: "pointer" }}>删除</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showTypeForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowTypeForm(false)}>
          <div style={{ background: "white", borderRadius: "12px", padding: "2rem", width: "90%", maxWidth: "440px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 1.5rem 0" }}>{editType ? "编辑字典类型" : "新建字典类型"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>唯一标识 (key)</label>
                <input type="text" value={typeForm.key} onChange={(e) => setTypeForm((p) => ({ ...p, key: e.target.value }))} disabled={!!editType} placeholder="例如: job_category" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box", background: editType ? "#f1f5f9" : "white" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>名称</label>
                <input type="text" value={typeForm.name} onChange={(e) => setTypeForm((p) => ({ ...p, name: e.target.value }))} placeholder="例如: 招聘职位分类" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>描述</label>
                <input type="text" value={typeForm.description} onChange={(e) => setTypeForm((p) => ({ ...p, description: e.target.value }))} placeholder="可选描述" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            </div>
            {typeErr && <div style={{ padding: "8px 12px", background: "#fef2f2", color: "#991b1b", borderRadius: "6px", fontSize: "13px", marginTop: "1rem" }}>{typeErr}</div>}
            <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
              <button onClick={() => setShowTypeForm(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontSize: "14px", cursor: "pointer" }}>取消</button>
              <button onClick={handleTypeSubmit} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#0B7A75", color: "white", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>{editType ? "保存" : "创建"}</button>
            </div>
          </div>
        </div>
      )}

      {showItemForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowItemForm(false)}>
          <div style={{ background: "white", borderRadius: "12px", padding: "2rem", width: "90%", maxWidth: "440px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 1.5rem 0" }}>{editItem ? "编辑枚举项" : "添加枚举项"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>标签 (显示名称)</label>
                <input type="text" value={itemForm.label} onChange={(e) => setItemForm((p) => ({ ...p, label: e.target.value }))} placeholder="例如: 普工/操作工" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>值 (value)</label>
                <input type="text" value={itemForm.value} onChange={(e) => setItemForm((p) => ({ ...p, value: e.target.value }))} placeholder="例如: general_worker" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>排序</label>
                <input type="number" value={itemForm.sort} onChange={(e) => setItemForm((p) => ({ ...p, sort: Number(e.target.value) }))} style={{ width: "100px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px" }} />
              </div>
            </div>
            {itemErr && <div style={{ padding: "8px 12px", background: "#fef2f2", color: "#991b1b", borderRadius: "6px", fontSize: "13px", marginTop: "1rem" }}>{itemErr}</div>}
            <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
              <button onClick={() => setShowItemForm(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontSize: "14px", cursor: "pointer" }}>取消</button>
              <button onClick={handleItemSubmit} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#0B7A75", color: "white", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>{editItem ? "保存" : "添加"}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
