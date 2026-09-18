"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, Column } from "@/components/admin/DataTable";

type IndustrialItem = {
  id: string;
  title: string;
  propertyType: string;
  transactionType: string;
  isWanted: boolean;
  region: string;
  parkName: string | null;
  areaTotal?: number;
  areaAvailable?: number | null;
  buildingArea?: number | null;
  landArea?: number | null;
  factoryArea?: number | null;
  price?: number | null;
  rentPrice?: number | null;
  salePrice?: number | null;
  priceUnit: string;
  contactName: string;
  contactPhone: string;
  status: "PENDING" | "PUBLISHED" | "REJECTED" | "OFFLINE" | "DRAFT" | "EXPIRED";
  verifiedLevel: "NONE" | "PHONE_VERIFIED" | "OWNER_VERIFIED" | "ENTERPRISE_VERIFIED";
  isTop: boolean;
  featured?: boolean;
  isFeatured?: boolean;
  viewsCount?: number;
  viewCount?: number;
  rejectReason: string | null;
  createdAt: string;
  user?: {
    username: string;
    nickname: string | null;
  };
};

const PROPERTY_TYPE_NAMES: Record<string, string> = {
  FACTORY: "标准厂房",
  WAREHOUSE: "高标仓库",
  LAND: "工业用地",
  OFFICE: "研发办公",
  INDUSTRIAL_PARK: "产业园物业",
  COMMERCIAL_SUPPORT: "商业配套",
  OTHER: "其他物业",
};

const TRANSACTION_NAMES: Record<string, string> = {
  RENT: "出租",
  SALE: "出售",
  TRANSFER: "转让",
  COOPERATION: "合作",
  JOINT_OPERATION: "联营",
  WANTED_RENT: "求租",
  WANTED_BUY: "求购",
};

const VERIFIED_LEVEL_NAMES: Record<string, { label: string; bg: string; color: string }> = {
  NONE: { label: "未核验", bg: "#f1f5f9", color: "#64748b" },
  PHONE_VERIFIED: { label: "电话已核验", bg: "#eff6ff", color: "#2563eb" },
  OWNER_VERIFIED: { label: "业主已核验", bg: "#ecfdf5", color: "#059669" },
  ENTERPRISE_VERIFIED: { label: "企业已认证", bg: "#faf5ff", color: "#7c3aed" },
};

export default function AdminIndustrialPage() {
  const [items, setItems] = useState<IndustrialItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("ALL");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        keyword,
        status: statusFilter,
        propertyType: propertyTypeFilter,
        transactionType: transactionTypeFilter,
        page: String(page),
        pageSize: "20",
      });
      const res = await fetch(`/api/admin/industrial?${q}`);
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        setTotal(data.total);
        setPendingCount(data.pendingReviewCount || 0);
        setApprovedCount(data.totalApprovedCount || 0);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchList();
  }, [page, statusFilter, propertyTypeFilter, transactionTypeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchList();
  };

  const handleUpdateStatus = async (item: IndustrialItem, newStatus: string) => {
    let rejectReason = "";
    if (newStatus === "REJECTED") {
      const reason = window.prompt("请输入驳回原因告知发布者（如：工业信息不合规、缺少土地证明等）：");
      if (!reason) return;
      rejectReason = reason;
    }

    const res = await fetch("/api/admin/industrial", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, status: newStatus, rejectReason }),
    });

    if (res.ok) {
      showMsg(newStatus === "PUBLISHED" ? "✅ 审核通过并上架" : newStatus === "REJECTED" ? "❌ 已驳回该信息" : "⏸ 已下线信息");
      fetchList();
    }
  };

  const handleToggleTop = async (item: IndustrialItem) => {
    const res = await fetch("/api/admin/industrial", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isTop: !item.isTop }),
    });
    if (res.ok) {
      showMsg(item.isTop ? "已取消置顶" : "🔥 已置顶推荐该物业");
      fetchList();
    }
  };

  const handleUpdateVerified = async (item: IndustrialItem, level: string) => {
    const res = await fetch("/api/admin/industrial", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, verifiedLevel: level }),
    });
    if (res.ok) {
      showMsg("认证等级已更新");
      fetchList();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("确定要彻底删除此条园区招商物业信息吗？此操作不可逆！")) return;
    const res = await fetch("/api/admin/industrial", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showMsg("🗑️ 物业信息已永久删除");
      fetchList();
    }
  };

  const columns: Column<IndustrialItem>[] = [
    {
      key: "info",
      header: "物业信息 / 园区板块",
      render: (row) => (
        <div style={{ maxWidth: "280px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <span style={{
              fontSize: "11px",
              padding: "1px 6px",
              borderRadius: "4px",
              background: row.isWanted ? "#fef3c7" : "#eff6ff",
              color: row.isWanted ? "#d97706" : "#2563eb",
              fontWeight: "bold",
            }}>
              {row.isWanted ? "求租求购" : PROPERTY_TYPE_NAMES[row.propertyType] || row.propertyType}
            </span>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              [{TRANSACTION_NAMES[row.transactionType] || row.transactionType}]
            </span>
            {row.isTop && (
              <span style={{ fontSize: "10px", padding: "1px 4px", background: "#fee2e2", color: "#dc2626", borderRadius: "3px", fontWeight: "bold" }}>
                置顶
              </span>
            )}
          </div>
          <Link
            href={`/industrial/${row.id}`}
            target="_blank"
            style={{ fontWeight: "600", color: "#0f172a", textDecoration: "none", fontSize: "13px", lineHeight: "1.4", display: "block" }}
          >
            {row.title}
          </Link>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            📍 {row.region} {row.parkName ? `· ${row.parkName}` : ""}
          </div>
        </div>
      ),
    },
    {
      key: "specs",
      header: "面积 / 价格",
      render: (row) => {
        const area = row.buildingArea || row.landArea || row.factoryArea;
        const price = row.rentPrice || row.salePrice;
        return (
          <div>
            <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "13px" }}>
              {area ? `${area} ㎡` : "面积面议"}
            </div>
            <div style={{ fontSize: "12px", color: "#059669", fontWeight: "600" }}>
              {price ? `${price} ${row.priceUnit || "元/㎡/月"}` : "价格面议"}
            </div>
          </div>
        );
      },
    },
    {
      key: "verified",
      header: "认证等级",
      render: (row) => {
        const v = VERIFIED_LEVEL_NAMES[row.verifiedLevel] || VERIFIED_LEVEL_NAMES.NONE;
        return (
          <div>
            <span style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "600",
              background: v.bg,
              color: v.color,
              marginBottom: "4px",
            }}>
              {v.label}
            </span>
            <div>
              <select
                value={row.verifiedLevel}
                onChange={(e) => handleUpdateVerified(row, e.target.value)}
                style={{ fontSize: "11px", padding: "2px 4px", borderRadius: "4px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", cursor: "pointer" }}
              >
                <option value="NONE">未核验</option>
                <option value="PHONE_VERIFIED">电话已核验</option>
                <option value="OWNER_VERIFIED">业主已核验</option>
                <option value="ENTERPRISE_VERIFIED">企业已认证</option>
              </select>
            </div>
          </div>
        );
      },
    },
    {
      key: "contact",
      header: "发布人 / 联系电话",
      render: (row) => (
        <div style={{ fontSize: "12px" }}>
          <div style={{ fontWeight: "600", color: "#334155" }}>{row.contactName}</div>
          <div style={{ color: "#0284c7" }}>{row.contactPhone}</div>
          <div style={{ color: "#94a3b8", fontSize: "11px" }}>
            发布者: {row.user?.nickname || row.user?.username || "游客"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "审核状态",
      render: (row) => {
        const statusMap: Record<string, { label: string; bg: string; color: string }> = {
          PENDING: { label: "待审核", bg: "#fef3c7", color: "#d97706" },
          PUBLISHED: { label: "已发布", bg: "#ecfdf5", color: "#059669" },
          REJECTED: { label: "已驳回", bg: "#fee2e2", color: "#dc2626" },
          OFFLINE: { label: "已下线", bg: "#f1f5f9", color: "#64748b" },
          DRAFT: { label: "草稿", bg: "#f1f5f9", color: "#64748b" },
          EXPIRED: { label: "已过期", bg: "#f1f5f9", color: "#94a3b8" },
        };
        const s = statusMap[row.status] || { label: row.status, bg: "#f1f5f9", color: "#475569" };
        return (
          <div>
            <span style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "600",
              background: s.bg,
              color: s.color,
            }}>
              {s.label}
            </span>
            {row.rejectReason && (
              <div style={{ fontSize: "11px", color: "#dc2626", marginTop: "3px", maxWidth: "120px" }}>
                原因: {row.rejectReason}
              </div>
            )}
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
              浏览 {row.viewCount ?? row.viewsCount ?? 0} 次
            </div>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "管理操作",
      render: (row) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {row.status !== "PUBLISHED" && (
            <button
              onClick={() => handleUpdateStatus(row, "PUBLISHED")}
              style={{ padding: "4px 8px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "600" }}
            >
              通过
            </button>
          )}
          {row.status !== "OFFLINE" && (
            <button
              onClick={() => handleUpdateStatus(row, "OFFLINE")}
              style={{ padding: "4px 8px", background: "#64748b", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
            >
              下线
            </button>
          )}
          {row.status !== "REJECTED" && (
            <button
              onClick={() => handleUpdateStatus(row, "REJECTED")}
              style={{ padding: "4px 8px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
            >
              驳回
            </button>
          )}
          <button
            onClick={() => handleToggleTop(row)}
            style={{
              padding: "4px 8px",
              background: row.isTop ? "#fecaca" : "#eff6ff",
              color: row.isTop ? "#dc2626" : "#2563eb",
              border: "none",
              borderRadius: "4px",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            {row.isTop ? "取顶" : "置顶"}
          </button>
          <Link
            href={`/industrial/${row.id}/edit`}
            target="_blank"
            style={{
              padding: "4px 8px",
              background: "#e0f2fe",
              color: "#0369a1",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "600",
            }}
          >
            编辑
          </Link>
          <button
            onClick={() => handleDelete(row.id)}
            style={{ padding: "4px 8px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
          >
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title="🏭 园区招商 / 工业地产管理"
      subtitle="管控杨林经开区厂房、高标仓库、工业土地地块、研发办公楼及求租求购招商信息。"
    >
      {message && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          padding: "12px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: "bold",
          background: message.startsWith("✅") || message.startsWith("🔥") ? "#ecfdf5" : "#fef2f2",
          color: message.startsWith("✅") || message.startsWith("🔥") ? "#065f46" : "#991b1b",
          border: "1px solid #cbd5e1", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
          {message}
        </div>
      )}

      {/* KPI 卡片 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "1.5rem" }}>
        <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>总招商物业数</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#0f172a", marginTop: "4px" }}>{total}</div>
        </div>
        <div style={{ background: "#ecfdf5", padding: "14px 16px", borderRadius: "10px", border: "1px solid #a7f3d0" }}>
          <div style={{ fontSize: "12px", color: "#065f46", fontWeight: "bold" }}>正常展示中</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#065f46", marginTop: "4px" }}>{approvedCount}</div>
        </div>
        <div style={{ background: "#fef3c7", padding: "14px 16px", borderRadius: "10px", border: "1px solid #fde68a" }}>
          <div style={{ fontSize: "12px", color: "#92400e", fontWeight: "bold" }}>待审核房源</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#92400e", marginTop: "4px" }}>{pendingCount}</div>
        </div>
        <div style={{ background: "#eff6ff", padding: "14px 16px", borderRadius: "10px", border: "1px solid #bfdbfe", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#1e40af", fontWeight: "bold" }}>前台招商发布</div>
            <div style={{ fontSize: "12px", color: "#3b82f6", marginTop: "2px" }}>支持多图上传与防重防刷</div>
          </div>
          <Link
            href="/industrial/publish"
            target="_blank"
            style={{
              display: "inline-block",
              background: "#2563eb",
              color: "#fff",
              textAlign: "center",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            + 前台录入房源
          </Link>
        </div>
      </div>

      {/* 搜索与筛选 */}
      <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索物业标题 / 园区名称 / 联系人 / 电话 / 板块..."
            style={{ flex: 1, minWidth: "220px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
          />

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#f8fafc", outline: "none" }}
          >
            <option value="ALL">全部审核状态</option>
            <option value="PUBLISHED">正常在售/在租</option>
            <option value="PENDING">待审核 (未发布)</option>
            <option value="REJECTED">已驳回</option>
            <option value="OFFLINE">已下线</option>
          </select>

          <select
            value={propertyTypeFilter}
            onChange={(e) => { setPropertyTypeFilter(e.target.value); setPage(1); }}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#f8fafc", outline: "none" }}
          >
            <option value="ALL">全部物业类型</option>
            <option value="FACTORY">标准厂房</option>
            <option value="WAREHOUSE">高标仓库</option>
            <option value="LAND">工业土地/地块</option>
            <option value="OFFICE">研发办公楼</option>
            <option value="PARK">产业园区</option>
            <option value="OTHER">其他物业</option>
          </select>

          <select
            value={transactionTypeFilter}
            onChange={(e) => { setTransactionTypeFilter(e.target.value); setPage(1); }}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#f8fafc", outline: "none" }}
          >
            <option value="ALL">全部供应/求租形态</option>
            <option value="SUPPLY">仅看供应物业 (出租/出售/转让)</option>
            <option value="WANTED">仅看企业需求 (求租/求购)</option>
            <option value="RENT">出租</option>
            <option value="SALE">出售</option>
            <option value="TRANSFER">转让</option>
            <option value="WANTED_RENT">求租需求</option>
            <option value="WANTED_BUY">求购需求</option>
          </select>

          <button
            type="submit"
            style={{ padding: "8px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
          >
            筛选查询
          </button>
        </form>
      </div>

      {/* 数据表格 */}
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(row) => row.id}
        emptyText={loading ? "正在加载数据..." : "暂无园区招商或工业地产信息"}
      />
    </AdminLayout>
  );
}
