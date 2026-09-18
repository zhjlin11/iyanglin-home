"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminMallZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    coverageDesc: "",
    minOrderYuan: "10.00",
    baseDeliveryFeeYuan: "3.00",
    freeShippingThresholdYuan: "29.00",
    estimatedMinutes: 30,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadZones = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mall/zones");
      if (res.ok) {
        const d = await res.json();
        setZones(d.zones || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const openAdd = () => {
    setEditingZone(null);
    setFormData({
      name: "",
      coverageDesc: "",
      minOrderYuan: "10.00",
      baseDeliveryFeeYuan: "3.00",
      freeShippingThresholdYuan: "29.00",
      estimatedMinutes: 30,
      isActive: true,
    });
    setErrorMsg("");
    setShowModal(true);
  };

  const openEdit = (z: any) => {
    setEditingZone(z);
    setFormData({
      name: z.name,
      coverageDesc: z.coverageDesc || "",
      minOrderYuan: (z.minOrderCents / 100).toFixed(2),
      baseDeliveryFeeYuan: (z.baseDeliveryFeeCents / 100).toFixed(2),
      freeShippingThresholdYuan: z.freeShippingThresholdCents ? (z.freeShippingThresholdCents / 100).toFixed(2) : "",
      estimatedMinutes: z.estimatedMinutes || 30,
      isActive: z.isActive,
    });
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("网格区域名称不能为空");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const payload = {
        name: formData.name.trim(),
        coverageDesc: formData.coverageDesc.trim(),
        minOrderCents: Math.round(parseFloat(formData.minOrderYuan) * 100) || 0,
        baseDeliveryFeeCents: Math.round(parseFloat(formData.baseDeliveryFeeYuan) * 100) || 0,
        freeShippingThresholdCents: formData.freeShippingThresholdYuan ? Math.round(parseFloat(formData.freeShippingThresholdYuan) * 100) : null,
        estimatedMinutes: parseInt(formData.estimatedMinutes as any, 10) || 30,
        isActive: formData.isActive,
      };

      const url = editingZone ? `/api/admin/mall/zones/${editingZone.id}` : "/api/admin/mall/zones";
      const method = editingZone ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (res.ok) {
        setShowModal(false);
        loadZones();
      } else {
        setErrorMsg(d.error || "保存失败");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "请求失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="🗺️ 自营便利店 · 配送网格与运费"
      subtitle="配置杨林本地配送区域、起送价、基础运费、满免门槛及预计送达时效。"
      actionButton={
        <button
          onClick={openAdd}
          style={{ padding: "8px 16px", background: "#0B7A75", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
        >
          + 添加配送区域
        </button>
      }
    >
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", color: "#4B5563", fontWeight: "700" }}>
              <th style={{ padding: "12px 16px" }}>网格区域名称</th>
              <th style={{ padding: "12px 16px" }}>覆盖地段说明</th>
              <th style={{ padding: "12px 16px", width: "90px" }}>起送价</th>
              <th style={{ padding: "12px 16px", width: "90px" }}>基础运费</th>
              <th style={{ padding: "12px 16px", width: "110px" }}>满额免运费</th>
              <th style={{ padding: "12px 16px", width: "90px" }}>预计送达</th>
              <th style={{ padding: "12px 16px", width: "80px" }}>状态</th>
              <th style={{ padding: "12px 16px", width: "80px", textAlign: "right" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "#9CA3AF" }}>
                  区域数据加载中...
                </td>
              </tr>
            ) : zones.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "#9CA3AF" }}>
                  暂未配置配送网格
                </td>
              </tr>
            ) : (
              zones.map((z) => (
                <tr key={z.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#111827" }}>
                    📍 {z.name}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#6B7280" }}>{z.coverageDesc || "全域覆盖"}</td>
                  <td style={{ padding: "12px 16px", color: "#374151" }}>¥{(z.minOrderCents / 100).toFixed(2)}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0B7A75" }}>
                    ¥{(z.baseDeliveryFeeCents / 100).toFixed(2)}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#059669", fontWeight: "600" }}>
                    {z.freeShippingThresholdCents ? `满¥${(z.freeShippingThresholdCents / 100).toFixed(2)}包邮` : "不设免邮"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#4B5563" }}>约 {z.estimatedMinutes} 分钟</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        background: z.isActive ? "#DCFCE7" : "#F3F4F6",
                        color: z.isActive ? "#166534" : "#6B7280",
                      }}
                    >
                      {z.isActive ? "已开放" : "暂停送"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => openEdit(z)}
                      style={{ padding: "4px 8px", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}
                    >
                      修改
                    </button>
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
          <div style={{ background: "#fff", borderRadius: "14px", width: "100%", maxWidth: "460px", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "900", marginBottom: "14px" }}>
              {editingZone ? "编辑配送网格" : "添加配送网格"}
            </h3>
            {errorMsg && <div style={{ color: "#DC2626", fontSize: "12px", marginBottom: "10px" }}>{errorMsg}</div>}
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700" }}>区域名称 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：大学城园区 / 经开区工业园"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700" }}>详细地段覆盖说明</label>
                <input
                  type="text"
                  placeholder="例如：云南工商学院、师大文理学院、各学生宿舍与商圈"
                  value={formData.coverageDesc}
                  onChange={(e) => setFormData({ ...formData, coverageDesc: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>起送金额 (元)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.minOrderYuan}
                    onChange={(e) => setFormData({ ...formData, minOrderYuan: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>基础运费 (元)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.baseDeliveryFeeYuan}
                    onChange={(e) => setFormData({ ...formData, baseDeliveryFeeYuan: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>满减免运费门槛 (元)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="留空则不免邮"
                    value={formData.freeShippingThresholdYuan}
                    onChange={(e) => setFormData({ ...formData, freeShippingThresholdYuan: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>预计送达时间 (分钟)</label>
                  <input
                    type="number"
                    value={formData.estimatedMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value, 10) || 30 })}
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
                <span>开放此区域配送</span>
              </label>
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
