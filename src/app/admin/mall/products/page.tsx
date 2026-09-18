"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminMallProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({
    name: "",
    categoryId: "",
    priceYuan: "",
    originalPriceYuan: "",
    costPriceYuan: "",
    stock: 10,
    lowStockThreshold: 5,
    unit: "件",
    spec: "",
    barcode: "",
    imageUrl: "",
    description: "",
    isFeatured: false,
    status: "ON_SALE",
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/admin/mall/products?search=${encodeURIComponent(search)}&categoryId=${categoryFilter}&status=${statusFilter}`),
        fetch("/api/admin/mall/categories"),
      ]);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || prodData.data || []);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || catData.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      categoryId: categories[0]?.id || "",
      priceYuan: "",
      originalPriceYuan: "",
      costPriceYuan: "",
      stock: 50,
      lowStockThreshold: 5,
      unit: "包",
      spec: "",
      barcode: "",
      imageUrl: "",
      description: "",
      isFeatured: false,
      status: "ON_SALE",
    });
    setErrorMsg("");
    setShowModal(true);
  };

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      categoryId: p.categoryId,
      priceYuan: (p.priceCents / 100).toFixed(2),
      originalPriceYuan: p.originalPriceCents ? (p.originalPriceCents / 100).toFixed(2) : "",
      costPriceYuan: p.costPriceCents ? (p.costPriceCents / 100).toFixed(2) : "",
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold,
      unit: p.unit || "件",
      spec: p.spec || "",
      barcode: p.barcode || "",
      imageUrl: p.imageUrl || "",
      description: p.description || "",
      isFeatured: p.isFeatured || false,
      status: p.status,
    });
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("商品名称不能为空");
      return;
    }
    const priceNum = parseFloat(formData.priceYuan);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg("售价必须大于0元");
      return;
    }
    const priceCents = Math.round(priceNum * 100);
    const originalPriceCents = formData.originalPriceYuan ? Math.round(parseFloat(formData.originalPriceYuan) * 100) : null;
    const costPriceCents = formData.costPriceYuan ? Math.round(parseFloat(formData.costPriceYuan) * 100) : null;

    setSaving(true);
    setErrorMsg("");
    try {
      const payload = {
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        priceCents,
        originalPriceCents,
        costPriceCents,
        stock: parseInt(formData.stock, 10) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold, 10) || 5,
        unit: formData.unit.trim(),
        spec: formData.spec.trim(),
        barcode: formData.barcode.trim(),
        imageUrl: formData.imageUrl.trim(),
        description: formData.description.trim(),
        isFeatured: formData.isFeatured,
        status: formData.status,
      };

      const url = editingProduct
        ? `/api/admin/mall/products/${editingProduct.id}`
        : "/api/admin/mall/products";
      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        loadData();
      } else {
        setErrorMsg(data.error || "保存商品失败");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "网络请求失败");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (p: any) => {
    const nextStatus = p.status === "ON_SALE" ? "OFF_SALE" : "ON_SALE";
    try {
      const res = await fetch(`/api/admin/mall/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (p: any) => {
    if (!confirm(`确定下架或删除商品【${p.name}】吗？`)) return;
    try {
      const res = await fetch(`/api/admin/mall/products/${p.id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout
      title="🥫 自营便利店 · 商品与真实库存"
      subtitle="管理自营便利店全部在售与下架商品，严控库存、价格与单规格品类。"
      actionButton={
        <button
          onClick={openAddModal}
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
          + 录入新商品
        </button>
      }
    >
      {/* 搜索与筛选 */}
      <div style={{ background: "#fff", padding: "16px", borderRadius: "12px", border: "1px solid #E5E7EB", marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", flex: 1, minWidth: "260px" }}>
          <input
            type="text"
            placeholder="搜索商品名称、条码、规格..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #D1D5DB",
              fontSize: "13px",
              flex: 1,
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              background: "#1F2937",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            搜索
          </button>
        </form>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", outline: "none", background: "#fff" }}
          >
            <option value="all">全部分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", outline: "none", background: "#fff" }}
          >
            <option value="all">全部状态</option>
            <option value="ON_SALE">在售中</option>
            <option value="OFF_SALE">已下架</option>
            <option value="SOLD_OUT">已售罄</option>
          </select>
        </div>
      </div>

      {/* 商品数据表格 */}
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", color: "#4B5563", fontWeight: "700" }}>
              <th style={{ padding: "12px 16px", width: "70px" }}>图例</th>
              <th style={{ padding: "12px 16px" }}>商品名称 / 规格</th>
              <th style={{ padding: "12px 16px", width: "120px" }}>所属分类</th>
              <th style={{ padding: "12px 16px", width: "100px" }}>售价 (元)</th>
              <th style={{ padding: "12px 16px", width: "110px" }}>库存 / 预警</th>
              <th style={{ padding: "12px 16px", width: "80px" }}>销量</th>
              <th style={{ padding: "12px 16px", width: "90px" }}>状态</th>
              <th style={{ padding: "12px 16px", width: "160px", textAlign: "right" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#9CA3AF" }}>
                  商品数据加载中...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#9CA3AF" }}>
                  暂无符合条件的便利店商品
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const isLowStock = p.stock <= p.lowStockThreshold;
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.15s" }}>
                    <td style={{ padding: "10px 16px" }}>
                      <img
                        src={p.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=80"}
                        alt={p.name}
                        style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "6px", border: "1px solid #E5E7EB" }}
                      />
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ fontWeight: "700", color: "#111827" }}>
                        {p.isFeatured && <span style={{ color: "#EF4444", marginRight: "4px" }}>🔥[精选]</span>}
                        {p.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>
                        规格: {p.spec || "标准单件"} {p.unit ? `| 单位: ${p.unit}` : ""} {p.barcode ? `| 条码: ${p.barcode}` : ""}
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px", color: "#4B5563" }}>
                      {p.category ? `${p.category.icon} ${p.category.name}` : "未分类"}
                    </td>
                    <td style={{ padding: "10px 16px", fontWeight: "700", color: "#111827" }}>
                      ¥{(p.priceCents / 100).toFixed(2)}
                      {p.originalPriceCents ? (
                        <div style={{ fontSize: "11px", color: "#9CA3AF", textDecoration: "line-through" }}>
                          ¥{(p.originalPriceCents / 100).toFixed(2)}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ fontWeight: "800", color: isLowStock ? "#DC2626" : "#059669" }}>
                        {p.stock} {p.unit}
                      </div>
                      {isLowStock && (
                        <div style={{ fontSize: "11px", color: "#EF4444", fontWeight: "600" }}>
                          ⚠️ 低于预警({p.lowStockThreshold})
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px 16px", color: "#6B7280" }}>{p.salesCount}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background:
                            p.status === "ON_SALE" ? "#DCFCE7" : p.status === "SOLD_OUT" ? "#FEF3C7" : "#F3F4F6",
                          color:
                            p.status === "ON_SALE" ? "#166534" : p.status === "SOLD_OUT" ? "#B45309" : "#6B7280",
                        }}
                      >
                        {p.status === "ON_SALE" ? "在售中" : p.status === "SOLD_OUT" ? "已售罄" : "已下架"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => toggleStatus(p)}
                          style={{
                            padding: "4px 8px",
                            background: p.status === "ON_SALE" ? "#FEF2F2" : "#F0FDF4",
                            color: p.status === "ON_SALE" ? "#DC2626" : "#166534",
                            border: "1px solid " + (p.status === "ON_SALE" ? "#FECACA" : "#BBF7D0"),
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          {p.status === "ON_SALE" ? "下架" : "上架"}
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          style={{
                            padding: "4px 8px",
                            background: "#F3F4F6",
                            color: "#374151",
                            border: "1px solid #D1D5DB",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          style={{
                            padding: "4px 8px",
                            background: "#FFF1F2",
                            color: "#BE123C",
                            border: "1px solid #FECDD3",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 录入/编辑商品弹窗 Modal */}
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
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#111827", margin: 0 }}>
                {editingProduct ? "✏️ 编辑便利店商品" : "➕ 录入新商品"}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#9CA3AF" }}>✕</button>
            </div>

            {errorMsg && (
              <div style={{ padding: "10px 14px", background: "#FEE2E2", color: "#991B1B", borderRadius: "8px", fontSize: "13px", fontWeight: "600", marginBottom: "14px" }}>
                ❌ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>商品全称 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：可口可乐 汽水 500ml"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>所属分类 *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box", background: "#fff" }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>规格说明</label>
                  <input
                    type="text"
                    placeholder="例如：500ml/瓶 或 12袋/提"
                    value={formData.spec}
                    onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#DC2626", marginBottom: "4px" }}>售卖单价 (元) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="3.50"
                    value={formData.priceYuan}
                    onChange={(e) => setFormData({ ...formData, priceYuan: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box", fontWeight: "700" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#6B7280", marginBottom: "4px" }}>划线原价 (元)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="4.00"
                    value={formData.originalPriceYuan}
                    onChange={(e) => setFormData({ ...formData, originalPriceYuan: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#6B7280", marginBottom: "4px" }}>进货成本 (元)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2.20"
                    value={formData.costPriceYuan}
                    onChange={(e) => setFormData({ ...formData, costPriceYuan: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>真实库存件数 *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>低库存预警阈值</label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>单位</label>
                  <input
                    type="text"
                    placeholder="瓶 / 包 / 盒 / 袋"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>商品主图 URL</label>
                <input
                  type="text"
                  placeholder="https://... 图片网络直链"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>商品简介 / 保质期与产地</label>
                <textarea
                  rows={2}
                  placeholder="例如：常温避光保存，保质期12个月，云南当地正品直供。"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", boxSizing: "border-box", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  <span>🔥 设为首页精选热卖推荐</span>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#374151" }}>上架状态:</span>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12px", background: "#fff" }}
                  >
                    <option value="ON_SALE">在售 (ON_SALE)</option>
                    <option value="OFF_SALE">下架 (OFF_SALE)</option>
                    <option value="SOLD_OUT">售罄 (SOLD_OUT)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px", borderTop: "1px solid #E5E7EB", paddingTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 16px", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "8px 22px",
                    background: "#0B7A75",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "保存中..." : "确认保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
