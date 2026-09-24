"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  LogOut,
  ExternalLink,
  ChevronRight,
  User,
  Shield,
} from "lucide-react";

/* ────────────────────────────────────────────
   Breadcrumb path map
   ──────────────────────────────────────────── */
const PATH_LABELS: Record<string, string> = {
  "/admin": "工作台",
  "/admin/content": "跨模块内容管理",
  "/admin/info": "便民分类管理",
  "/admin/review": "全站审核队列",
  "/admin/users": "会员用户管理",
  "/admin/companies": "招聘企业主体",
  "/admin/organizations": "组织治理中心",
  "/admin/orders": "全部订单管理",
  "/admin/mall": "自营便利店",
  "/admin/mall/orders": "便利店订单",
  "/admin/mall/products": "商品与库存",
  "/admin/mall/categories": "分类与网格",
  "/admin/mall/delivery": "配送与骑手",
  "/admin/mall/zones": "配送网格与运费",
  "/admin/mall/aftersales": "售后退款处理",
  "/admin/reports": "违规举报工单",
  "/admin/risk": "风控预警与仲裁",
  "/admin/logs": "操作日志",
  "/admin/operations": "运营数据看板",
  "/admin/operations/opportunities": "运营商机与缺口",
  "/admin/billing": "商业配置中心",
  "/admin/pricing": "收费策略定价",
  "/admin/commercial": "便民商业化运营",
  "/admin/withdrawals": "提现结算申请",
  "/admin/finance": "财务对账中心",
  "/admin/ads": "广告排期运营",
  "/admin/profile": "管理员中心",
  "/admin/resumes": "人才简历库",
  "/admin/industrial": "园区招商物业",
  "/admin/love": "相亲交友管理",
  "/admin/bianmin": "便民电话管理",
  "/admin/dictionaries": "数据字典配置",
  "/admin/regions": "区域网格管理",
  "/admin/files": "文件存储资源",
  "/admin/community": "贴吧社区管理",
  "/admin/articles": "本地资讯管理",
  "/admin/events": "同城活动管理",
  "/admin/shops": "口碑好店管理",
  "/admin/knowledge": "平台统一知识库",
  "/admin/workflows": "自动化工作流",
  "/admin/insights": "本地商业洞察",
  "/admin/settings/site": "站点基础配置",
  "/admin/settings/features": "全站功能开关",
  "/admin/settings/ai": "AI模型与用量",
  "/admin/wechat/overview": "公众号概览",
  "/admin/wechat/menu": "自定义菜单",
  "/admin/wechat/reply": "自动回复",
  "/admin/wechat/users": "微信粉丝管理",
  "/admin/wechat/leads": "商业线索转化",
  "/admin/wechat/settings": "微信公众号配置",
  "/admin/system/health": "服务器健康监控",
  "/admin/system/cache": "系统缓存治理",
  "/admin/system/tasks": "定时巡检任务",
  "/admin/login": "管理员登录",
};

interface AdminHeaderProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  session?: { username?: string; role?: string } | null;
  pendingAuditCount?: number;
}

export default function AdminHeader({ collapsed = false, onToggleCollapse, session, pendingAuditCount }: AdminHeaderProps) {
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/admin/login";
  };

  // Build breadcrumb
  const breadcrumbLabel = PATH_LABELS[pathname] || pathname.split("/").pop() || "后台";

  const S = {
    header: {
      height: "56px",
      background: "#ffffff",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      flexShrink: 0,
      gap: "16px",
    },
    left: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      minWidth: 0,
    },
    toggleBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#6b7280",
      display: "flex",
      alignItems: "center",
      padding: "6px",
      borderRadius: "6px",
      transition: "all 0.15s",
    },
    breadcrumb: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "13px",
      color: "#6b7280",
      whiteSpace: "nowrap" as const,
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    center: {
      flex: 1,
      maxWidth: "360px",
      minWidth: "120px",
    },
    searchWrap: {
      position: "relative" as const,
      width: "100%",
    },
    searchInput: {
      width: "100%",
      padding: "7px 12px 7px 34px",
      borderRadius: "8px",
      border: "1px solid #e5e7eb",
      background: "#f9fafb",
      fontSize: "13px",
      color: "#1f2937",
      outline: "none",
      boxSizing: "border-box" as const,
      transition: "border-color 0.15s",
    },
    right: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      flexShrink: 0,
    },
    iconBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#6b7280",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "7px",
      borderRadius: "8px",
      transition: "all 0.15s",
      position: "relative" as const,
    },
    badge: {
      position: "absolute" as const,
      top: "2px",
      right: "2px",
      width: "16px",
      height: "16px",
      borderRadius: "50%",
      background: "#ef4444",
      color: "white",
      fontSize: "9px",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
    },
    visitBtn: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      padding: "6px 12px",
      borderRadius: "7px",
      background: "#f0fdf4",
      color: "#15803d",
      border: "1px solid #bbf7d0",
      fontSize: "12px",
      fontWeight: 600,
      textDecoration: "none",
      cursor: "pointer",
      transition: "all 0.15s",
      whiteSpace: "nowrap" as const,
    },
    profileBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "4px 10px 4px 4px",
      borderRadius: "8px",
      border: "1px solid #e5e7eb",
      background: "#f9fafb",
      cursor: "pointer",
      transition: "all 0.15s",
      whiteSpace: "nowrap" as const,
    },
    avatar: {
      width: "28px",
      height: "28px",
      borderRadius: "6px",
      background: "#1677FF",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: "12px",
      flexShrink: 0,
    },
    dropdown: {
      position: "absolute" as const,
      top: "calc(100% + 6px)",
      right: 0,
      width: "200px",
      background: "white",
      borderRadius: "10px",
      border: "1px solid #e5e7eb",
      boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
      padding: "6px",
      zIndex: 999,
    },
    dropdownItem: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      width: "100%",
      padding: "8px 10px",
      borderRadius: "6px",
      border: "none",
      background: "none",
      color: "#374151",
      fontSize: "13px",
      cursor: "pointer",
      textDecoration: "none",
      transition: "background 0.1s",
      textAlign: "left" as const,
    },
  };

  return (
    <header style={S.header}>
      {/* Left: toggle + breadcrumb */}
      <div style={S.left}>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            style={S.toggleBtn}
            title={collapsed ? "展开侧栏" : "收起侧栏"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}
        <div style={S.breadcrumb}>
          <span style={{ color: "#9ca3af" }}>后台管理</span>
          <ChevronRight size={12} />
          <span style={{ color: "#1f2937", fontWeight: 600 }}>{breadcrumbLabel}</span>
        </div>
      </div>

      {/* Center: search */}
      <div style={S.center}>
        <div style={S.searchWrap}>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="全局搜索..."
            style={S.searchInput}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#1677FF")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
          />
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
        </div>
      </div>

      {/* Right: actions */}
      <div style={S.right}>
        {/* Audit badge link */}
        {(pendingAuditCount ?? 0) > 0 && (
          <Link href="/admin/review" style={{ ...S.iconBtn, textDecoration: "none" }} title="待审核内容">
            <ShieldCheck size={18} style={{ color: "#f59e0b" }} />
            <span style={S.badge}>{pendingAuditCount}</span>
          </Link>
        )}

        {/* Visit frontend */}
        <a href="/" target="_blank" rel="noreferrer" style={S.visitBtn}>
          <ExternalLink size={13} />
          <span>访问前台</span>
        </a>

        {/* Profile dropdown */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button onClick={() => setProfileOpen(!profileOpen)} style={S.profileBtn}>
            <div style={S.avatar}>{(session?.username || "A").charAt(0).toUpperCase()}</div>
            <div style={{ textAlign: "left" as const }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#1f2937", lineHeight: 1.2 }}>{session?.username || "管理员"}</div>
              <div style={{ fontSize: "10px", color: "#9ca3af", lineHeight: 1.2 }}>{session?.role || "ADMIN"}</div>
            </div>
          </button>

          {profileOpen && (
            <div style={S.dropdown}>
              <Link
                href="/admin/profile"
                style={S.dropdownItem}
                onClick={() => setProfileOpen(false)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <User size={14} />
                <span>管理员中心</span>
              </Link>
              <Link
                href="/admin/settings/site"
                style={S.dropdownItem}
                onClick={() => setProfileOpen(false)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <Shield size={14} />
                <span>站点配置</span>
              </Link>
              <div style={{ height: "1px", background: "#f3f4f6", margin: "4px 0" }} />
              <button
                onClick={logout}
                style={{ ...S.dropdownItem, color: "#ef4444" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <LogOut size={14} />
                <span>退出登录</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
