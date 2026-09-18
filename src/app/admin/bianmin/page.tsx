"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

type PhoneEntry = { id: string; name: string; phone: string; address?: string; description?: string; isHot: boolean; status: string; sortOrder: number; categoryId: string };
type PhoneCategory = { id: string; name: string; icon?: string; sortOrder: number; status: string; phones: PhoneEntry[] };

export default function AdminBianminPage() {
  const [categories, setCategories] = useState<PhoneCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Category form
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("📞");

  // Phone entry form
  const [phoneFormOpen, setPhoneFormOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState<PhoneEntry | null>(null);
  const [pf, setPf] = useState({ categoryId: "", name: "", phone: "", address: "", description: "", isHot: false });

  const load = () => {
    fetch("/api/bianmin?all=true")
      .then((r) => r.json())
      .then((data) => { setCategories(data.categories || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const totalPhones = categories.reduce((s, c) => s + c.phones.length, 0);

  const addCategory = async () => {
    setErr("");
    if (!catName.trim()) { setErr("分类名称不能为空"); return; }
    const res = await fetch("/api/bianmin", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", name: catName.trim(), icon: catIcon }),
    });
    if (!res.ok) { setErr("创建失败"); return; }
    setMsg("分类创建成功");
    setCatFormOpen(false);
    setCatName("");
    setCatIcon("📞");
    load();
  };

  const openAddPhone = (categoryId?: string) => {
    setEditingPhone(null);
    setPf({ categoryId: categoryId || categories[0]?.id || "", name: "", phone: "", address: "", description: "", isHot: false });
    setPhoneFormOpen(true);
    setErr("");
  };

  const openEditPhone = (phone: PhoneEntry) => {
    setEditingPhone(phone);
    setPf({ categoryId: phone.categoryId, name: phone.name, phone: phone.phone, address: phone.address || "", description: phone.description || "", isHot: phone.isHot });
    setPhoneFormOpen(true);
    setErr("");
  };

  const savePhone = async () => {
    setErr("");
    if (!pf.name.trim() || !pf.phone.trim()) { setErr("名称和电话不能为空"); return; }
    if (!pf.categoryId) { setErr("请选择分类"); return; }

    if (editingPhone) {
      const res = await fetch("/api/bianmin", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingPhone.id, ...pf }),
      });
      if (!res.ok) { setErr("更新失败"); return; }
      setMsg("电话已更新");
    } else {
      const res = await fetch("/api/bianmin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pf),
      });
      if (!res.ok) { setErr("添加失败"); return; }
      setMsg("电话已添加");
    }
    setPhoneFormOpen(false);
    load();
  };

  const deletePhone = async (id: string) => {
    if (!window.confirm("确认删除这条电话记录？")) return;
    await fetch("/api/bianmin", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMsg("已删除");
    load();
  };

  const toggleHot = async (phone: PhoneEntry) => {
    await fetch("/api/bianmin", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: phone.id, isHot: !phone.isHot }),
    });
    load();
  };

  return (
    <AdminLayout
      title="📞 便民电话管理"
      subtitle={`管理杨林本地便民服务电话黄页。共 ${categories.length} 个分类、${totalPhones} 条电话。`}
      actionButton={
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { setCatFormOpen(true); setErr(""); }} className="button button-secondary" style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "13px" }}>
            + 新建分类
          </button>
          <button onClick={() => openAddPhone()} className="button button-primary" style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "13px", background: "#0B7A75", borderColor: "#0B7A75" }}>
            + 添加电话
          </button>
        </div>
      }
    >
      {msg && <div className="notice-success" style={{ marginBottom: "1rem" }}>{msg}</div>}
      {err && <div className="notice-error" style={{ marginBottom: "1rem" }}>{err}</div>}

      {loading ? (
        <p style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>加载中...</p>
      ) : categories.length === 0 ? (
        <div style={{ background: "white", padding: "3rem", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📞</div>
          <h3 style={{ margin: "0 0 0.5rem 0" }}>暂无便民电话分类</h3>
          <p style={{ color: "#64748b", fontSize: "14px" }}>点击"新建分类"开始录入杨林本地便民电话数据。</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {categories.map((cat) => (
            <div key={cat.id} style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.2rem" }}>{cat.icon || "📞"}</span>
                  <span style={{ fontWeight: "bold", fontSize: "15px" }}>{cat.name}</span>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>({cat.phones.length}条)</span>
                  <span style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "4px", background: cat.status === "ACTIVE" ? "#d1fae5" : "#fee2e2", color: cat.status === "ACTIVE" ? "#065f46" : "#991b1b", fontWeight: "bold" }}>
                    {cat.status === "ACTIVE" ? "启用" : "禁用"}
                  </span>
                </div>
                <button onClick={() => openAddPhone(cat.id)} style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer" }}>
                  + 添加电话
                </button>
              </div>
              {cat.phones.length === 0 ? (
                <p style={{ padding: "1rem 16px", color: "#94a3b8", fontSize: "13px" }}>暂无电话记录</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#fafafa" }}>
                        <th style={{ padding: "8px 14px", textAlign: "left", fontWeight: "bold", color: "#64748b" }}>名称</th>
                        <th style={{ padding: "8px 14px", textAlign: "left", fontWeight: "bold", color: "#64748b" }}>电话</th>
                        <th style={{ padding: "8px 14px", textAlign: "left", fontWeight: "bold", color: "#64748b" }}>地址</th>
                        <th style={{ padding: "8px 14px", textAlign: "center", fontWeight: "bold", color: "#64748b", width: "80px" }}>热门</th>
                        <th style={{ padding: "8px 14px", textAlign: "right", fontWeight: "bold", color: "#64748b", width: "160px" }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.phones.map((p) => (
                        <tr key={p.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 14px", fontWeight: "bold", color: "#1e293b" }}>{p.name}</td>
                          <td style={{ padding: "8px 14px", color: "#0B7A75", fontWeight: "bold", fontVariantNumeric: "tabular-nums" }}>{p.phone}</td>
                          <td style={{ padding: "8px 14px", color: "#64748b" }}>{p.address || "—"}</td>
                          <td style={{ padding: "8px 14px", textAlign: "center" }}>
                            <button onClick={() => toggleHot(p)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}>
                              {p.isHot ? "🔥" : "⚪"}
                            </button>
                          </td>
                          <td style={{ padding: "8px 14px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                              <button onClick={() => openEditPhone(p)} style={{ padding: "3px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>编辑</button>
                              <button onClick={() => deletePhone(p.id)} style={{ padding: "3px 8px", fontSize: "12px", borderRadius: "4px", border: "none", background: "#ef4444", color: "white", cursor: "pointer" }}>删除</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {catFormOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setCatFormOpen(false)}>
          <div style={{ background: "white", borderRadius: "12px", padding: "2rem", width: "90%", maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 1.5rem 0" }}>新建电话分类</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>分类名称</label>
                <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="如：急救报警、水电维修" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>图标 (emoji)</label>
                <input type="text" value={catIcon} onChange={(e) => setCatIcon(e.target.value)} placeholder="📞" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
              <button onClick={() => setCatFormOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>取消</button>
              <button onClick={addCategory} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#0B7A75", color: "white", fontWeight: "bold", cursor: "pointer" }}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Phone Modal */}
      {phoneFormOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setPhoneFormOpen(false)}>
          <div style={{ background: "white", borderRadius: "12px", padding: "2rem", width: "90%", maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 1.5rem 0" }}>{editingPhone ? "编辑电话" : "添加电话"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>所属分类</label>
                <select value={pf.categoryId} onChange={(e) => setPf((p) => ({ ...p, categoryId: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box" }}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>名称 *</label>
                  <input type="text" value={pf.name} onChange={(e) => setPf((p) => ({ ...p, name: e.target.value }))} placeholder="如：杨林派出所" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>电话 *</label>
                  <input type="text" value={pf.phone} onChange={(e) => setPf((p) => ({ ...p, phone: e.target.value }))} placeholder="0871-67XXXXXX" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>地址</label>
                <input type="text" value={pf.address} onChange={(e) => setPf((p) => ({ ...p, address: e.target.value }))} placeholder="选填" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>说明</label>
                <input type="text" value={pf.description} onChange={(e) => setPf((p) => ({ ...p, description: e.target.value }))} placeholder="选填" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                <input type="checkbox" checked={pf.isHot} onChange={(e) => setPf((p) => ({ ...p, isHot: e.target.checked }))} />
                🔥 设为热门电话（在前台首页突出显示）
              </label>
            </div>
            {err && <div style={{ padding: "8px 12px", background: "#fef2f2", color: "#991b1b", borderRadius: "6px", fontSize: "13px", marginTop: "1rem" }}>{err}</div>}
            <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
              <button onClick={() => setPhoneFormOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>取消</button>
              <button onClick={savePhone} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#0B7A75", color: "white", fontWeight: "bold", cursor: "pointer" }}>{editingPhone ? "保存" : "添加"}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
