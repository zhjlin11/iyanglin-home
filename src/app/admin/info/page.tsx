"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Flame,
  Star,
  Eye,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  EyeOff,
  ChevronRight,
  X,
  PhoneCall,
  MapPin,
  Tag,
  Check,
  Calendar,
  Layers,
  FileText,
  AlertOctagon,
} from "lucide-react";
import {
  INFO_CATEGORIES,
  INFO_AREAS,
  getCategoryBadge,
  getItemTypeBadge,
} from "@/lib/info-categories";

interface AdminListingItem {
  id: string;
  title: string;
  body: string;
  category: string;
  subCategory?: string | null;
  itemType: string;
  price?: string | null;
  priceUnit?: string | null;
  condition?: string | null;
  area?: string | null;
  address?: string | null;
  contact?: string | null;
  contactName?: string | null;
  wechat?: string | null;
  images: string[];
  viewsCount: number;
  isTop: boolean;
  isFeatured?: boolean;
  status: string;
  rejectReason?: string | null;
  expiresAt?: string | null;
  extraData?: any;
  fromPlace?: string | null;
  toPlace?: string | null;
  departureTime?: string | null;
  createdAt: string;
  refreshedAt: string;
  isDuplicateSuspect?: boolean;
  isExpired?: boolean;
  author?: {
    id: string;
    username: string;
    nickname?: string | null;
    avatar?: string | null;
    phone?: string | null;
    phoneVerifiedAt?: string | null;
    role?: string;
  } | null;
}

export default function AdminInfoPage() {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [items, setItems] = useState<AdminListingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  // 统计指标
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    offline: 0,
    expired: 0,
    top: 0,
    today: 0,
  });

  // 过滤字段
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedArea, setSelectedArea] = useState("ALL");

  // 侧边详情抽屉
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<AdminListingItem | null>(null);

  // 驳回模态框
  const [rejectModalItem, setRejectModalItem] = useState<AdminListingItem | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  // Toast 消息
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("tab", activeTab);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (selectedArea !== "ALL") params.set("area", selectedArea);

      const res = await fetch(`/api/admin/info?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setTotal(data.total || 0);
        if (data.counts) {
          setCounts(data.counts);
        }
      } else {
        showToast(data.error || "获取列表失败");
      }
    } catch (err: any) {
      showToast("网络请求异常");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize, searchQuery, selectedCategory, selectedArea]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 执行单条审核动作
  const handleAction = async (action: string, id: string, reason?: string) => {
    try {
      const res = await fetch("/api/admin/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "操作失败");
      }
      showToast("操作成功！");
      // 关闭模态框与更新抽屉
      if (rejectModalItem?.id === id) {
        setRejectModalItem(null);
        setRejectReasonInput("");
      }
      if (selectedDrawerItem?.id === id) {
        if (action === "DELETE") {
          setSelectedDrawerItem(null);
        } else {
          setSelectedDrawerItem((prev) => (prev ? { ...prev, status: action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : action === "OFFLINE" ? "OFFLINE" : action === "RESTORE" ? "APPROVED" : prev.status } : null));
        }
      }
      loadData();
    } catch (err: any) {
      showToast(err.message || "操作异常");
    }
  };

  const tabs = [
    { key: "ALL", label: "全部信息", count: undefined },
    { key: "PENDING", label: "待审核", count: counts.pending, highlight: counts.pending > 0 },
    { key: "APPROVED", label: "正常在架", count: counts.approved },
    { key: "REJECTED", label: "已驳回", count: counts.rejected },
    { key: "OFFLINE", label: "已下架", count: counts.offline },
    { key: "EXPIRED", label: "已过期", count: counts.expired },
    { key: "TOP", label: "置顶推荐", count: counts.top },
  ];

  return (
    <div style={{ padding: "1.5rem", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0f172a",
            color: "white",
            padding: "10px 22px",
            borderRadius: "30px",
            fontSize: "13px",
            fontWeight: "700",
            zIndex: 9999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* 顶部标题栏 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", background: "#f0fdfa", color: "#0B7A75", padding: "3px 10px", borderRadius: "12px", fontWeight: "800", marginBottom: "6px" }}>
            <ShieldCheck size={14} />
            <span>杨林生活网 · 便民综合信息管理工作台</span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#0f172a", margin: 0 }}>
            便民信息运营审核中心
          </h1>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={() => loadData()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "white",
              border: "1px solid #cbd5e1",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} />
            <span>刷新数据</span>
          </button>
          <Link
            href="/info"
            target="_blank"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#0B7A75",
              color: "white",
              padding: "8px 18px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "800",
              textDecoration: "none",
            }}
          >
            <span>🌐 前台大厅预览</span>
          </Link>
        </div>
      </div>

      {/* 4 大核心 KPI 统计卡片 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "1.5rem" }}>
        {/* 待审核 */}
        <div style={{ background: "white", borderRadius: "14px", padding: "16px 18px", border: counts.pending > 0 ? "2px solid #ef4444" : "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "700" }}>待审核便民信息</span>
            <Clock size={18} color={counts.pending > 0 ? "#ef4444" : "#94a3b8"} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: counts.pending > 0 ? "#ef4444" : "#0f172a", marginTop: "8px" }}>
            {counts.pending}
          </div>
          <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px" }}>
            {counts.pending > 0 ? "⚠️ 有新提交信息待审核" : "所有提交已审核完毕"}
          </div>
        </div>

        {/* 正常在架 */}
        <div style={{ background: "white", borderRadius: "14px", padding: "16px 18px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "700" }}>正常在架信息总量</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: "#0B7A75", marginTop: "8px" }}>
            {counts.approved}
          </div>
          <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px" }}>
            前台可即时检索与查看
          </div>
        </div>

        {/* 今日新发 */}
        <div style={{ background: "white", borderRadius: "14px", padding: "16px 18px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "700" }}>今日新发便民信息</span>
            <Calendar size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: "#0284c7", marginTop: "8px" }}>
            {counts.today}
          </div>
          <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px" }}>
            今日 00:00 至今新增数
          </div>
        </div>

        {/* 置顶与推荐 */}
        <div style={{ background: "white", borderRadius: "14px", padding: "16px 18px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "700" }}>置顶优先展示数</span>
            <Flame size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: "#d97706", marginTop: "8px" }}>
            {counts.top}
          </div>
          <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px" }}>
            常驻大厅顶部推荐位
          </div>
        </div>
      </div>

      {/* 状态 Tab 导航栏 */}
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "8px", marginBottom: "1rem", scrollbarWidth: "none" }}>
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setActiveTab(t.key);
                setPage(1);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "12px",
                border: isActive ? "1px solid #0B7A75" : "1px solid #e2e8f0",
                background: isActive ? "#0B7A75" : "white",
                color: isActive ? "white" : "#475569",
                fontWeight: isActive ? "800" : "600",
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span
                  style={{
                    background: isActive ? "rgba(255,255,255,0.25)" : t.highlight ? "#fee2e2" : "#f1f5f9",
                    color: isActive ? "white" : t.highlight ? "#ef4444" : "#64748b",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: "800",
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 搜索与多维过滤条 */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          padding: "12px 16px",
          border: "1px solid #e2e8f0",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* 关键字搜索 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: "220px" }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadData()}
            placeholder="搜索标题、内容、联系电话、发布人..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "13.5px",
              color: "#0f172a",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                loadData();
              }}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 分类下拉 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "700" }}>分类：</span>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "white" }}
          >
            <option value="ALL">全部分类</option>
            {INFO_CATEGORIES.map((c) => (
              <option key={c.key} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* 区域下拉 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "700" }}>区域：</span>
          <select
            value={selectedArea}
            onChange={(e) => {
              setSelectedArea(e.target.value);
              setPage(1);
            }}
            style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "white" }}
          >
            <option value="ALL">全部区域</option>
            {INFO_AREAS.filter((a) => a !== "全部区域").map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setPage(1);
            loadData();
          }}
          style={{
            background: "#0B7A75",
            color: "white",
            border: "none",
            padding: "6px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          筛选
        </button>
      </div>

      {/* 数据表格 */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: "800" }}>
                <th style={{ padding: "12px 16px" }}>封面/标题</th>
                <th style={{ padding: "12px 14px" }}>分类 / 供求</th>
                <th style={{ padding: "12px 14px" }}>片区</th>
                <th style={{ padding: "12px 14px" }}>发布人 / 手机</th>
                <th style={{ padding: "12px 14px" }}>状态</th>
                <th style={{ padding: "12px 14px" }}>价格 / 浏览</th>
                <th style={{ padding: "12px 14px" }}>刷新时间</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                    正在加载数据...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                    暂无符合条件的便民信息
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const catBadge = getCategoryBadge(item.category);
                  const typeBadge = getItemTypeBadge(item.category, item.itemType);
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* 标题与封面 */}
                      <td style={{ padding: "12px 16px", maxWidth: "300px" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          {item.images && item.images[0] ? (
                            <img
                              src={item.images[0]}
                              alt="thumb"
                              style={{ width: "48px", height: "36px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: "48px", height: "36px", background: "#f1f5f9", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#94a3b8", flexShrink: 0 }}>
                              无图
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                              {item.isTop && (
                                <span style={{ background: "#fef3c7", color: "#b45309", fontSize: "10.5px", fontWeight: "900", padding: "1px 5px", borderRadius: "4px" }}>
                                  置顶
                                </span>
                              )}
                              {item.isDuplicateSuspect && (
                                <span style={{ background: "#fee2e2", color: "#b91c1c", fontSize: "10px", fontWeight: "800", padding: "1px 5px", borderRadius: "4px" }}>
                                  ⚠️ 疑似短时重发
                                </span>
                              )}
                            </div>
                            <div
                              onClick={() => setSelectedDrawerItem(item)}
                              style={{ fontWeight: "800", color: "#0f172a", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                              title={item.title}
                            >
                              {item.title}
                            </div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>ID: {item.id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>

                      {/* 分类 / 供求 */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: "700", color: "#334155" }}>
                          {catBadge.name.split("/")[0]}
                        </div>
                        <div style={{ display: "flex", gap: "4px", marginTop: "2px" }}>
                          <span style={{ fontSize: "10.5px", padding: "1px 5px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b" }}>
                            {typeBadge.label}
                          </span>
                          {item.subCategory && (
                            <span style={{ fontSize: "10.5px", padding: "1px 5px", borderRadius: "4px", background: "#f8fafc", color: "#94a3b8" }}>
                              {item.subCategory}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 片区 */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap", color: "#475569" }}>
                        📍 {item.area || "杨林"}
                      </td>

                      {/* 发布人与手机 */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: "700", color: "#0f172a" }}>
                          {item.contactName || item.author?.nickname || item.author?.username || "热心街坊"}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#0B7A75", display: "flex", alignItems: "center", gap: "3px" }}>
                          <PhoneCall size={11} />
                          <span>{item.contact || "未留电话"}</span>
                          {item.author?.phoneVerifiedAt && (
                            <span title="电话已核验">
                              <Check size={12} color="#10b981" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 状态 */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "10px",
                            fontSize: "11.5px",
                            fontWeight: "800",
                            background:
                              item.status === "APPROVED" ? "#dcfce7" :
                              item.status === "PENDING" ? "#e0f2fe" :
                              item.status === "REJECTED" ? "#fee2e2" :
                              item.status === "OFFLINE" ? "#f1f5f9" : "#fef3c7",
                            color:
                              item.status === "APPROVED" ? "#166534" :
                              item.status === "PENDING" ? "#0369a1" :
                              item.status === "REJECTED" ? "#991b1b" :
                              item.status === "OFFLINE" ? "#64748b" : "#92400e",
                          }}
                        >
                          {item.status === "APPROVED" ? "在架" :
                           item.status === "PENDING" ? "待审核" :
                           item.status === "REJECTED" ? "已驳回" :
                           item.status === "OFFLINE" ? "已下架" :
                           item.status === "SOLD" ? "已售出" :
                           item.status === "RESOLVED" ? "已解决" : item.status}
                        </span>
                      </td>

                      {/* 价格 / 浏览 */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: "800", color: "#e11d48" }}>
                          {item.price === "面议" ? "面议" : `¥${item.price}`}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                          {item.viewsCount} 浏览
                        </div>
                      </td>

                      {/* 刷新时间 */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap", fontSize: "11.5px", color: "#64748b" }}>
                        {new Date(item.refreshedAt || item.createdAt).toLocaleDateString("zh-CN")}
                      </td>

                      {/* 操作 */}
                      <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {/* 待审核时快速通过 / 驳回 */}
                          {item.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAction("APPROVE", item.id)}
                                style={{
                                  background: "#10b981",
                                  color: "white",
                                  border: "none",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "800",
                                  cursor: "pointer",
                                }}
                              >
                                通过
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectModalItem(item);
                                  setRejectReasonInput("");
                                }}
                                style={{
                                  background: "#ef4444",
                                  color: "white",
                                  border: "none",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "800",
                                  cursor: "pointer",
                                }}
                              >
                                驳回
                              </button>
                            </>
                          )}

                          {/* 查看抽屉 */}
                          <button
                            type="button"
                            onClick={() => setSelectedDrawerItem(item)}
                            style={{
                              background: "#f1f5f9",
                              color: "#334155",
                              border: "1px solid #cbd5e1",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                            }}
                          >
                            抽屉详情
                          </button>

                          {/* 置顶切换 */}
                          <button
                            type="button"
                            onClick={() => handleAction("TOGGLE_TOP", item.id)}
                            style={{
                              background: item.isTop ? "#fef3c7" : "white",
                              color: item.isTop ? "#b45309" : "#64748b",
                              border: "1px solid #cbd5e1",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                            title={item.isTop ? "取消置顶" : "设为置顶"}
                          >
                            <Flame size={13} />
                          </button>

                          {/* 删除 */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`确定要彻底删除信息【${item.title}】吗？`)) {
                                handleAction("DELETE", item.id);
                              }
                            }}
                            style={{
                              background: "#fee2e2",
                              color: "#b91c1c",
                              border: "none",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                            title="删除"
                          >
                            <Trash2 size={13} />
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

        {/* 底部分页条 */}
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", fontSize: "12.5px", color: "#64748b" }}>
          <div>
            共 <b>{total}</b> 条信息 · 当前第 <b>{page}</b> 页
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: "4px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "white",
                cursor: page <= 1 ? "not-allowed" : "pointer",
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              上一页
            </button>
            <button
              type="button"
              disabled={page * pageSize >= total}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: "4px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "white",
                cursor: page * pageSize >= total ? "not-allowed" : "pointer",
                opacity: page * pageSize >= total ? 0.5 : 1,
              }}
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          右侧详情抽屉 (AdminInfoDrawer)
          ======================================================== */}
      {selectedDrawerItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.4)",
            zIndex: 999,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setSelectedDrawerItem(null)}
        >
          <div
            style={{
              width: "480px",
              maxWidth: "90vw",
              background: "white",
              height: "100%",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 抽屉头部 */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a" }}>
                便民信息核验详情
              </span>
              <button
                type="button"
                onClick={() => setSelectedDrawerItem(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* 抽屉主体 */}
            <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
              {/* 重复发布警示 */}
              {selectedDrawerItem.isDuplicateSuspect && (
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "10px 14px", borderRadius: "10px", fontSize: "12.5px", marginBottom: "14px" }}>
                  ⚠️ 系统检测到该联系电话在 48 小时内已存在相似发布，请重点核验是否存在重复灌水发布。
                </div>
              )}

              {/* 标题与分类 */}
              <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", margin: "0 0 8px 0" }}>
                {selectedDrawerItem.title}
              </h2>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
                <span style={{ background: "#f0fdfa", color: "#0B7A75", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "800" }}>
                  {selectedDrawerItem.category}
                </span>
                {selectedDrawerItem.subCategory && (
                  <span style={{ background: "#f8fafc", color: "#64748b", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", border: "1px solid #e2e8f0" }}>
                    {selectedDrawerItem.subCategory}
                  </span>
                )}
                <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                  {selectedDrawerItem.itemType === "WANTED" ? "需求/求购" : "提供/转让"}
                </span>
              </div>

              {/* 照片网格 */}
              {selectedDrawerItem.images && selectedDrawerItem.images.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: "800", color: "#64748b", marginBottom: "8px" }}>
                    现场照片 ({selectedDrawerItem.images.length}张)：
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                    {selectedDrawerItem.images.map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noreferrer" style={{ borderRadius: "8px", overflow: "hidden", height: "80px", background: "#f1f5f9", display: "block" }}>
                        <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 顺风车路线 (如果是拼车) */}
              {(selectedDrawerItem.fromPlace || selectedDrawerItem.toPlace) && (
                <div style={{ background: "#ecfdf5", padding: "12px", borderRadius: "10px", border: "1px solid #a7f3d0", marginBottom: "14px" }}>
                  <div style={{ fontSize: "12px", color: "#059669", fontWeight: "800", marginBottom: "6px" }}>
                    🚗 顺风车行程
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "900", color: "#065f46" }}>
                    {selectedDrawerItem.fromPlace} ➔ {selectedDrawerItem.toPlace}
                  </div>
                  <div style={{ fontSize: "12px", color: "#047857", marginTop: "4px" }}>
                    发车: {selectedDrawerItem.departureTime || "未定"} · 车型: {selectedDrawerItem.extraData?.carModel || "普通私家车"} · 余座: {selectedDrawerItem.extraData?.seats || "多位"}
                  </div>
                </div>
              )}

              {/* 核心字段 */}
              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "14px", fontSize: "13px" }}>
                <div style={{ marginBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>期望价格：</span>
                  <b style={{ color: "#e11d48" }}>{selectedDrawerItem.price === "面议" ? "面议" : `¥${selectedDrawerItem.price} ${selectedDrawerItem.priceUnit || ""}`}</b>
                </div>
                <div style={{ marginBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>所在片区：</span>
                  <b>{selectedDrawerItem.area || "杨林"}</b>
                </div>
                {selectedDrawerItem.address && (
                  <div style={{ marginBottom: "6px" }}>
                    <span style={{ color: "#64748b" }}>具体地址：</span>
                    <span>{selectedDrawerItem.address}</span>
                  </div>
                )}
                {selectedDrawerItem.condition && (
                  <div>
                    <span style={{ color: "#64748b" }}>物品成色：</span>
                    <b>{selectedDrawerItem.condition}</b>
                  </div>
                )}
              </div>

              {/* 正文说明 */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12.5px", fontWeight: "800", color: "#64748b", marginBottom: "6px" }}>
                  正文详细描述：
                </div>
                <div style={{ fontSize: "13.5px", lineHeight: "1.6", color: "#334155", background: "#ffffff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", whiteSpace: "pre-wrap" }}>
                  {selectedDrawerItem.body}
                </div>
              </div>

              {/* 发布者与联系方式 */}
              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "13px" }}>
                <div style={{ fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
                  发布者核验：
                </div>
                <div>称呼: {selectedDrawerItem.contactName || "未留"}</div>
                <div>电话: <b style={{ color: "#0B7A75" }}>{selectedDrawerItem.contact || "无"}</b></div>
                {selectedDrawerItem.wechat && <div>微信: {selectedDrawerItem.wechat}</div>}
              </div>

              {/* 驳回原因说明 */}
              {selectedDrawerItem.rejectReason && (
                <div style={{ background: "#fee2e2", padding: "10px 12px", borderRadius: "8px", color: "#991b1b", fontSize: "12.5px", marginBottom: "16px" }}>
                  <b>驳回历史记录：</b> {selectedDrawerItem.rejectReason}
                </div>
              )}
            </div>

            {/* 抽屉底部操作条 */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {selectedDrawerItem.status !== "APPROVED" && (
                <button
                  type="button"
                  onClick={() => handleAction("APPROVE", selectedDrawerItem.id)}
                  style={{
                    flex: 1,
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "8px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  ✅ 审核通过上架
                </button>
              )}

              {selectedDrawerItem.status !== "REJECTED" && (
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalItem(selectedDrawerItem);
                    setRejectReasonInput("");
                  }}
                  style={{
                    flex: 1,
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "8px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  ❌ 驳回并留痕
                </button>
              )}

              <button
                type="button"
                onClick={() => handleAction("TOGGLE_TOP", selectedDrawerItem.id)}
                style={{
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "1px solid #cbd5e1",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                {selectedDrawerItem.isTop ? "取消置顶" : "设为置顶"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          驳回原因模态框 (Reject Reason Modal)
          ======================================================== */}
      {rejectModalItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setRejectModalItem(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "20px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a" }}>
                填写驳回原因说明
              </span>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px 0" }}>
              信息：<b>{rejectModalItem.title}</b>
            </p>

            {/* 快速快捷原因选项 */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
              {[
                "涉嫌违法违规垃圾营销",
                "联系电话虚假或空号",
                "分类选择错误，请重新提交",
                "信息描述不清，请补充细节",
                "顺风车行程信息不完整",
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReasonInput(reason)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "11.5px",
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="请输入清晰的驳回原因，方便发布者修改重新提交..."
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13.5px",
                boxSizing: "border-box",
                marginBottom: "16px",
              }}
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!rejectReasonInput.trim()) {
                    alert("请填写驳回原因");
                    return;
                  }
                  handleAction("REJECT", rejectModalItem.id, rejectReasonInput.trim());
                }}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
