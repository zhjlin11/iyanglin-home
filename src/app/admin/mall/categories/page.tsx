"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminMallCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "🥫",
    sortOrder: 10,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mall/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAdd = () => {
    setEditingCat(null);
    setFormData({ name: "", slug: "", icon: "🥫", sortOrder: (categories.length + 1) * 10, isActive: true });
    setErrorMsg("");
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditingCat(c);
    setFormData({ name: c.name, slug: c.slug, icon: c.icon || "🥫", sortOrder: c.sortOrder, isActive: c.isActive });
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      setErrorMsg("名称和唯一标识(Slug)不能为空");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const url = editingCat ? `/api/admin/mall/categories/${editingCat.id}` : "/api/admin/mall/categories";
      const method = editingCat ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        loadCategories();
      } else {
        setErrorMsg(data.error || "保存失败");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "网络请求失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: any) => {
    if (!confirm(`确定删除分类【${c.name}】吗？若分类下有商品将无法直接删除。`)) return;
    try {
      const res = await fetch(`/api/admin/mall/categories/${c.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        loadCategories();
      } else {
        alert(data.error || "删除失败");
      }
    } catch (e: any) {
      alert(e.message || "请求失败");
    }
  };

  return (
    <AdminLayout
      title="📑 自营便利店 · 商品分类"
      subtitle="维护便利店商品类目，支持自定义图标 Emoji、排序权重与启停用。"
      actionButton={
        <button
          onClick={openAdd}
          style={{
            padding: "8px 16px",
            background: "#0B7A75",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          + 新增分类
        </button>
      }
    >
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", color: "#4B5563", fontWeight: "700" }}>
              <th style={{ padding: "12px 16px", width: "60px" }}>图标</th>
              <th style={{ padding: "12px 16px" }}>分类名称</th>
              <th style={{ padding: "12px 16px" }}>唯一标识 (Slug)</th>
              <th style={{ padding: "12px 16px", width: "100px" }}>关联商品数</th>
              <th style={{ padding: "12px 16px", width: "80px" }}>排序权重</th>
              <th style={{ padding: "12px 16px", width: "80px" }}>状态</th>
              <th style={{ padding: "12px 16px", width: "120px", textAlign: "right" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#9CA3AF" }}>
                  分类数据加载中...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#9CA3AF" }}>
                  暂无分类
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "12px 16px", fontSize: "20px" }}>{c.icon || "🥫"}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#111827" }}>{c.name}</td>
                  <td style={{ padding: "12px 16px", color: "#6B7280", fontFamily: "monospace" }}>{c.slug}</td>
                  <td style={{ padding: "12px 16px", color: "#0B7A75", fontWeight: "600" }}>
                    {c._count?.products ?? 0} 款
                  </td>
                  <td style={{ padding: "12px 16px", color: "#4B5563" }}>{c.sortOrder}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        background: c.isActive ? "#DCFCE7" : "#F3F4F6",
                        color: c.isActive ? "#166534" : "#6B7280",
                      }}
                    >
                      {c.isActive ? "已启用" : "已停用"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => openEdit(c)}
                        style={{ padding: "4px 8px", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        style={{ padding: "4px 8px", background: "#FFF1F2", color: "#BE123C", border: "1px solid #FECDD3", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div style={{ background: "#fff", borderRadius: "14px", width: "100%", maxWidth: "420px", padding: "20px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "900", marginBottom: "14px" }}>
              {editingCat ? "编辑分类" : "新增分类"}
            </h3>
            {errorMsg && <div style={{ color: "#DC2626", fontSize: "12px", marginBottom: "10px" }}>{errorMsg}</div>}
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700" }}>分类名称</label>
                <input
                  type="text"
                  required
                  placeholder="例如：饮料冷饮"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700" }}>唯一 Slug</label>
                <input
                  type="text"
                  required
                  placeholder="例如：drinks"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>图标 Emoji</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>排序顺序</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span>启用此分类</span>
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "6px 12px", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "6px", cursor: "pointer" }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "6px 18px", background: "#0B7A75", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}
                >
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
