"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";

type AdPlacement = {
  id: string;
  key: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  enabled: boolean;
};

type Ad = {
  id: string;
  placementId: string;
  title: string;
  image: string;
  link: string;
  sort: number;
  clickCount: number;
  viewCount: number;
  status: string;
  createdBy?: string;
  createdAt: string;
};

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState({ placementId: "", title: "", image: "", link: "", sort: 0 });
  const [formErr, setFormErr] = useState("");
  const [uploading, setUploading] = useState(false);

  const loadAds = async () => {
    try {
      const res = await fetch("/api/admin/ads");
      if (res.ok) {
        const d = await res.json();
        setAds(d.ads || []);
        setPlacements(d.placements || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadAds(); }, []);

  const openCreate = () => {
    setEditingAd(null);
    setFormData({ placementId: placements[0]?.id || "", title: "", image: "", link: "", sort: 0 });
    setFormErr("");
    setShowForm(true);
  };

  const openEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({ placementId: ad.placementId, title: ad.title, image: ad.image, link: ad.link, sort: ad.sort });
    setFormErr("");
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setFormErr("图片不能超过 5MB"); return; }
    setUploading(true);
    setFormErr("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, image: data.url }));
      } else {
        setFormErr(data.error || "上传失败");
      }
    } catch { setFormErr("上传失败"); }
    setUploading(false);
  };

  const handleSubmit = async () => {
    setFormErr("");
    if (!formData.title.trim() || !formData.image || !formData.link.trim()) {
      setFormErr("标题、图片、链接为必填项");
      return;
    }
    if (!formData.placementId) {
      setFormErr("请选择广告位");
      return;
    }

    if (editingAd) {
      const res = await fetch(`/api/admin/ads/${editingAd.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) { setFormErr("保存失败"); return; }
    } else {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) { setFormErr("创建失败"); return; }
    }
    setShowForm(false);
    loadAds();
  };

  const handleToggleStatus = async (ad: Ad) => {
    const newStatus = ad.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    await fetch(`/api/admin/ads/${ad.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadAds();
  };

  const handleDelete = async (ad: Ad) => {
    if (!window.confirm(`确定删除广告「${ad.title}」？此操作不可恢复。`)) return;
    await fetch(`/api/admin/ads/${ad.id}`, { method: "DELETE" });
    loadAds();
  };

  const getPlacementName = (pid: string) => placements.find((p) => p.id === pid)?.name || "未知广告位";

  const columns: Column<Ad>[] = [
    {
      key: "title",
      header: "广告 / Banner 标题",
      render: (a) => (
        <div>
          <div style={{ fontWeight: "bold", color: "#0f172a" }}>{a.title}</div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{getPlacementName(a.placementId)}</div>
          <div style={{ fontSize: "12px", color: "#0369a1", textDecoration: "underline", marginTop: "2px" }}>{a.link}</div>
        </div>
      ),
    },
    {
      key: "image",
      header: "预览",
      width: "80px",
      render: (a) => (
        <img src={a.image} alt={a.title} style={{ width: "64px", height: "40px", objectFit: "cover", borderRadius: "4px", border: "1px solid #e2e8f0" }} />
      ),
    },
    {
      key: "metrics",
      header: "曝光 / 点击",
      width: "140px",
      render: (a) => (
        <span style={{ fontSize: "13px", fontWeight: "bold", color: "#0B7A75" }}>
          {a.viewCount} / {a.clickCount}
        </span>
      ),
    },
    {
      key: "status",
      header: "状态",
      width: "100px",
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: "actions",
      header: "操作",
      width: "200px",
      render: (a) => (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button onClick={() => openEdit(a)} style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "4px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>编辑</button>
          <button onClick={() => handleToggleStatus(a)} style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "4px", border: "none", background: a.status === "ACTIVE" ? "#fef3c7" : "#d1fae5", color: a.status === "ACTIVE" ? "#92400e" : "#065f46", cursor: "pointer", fontWeight: "bold" }}>
            {a.status === "ACTIVE" ? "下线" : "上线"}
          </button>
          <button onClick={() => handleDelete(a)} style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "4px", border: "none", background: "#fee2e2", color: "#991b1b", cursor: "pointer" }}>删除</button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title="广告位、Banner 与全站推荐位运营中心"
      subtitle="统一管理首页 Banner 轮播、各频道顶部广告、商家推荐位与点击/曝光监控。"
      actionButton={
        <button onClick={openCreate} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#0B7A75", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>
          + 新建广告
        </button>
      }
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>加载中...</div>
      ) : (
        <DataTable columns={columns} data={ads} keyExtractor={(a) => a.id} emptyText="暂无广告记录，点击「+ 新建广告」创建第一条" />
      )}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowForm(false)}>
          <div style={{ background: "white", borderRadius: "12px", padding: "2rem", width: "90%", maxWidth: "500px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 1.5rem 0" }}>{editingAd ? "编辑广告" : "新建广告"}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>广告位</label>
                <select
                  value={formData.placementId}
                  onChange={(e) => setFormData((p) => ({ ...p, placementId: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px" }}
                >
                  {placements.length === 0 && <option value="">无可用广告位</option>}
                  {placements.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>广告标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="输入广告标题"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>广告图片</label>
                {formData.image && (
                  <img src={formData.image} alt="预览" style={{ width: "100%", maxHeight: "120px", objectFit: "cover", borderRadius: "6px", marginBottom: "8px", border: "1px solid #e2e8f0" }} />
                )}
                <label style={{ display: "inline-block", padding: "6px 14px", fontSize: "13px", borderRadius: "6px", border: "1px solid #e2e8f0", cursor: "pointer", color: "#0B7A75", fontWeight: "bold" }}>
                  {uploading ? "上传中..." : "选择图片"}
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} disabled={uploading} />
                </label>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>跳转链接</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData((p) => ({ ...p, link: e.target.value }))}
                  placeholder="https://iyanglin.com/..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>排序权重</label>
                <input
                  type="number"
                  value={formData.sort}
                  onChange={(e) => setFormData((p) => ({ ...p, sort: Number(e.target.value) }))}
                  style={{ width: "100px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "14px" }}
                />
              </div>
            </div>

            {formErr && <div style={{ padding: "8px 12px", background: "#fef2f2", color: "#991b1b", borderRadius: "6px", fontSize: "13px", marginTop: "1rem" }}>{formErr}</div>}

            <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontSize: "14px", cursor: "pointer" }}>取消</button>
              <button onClick={handleSubmit} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#0B7A75", color: "white", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
                {editingAd ? "保存修改" : "创建广告"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
