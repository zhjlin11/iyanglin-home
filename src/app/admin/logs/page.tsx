"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  presentAuditLog,
  AUDIT_CATEGORIES,
  AuditCategoryKey,
  AUDIT_ACTION_REGISTRY,
} from "@/lib/audit-log-presenter";
import {
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  CreditCard,
  AlertTriangle,
  Activity,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Eye,
  Clock,
  Globe,
  FileText,
  CheckCircle2,
  AlertOctagon,
  Info,
  Server,
  Terminal,
} from "lucide-react";

interface RawLog {
  id: string;
  userId?: string | null;
  action: string;
  targetId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    role?: string;
    nickname?: string | null;
    phone?: string | null;
  } | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface StatsMeta {
  todayTotal: number;
  todayAdmin: number;
  todayPayment: number;
  todaySecurity: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<RawLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 分页状态
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
  });

  // 顶部轻量统计
  const [stats, setStats] = useState<StatsMeta>({
    todayTotal: 0,
    todayAdmin: 0,
    todayPayment: 0,
    todaySecurity: 0,
  });

  // 筛选器状态
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeRange, setTimeRange] = useState("ALL");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // 详情 Drawer 状态
  const [selectedRawLog, setSelectedRawLog] = useState<RawLog | null>(null);
  const [techExpanded, setTechExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 加载数据函数
  const fetchLogs = useCallback(
    async (targetPage = 1, currentLimit = pagination.limit) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(targetPage));
        params.set("limit", String(currentLimit));
        if (searchInput.trim()) params.set("search", searchInput.trim());
        if (categoryFilter !== "ALL") params.set("category", categoryFilter);
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        if (timeRange !== "ALL") params.set("timeRange", timeRange);

        const res = await fetch(`/api/admin/logs?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "加载审计日志失败");

        setLogs(data.logs || []);
        if (data.pagination) setPagination(data.pagination);
        if (data.stats) setStats(data.stats);
      } catch (err: any) {
        setError(err.message || "请求日志服务异常");
      } finally {
        setLoading(false);
      }
    },
    [searchInput, categoryFilter, statusFilter, timeRange, pagination.limit]
  );

  // 初始加载及筛选变化时重新请求第 1 页
  useEffect(() => {
    fetchLogs(1, pagination.limit);
  }, [categoryFilter, statusFilter, timeRange]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1, pagination.limit);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setCategoryFilter("ALL");
    setStatusFilter("ALL");
    setTimeRange("ALL");
    setTimeout(() => {
      fetchLogs(1, pagination.limit);
    }, 0);
  };

  // 使用 Presenter 提炼展示数据
  const presentedLogs = useMemo(() => {
    return logs.map((raw) => ({
      raw,
      presented: presentAuditLog(raw),
    }));
  }, [logs]);

  // 当前选中日志的 Presenter 数据
  const activeDetail = useMemo(() => {
    if (!selectedRawLog) return null;
    return presentAuditLog(selectedRawLog);
  }, [selectedRawLog]);

  // 复制原始 JSON
  const handleCopyRawJson = (data: any) => {
    try {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      alert("复制失败，请手动选取复制");
    }
  };

  return (
    <AdminLayout
      title="🛡️ 操作日志与安全审计中心"
      subtitle="全息记录全站微信支付入账、内容流转审核、管理员权限变更、违规处置与系统治理轨迹。"
    >
      {/* ── 顶部 4 大轻量统计指标卡片 ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        {/* 卡片 1: 今日操作 */}
        <div
          style={{
            background: "#ffffff",
            padding: "16px 18px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>今日操作总数</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#111827", marginTop: "4px" }}>
              {stats.todayTotal}
            </div>
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563eb",
            }}
          >
            <Activity size={20} />
          </div>
        </div>

        {/* 卡片 2: 今日管理员操作 */}
        <div
          style={{
            background: "#ffffff",
            padding: "16px 18px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>今日管理员操作</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#0369a1", marginTop: "4px" }}>
              {stats.todayAdmin}
            </div>
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#f0f9ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0284c7",
            }}
          >
            <Shield size={20} />
          </div>
        </div>

        {/* 卡片 3: 今日支付事件 */}
        <div
          style={{
            background: "#ffffff",
            padding: "16px 18px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>今日支付事件</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#15803d", marginTop: "4px" }}>
              {stats.todayPayment}
            </div>
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#16a34a",
            }}
          >
            <CreditCard size={20} />
          </div>
        </div>

        {/* 卡片 4: 今日安全异常 */}
        <div
          style={{
            background: "#ffffff",
            padding: "16px 18px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>今日安全异常</div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: stats.todaySecurity > 0 ? "#b91c1c" : "#6b7280",
                marginTop: "4px",
              }}
            >
              {stats.todaySecurity}
            </div>
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: stats.todaySecurity > 0 ? "#fef2f2" : "#f9fafb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: stats.todaySecurity > 0 ? "#dc2626" : "#9ca3af",
            }}
          >
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* ── 综合搜索与多维筛选栏 ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "16px 20px",
          marginBottom: "20px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
        }}
      >
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* 搜索框 */}
          <div style={{ position: "relative", minWidth: "280px", flex: "1 1 320px" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
              }}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索用户、企业、内容、订单号、IP..."
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                fontSize: "13px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                outline: "none",
                background: "#f9fafb",
                transition: "all 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.background = "#ffffff")}
              onBlur={(e) => (e.target.style.background = "#f9fafb")}
            />
          </div>

          {/* 快捷时间按钮组 */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "全部时间" },
              { id: "today", label: "今天" },
              { id: "yesterday", label: "昨天" },
              { id: "7days", label: "近7天" },
              { id: "30days", label: "近30天" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeRange(t.id)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: timeRange === t.id ? 600 : 400,
                  background: timeRange === t.id ? "#1677FF" : "#f3f4f6",
                  color: timeRange === t.id ? "#ffffff" : "#4b5563",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 分类下拉框 */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "7px 12px",
              fontSize: "12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#374151",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="ALL">全部业务类型</option>
            {Object.values(AUDIT_CATEGORIES).map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* 操作按钮 */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="submit"
              style={{
                padding: "7px 16px",
                background: "#1677FF",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Search size={13} />
              <span>查询</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                padding: "7px 12px",
                background: "#f3f4f6",
                color: "#4b5563",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="重置全部筛选条件"
            >
              <RotateCcw size={13} />
              <span>重置</span>
            </button>
          </div>
        </form>

        {/* 筛选结果摘要 */}
        <div
          style={{
            marginTop: "12px",
            paddingTop: "10px",
            borderTop: "1px solid #f3f4f6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          <div>
            共匹配到 <strong style={{ color: "#111827" }}>{pagination.totalCount}</strong> 笔审计日志
            {categoryFilter !== "ALL" && (
              <span style={{ marginLeft: "8px", color: "#1677FF" }}>
                · 类型: {AUDIT_CATEGORIES[categoryFilter as AuditCategoryKey]?.label}
              </span>
            )}
            {timeRange !== "ALL" && (
              <span style={{ marginLeft: "8px", color: "#1677FF" }}>· 时间: {timeRange}</span>
            )}
          </div>
          <div>每页显示 {pagination.limit} 笔</div>
        </div>
      </div>

      {/* ── 错误警示栏 ── */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#b91c1c",
            fontSize: "13px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertOctagon size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ── 主体表格 (桌面端) ── */}
      <div
        className="desktop-only"
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr
              style={{
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                fontSize: "12px",
                color: "#475569",
                fontWeight: 600,
              }}
            >
              <th style={{ padding: "12px 16px", width: "140px" }}>操作时间</th>
              <th style={{ padding: "12px 16px", width: "160px" }}>操作人</th>
              <th style={{ padding: "12px 16px", width: "170px" }}>操作类型</th>
              <th style={{ padding: "12px 16px", minWidth: "260px" }}>操作对象</th>
              <th style={{ padding: "12px 16px", width: "110px" }}>操作结果</th>
              <th style={{ padding: "12px 16px", width: "130px" }}>来源 / IP</th>
              <th style={{ padding: "12px 16px", width: "90px", textAlign: "center" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <Activity className="animate-spin" size={16} />
                    <span>正在检索安全审计流水...</span>
                  </div>
                </td>
              </tr>
            ) : presentedLogs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
                  暂无符合条件的审计日志
                </td>
              </tr>
            ) : (
              presentedLogs.map(({ raw, presented }) => (
                <tr
                  key={raw.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: "13px",
                    color: "#1e293b",
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* 1. 操作时间 */}
                  <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 500, color: "#334155" }} title={presented.time.full}>
                      {presented.time.short}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                      {presented.time.full.split(" ")[0]}
                    </div>
                  </td>

                  {/* 2. 操作人 */}
                  <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "50%",
                          background: presented.actor.isSystem ? "#f1f5f9" : "#e0f2fe",
                          color: presented.actor.isSystem ? "#64748b" : "#0369a1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {presented.actor.avatarText}
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                          }}
                        >
                          {presented.actor.primary}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                          }}
                        >
                          {presented.actor.secondary}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 3. 操作类型 */}
                  <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: "4px",
                          background: presented.category.bg,
                          color: presented.category.color,
                          border: `1px solid ${presented.category.border}`,
                        }}
                      >
                        {presented.category.label}
                      </span>
                      {presented.isSecurity && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "2px",
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "1px 5px",
                            borderRadius: "4px",
                            background: "#fee2e2",
                            color: "#b91c1c",
                          }}
                        >
                          <AlertTriangle size={10} />
                          安全
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, color: "#1e293b", marginTop: "4px" }}>
                      {presented.actionLabel}
                    </div>
                  </td>

                  {/* 4. 操作对象 */}
                  <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {presented.target.href ? (
                        <Link
                          href={presented.target.href}
                          style={{
                            fontWeight: 600,
                            color: "#1677FF",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>{presented.target.primary}</span>
                          <ExternalLink size={12} />
                        </Link>
                      ) : (
                        <span style={{ fontWeight: 600, color: presented.target.isDeleted ? "#94a3b8" : "#0f172a" }}>
                          {presented.target.primary}
                        </span>
                      )}
                      {presented.target.isDeleted && (
                        <span
                          style={{
                            fontSize: "10px",
                            background: "#f1f5f9",
                            color: "#64748b",
                            padding: "1px 4px",
                            borderRadius: "3px",
                          }}
                        >
                          已删除
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", fontFamily: "monospace" }}>
                      {presented.target.secondary}
                    </div>
                  </td>

                  {/* 5. 操作结果 */}
                  <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background:
                          presented.result.severity === "success"
                            ? "#ecfdf5"
                            : presented.result.severity === "danger"
                            ? "#fef2f2"
                            : "#fffbeb",
                        color:
                          presented.result.severity === "success"
                            ? "#047857"
                            : presented.result.severity === "danger"
                            ? "#b91c1c"
                            : "#b45309",
                        border: `1px solid ${
                          presented.result.severity === "success"
                            ? "#a7f3d0"
                            : presented.result.severity === "danger"
                            ? "#fecaca"
                            : "#fde68a"
                        }`,
                      }}
                    >
                      {presented.result.severity === "success" ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <Info size={11} />
                      )}
                      {presented.result.label}
                    </span>
                  </td>

                  {/* 6. 来源与 IP */}
                  <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                    <div style={{ color: "#475569", fontWeight: 500 }}>{presented.source.channel}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace", marginTop: "2px" }}>
                      {presented.source.ip}
                    </div>
                  </td>

                  {/* 7. 查看详情按钮 */}
                  <td style={{ padding: "12px 16px", textAlign: "center", verticalAlign: "top" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRawLog(raw);
                        setTechExpanded(false);
                      }}
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        color: "#16a34a",
                        borderRadius: "6px",
                        padding: "5px 9px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#16a34a";
                        e.currentTarget.style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f0fdf4";
                        e.currentTarget.style.color = "#16a34a";
                      }}
                    >
                      <Eye size={12} />
                      <span>详情</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── 移动端卡片流列表 (Mobile Card View) ── */}
      <div className="mobile-only">
        {loading && logs.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
            <Activity className="animate-spin" size={20} style={{ margin: "0 auto 8px" }} />
            <div>加载中...</div>
          </div>
        ) : presentedLogs.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              background: "#ffffff",
              borderRadius: "12px",
              color: "#9ca3af",
            }}
          >
            暂无匹配日志
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {presentedLogs.map(({ raw, presented }) => (
              <div
                key={raw.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  padding: "14px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                }}
              >
                {/* 顶栏：时间与结果 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>{presented.time.short}</span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "1px 6px",
                      borderRadius: "10px",
                      background: presented.result.severity === "success" ? "#ecfdf5" : "#fef2f2",
                      color: presented.result.severity === "success" ? "#047857" : "#b91c1c",
                    }}
                  >
                    {presented.result.label}
                  </span>
                </div>

                {/* 动作类型与标题 */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "1px 5px",
                      borderRadius: "4px",
                      background: presented.category.bg,
                      color: presented.category.color,
                    }}
                  >
                    {presented.category.label}
                  </span>
                  <strong style={{ fontSize: "14px", color: "#111827" }}>{presented.actionLabel}</strong>
                </div>

                {/* 操作对象 */}
                <div style={{ fontSize: "13px", color: "#374151", fontWeight: 500, marginBottom: "4px" }}>
                  {presented.target.primary}
                </div>
                <div style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "monospace", marginBottom: "10px" }}>
                  {presented.target.secondary}
                </div>

                {/* 底栏：操作人与详情按钮 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "8px",
                    borderTop: "1px solid #f3f4f6",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#4b5563" }}>
                    操作人: <strong>{presented.actor.primary}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRawLog(raw);
                      setTechExpanded(false);
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "#f0fdf4",
                      color: "#16a34a",
                      border: "1px solid #bbf7d0",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 底部分页栏 ── */}
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "13px",
          color: "#475569",
        }}
      >
        <div>
          第 <strong>{pagination.page}</strong> / {pagination.totalPages} 页 (共 {pagination.totalCount} 笔)
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* 上一页 */}
          <button
            type="button"
            disabled={pagination.page <= 1 || loading}
            onClick={() => fetchLogs(pagination.page - 1, pagination.limit)}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              background: pagination.page <= 1 ? "#f1f5f9" : "#ffffff",
              color: pagination.page <= 1 ? "#94a3b8" : "#334155",
              border: "1px solid #cbd5e1",
              cursor: pagination.page <= 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <ChevronLeft size={14} />
            <span>上一页</span>
          </button>

          {/* 下一页 */}
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages || loading}
            onClick={() => fetchLogs(pagination.page + 1, pagination.limit)}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              background: pagination.page >= pagination.totalPages ? "#f1f5f9" : "#ffffff",
              color: pagination.page >= pagination.totalPages ? "#94a3b8" : "#334155",
              border: "1px solid #cbd5e1",
              cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>下一页</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          右侧滑动抽屉：操作审计业务详情 (Details Drawer)
          ════════════════════════════════════════════════════════ */}
      {selectedRawLog && activeDetail && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {/* 背景遮罩 */}
          <div
            onClick={() => setSelectedRawLog(null)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(2px)",
              transition: "opacity 0.2s ease",
            }}
          />

          {/* 抽屉容器 */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "560px",
              height: "100%",
              background: "#ffffff",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              zIndex: 101,
              overflow: "hidden",
            }}
          >
            {/* 抽屉头部 */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                background: "#fafafa",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: "4px",
                      background: activeDetail.category.bg,
                      color: activeDetail.category.color,
                      border: `1px solid ${activeDetail.category.border}`,
                    }}
                  >
                    {activeDetail.category.label}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: "4px",
                      background: activeDetail.result.severity === "success" ? "#ecfdf5" : "#fef2f2",
                      color: activeDetail.result.severity === "success" ? "#047857" : "#b91c1c",
                    }}
                  >
                    {activeDetail.result.label}
                  </span>
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: 0 }}>
                  {activeDetail.actionLabel}
                </h2>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                  记录时间：{activeDetail.time.full}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRawLog(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 抽屉主体内容区 (滚动) */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* 模块 1：业务核心对象高亮卡片 */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "10px",
                  padding: "16px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, marginBottom: "4px" }}>
                  关联操作对象
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                  {activeDetail.target.primary}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", fontFamily: "monospace", marginTop: "4px" }}>
                  {activeDetail.target.secondary}
                </div>
                {activeDetail.target.href && (
                  <div style={{ marginTop: "10px" }}>
                    <Link
                      href={activeDetail.target.href}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#1677FF",
                        textDecoration: "none",
                      }}
                    >
                      <span>前往管理后台查看对应实体</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                )}
              </div>

              {/* 模块 2：六大审计核心要素网格 */}
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>
                  审计基础要素
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "12px",
                  }}
                >
                  <div style={{ padding: "10px 12px", background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "8px" }}>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>1. 操作人员</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                      {activeDetail.actor.primary}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>{activeDetail.actor.secondary}</div>
                  </div>

                  <div style={{ padding: "10px 12px", background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "8px" }}>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>2. 操作类型</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                      {activeDetail.actionLabel}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>分类: {activeDetail.category.label}</div>
                  </div>

                  <div style={{ padding: "10px 12px", background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "8px" }}>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>3. 来源渠道</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                      {activeDetail.source.channel}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>IP: {activeDetail.source.ip}</div>
                  </div>

                  <div style={{ padding: "10px 12px", background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "8px" }}>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>4. 执行结果</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#047857", marginTop: "2px" }}>
                      {activeDetail.result.label}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>已落盘防篡改存证</div>
                  </div>
                </div>
              </div>

              {/* 模块 3：变更对比 (如果有变更项) */}
              {activeDetail.changes && activeDetail.changes.length > 0 && (
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "10px" }}>
                    数据变更对比
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {activeDetail.changes.map((ch, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          padding: "10px 14px",
                        }}
                      >
                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, marginBottom: "6px" }}>
                          变更属性：{ch.field}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: "#fef2f2",
                              color: "#b91c1c",
                              textDecoration: "line-through",
                            }}
                          >
                            {ch.before}
                          </span>
                          <span style={{ color: "#94a3b8" }}>➔</span>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: "#ecfdf5",
                              color: "#047857",
                              fontWeight: 600,
                            }}
                          >
                            {ch.after}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 模块 4：技术信息 (高级，默认折叠) */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  overflow: "hidden",
                  marginTop: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setTechExpanded(!techExpanded)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "#f8fafc",
                    border: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Terminal size={14} style={{ color: "#64748b" }} />
                    <span>技术原始数据 (开发与故障排查)</span>
                  </div>
                  {techExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {techExpanded && (
                  <div style={{ padding: "16px", background: "#ffffff", borderTop: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                        Action Code: <strong>{activeDetail.rawAction}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyRawJson(activeDetail.rawMetadata)}
                        style={{
                          background: copySuccess ? "#ecfdf5" : "#f1f5f9",
                          color: copySuccess ? "#047857" : "#475569",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "3px 8px",
                          fontSize: "11px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {copySuccess ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copySuccess ? "已复制" : "复制 JSON"}</span>
                      </button>
                    </div>

                    <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace", marginBottom: "10px" }}>
                      Target ID: {selectedRawLog.targetId || "null"} · Log ID: {selectedRawLog.id}
                    </div>

                    {/* 格式化 Pretty JSON 视图 */}
                    <pre
                      style={{
                        background: "#0f172a",
                        color: "#38bdf8",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontFamily: "Consolas, Monaco, monospace",
                        lineHeight: 1.5,
                        overflowX: "auto",
                        maxHeight: "240px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                        margin: 0,
                      }}
                    >
                      {JSON.stringify(activeDetail.rawMetadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* 抽屉底栏 */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #e5e7eb",
                background: "#fafafa",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedRawLog(null)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  background: "#1677FF",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                关闭详情
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
