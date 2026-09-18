"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Link from "next/link";

export type CompanyItem = {
  id: string;
  name: string;
  shortName?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  description?: string | null;
  industry?: string | null;
  companySize?: string | null;
  companyType?: string | null;
  address?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactWechat?: string | null;
  creditCode?: string | null;
  businessLicenseImage?: string | null;
  legalRepresentative?: string | null;
  isVerified: boolean;
  verificationStatus: string; // UNVERIFIED | PENDING | VERIFIED | REJECTED
  verificationLevel?: string | null;
  verifiedAt?: string | null;
  rejectReason?: string | null;
  isFeaturedEmployer: boolean;
  status: string; // ACTIVE | DISABLED | ARCHIVED
  source: string;
  organizationId?: string | null;
  organizationName?: string | null;
  jobCount: number;
  recentJobs?: Array<{
    id: string;
    title: string;
    salary: string;
    status: string;
    updatedAt: string;
  }>;
  completeness: {
    score: number;
    level: "COMPLETE" | "INCOMPLETE" | "SEVERE";
    levelText: string;
    missingFields: string[];
  };
  isSuspectedDuplicate?: boolean;
  duplicateInfo?: {
    candidateId: string;
    candidateName: string;
    reason: string;
  } | null;
  issues: string[];
  createdAt: string;
  updatedAt: string;
};

// 行业选项
const INDUSTRY_OPTIONS = [
  "全部行业",
  "实体制造与商贸",
  "先进装备与机械制造",
  "绿色绿色食品制造",
  "商业餐饮与新零售",
  "现代物流与仓储配送",
  "数字经济与信息科技",
  "建材家居与装饰工程",
  "教育培训与高校后勤",
  "现代农林与生物农业",
];

export default function AdminCompaniesGovernancePage() {
  // ── 核心列表数据状态 ──
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [stats, setStats] = useState({
    total: 0,
    verifiedCount: 0,
    featuredCount: 0,
    pendingCount: 0,
    suspectedDuplicateCount: 0,
    incompleteCount: 0,
  });

  // ── 筛选检索状态 ──
  const [search, setSearch] = useState("");
  const [filterVerif, setFilterVerif] = useState("ALL");
  const [filterFeatured, setFilterFeatured] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterSource, setFilterSource] = useState("ALL");
  const [filterIndustry, setFilterIndustry] = useState("ALL");
  const [filterCompleteness, setFilterCompleteness] = useState("ALL");
  const [filterHasJobs, setFilterHasJobs] = useState("ALL");
  const [duplicateFlag, setDuplicateFlag] = useState(false);
  const [sortBy, setSortBy] = useState("updatedAt");
  const [activeTab, setActiveTab] = useState("all");

  // ── 多选批量状态 ──
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // ── 抽屉与弹窗状态 ──
  const [viewDrawerComp, setViewDrawerComp] = useState<CompanyItem | null>(null);
  const [viewDrawerLoading, setViewDrawerLoading] = useState(false);
  const [fullCompanyDetail, setFullCompanyDetail] = useState<any>(null);

  // 编辑抽屉
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);

  // 认证审核弹窗
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewComp, setReviewComp] = useState<CompanyItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // 疑似重复合并抽屉
  const [mergeDrawerOpen, setMergeDrawerOpen] = useState(false);
  const [mergeData, setMergeData] = useState<{ companyA: any; companyB: any } | null>(null);
  const [mergeMasterId, setMergeMasterId] = useState("");
  const [mergeLoading, setMergeLoading] = useState(false);

  // 两步式新增企业主体
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [createForm, setCreateForm] = useState({
    name: "",
    shortName: "",
    creditCode: "",
    industry: "实体制造与商贸",
    companySize: "1-49人",
    companyType: "民营企业",
    address: "云南省昆明市嵩明县杨林经开区",
    contactName: "",
    contactPhone: "",
    description: "",
    isVerified: false,
    isFeaturedEmployer: false,
  });
  const [createCheckMatches, setCreateCheckMatches] = useState<any[]>([]);
  const [createChecking, setCreateChecking] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // 营业执照大图灯箱
  const [previewLicenseUrl, setPreviewLicenseUrl] = useState<string | null>(null);

  // 操作菜单下拉定位
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // ── 初始化 URL Query 参数同步 ──
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("search")) setSearch(params.get("search") || "");
      if (params.get("verification")) setFilterVerif(params.get("verification") || "ALL");
      if (params.get("featured")) setFilterFeatured(params.get("featured") || "ALL");
      if (params.get("duplicate") === "true") setDuplicateFlag(true);
      if (params.get("completeness")) setFilterCompleteness(params.get("completeness") || "ALL");
      if (params.get("page")) setPage(parseInt(params.get("page") || "1"));
      if (params.get("tab")) setActiveTab(params.get("tab") || "all");
    }
  }, []);

  // ── 加载企业列表数据 ──
  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("sortBy", sortBy);

      if (search.trim()) params.set("search", search.trim());
      if (filterVerif !== "ALL") params.set("verificationStatus", filterVerif);
      if (filterFeatured !== "ALL") params.set("isFeatured", filterFeatured === "true" ? "true" : "false");
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      if (filterSource !== "ALL") params.set("source", filterSource);
      if (filterIndustry !== "ALL" && filterIndustry !== "全部行业") params.set("industry", filterIndustry);
      if (filterCompleteness !== "ALL") params.set("completeness", filterCompleteness);
      if (filterHasJobs !== "ALL") params.set("hasJobs", filterHasJobs);
      if (duplicateFlag) params.set("duplicateFlag", "true");

      const res = await fetch(`/api/admin/companies?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies || []);
        setTotal(data.total || 0);
        if (data.stats) setStats(data.stats);
      }

      // 同步 URL Query
      if (typeof window !== "undefined") {
        const queryParams = new URLSearchParams();
        if (search.trim()) queryParams.set("search", search.trim());
        if (filterVerif !== "ALL") queryParams.set("verification", filterVerif);
        if (filterFeatured !== "ALL") queryParams.set("featured", filterFeatured);
        if (duplicateFlag) queryParams.set("duplicate", "true");
        if (filterCompleteness !== "ALL") queryParams.set("completeness", filterCompleteness);
        if (page > 1) queryParams.set("page", String(page));
        if (activeTab !== "all") queryParams.set("tab", activeTab);

        const newUrl = queryParams.toString() ? `?${queryParams.toString()}` : window.location.pathname;
        window.history.replaceState(null, "", newUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    sortBy,
    search,
    filterVerif,
    filterFeatured,
    filterStatus,
    filterSource,
    filterIndustry,
    filterCompleteness,
    filterHasJobs,
    duplicateFlag,
    activeTab,
  ]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // ── 快捷分段 Tab 切换联动 ──
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    setPage(1);
    // 重置特殊互斥条件
    setDuplicateFlag(false);
    setFilterCompleteness("ALL");
    setFilterHasJobs("ALL");
    setFilterFeatured("ALL");
    setFilterVerif("ALL");

    switch (tabKey) {
      case "verified":
        setFilterVerif("VERIFIED");
        break;
      case "pending":
        setFilterVerif("PENDING");
        break;
      case "unverified":
        setFilterVerif("UNVERIFIED");
        break;
      case "rejected":
        setFilterVerif("REJECTED");
        break;
      case "featured":
        setFilterFeatured("true");
        break;
      case "duplicate":
        setDuplicateFlag(true);
        break;
      case "incomplete":
        setFilterCompleteness("incomplete");
        break;
      case "no_jobs":
        setFilterHasJobs("false");
        break;
      default:
        // 全部
        break;
    }
  };

  // ── 重置所有筛选 ──
  const handleResetFilters = () => {
    setSearch("");
    setFilterVerif("ALL");
    setFilterFeatured("ALL");
    setFilterStatus("ALL");
    setFilterSource("ALL");
    setFilterIndustry("ALL");
    setFilterCompleteness("ALL");
    setFilterHasJobs("ALL");
    setDuplicateFlag(false);
    setSortBy("updatedAt");
    setActiveTab("all");
    setPage(1);
  };

  // ── 切换名企推荐 ──
  const handleToggleFeatured = async (comp: CompanyItem) => {
    try {
      const res = await fetch("/api/admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: comp.id,
          action: "TOGGLE_FEATURED",
        }),
      });
      if (res.ok) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === comp.id ? { ...c, isFeaturedEmployer: !c.isFeaturedEmployer } : c))
        );
        setStats((prev) => ({
          ...prev,
          featuredCount: comp.isFeaturedEmployer ? prev.featuredCount - 1 : prev.featuredCount + 1,
        }));
      }
    } catch (e) {
      alert("推荐状态更新失败");
    }
  };

  // ── 切换企业状态（停用/启用） ──
  const handleToggleStatus = async (comp: CompanyItem, targetStatus: "ACTIVE" | "DISABLED" | "ARCHIVED") => {
    const actionText = targetStatus === "DISABLED" ? "停用" : targetStatus === "ARCHIVED" ? "归档" : "启用";
    if (!confirm(`确认要${actionText}企业「${comp.name}」吗？`)) return;

    try {
      const res = await fetch("/api/admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: comp.id, status: targetStatus }),
      });
      if (res.ok) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === comp.id ? { ...c, status: targetStatus } : c))
        );
      }
    } catch (e) {
      alert("操作失败");
    }
  };

  // ── 审核处理（通过 / 驳回） ──
  const handleAuditSubmit = async (action: "VERIFY" | "REJECT") => {
    if (!reviewComp) return;
    if (action === "REJECT" && !rejectReason.trim()) {
      alert("驳回认证必须填写具体原因！");
      return;
    }

    setReviewLoading(true);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reviewComp.id,
          action,
          rejectReason: action === "REJECT" ? rejectReason.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewModalOpen(false);
        loadCompanies();
      } else {
        alert(data.error || "审核处理失败");
      }
    } catch (e) {
      alert("网络异常，请重试");
    } finally {
      setReviewLoading(false);
    }
  };

  // ── 查看企业详情抽屉 ──
  const handleOpenViewDrawer = async (comp: CompanyItem) => {
    setViewDrawerComp(comp);
    setViewDrawerLoading(true);
    setFullCompanyDetail(null);
    try {
      const res = await fetch(`/api/admin/companies/${comp.id}`);
      const data = await res.json();
      if (data.success && data.company) {
        setFullCompanyDetail(data.company);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setViewDrawerLoading(false);
    }
  };

  // ── 打开企业编辑抽屉 ──
  const handleOpenEditDrawer = (comp: CompanyItem) => {
    setEditForm({
      id: comp.id,
      name: comp.name || "",
      shortName: comp.shortName || "",
      logo: comp.logo || "",
      industry: comp.industry || "实体制造与商贸",
      companySize: comp.companySize || "1-49人",
      companyType: comp.companyType || "民营企业",
      address: comp.address || "",
      contactName: comp.contactName || "",
      contactPhone: comp.contactPhone || "",
      contactWechat: comp.contactWechat || "",
      creditCode: comp.creditCode || "",
      legalRepresentative: comp.legalRepresentative || "",
      businessLicenseImage: comp.businessLicenseImage || "",
      description: comp.description || "",
      status: comp.status || "ACTIVE",
    });
    setEditDrawerOpen(true);
  };

  // ── 保存企业编辑 ──
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      alert("企业全称不能为空");
      return;
    }

    setEditSaving(true);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editForm.id,
          action: "UPDATE_PROFILE",
          profile: editForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditDrawerOpen(false);
        loadCompanies();
      } else {
        alert(data.error || "保存失败");
      }
    } catch (e) {
      alert("保存异常");
    } finally {
      setEditSaving(false);
    }
  };

  // ── 打开疑似重复企业合并抽屉 ──
  const handleOpenMergeDrawer = async (comp: CompanyItem) => {
    if (!comp.duplicateInfo?.candidateId) {
      alert("未检测到具体对比企业");
      return;
    }

    setMergeLoading(true);
    setMergeDrawerOpen(true);
    setMergeMasterId(comp.id); // 默认当前企业为主企业

    try {
      const res = await fetch(
        `/api/admin/companies/check-duplicate?companyAId=${comp.id}&companyBId=${comp.duplicateInfo.candidateId}`
      );
      const data = await res.json();
      if (data.success && data.comparison) {
        setMergeData(data.comparison);
      } else {
        alert(data.error || "获取对比信息失败");
      }
    } catch (e) {
      alert("获取对比数据异常");
    } finally {
      setMergeLoading(false);
    }
  };

  // ── 提交企业合并 ──
  const handleExecuteMerge = async () => {
    if (!mergeData) return;
    const { companyA, companyB } = mergeData;
    const masterId = mergeMasterId;
    const subId = masterId === companyA.id ? companyB.id : companyA.id;
    const masterName = masterId === companyA.id ? companyA.name : companyB.name;
    const subName = masterId === companyA.id ? companyB.name : companyA.name;

    if (
      !confirm(
        `【高危操作确认】\n\n将把从企业「${subName}」的在招职位与关联数据全部合并平移至主企业「${masterName}」，并将从企业标记为归档！\n\n确认合并？`
      )
    ) {
      return;
    }

    setMergeLoading(true);
    try {
      const res = await fetch("/api/admin/companies/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterCompanyId: masterId,
          subCompanyId: subId,
          reason: "管理员在后台治理中心确认为重复主体并执行合并",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "合并完成！");
        setMergeDrawerOpen(false);
        loadCompanies();
      } else {
        alert(data.error || "合并失败");
      }
    } catch (e) {
      alert("合并执行异常");
    } finally {
      setMergeLoading(false);
    }
  };

  // ── 录入新企业主体：实时防重查重 ──
  const handleCheckSimilarity = async () => {
    if (!createForm.name.trim() && !createForm.creditCode.trim()) return;
    setCreateChecking(true);
    try {
      const params = new URLSearchParams();
      if (createForm.name.trim()) params.set("name", createForm.name.trim());
      if (createForm.creditCode.trim()) params.set("creditCode", createForm.creditCode.trim());

      const res = await fetch(`/api/admin/companies/check-duplicate?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.matches) {
        setCreateCheckMatches(data.matches);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreateChecking(false);
    }
  };

  // ── 创建企业提交 ──
  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      alert("请填写企业全称");
      return;
    }

    setCreateSubmitting(true);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.success) {
        setCreateModalOpen(false);
        setCreateStep(1);
        setCreateForm({
          name: "",
          shortName: "",
          creditCode: "",
          industry: "实体制造与商贸",
          companySize: "1-49人",
          companyType: "民营企业",
          address: "云南省昆明市嵩明县杨林经开区",
          contactName: "",
          contactPhone: "",
          description: "",
          isVerified: false,
          isFeaturedEmployer: false,
        });
        setCreateCheckMatches([]);
        loadCompanies();
      } else {
        alert(data.error || "创建失败");
      }
    } catch (e) {
      alert("网络异常");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // ── 批量操作执行 ──
  const handleBatchAction = async (action: "SET_FEATURED" | "UNSET_FEATURED" | "ARCHIVE") => {
    if (selectedIds.length === 0) return;
    const actionMap = {
      SET_FEATURED: "设为名企推荐",
      UNSET_FEATURED: "取消名企推荐",
      ARCHIVE: "批量归档（停用）",
    };

    if (!confirm(`确认对选中的 ${selectedIds.length} 家企业执行【${actionMap[action]}】吗？`)) return;

    setBatchLoading(true);
    try {
      const res = await fetch("/api/admin/companies/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds([]);
        loadCompanies();
      } else {
        alert(data.error || "批量操作失败");
      }
    } catch (e) {
      alert("批量操作异常");
    } finally {
      setBatchLoading(false);
    }
  };

  // ── 导出 CSV ──
  const handleExportCsv = () => {
    if (companies.length === 0) return;
    const headers = ["企业ID", "企业全称", "统一信用代码", "行业", "规模", "认证状态", "名企推荐", "在招职位数", "地址", "联系人", "电话", "资料完整度", "更新时间"];
    const rows = companies.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.creditCode || "",
      c.industry || "",
      c.companySize || "",
      c.verificationStatus,
      c.isFeaturedEmployer ? "是" : "否",
      c.jobCount,
      `"${(c.address || "").replace(/"/g, '""')}"`,
      c.contactName || "",
      c.contactPhone || "",
      `${c.completeness?.score || 0}%`,
      c.updatedAt,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `iyanglin_companies_governance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 格式化相对时间
  const formatTimeAgo = (iso: string) => {
    if (!iso) return "-";
    const date = new Date(iso);
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "今天 " + date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    if (days === 1) return "昨天";
    if (days < 7) return `${days}天前`;
    return date.toISOString().slice(0, 10);
  };

  // 选中状态计算
  const isAllSelected = companies.length > 0 && selectedIds.length === companies.length;

  const actionButtons = (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
      <button
        onClick={handleExportCsv}
        style={{
          background: "#ffffff",
          color: "#475569",
          padding: "8px 14px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: "700",
          border: "1px solid #CBD5E1",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        📥 导出当前数据表
      </button>
      <Link
        href="/admin/jobs/new"
        style={{
          background: "#F1F5F9",
          color: "#1E293B",
          padding: "8px 16px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: "700",
          textDecoration: "none",
          border: "1px solid #CBD5E1",
        }}
      >
        + 录入新职位
      </Link>
      <button
        onClick={() => {
          setCreateStep(1);
          setCreateModalOpen(true);
        }}
        style={{
          background: "#1967D2",
          color: "#ffffff",
          padding: "8px 18px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: "700",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(25,103,210,0.25)",
        }}
      >
        ＋ 录入新企业主体
      </button>
    </div>
  );

  return (
    <AdminLayout
      title="🏢 招聘企业主体治理"
      subtitle="统一管理招聘企业主体、认证资质、职位归属与企业推荐状态"
      actionButton={actionButtons}
      maxWidth="1440px"
    >
      <div style={{ width: "100%", margin: "0 auto" }}>

        {/* ── 核心指标统计卡（6张可点击快捷筛选） ── */}
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "1.25rem" }}>
          {/* 卡1: 收录总数 */}
          <div
            onClick={() => handleTabChange("all")}
            style={{
              background: activeTab === "all" ? "#EFF6FF" : "#ffffff",
              border: activeTab === "all" ? "2px solid #1967D2" : "1px solid #E2E8F0",
              padding: "14px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>收录企业总数</div>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#0F172A", marginTop: "2px" }}>
              {stats.total}
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>包含平台已收录所有主体</div>
          </div>

          {/* 卡2: 已官方认证雇主 */}
          <div
            onClick={() => handleTabChange("verified")}
            style={{
              background: activeTab === "verified" ? "#F0FDF4" : "#ffffff",
              border: activeTab === "verified" ? "2px solid #16A34A" : "1px solid #E2E8F0",
              padding: "14px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ fontSize: "12px", color: "#166534", fontWeight: "700" }}>✓ 已官方认证雇主</div>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#16A34A", marginTop: "2px" }}>
              {stats.verifiedCount}
            </div>
            <div style={{ fontSize: "11px", color: "#15803D", marginTop: "2px" }}>已核验营业执照证照</div>
          </div>

          {/* 卡3: 名企招聘推荐 */}
          <div
            onClick={() => handleTabChange("featured")}
            style={{
              background: activeTab === "featured" ? "#FEFCE8" : "#ffffff",
              border: activeTab === "featured" ? "2px solid #D97706" : "1px solid #E2E8F0",
              padding: "14px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ fontSize: "12px", color: "#92400E", fontWeight: "700" }}>★ 名企招聘推荐</div>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#D97706", marginTop: "2px" }}>
              {stats.featuredCount}
            </div>
            <div style={{ fontSize: "11px", color: "#B45309", marginTop: "2px" }}>大厅置顶与焦点展示</div>
          </div>

          {/* 卡4: 待审核认证申请 */}
          <div
            onClick={() => handleTabChange("pending")}
            style={{
              background: activeTab === "pending" ? "#FEF2F2" : "#ffffff",
              border: activeTab === "pending" ? "2px solid #EF4444" : "1px solid #E2E8F0",
              padding: "14px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ fontSize: "12px", color: "#B91C1C", fontWeight: "700" }}>⏳ 待审核认证申请</div>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#EF4444", marginTop: "2px" }}>
              {stats.pendingCount}
            </div>
            <div style={{ fontSize: "11px", color: "#DC2626", marginTop: "2px" }}>
              {stats.pendingCount > 0 ? "需人工尽快复核" : "当前无堆积待审"}
            </div>
          </div>

          {/* 卡5: 疑似重复企业 */}
          <div
            onClick={() => handleTabChange("duplicate")}
            style={{
              background: activeTab === "duplicate" ? "#F5F3FF" : "#ffffff",
              border: activeTab === "duplicate" ? "2px solid #8B5CF6" : "1px solid #E2E8F0",
              padding: "14px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ fontSize: "12px", color: "#6D28D9", fontWeight: "700" }}>⚡ 疑似重复企业</div>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#7C3AED", marginTop: "2px" }}>
              {stats.suspectedDuplicateCount}
            </div>
            <div style={{ fontSize: "11px", color: "#8B5CF6", marginTop: "2px" }}>同代码/简称相似度重合</div>
          </div>

          {/* 卡6: 资料待完善企业 */}
          <div
            onClick={() => handleTabChange("incomplete")}
            style={{
              background: activeTab === "incomplete" ? "#FFF7ED" : "#ffffff",
              border: activeTab === "incomplete" ? "2px solid #F97316" : "1px solid #E2E8F0",
              padding: "14px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ fontSize: "12px", color: "#C2410C", fontWeight: "700" }}>📋 资料待完善企业</div>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#EA580C", marginTop: "2px" }}>
              {stats.incompleteCount}
            </div>
            <div style={{ fontSize: "11px", color: "#F97316", marginTop: "2px" }}>完整度低于 80% 需补全</div>
          </div>
        </div>

        {/* ── 统一综合搜索与多维筛选工具栏 ── */}
        <div
          style={{
            background: "#ffffff",
            padding: "14px 18px",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            marginBottom: "1rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          {/* 上层：搜索输入与核心选择器 */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" }}>
            <div style={{ display: "flex", gap: "8px", flex: "1 1 300px" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadCompanies()}
                placeholder="搜索企业全称、简称、信用代码、联系人、电话、地址..."
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "13px",
                  width: "100%",
                }}
              />
              <button
                onClick={() => {
                  setPage(1);
                  loadCompanies();
                }}
                style={{
                  background: "#1967D2",
                  color: "#fff",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                查询
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={filterIndustry}
                onChange={(e) => {
                  setFilterIndustry(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12.5px" }}
              >
                {INDUSTRY_OPTIONS.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>

              <select
                value={filterSource}
                onChange={(e) => {
                  setFilterSource(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12.5px" }}
              >
                <option value="ALL">全部来源</option>
                <option value="ADMIN_CREATED">后台录入</option>
                <option value="USER_CREATED">企业自主创建</option>
                <option value="MIGRATED">历史数据收录</option>
                <option value="CLAIMED">企业HR认领</option>
                <option value="IMPORT">批量导入</option>
              </select>

              <select
                value={filterCompleteness}
                onChange={(e) => {
                  setFilterCompleteness(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12.5px" }}
              >
                <option value="ALL">全部完整度</option>
                <option value="complete">完整 (≥80%)</option>
                <option value="incomplete">待完善 (40-79%)</option>
                <option value="severe">严重缺失 (&lt;40%)</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12.5px" }}
              >
                <option value="updatedAt">按最近更新时间</option>
                <option value="jobs_desc">按在招职位数从多到少</option>
                <option value="createdAt">按最新收录创建时间</option>
                <option value="name">按企业名称字母序</option>
              </select>

              <button
                onClick={handleResetFilters}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #E2E8F0",
                  background: "#F8FAFC",
                  color: "#64748B",
                  fontSize: "12.5px",
                  cursor: "pointer",
                }}
              >
                ↺ 重置筛选
              </button>
            </div>
          </div>

          {/* 下层：快捷分段 Tab 栏 */}
          <div className="tabs-row" style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            {[
              { key: "all", label: "全部主体", badge: stats.total },
              { key: "verified", label: "已认证", badge: stats.verifiedCount },
              { key: "pending", label: "待审核", badge: stats.pendingCount },
              { key: "unverified", label: "未认证收录", badge: null },
              { key: "rejected", label: "已驳回", badge: null },
              { key: "featured", label: "推荐名企", badge: stats.featuredCount },
              { key: "duplicate", label: "疑似重复", badge: stats.suspectedDuplicateCount },
              { key: "incomplete", label: "资料待完善", badge: stats.incompleteCount },
              { key: "no_jobs", label: "无在招职位", badge: null },
            ].map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12.5px",
                    fontWeight: active ? "700" : "500",
                    border: active ? "1px solid #1967D2" : "1px solid #E2E8F0",
                    background: active ? "#EFF6FF" : "#ffffff",
                    color: active ? "#1D4ED8" : "#475569",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {tab.label}
                  {tab.badge !== null && tab.badge !== undefined && (
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "1px 5px",
                        borderRadius: "10px",
                        background: active ? "#1D4ED8" : "#F1F5F9",
                        color: active ? "#ffffff" : "#64748B",
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 批量操作浮动条（当勾选任意企业时显示） ── */}
        {selectedIds.length > 0 && (
          <div
            style={{
              background: "#1E293B",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: "10px",
              marginBottom: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700" }}>
                已选中 <b>{selectedIds.length}</b> 家企业
              </span>
              <button
                onClick={() => setSelectedIds([])}
                style={{ background: "none", border: "none", color: "#94A3B8", fontSize: "12px", cursor: "pointer" }}
              >
                取消全选
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={batchLoading}
                onClick={() => handleBatchAction("SET_FEATURED")}
                style={{
                  background: "#D97706",
                  border: "none",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                批量设为推荐
              </button>
              <button
                disabled={batchLoading}
                onClick={() => handleBatchAction("UNSET_FEATURED")}
                style={{
                  background: "#475569",
                  border: "none",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12.5px",
                  cursor: "pointer",
                }}
              >
                取消推荐
              </button>
              <button
                disabled={batchLoading}
                onClick={() => handleBatchAction("ARCHIVE")}
                style={{
                  background: "#DC2626",
                  border: "none",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                批量归档
              </button>
            </div>
          </div>
        )}

        {/* ── 高密度企业治理表格（PC端） ── */}
        <div
          className="companies-table-wrap"
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr
                style={{
                  background: "#F8FAFC",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#475569",
                  fontWeight: "700",
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                }}
              >
                <th style={{ padding: "12px 14px", width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(companies.map((c) => c.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>
                <th style={{ padding: "12px 14px", minWidth: "260px" }}>企业主体档案</th>
                <th style={{ padding: "12px 14px", minWidth: "150px" }}>行业与规模</th>
                <th style={{ padding: "12px 14px", minWidth: "110px" }}>资质认证</th>
                <th style={{ padding: "12px 14px", minWidth: "90px" }}>推荐状态</th>
                <th style={{ padding: "12px 14px", minWidth: "120px" }}>资料完整度</th>
                <th style={{ padding: "12px 14px", minWidth: "90px" }}>在招职位</th>
                <th style={{ padding: "12px 14px", minWidth: "90px" }}>来源</th>
                <th style={{ padding: "12px 14px", minWidth: "110px" }}>更新时间</th>
                <th style={{ padding: "12px 14px", textAlign: "right", minWidth: "180px" }}>治理操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "4rem", color: "#94A3B8" }}>
                    <div style={{ fontSize: "14px" }}>⏳ 正在载入招聘企业主数据...</div>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "4rem", color: "#94A3B8" }}>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#475569" }}>未检索到匹配企业主体</div>
                    <div style={{ fontSize: "13px", marginTop: "4px" }}>可尝试更换关键词或重置筛选条件</div>
                    <button
                      onClick={handleResetFilters}
                      style={{
                        marginTop: "12px",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        border: "1px solid #CBD5E1",
                        background: "#fff",
                        color: "#1967D2",
                        cursor: "pointer",
                      }}
                    >
                      清空条件
                    </button>
                  </td>
                </tr>
              ) : (
                companies.map((comp) => {
                  const isChecked = selectedIds.includes(comp.id);
                  const isMenuOpen = actionMenuId === comp.id;

                  return (
                    <tr
                      key={comp.id}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        background: isChecked ? "#F0F9FF" : "#ffffff",
                        transition: "background 0.1s ease",
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: "12px 14px" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, comp.id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== comp.id));
                            }
                          }}
                        />
                      </td>

                      {/* 企业主体 */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          {/* Logo 或 Monogram */}
                          {comp.logo ? (
                            <img
                              src={comp.logo}
                              alt=""
                              style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "6px",
                                background: "linear-gradient(135deg, #1967D2 0%, #0F4FA8 100%)",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "800",
                                fontSize: "14px",
                                flexShrink: 0,
                              }}
                            >
                              {comp.name.slice(0, 2)}
                            </div>
                          )}

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span style={{ fontWeight: "800", color: "#0F172A", fontSize: "13.5px" }}>
                                {comp.name}
                              </span>
                              {comp.status === "DISABLED" && (
                                <span style={{ background: "#F1F5F9", color: "#64748B", fontSize: "10px", padding: "1px 4px", borderRadius: "3px" }}>
                                  已停用
                                </span>
                              )}
                              {comp.isSuspectedDuplicate && (
                                <span
                                  onClick={() => handleOpenMergeDrawer(comp)}
                                  title={comp.duplicateInfo?.reason || "疑似重复"}
                                  style={{
                                    background: "#F5F3FF",
                                    color: "#7C3AED",
                                    fontSize: "10.5px",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    fontWeight: "700",
                                    border: "1px solid #DDD6FE",
                                    cursor: "pointer",
                                  }}
                                >
                                  ⚡ 疑似重复
                                </span>
                              )}
                            </div>

                            {/* 异常警示 */}
                            {comp.issues && comp.issues.length > 0 && (
                              <div style={{ display: "flex", gap: "4px", marginTop: "2px" }}>
                                {comp.issues.map((iss, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      background: "#FFFBEB",
                                      color: "#B45309",
                                      fontSize: "10px",
                                      padding: "1px 5px",
                                      borderRadius: "3px",
                                      border: "1px solid #FDE68A",
                                    }}
                                  >
                                    ⚠ {iss}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* 地址与代码第二行 */}
                            <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "3px", display: "flex", gap: "10px" }}>
                              <span>📍 {comp.address ? comp.address.slice(0, 18) : "嵩明县杨林工业园区"}</span>
                              {comp.creditCode ? (
                                <span style={{ fontFamily: "monospace" }}>
                                  统一代码: ...{comp.creditCode.slice(-6)}
                                </span>
                              ) : (
                                <span style={{ color: "#94A3B8" }}>ID: ...{comp.id.slice(-6)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 行业与规模 */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ color: "#1E293B", fontWeight: "600" }}>{comp.industry || "实体企业"}</div>
                        <div style={{ fontSize: "11.5px", color: "#94A3B8", marginTop: "2px" }}>
                          {comp.companySize || "1-49人"} · {comp.companyType || "民营企业"}
                        </div>
                      </td>

                      {/* 资质认证 */}
                      <td style={{ padding: "12px 14px" }}>
                        {comp.verificationStatus === "VERIFIED" ? (
                          <span
                            style={{
                              background: "#DCFCE7",
                              color: "#166534",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11.5px",
                              fontWeight: "700",
                              display: "inline-block",
                            }}
                          >
                            ✓ 已认证
                          </span>
                        ) : comp.verificationStatus === "PENDING" ? (
                          <span
                            style={{
                              background: "#FEF3C7",
                              color: "#92400E",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11.5px",
                              fontWeight: "700",
                              display: "inline-block",
                            }}
                          >
                            ⏳ 待审核
                          </span>
                        ) : comp.verificationStatus === "REJECTED" ? (
                          <span
                            style={{
                              background: "#FEE2E2",
                              color: "#991B1B",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11.5px",
                              fontWeight: "700",
                              display: "inline-block",
                            }}
                            title={comp.rejectReason || "认证申请已驳回"}
                          >
                            ✕ 已驳回
                          </span>
                        ) : (
                          <span
                            style={{
                              background: "#F1F5F9",
                              color: "#64748B",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11.5px",
                              display: "inline-block",
                            }}
                          >
                            平台收录
                          </span>
                        )}
                      </td>

                      {/* 推荐状态 */}
                      <td style={{ padding: "12px 14px" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(comp)}
                          title="点击快捷切换推荐状态"
                          style={{
                            background: comp.isFeaturedEmployer ? "#FEF3C7" : "#F8FAFC",
                            border: comp.isFeaturedEmployer ? "1px solid #FDE68A" : "1px solid #E2E8F0",
                            color: comp.isFeaturedEmployer ? "#B45309" : "#64748B",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11.5px",
                            fontWeight: comp.isFeaturedEmployer ? "700" : "500",
                            cursor: "pointer",
                          }}
                        >
                          {comp.isFeaturedEmployer ? "★ 推荐" : "普通"}
                        </button>
                      </td>

                      {/* 资料完整度 */}
                      <td style={{ padding: "12px 14px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "50px", height: "6px", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${comp.completeness?.score || 0}%`,
                                  height: "100%",
                                  background:
                                    (comp.completeness?.score || 0) >= 80
                                      ? "#16A34A"
                                      : (comp.completeness?.score || 0) >= 40
                                      ? "#F59E0B"
                                      : "#EF4444",
                                }}
                              />
                            </div>
                            <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#334155" }}>
                              {comp.completeness?.score || 0}%
                            </span>
                          </div>
                          {comp.completeness?.missingFields?.length > 0 && (
                            <div style={{ fontSize: "10.5px", color: "#94A3B8", marginTop: "2px" }}>
                              缺: {comp.completeness.missingFields.slice(0, 2).join("、")}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 在招职位 */}
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          onClick={() => handleOpenViewDrawer(comp)}
                          title="点击查看在招职位抽屉"
                          style={{
                            color: comp.jobCount > 0 ? "#1967D2" : "#94A3B8",
                            fontWeight: "800",
                            cursor: "pointer",
                            textDecoration: comp.jobCount > 0 ? "underline" : "none",
                          }}
                        >
                          {comp.jobCount} 个
                        </span>
                      </td>

                      {/* 数据来源 */}
                      <td style={{ padding: "12px 14px", fontSize: "12px", color: "#64748B" }}>
                        {comp.source === "MIGRATED"
                          ? "历史收录"
                          : comp.source === "ADMIN_CREATED"
                          ? "后台录入"
                          : comp.source === "USER_CREATED"
                          ? "企业创建"
                          : comp.source === "CLAIMED"
                          ? "企业认领"
                          : "批量导入"}
                      </td>

                      {/* 更新时间 */}
                      <td style={{ padding: "12px 14px", fontSize: "11.5px", color: "#64748B" }}>
                        {formatTimeAgo(comp.updatedAt)}
                      </td>

                      {/* 操作列 */}
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenViewDrawer(comp)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#1967D2",
                              fontWeight: "700",
                              cursor: "pointer",
                              padding: "2px 4px",
                            }}
                          >
                            查看
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditDrawer(comp)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#0F766E",
                              fontWeight: "600",
                              cursor: "pointer",
                              padding: "2px 4px",
                            }}
                          >
                            编辑
                          </button>

                          {/* 录入职位直达 */}
                          <Link
                            href={`/admin/jobs/new?companyId=${comp.id}`}
                            title="以此企业主体直接发布新职位"
                            style={{
                              color: "#D97706",
                              fontWeight: "600",
                              textDecoration: "none",
                              padding: "2px 4px",
                            }}
                          >
                            +职位
                          </Link>

                          {/* 审核操作 */}
                          {(comp.verificationStatus === "PENDING" || comp.verificationStatus === "VERIFIED") && (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewComp(comp);
                                setRejectReason(comp.rejectReason || "");
                                setReviewModalOpen(true);
                              }}
                              style={{
                                background: comp.verificationStatus === "PENDING" ? "#EF4444" : "#F1F5F9",
                                color: comp.verificationStatus === "PENDING" ? "#ffffff" : "#475569",
                                border: "none",
                                borderRadius: "4px",
                                padding: "2px 6px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer",
                              }}
                            >
                              审核
                            </button>
                          )}

                          {/* 更多菜单按钮 */}
                          <button
                            type="button"
                            onClick={() => setActionMenuId(isMenuOpen ? null : comp.id)}
                            style={{
                              background: isMenuOpen ? "#E2E8F0" : "none",
                              border: "none",
                              color: "#64748B",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            ⋮
                          </button>

                          {/* 更多下拉浮层 */}
                          {isMenuOpen && (
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "26px",
                                background: "#ffffff",
                                border: "1px solid #CBD5E1",
                                borderRadius: "8px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                                zIndex: 10,
                                width: "140px",
                                textAlign: "left",
                                overflow: "hidden",
                              }}
                            >
                              <Link
                                href={`/company/${comp.id}`}
                                target="_blank"
                                onClick={() => setActionMenuId(null)}
                                style={{
                                  display: "block",
                                  padding: "8px 12px",
                                  color: "#1E293B",
                                  textDecoration: "none",
                                  fontSize: "12.5px",
                                  borderBottom: "1px solid #F1F5F9",
                                }}
                              >
                                ↗ 前台招聘主页
                              </Link>

                              {comp.isSuspectedDuplicate && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionMenuId(null);
                                    handleOpenMergeDrawer(comp);
                                  }}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "8px 12px",
                                    border: "none",
                                    background: "#F5F3FF",
                                    color: "#7C3AED",
                                    fontSize: "12.5px",
                                    cursor: "pointer",
                                    fontWeight: "700",
                                    borderBottom: "1px solid #F1F5F9",
                                  }}
                                >
                                  ⚡ 重复合并对比
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuId(null);
                                  handleToggleStatus(comp, comp.status === "ACTIVE" ? "DISABLED" : "ACTIVE");
                                }}
                                style={{
                                  display: "block",
                                  width: "100%",
                                  textAlign: "left",
                                  padding: "8px 12px",
                                  border: "none",
                                  background: "none",
                                  color: comp.status === "ACTIVE" ? "#DC2626" : "#16A34A",
                                  fontSize: "12.5px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid #F1F5F9",
                                }}
                              >
                                {comp.status === "ACTIVE" ? "停用该企业" : "恢复正常启用"}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuId(null);
                                  handleToggleStatus(comp, "ARCHIVED");
                                }}
                                style={{
                                  display: "block",
                                  width: "100%",
                                  textAlign: "left",
                                  padding: "8px 12px",
                                  border: "none",
                                  background: "none",
                                  color: "#94A3B8",
                                  fontSize: "12.5px",
                                  cursor: "pointer",
                                }}
                              >
                                归档主体
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* ── 分页控制器 ── */}
          <div
            style={{
              padding: "12px 18px",
              background: "#F8FAFC",
              borderTop: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#64748B" }}>
              <span>
                共 <b>{total}</b> 家企业主体 · 第 <b>{page}</b> 页
              </span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
                style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #CBD5E1", fontSize: "12px" }}
              >
                <option value="25">25 条/页</option>
                <option value="50">50 条/页</option>
                <option value="100">100 条/页</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  background: "#fff",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  color: page <= 1 ? "#CBD5E1" : "#1E293B",
                  fontSize: "12.5px",
                }}
              >
                上一页
              </button>
              <button
                disabled={companies.length < limit}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  background: "#fff",
                  cursor: companies.length < limit ? "not-allowed" : "pointer",
                  color: companies.length < limit ? "#CBD5E1" : "#1E293B",
                  fontSize: "12.5px",
                }}
              >
                下一页
              </button>
            </div>
          </div>
        </div>

        {/* ── 手机端自适应卡片流（在小屏下展示） ── */}
        <div className="mobile-cards-stream" style={{ display: "none", flexDirection: "column", gap: "12px" }}>
          {companies.map((comp) => (
            <div
              key={comp.id}
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                padding: "14px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "6px",
                      background: "linear-gradient(135deg, #1967D2 0%, #0F4FA8 100%)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "800",
                      fontSize: "16px",
                      flexShrink: 0,
                    }}
                  >
                    {comp.name.slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: "800", color: "#0F172A", fontSize: "14px" }}>{comp.name}</div>
                    <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                      {comp.industry} · {comp.companySize}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    background: comp.verificationStatus === "VERIFIED" ? "#DCFCE7" : "#F1F5F9",
                    color: comp.verificationStatus === "VERIFIED" ? "#166534" : "#64748B",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {comp.verificationStatus === "VERIFIED" ? "已认证" : "平台收录"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", margin: "10px 0", fontSize: "12px", color: "#64748B", borderTop: "1px solid #F1F5F9", paddingTop: "8px" }}>
                <span>在招职位: <b style={{ color: "#1967D2" }}>{comp.jobCount}</b> 个</span>
                <span>完整度: <b>{comp.completeness?.score || 0}%</b></span>
                <span>更新: {formatTimeAgo(comp.updatedAt)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", borderTop: "1px solid #F1F5F9", paddingTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleOpenViewDrawer(comp)}
                  style={{ padding: "5px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#fff", fontSize: "12px", fontWeight: "600" }}
                >
                  查看
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEditDrawer(comp)}
                  style={{ padding: "5px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#fff", fontSize: "12px", fontWeight: "600", color: "#0F766E" }}
                >
                  编辑
                </button>
                <Link
                  href={`/company/${comp.id}`}
                  target="_blank"
                  style={{ padding: "5px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#EFF6FF", fontSize: "12px", fontWeight: "700", color: "#1967D2", textDecoration: "none" }}
                >
                  前台主页
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── 抽屉 1: 查看企业全貌详情抽屉 (ViewCompanyDrawer) ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {viewDrawerComp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            zIndex: 100,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setViewDrawerComp(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "560px",
              height: "100%",
              background: "#ffffff",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 抽屉头部 */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                background: "#F8FAFC",
              }}
            >
              <div>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#1967D2" }}>企业主数据详情</span>
                <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#0F172A", margin: "4px 0" }}>
                  {viewDrawerComp.name}
                </h2>
                <div style={{ fontSize: "12px", color: "#64748B" }}>
                  企业ID: <span style={{ fontFamily: "monospace" }}>{viewDrawerComp.id}</span>
                </div>
              </div>
              <button
                onClick={() => setViewDrawerComp(null)}
                style={{ background: "none", border: "none", fontSize: "20px", color: "#94A3B8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* 抽屉正文 */}
            <div style={{ padding: "20px 24px", flex: 1 }}>
              {viewDrawerLoading ? (
                <div style={{ padding: "3rem 0", textAlign: "center", color: "#94A3B8" }}>正在加载企业完整全貌...</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* 核心状态卡 */}
                  <div style={{ background: "#F8FAFC", borderRadius: "10px", padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748B" }}>认证状态</div>
                      <div style={{ fontWeight: "800", marginTop: "2px", color: viewDrawerComp.verificationStatus === "VERIFIED" ? "#16A34A" : "#D97706" }}>
                        {viewDrawerComp.verificationStatus === "VERIFIED" ? "✓ 已认证" : viewDrawerComp.verificationStatus === "PENDING" ? "⏳ 待审核" : "平台收录"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748B" }}>名企推荐</div>
                      <div style={{ fontWeight: "800", marginTop: "2px", color: viewDrawerComp.isFeaturedEmployer ? "#D97706" : "#64748B" }}>
                        {viewDrawerComp.isFeaturedEmployer ? "★ 名企招聘推荐" : "普通收录"}
                      </div>
                    </div>
                  </div>

                  {/* 资料完整度诊断 */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>资料完整度诊断</span>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "#1967D2" }}>
                        {viewDrawerComp.completeness?.score || 0}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#E2E8F0", borderRadius: "4px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${viewDrawerComp.completeness?.score || 0}%`,
                          height: "100%",
                          background: "#16A34A",
                        }}
                      />
                    </div>
                    {viewDrawerComp.completeness?.missingFields?.length > 0 && (
                      <div style={{ fontSize: "12px", color: "#DC2626", marginTop: "6px" }}>
                        待补充项：{viewDrawerComp.completeness.missingFields.join("、")}
                      </div>
                    )}
                  </div>

                  {/* 工商执照资质 */}
                  <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0F172A", margin: "0 0 10px 0" }}>
                      工商证照与资质
                    </h3>
                    <div style={{ fontSize: "13px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div><b>统一信用代码:</b> {viewDrawerComp.creditCode || "未填写"}</div>
                      <div><b>法定代表人:</b> {viewDrawerComp.legalRepresentative || "未填"}</div>
                      <div><b>成立年份:</b> {fullCompanyDetail?.foundedYear ? `${fullCompanyDetail.foundedYear}年` : "未填"}</div>
                      <div><b>注册资本:</b> {fullCompanyDetail?.registeredCapital || "未填"}</div>
                    </div>

                    {/* 营业执照图 */}
                    <div style={{ marginTop: "12px" }}>
                      <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "6px" }}>营业执照原件凭据：</div>
                      {viewDrawerComp.businessLicenseImage ? (
                        <div
                          onClick={() => setPreviewLicenseUrl(viewDrawerComp.businessLicenseImage!)}
                          style={{
                            border: "1px solid #CBD5E1",
                            borderRadius: "8px",
                            padding: "6px",
                            display: "inline-block",
                            cursor: "pointer",
                            background: "#F8FAFC",
                          }}
                        >
                          <img
                            src={viewDrawerComp.businessLicenseImage}
                            alt="营业执照"
                            style={{ height: "100px", borderRadius: "4px", objectFit: "contain" }}
                          />
                          <div style={{ fontSize: "11px", color: "#1967D2", textAlign: "center", marginTop: "2px" }}>
                            🔍 点击放大查看
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: "14px", background: "#F8FAFC", borderRadius: "6px", color: "#94A3B8", fontSize: "12.5px" }}>
                          暂无上传营业执照图片
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 在招职位分布 */}
                  <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                        关联在招职位 ({fullCompanyDetail?.jobs?.length || viewDrawerComp.jobCount}个)
                      </h3>
                      <Link
                        href={`/admin/jobs/new?companyId=${viewDrawerComp.id}`}
                        style={{ fontSize: "12px", color: "#1967D2", fontWeight: "700", textDecoration: "none" }}
                      >
                        + 新增职位
                      </Link>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {(fullCompanyDetail?.jobs || viewDrawerComp.recentJobs || []).map((job: any) => (
                        <div
                          key={job.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "6px",
                            border: "1px solid #E2E8F0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: "700", color: "#1E293B", fontSize: "13px" }}>{job.title}</div>
                            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
                              更新于: {formatTimeAgo(job.updatedAt)}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#E65100", fontWeight: "800", fontSize: "13px" }}>{job.salary || "面议"}</div>
                            <span style={{ fontSize: "10px", background: job.status === "APPROVED" ? "#DCFCE7" : "#F1F5F9", color: job.status === "APPROVED" ? "#166534" : "#64748B", padding: "1px 4px", borderRadius: "3px" }}>
                              {job.status === "APPROVED" ? "已发布" : job.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 审计日志 */}
                  {fullCompanyDetail?.auditLogs && fullCompanyDetail.auditLogs.length > 0 && (
                    <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#0F172A", margin: "0 0 8px 0" }}>
                        最近操作审计日志
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {fullCompanyDetail.auditLogs.map((log: any) => (
                          <div key={log.id} style={{ fontSize: "12px", color: "#64748B", background: "#F8FAFC", padding: "8px 10px", borderRadius: "6px" }}>
                            <span style={{ fontWeight: "700", color: "#334155" }}>{log.action}</span> · {log.user?.username || "管理员"} ({formatTimeAgo(log.createdAt)})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 抽屉底部操作条 */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #E2E8F0",
                background: "#F8FAFC",
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <Link
                href={`/company/${viewDrawerComp.id}`}
                target="_blank"
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  background: "#fff",
                  color: "#1967D2",
                  fontWeight: "700",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
              >
                ↗ 前台招聘主页
              </Link>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleOpenEditDrawer(viewDrawerComp)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    background: "#fff",
                    color: "#0F766E",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  编辑资料
                </button>
                <button
                  onClick={() => {
                    setReviewComp(viewDrawerComp);
                    setRejectReason(viewDrawerComp.rejectReason || "");
                    setReviewModalOpen(true);
                  }}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#1967D2",
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  审核资质
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── 抽屉 2: 企业分组编辑抽屉 (EditCompanyDrawer) ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {editDrawerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            zIndex: 100,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setEditDrawerOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              height: "100%",
              background: "#ffffff",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "#0F172A" }}>
                编辑招聘企业档案
              </h3>
              <button onClick={() => setEditDrawerOpen(false)} style={{ background: "none", border: "none", fontSize: "20px", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* 分组 1: 基本档案 */}
              <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#1967D2", marginBottom: "10px" }}>
                  1. 企业主体基本档案
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px" }}>企业全称 *</label>
                    <input
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px" }}>企业对外简称</label>
                      <input
                        value={editForm.shortName}
                        onChange={(e) => setEditForm({ ...editForm, shortName: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px" }}>企业性质</label>
                      <select
                        value={editForm.companyType}
                        onChange={(e) => setEditForm({ ...editForm, companyType: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                      >
                        <option value="民营企业">民营企业</option>
                        <option value="国有企业">国有企业</option>
                        <option value="外资/合资企业">外资/合资企业</option>
                        <option value="股份制企业">股份制企业</option>
                        <option value="事业单位">事业单位</option>
                        <option value="个体工商户">个体工商户</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 分组 2: 行业与规模 */}
              <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#1967D2", marginBottom: "10px" }}>
                  2. 行业与用工规模
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px" }}>所属行业</label>
                    <select
                      value={editForm.industry}
                      onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                    >
                      {INDUSTRY_OPTIONS.filter((o) => o !== "全部行业").map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px" }}>人员规模</label>
                    <select
                      value={editForm.companySize}
                      onChange={(e) => setEditForm({ ...editForm, companySize: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                    >
                      <option value="1-49人">1-49人</option>
                      <option value="50-99人">50-99人</option>
                      <option value="100-499人">100-499人</option>
                      <option value="500-999人">500-999人</option>
                      <option value="1000人以上">1000人以上</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 分组 3: 招聘联系方式 */}
              <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#1967D2", marginBottom: "10px" }}>
                  3. 招聘联系人与电话
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px" }}>联系人姓名</label>
                    <input
                      value={editForm.contactName}
                      onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px" }}>官方联系电话</label>
                    <input
                      value={editForm.contactPhone}
                      onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              {/* 分组 4: 办公地址 */}
              <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#1967D2", marginBottom: "10px" }}>
                  4. 办公/厂区详细地址
                </div>
                <input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              {/* 分组 5: 工商代码与营业执照图 */}
              <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#1967D2", marginBottom: "10px" }}>
                  5. 资质与营业执照
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px" }}>统一社会信用代码</label>
                      <input
                        value={editForm.creditCode}
                        onChange={(e) => setEditForm({ ...editForm, creditCode: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px" }}>法定代表人</label>
                      <input
                        value={editForm.legalRepresentative}
                        onChange={(e) => setEditForm({ ...editForm, legalRepresentative: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", marginBottom: "4px" }}>营业执照图片链接</label>
                    <input
                      value={editForm.businessLicenseImage}
                      onChange={(e) => setEditForm({ ...editForm, businessLicenseImage: e.target.value })}
                      placeholder="https://..."
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              {/* 分组 6: 企业简介 */}
              <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#1967D2", marginBottom: "10px" }}>
                  6. 企业图文介绍
                </div>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEditDrawerOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer" }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  style={{ padding: "8px 24px", borderRadius: "6px", border: "none", background: "#1967D2", color: "#fff", fontWeight: "700", cursor: "pointer" }}
                >
                  {editSaving ? "保存中..." : "保存修改"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── 弹窗 3: 资质认证审核 (ReviewModal) ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {reviewModalOpen && reviewComp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            zIndex: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={() => setReviewModalOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "520px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "900", color: "#0F172A" }}>
              企业资质认证审核
            </h3>

            <div style={{ background: "#F8FAFC", borderRadius: "8px", padding: "14px", marginBottom: "14px", fontSize: "13px" }}>
              <div><b>企业全称：</b> {reviewComp.name}</div>
              <div style={{ marginTop: "4px" }}><b>统一代码：</b> {reviewComp.creditCode || "未提供统一社会信用代码"}</div>
              <div style={{ marginTop: "4px" }}><b>联系人及电话：</b> {reviewComp.contactName || "未填"} / {reviewComp.contactPhone || "未填"}</div>
              <div style={{ marginTop: "4px" }}><b>当前状态：</b> {reviewComp.verificationStatus}</div>
            </div>

            {/* 执照放大通道 */}
            {reviewComp.businessLicenseImage && (
              <div style={{ marginBottom: "14px", textAlign: "center" }}>
                <img
                  src={reviewComp.businessLicenseImage}
                  alt="营业执照"
                  onClick={() => setPreviewLicenseUrl(reviewComp.businessLicenseImage!)}
                  style={{ maxHeight: "140px", borderRadius: "6px", cursor: "pointer", border: "1px solid #CBD5E1" }}
                />
                <div style={{ fontSize: "11px", color: "#1967D2", marginTop: "4px", cursor: "pointer" }}>
                  🔍 点击放大查看执照大图
                </div>
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                驳回原因（驳回时必填）
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="例如：营业执照复印件字迹模糊无法核实，或统一社会信用代码校验不符..."
                rows={3}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer" }}
              >
                取消
              </button>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  disabled={reviewLoading}
                  onClick={() => handleAuditSubmit("REJECT")}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#EF4444", color: "#fff", fontWeight: "700", cursor: "pointer" }}
                >
                  驳回申请
                </button>
                <button
                  type="button"
                  disabled={reviewLoading}
                  onClick={() => handleAuditSubmit("VERIFY")}
                  style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: "#16A34A", color: "#fff", fontWeight: "700", cursor: "pointer" }}
                >
                  通过认证
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── 抽屉 4: 疑似重复企业两两对比与合并 (MergeCompanyDrawer) ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {mergeDrawerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            zIndex: 110,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1.5rem",
          }}
          onClick={() => setMergeDrawerOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "840px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#7C3AED" }}>疑似重复治理中心</span>
                <h3 style={{ margin: "2px 0", fontSize: "18px", fontWeight: "900", color: "#0F172A" }}>
                  企业主体深度对比与平移合并
                </h3>
              </div>
              <button onClick={() => setMergeDrawerOpen(false)} style={{ background: "none", border: "none", fontSize: "20px", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            {mergeLoading || !mergeData ? (
              <div style={{ padding: "3rem 0", textAlign: "center", color: "#94A3B8" }}>正在加载对比数据...</div>
            ) : (
              <div>
                <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "12.5px", color: "#5B21B6" }}>
                  💡 <b>合并规则说明</b>：选择保留的「主企业」，系统将把「从企业」关联的所有在招职位平滑移转至主企业，并将从企业状态置为“归档”，绝不硬删除历史记录，全程写入审计日志。
                </div>

                {/* 两两对比表格 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  {/* 企业 A */}
                  <div
                    style={{
                      border: mergeMasterId === mergeData.companyA.id ? "2px solid #1967D2" : "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "16px",
                      background: mergeMasterId === mergeData.companyA.id ? "#EFF6FF" : "#ffffff",
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "800", fontSize: "14px", color: "#0F172A", marginBottom: "10px" }}>
                      <input
                        type="radio"
                        name="masterSelect"
                        checked={mergeMasterId === mergeData.companyA.id}
                        onChange={() => setMergeMasterId(mergeData.companyA.id)}
                      />
                      设定为保留主企业 (A)
                    </label>

                    <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div><b>全称：</b> {mergeData.companyA.name}</div>
                      <div><b>信用代码：</b> {mergeData.companyA.creditCode || "无"}</div>
                      <div><b>行业/规模：</b> {mergeData.companyA.industry} · {mergeData.companyA.companySize}</div>
                      <div><b>地址：</b> {mergeData.companyA.address}</div>
                      <div><b>联系电话：</b> {mergeData.companyA.contactPhone || "无"}</div>
                      <div><b>在招职位：</b> <b style={{ color: "#1967D2" }}>{mergeData.companyA.jobs?.length || 0}</b> 个</div>
                      <div><b>认证状态：</b> {mergeData.companyA.verificationStatus}</div>
                      <div><b>资料完整度：</b> {mergeData.companyA.completeness?.score || 0}%</div>
                    </div>
                  </div>

                  {/* 企业 B */}
                  <div
                    style={{
                      border: mergeMasterId === mergeData.companyB.id ? "2px solid #1967D2" : "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "16px",
                      background: mergeMasterId === mergeData.companyB.id ? "#EFF6FF" : "#ffffff",
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "800", fontSize: "14px", color: "#0F172A", marginBottom: "10px" }}>
                      <input
                        type="radio"
                        name="masterSelect"
                        checked={mergeMasterId === mergeData.companyB.id}
                        onChange={() => setMergeMasterId(mergeData.companyB.id)}
                      />
                      设定为保留主企业 (B)
                    </label>

                    <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div><b>全称：</b> {mergeData.companyB.name}</div>
                      <div><b>信用代码：</b> {mergeData.companyB.creditCode || "无"}</div>
                      <div><b>行业/规模：</b> {mergeData.companyB.industry} · {mergeData.companyB.companySize}</div>
                      <div><b>地址：</b> {mergeData.companyB.address}</div>
                      <div><b>联系电话：</b> {mergeData.companyB.contactPhone || "无"}</div>
                      <div><b>在招职位：</b> <b style={{ color: "#1967D2" }}>{mergeData.companyB.jobs?.length || 0}</b> 个</div>
                      <div><b>认证状态：</b> {mergeData.companyB.verificationStatus}</div>
                      <div><b>资料完整度：</b> {mergeData.companyB.completeness?.score || 0}%</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setMergeDrawerOpen(false)}
                    style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer" }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    disabled={mergeLoading}
                    onClick={handleExecuteMerge}
                    style={{
                      padding: "8px 24px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#7C3AED",
                      color: "#fff",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {mergeLoading ? "合并执行中..." : "确认合并两家企业"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── 弹窗 5: 两步式录入新企业主体 (CreateCompanyModal) ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {createModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            zIndex: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "540px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#1967D2" }}>
                  两步防重录入 · 步骤 {createStep}/2
                </span>
                <h3 style={{ margin: "2px 0", fontSize: "18px", fontWeight: "900", color: "#0F172A" }}>
                  {createStep === 1 ? "第一步：输入名称与实时防重检测" : "第二步：补充企业详情并保存"}
                </h3>
              </div>
              <button onClick={() => setCreateModalOpen(false)} style={{ background: "none", border: "none", fontSize: "20px", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleCreateCompanySubmit}>
              {createStep === 1 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>企业全称 *</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        required
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        onBlur={handleCheckSimilarity}
                        placeholder="如: 云南沃莱德新材料科技有限公司"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                      />
                      <button
                        type="button"
                        onClick={handleCheckSimilarity}
                        style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #1967D2", background: "#EFF6FF", color: "#1967D2", fontSize: "12.5px", fontWeight: "700", cursor: "pointer", flexShrink: 0 }}
                      >
                        查重
                      </button>
                    </div>
                  </div>

                  {/* 相似企业预警列表 */}
                  {createChecking && <div style={{ fontSize: "12px", color: "#64748B" }}>正在检索数据库相似主体...</div>}
                  {createCheckMatches.length > 0 && (
                    <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "8px", padding: "10px 12px" }}>
                      <div style={{ fontSize: "12.5px", fontWeight: "800", color: "#92400E", marginBottom: "4px" }}>
                        ⚠ 提示：库内发现 {createCheckMatches.length} 个名称相似的已有主体：
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {createCheckMatches.map((m) => (
                          <div key={m.id} style={{ fontSize: "12px", color: "#78350F", display: "flex", justifyContent: "space-between" }}>
                            <span>· {m.name} ({m.industry || "实体企业"})</span>
                            <span style={{ fontWeight: "700" }}>{m.jobCount}个职位</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>统一社会信用代码</label>
                    <input
                      value={createForm.creditCode}
                      onChange={(e) => setCreateForm({ ...createForm, creditCode: e.target.value })}
                      placeholder="18位统一社会信用代码（选填）"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>所属行业</label>
                      <select
                        value={createForm.industry}
                        onChange={(e) => setCreateForm({ ...createForm, industry: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                      >
                        {INDUSTRY_OPTIONS.filter((o) => o !== "全部行业").map((ind) => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>企业简称</label>
                      <input
                        value={createForm.shortName}
                        onChange={(e) => setCreateForm({ ...createForm, shortName: e.target.value })}
                        placeholder="选填"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setCreateModalOpen(false)}
                      style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer" }}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      disabled={!createForm.name.trim()}
                      onClick={() => setCreateStep(2)}
                      style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: "#1967D2", color: "#fff", fontWeight: "700", cursor: "pointer" }}
                    >
                      下一步：完善详情 →
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>办公/厂区详细地址</label>
                    <input
                      value={createForm.address}
                      onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>联系人姓名</label>
                      <input
                        value={createForm.contactName}
                        onChange={(e) => setCreateForm({ ...createForm, contactName: e.target.value })}
                        placeholder="如: 王经理"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>联系电话</label>
                      <input
                        value={createForm.contactPhone}
                        onChange={(e) => setCreateForm({ ...createForm, contactPhone: e.target.value })}
                        placeholder="如: 13800000000"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>企业简介</label>
                    <textarea
                      rows={3}
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="简述企业主营业务与用工需求..."
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setCreateStep(1)}
                      style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#fff", cursor: "pointer" }}
                    >
                      ← 上一步
                    </button>
                    <button
                      type="submit"
                      disabled={createSubmitting}
                      style={{ padding: "8px 24px", borderRadius: "6px", border: "none", background: "#16A34A", color: "#fff", fontWeight: "700", cursor: "pointer" }}
                    >
                      {createSubmitting ? "正在保存..." : "确认录入新企业"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── 营业执照放大灯箱 (Lightbox) ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {previewLicenseUrl && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={() => setPreviewLicenseUrl(null)}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img
              src={previewLicenseUrl}
              alt="营业执照放大"
              style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "8px", objectFit: "contain" }}
            />
            <button
              onClick={() => setPreviewLicenseUrl(null)}
              style={{
                position: "absolute",
                top: "-36px",
                right: "0",
                color: "#ffffff",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              ✕ 关闭预览
            </button>
          </div>
        </div>
      )}

      {/* ── 响应式与交互样式 ── */}
      <style jsx>{`
        @media (max-width: 900px) {
          .companies-table-wrap {
            display: none !important;
          }
          .mobile-cards-stream {
            display: flex !important;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </AdminLayout>
  );
}
