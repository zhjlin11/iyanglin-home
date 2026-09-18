"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminMallDeliveryPage() {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourier, setEditingCourier] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", accessCode: "888888", status: "ACTIVE" });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadCouriers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mall/couriers");
      if (res.ok) {
        const d = await res.json();
        setCouriers(d.couriers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCouriers();
  }, []);

  const openAdd = () => {
    setEditingCourier(null);
    setFormData({ name: "", phone: "", accessCode: "888888", status: "ACTIVE" });
    setErrorMsg("");
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditingCourier(c);
    setFormData({ name: c.name, phone: c.phone, accessCode: c.accessCode, status: c.status });
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg("姓名和手机号不能为空");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const url = editingCourier ? `/api/admin/mall/couriers/${editingCourier.id}` : "/api/admin/mall/couriers";
      const method = editingCourier ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const d = await res.json();
      if (res.ok) {
        setShowModal(false);
        loadCouriers();
      } else {
        setErrorMsg(d.error || "保存失败");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "请求失败");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (c: any) => {
    const nextStatus = c.status === "ACTIVE" ? "RESTING" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/mall/couriers/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) loadCouriers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout
      title="🚴 自营便利店 · 骑手与配送管理"
      subtitle="管理内部配送员专属账号与口令，支持配送员独立手机端工作台 (/courier)。"
      actionButton={
        <button
          onClick={openAdd}
          style={{ padding: "8px 16px", background: "#0B7A75", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
        >
          + 添加配送员
        </button>
      }
    >
      {/* 配送员手机端工作台说明卡片 */}
      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ fontSize: "14px", fontWeight: "800", color: "#1E40AF" }}>📱 配送员移动端专属工作台已启用</div>
        <div style={{ fontSize: "12px", color: "#1D4ED8", marginTop: "4px", lineHeight: "1.6" }}>
          配送员使用手机浏览器访问 <strong>https://iyanglin.com/courier/login</strong>，输入手机号和管理后台分配的工作口令（默认 888888），即可登录专属极速送货界面，进行一键导航拨号与送达打卡。
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", color: "#4B5563", fontWeight: "700" }}>
              <th style={{ padding: "12px 16px" }}>配送员姓名</th>
              <th style={{ padding: "12px 16px" }}>手机号</th>
              <th style={{ padding: "12px 16px" }}>工作登录口令</th>
              <th style={{ padding: "12px 16px", width: "100px" }}>当前在派单</th>
              <th style={{ padding: "12px 16px", width: "100px" }}>累计送达</th>
              <th style={{ padding: "12px 16px", width: "100px" }}>状态</th>
              <th style={{ padding: "12px 16px", width: "140px", textAlign: "right" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#9CA3AF" }}>
                  配送员列表加载中...
                </td>
              </tr>
            ) : couriers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#9CA3AF" }}>
                  暂未添加专职配送员
                </td>
              </tr>
            ) : (
              couriers.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#111827" }}>
                    🚴 {c.name}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151" }}>{c.phone}</td>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#0B7A75", fontWeight: "700" }}>
                    {c.accessCode}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: "800", color: "#D97706" }}>
                    {c.activeOrdersCount ?? 0} 单
                  </td>
                  <td style={{ padding: "12px 16px", color: "#4B5563" }}>
                    {c.totalDeliveredCount ?? 0} 单
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        background: c.status === "ACTIVE" ? "#DCFCE7" : "#F3F4F6",
                        color: c.status === "ACTIVE" ? "#166534" : "#6B7280",
                      }}
                    >
                      {c.status === "ACTIVE" ? "🟢 在岗接单" : "⚪ 休息离线"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => toggleStatus(c)}
                        style={{ padding: "4px 8px", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}
                      >
                        {c.status === "ACTIVE" ? "设为休息" : "设为在岗"}
                      </button>
                      <button
                        onClick={() => openEdit(c)}
                        style={{ padding: "4px 8px", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}
                      >
                        修改
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
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div style={{ background: "#fff", borderRadius: "14px", width: "100%", maxWidth: "400px", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "900", marginBottom: "14px" }}>
              {editingCourier ? "修改配送员" : "添加配送员"}
            </h3>
            {errorMsg && <div style={{ color: "#DC2626", fontSize: "12px", marginBottom: "10px" }}>{errorMsg}</div>}
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700" }}>配送员姓名 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：张师傅"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700" }}>手机号 (登录账号) *</label>
                <input
                  type="text"
                  required
                  placeholder="11位手机号"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700" }}>工作登录口令 *</label>
                <input
                  type="text"
                  required
                  placeholder="默认 888888"
                  value={formData.accessCode}
                  onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "6px 12px", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "6px", cursor: "pointer" }}>
                  取消
                </button>
                <button type="submit" disabled={saving} style={{ padding: "6px 18px", background: "#0B7A75", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}>
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
