"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import Link from "next/link";

interface ShopItem {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  hours: string;
  intro: string;
  logo: string | null;
  status: string;
  isFeatured: boolean;
  isTop: boolean;
  createdAt: string;
}

const CATEGORY_MAP: Record<string, string> = {
  food: "美食团购",
  digital: "电脑数码",
  hotel: "酒店客栈",
  service: "同城生活",
  car: "汽车养护",
  decorate: "家居建材",
  beauty: "美妆丽人",
  monitor: "安防监控",
  education: "文教培训",
  express: "同城速递",
};

export default function AdminMallPage() {
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shops");
      const data = await res.json();
      if (data.items) {
        setShops(data.items);
      }
    } catch (err) {
      console.error("加载商城商户列表失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  // 统计数据
  const totalCount = shops.length;
  const approvedCount = shops.filter((s) => s.status.toLowerCase() === "approved").length;
  const featuredCount = shops.filter((s) => s.isFeatured || s.isTop).length;
  const pendingCount = shops.filter((s) => s.status.toLowerCase() === "pending").length;

  // 过滤数据
  const filteredShops = shops.filter((shop) => {
    const matchSearch =
      !searchTerm ||
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.phone.includes(searchTerm);

    const matchCategory = selectedCategory === "all" || shop.category === selectedCategory;

    const matchStatus =
      selectedStatus === "all" ||
      (selectedStatus === "featured" && (shop.isFeatured || shop.isTop)) ||
      shop.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchSearch && matchCategory && matchStatus;
  });

  // 更新商户状态
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch("/api/shops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setShops((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
      } else {
        alert("更新店铺状态失败");
      }
    } catch {
      alert("更新店铺状态异常");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 切换爆款推荐
  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    setActionLoadingId(id);
    try {
      const targetState = !currentFeatured;
      const res = await fetch("/api/shops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "approved", isFeatured: targetState }),
      });
      if (res.ok) {
        setShops((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isFeatured: targetState } : s))
        );
      } else {
        alert("设置爆款推荐失败");
      }
    } catch {
      alert("设置推荐异常");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 删除商户
  const handleDeleteShop = async (id: string, name: string) => {
    if (!confirm(`确定要删除商城店铺【${name}】吗？此操作无法撤销。`)) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/shops?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setShops((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert("删除店铺失败");
      }
    } catch {
      alert("删除店铺异常");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <AdminLayout
      title="杨林生活网商城管理中枢 (Ekka 电商工作台)"
      subtitle="全方位管控同城入驻店铺、审核在售商品与服务套餐、设置首页爆款推荐与经营状态"
      actionButton={
        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            href="/haodian"
            target="_blank"
            style={{
              background: "#ffffff",
              color: "#2EA46D",
              border: "1px solid #2EA46D",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13.5px",
              fontWeight: "700",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>🌐</span> 预览前台商城大厅
          </Link>
          <button
            onClick={fetchShops}
            style={{
              background: "#46C389",
              color: "#ffffff",
              border: "none",
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "13.5px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: "0 2px 8px rgba(70,195,137,0.25)",
            }}
          >
            <span>🔄</span> 刷新商城数据
          </button>
        </div>
      }
    >
      {/* =========================================================================
          1. Ekka 风格 4 大商城核心指标 KPI 卡片
          ========================================================================= */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {/* 卡片 1: 全站入驻店铺 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "20px 24px",
            border: "1px solid #ECEFF2",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            borderLeft: "4px solid #46C389",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "700" }}>全站商城店铺</span>
            <span style={{ fontSize: "20px" }}>🛍️</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: "#0F172A" }}>{totalCount}</div>
          <div style={{ fontSize: "12px", color: "#2EA46D", marginTop: "4px", fontWeight: "600" }}>
            同城精选实体名店
          </div>
        </div>

        {/* 卡片 2: 正常营业店铺 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "20px 24px",
            border: "1px solid #ECEFF2",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            borderLeft: "4px solid #2B78E4",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "700" }}>正常营业店铺</span>
            <span style={{ fontSize: "20px" }}>✅</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: "#0F172A" }}>{approvedCount}</div>
          <div style={{ fontSize: "12px", color: "#2B78E4", marginTop: "4px", fontWeight: "600" }}>
            营业资质核验通过
          </div>
        </div>

        {/* 卡片 3: 首页爆款推荐 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "20px 24px",
            border: "1px solid #ECEFF2",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            borderLeft: "4px solid #FF5E3A",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "700" }}>首页爆款推荐</span>
            <span style={{ fontSize: "20px" }}>🔥</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: "#FF5E3A" }}>{featuredCount}</div>
          <div style={{ fontSize: "12px", color: "#FF5E3A", marginTop: "4px", fontWeight: "600" }}>
            商城置顶特惠专区
          </div>
        </div>

        {/* 卡片 4: 待审核店铺 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "20px 24px",
            border: "1px solid #ECEFF2",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            borderLeft: "4px solid #F59E0B",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "700" }}>待审核入驻</span>
            <span style={{ fontSize: "20px" }}>⏳</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: pendingCount > 0 ? "#F59E0B" : "#0F172A" }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: "12px", color: "#F59E0B", marginTop: "4px", fontWeight: "600" }}>
            {pendingCount > 0 ? "需尽快人工核验" : "暂无待审店铺"}
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. 综合筛选与搜索控制栏
          ========================================================================= */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          padding: "18px 24px",
          border: "1px solid #ECEFF2",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          marginBottom: "20px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", flex: 1, minWidth: "280px" }}>
          {/* 搜索框 */}
          <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="按店铺名称、经营地址或联系电话搜索..."
              style={{
                width: "100%",
                height: "40px",
                padding: "0 14px 0 38px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                fontSize: "13.5px",
                outline: "none",
                boxSizing: "border-box",
                background: "#F8FAFC",
              }}
            />
            <span style={{ position: "absolute", left: "12px", top: "11px", fontSize: "15px", color: "#94A3B8" }}>🔍</span>
          </div>

          {/* 分类筛选 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              height: "40px",
              padding: "0 14px",
              borderRadius: "8px",
              border: "1px solid #CBD5E1",
              fontSize: "13.5px",
              outline: "none",
              background: "#ffffff",
              color: "#334155",
            }}
          >
            <option value="all">全部商城品类</option>
            {Object.entries(CATEGORY_MAP).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          {/* 状态筛选 */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              height: "40px",
              padding: "0 14px",
              borderRadius: "8px",
              border: "1px solid #CBD5E1",
              fontSize: "13.5px",
              outline: "none",
              background: "#ffffff",
              color: "#334155",
            }}
          >
            <option value="all">全部营业状态</option>
            <option value="approved">正常营业 (APPROVED)</option>
            <option value="pending">待审核入驻 (PENDING)</option>
            <option value="offline">已下线 (OFFLINE)</option>
            <option value="featured">🔥 仅看爆款推荐</option>
          </select>
        </div>

        <div style={{ fontSize: "13px", color: "#64748B" }}>
          符合条件：<b style={{ color: "#46C389" }}>{filteredShops.length}</b> 家商城店铺
        </div>
      </div>

      {/* =========================================================================
          3. 商城店铺数据表格 (DataTable)
          ========================================================================= */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #ECEFF2",
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "#64748B" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
            <div>正在加载商城店铺数据...</div>
          </div>
        ) : filteredShops.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "#64748B" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
            <h4 style={{ margin: "0 0 6px 0", color: "#0F172A", fontSize: "16px" }}>暂无符合条件的店铺</h4>
            <p style={{ margin: 0, fontSize: "13.5px" }}>请调整搜索关键词或重置品类筛选条件</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #ECEFF2", color: "#475569" }}>
                  <th style={{ padding: "14px 18px", fontWeight: "700" }}>店铺名称 / 品牌标识</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700" }}>商城品类</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700" }}>联系订购电话</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700" }}>提货/经营地址</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700" }}>审核状态</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700" }}>爆款推荐</th>
                  <th style={{ padding: "14px 18px", fontWeight: "700", textAlign: "right" }}>电商管控</th>
                </tr>
              </thead>
              <tbody>
                {filteredShops.map((shop) => {
                  const isActionLoading = actionLoadingId === shop.id;
                  const isFeatured = shop.isFeatured || shop.isTop;
                  const isApproved = shop.status.toLowerCase() === "approved";

                  return (
                    <tr
                      key={shop.id}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        transition: "background 0.15s",
                      }}
                    >
                      {/* 店铺名称与 Logo */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "8px",
                              background: "#F1F5F9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "18px",
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            {shop.logo ? (
                              <img src={shop.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              "🛍️"
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", color: "#0F172A" }}>{shop.name}</div>
                            <div style={{ fontSize: "11.5px", color: "#94A3B8" }}>ID: {shop.id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>

                      {/* 商城品类 */}
                      <td style={{ padding: "14px 18px", color: "#334155" }}>
                        <span style={{ background: "#F1F5F9", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                          {CATEGORY_MAP[shop.category] || shop.category}
                        </span>
                      </td>

                      {/* 联系电话 */}
                      <td style={{ padding: "14px 18px", color: "#0F172A", fontWeight: "600" }}>
                        {shop.phone || "未留电话"}
                      </td>

                      {/* 经营地址 */}
                      <td style={{ padding: "14px 18px", color: "#64748B", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {shop.address || "杨林镇"}
                      </td>

                      {/* 状态徽章 */}
                      <td style={{ padding: "14px 18px" }}>
                        <StatusBadge status={shop.status} />
                      </td>

                      {/* 首页爆款推荐 */}
                      <td style={{ padding: "14px 18px" }}>
                        {isFeatured ? (
                          <span style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FEE2E2", padding: "2px 8px", borderRadius: "4px", fontSize: "11.5px", fontWeight: "700" }}>
                            🔥 爆款特惠
                          </span>
                        ) : (
                          <span style={{ color: "#94A3B8", fontSize: "12px" }}>普通在售</span>
                        )}
                      </td>

                      {/* 电商管控操作 */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                          {/* 切换爆款推荐 */}
                          <button
                            onClick={() => handleToggleFeatured(shop.id, isFeatured)}
                            disabled={isActionLoading}
                            style={{
                              background: isFeatured ? "#FFF1F2" : "#F0FDF4",
                              color: isFeatured ? "#E11D48" : "#16A34A",
                              border: `1px solid ${isFeatured ? "#FECDD3" : "#BBF7D0"}`,
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                            }}
                          >
                            {isFeatured ? "取消推荐" : "⭐ 设为爆款"}
                          </button>

                          {/* 审核通过 / 下线 */}
                          {!isApproved ? (
                            <button
                              onClick={() => handleUpdateStatus(shop.id, "approved")}
                              disabled={isActionLoading}
                              style={{
                                background: "#46C389",
                                color: "#ffffff",
                                border: "none",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                              }}
                            >
                              ✅ 审核通过
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(shop.id, "offline")}
                              disabled={isActionLoading}
                              style={{
                                background: "#F1F5F9",
                                color: "#475569",
                                border: "1px solid #CBD5E1",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              下线
                            </button>
                          )}

                          {/* 前台预览 */}
                          <Link
                            href={`/haodian/${shop.id}`}
                            target="_blank"
                            style={{
                              background: "#EFF6FF",
                              color: "#2563EB",
                              border: "1px solid #BFDBFE",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              textDecoration: "none",
                              fontWeight: "600",
                            }}
                          >
                            查看
                          </Link>

                          {/* 删除店铺 */}
                          <button
                            onClick={() => handleDeleteShop(shop.id, shop.name)}
                            disabled={isActionLoading}
                            style={{
                              background: "#FEF2F2",
                              color: "#DC2626",
                              border: "1px solid #FEE2E2",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
