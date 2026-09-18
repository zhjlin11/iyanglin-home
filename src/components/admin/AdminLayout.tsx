"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import AdminHeader from "@/components/AdminNavbar";
import {
  X,
  LayoutDashboard,
  ClipboardList,
  ShieldCheck,
  PackageCheck,
  Menu,
  Home,
  Briefcase,
  Users,
  Heart,
  ShoppingBag,
  Newspaper,
  Phone,
  CalendarDays,
  MessageSquare,
  DollarSign,
  CreditCard,
  Megaphone,
  AlertOctagon,
  BarChart3,
  Settings,
  Smartphone,
  FolderOpen,
  Server,
  Zap,
  ScrollText,
  ToggleLeft,
  ExternalLink,
  LogOut,
  ChevronRight,
} from "lucide-react";

/* ────────────────────────────────────────────
   Tab label map
   ──────────────────────────────────────────── */
const TAB_LABELS: Record<string, string> = {
  "/admin": "工作台首页",
  "/admin/content": "内容管理",
  "/admin/review": "全站审核",
  "/admin/users": "用户管理",
  "/admin/orders": "订单管理",
  "/admin/reports": "违规举报",
  "/admin/logs": "操作日志",
  "/admin/operations": "运营看板",
  "/admin/billing": "商业配置",
  "/admin/commercial": "便民商业化",
  "/admin/pricing": "收费策略",
  "/admin/ads": "广告运营",
  "/admin/profile": "管理员中心",
  "/admin/resumes": "人才简历",
  "/admin/companies": "企业主体治理",
  "/admin/love": "相亲交友",
  "/admin/bianmin": "便民电话",
  "/admin/withdrawals": "提现结算",
  "/admin/dictionaries": "数据字典",
  "/admin/regions": "区域管理",
  "/admin/files": "文件资源",
  "/admin/community": "社区管理",
  "/admin/articles": "资讯管理",
  "/admin/events": "活动管理",
  "/admin/shops": "好店管理",
  "/admin/settings/site": "站点配置",
  "/admin/settings/features": "功能开关",
  "/admin/wechat/users": "微信粉丝",
  "/admin/wechat/settings": "微信配置",
  "/admin/system/health": "服务器监控",
  "/admin/system/cache": "缓存管理",
  "/admin/system/tasks": "定时任务",
};

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */
interface TabItem { path: string; label: string; }

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
  session?: { username?: string; role?: string } | null;
  pendingCounts?: { review?: number; reports?: number; orders?: number; };
  maxWidth?: string | number;
}

/* ────────────────────────────────────────────
   Mobile drawer menu definition
   ──────────────────────────────────────────── */
interface DrawerItem { label: string; href: string; icon: React.ElementType; badge?: number; }
interface DrawerGroup { group: string; icon: React.ElementType; items: DrawerItem[]; }

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */
export function AdminLayout({
  children, title, subtitle, actionButton, session, pendingCounts, maxWidth = "1440px",
}: AdminLayoutProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabs, setTabs] = useState<TabItem[]>([{ path: "/admin", label: "工作台首页" }]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_sidebar_collapsed");
      if (saved === "true") setSidebarCollapsed(true);
    } catch {}
  }, []);

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try { localStorage.setItem("admin_sidebar_collapsed", String(next)); } catch {}
  };

  useEffect(() => {
    const fullPath = pathname + window.location.search;
    const label = TAB_LABELS[pathname] || pathname.split("/").pop() || "页面";
    if (!tabs.some((t) => t.path === fullPath)) {
      setTabs((prev) => [...prev, { path: fullPath, label }]);
    }
  }, [pathname]);

  const closeTab = (e: React.MouseEvent, tabPath: string) => {
    e.preventDefault(); e.stopPropagation();
    if (tabs.length <= 1) return;
    const remaining = tabs.filter((t) => t.path !== tabPath);
    setTabs(remaining);
    const currentFull = pathname + window.location.search;
    if (currentFull === tabPath || pathname === tabPath) {
      window.location.href = remaining[remaining.length - 1].path;
    }
  };

  useEffect(() => { if (isMobile) setDrawerOpen(false); }, [pathname, isMobile]);

  /* ── Current page label ── */
  const pageLabel = TAB_LABELS[pathname] || title;

  /* ── Drawer groups (with lucide icons) ── */
  const drawerGroups: DrawerGroup[] = [
    {
      group: "内容运营",
      icon: ClipboardList,
      items: [
        { label: "跨模块内容", href: "/admin/content", icon: ClipboardList },
        { label: "全站审核", href: "/admin/review", icon: ShieldCheck, badge: pendingCounts?.review },
        { label: "运营看板", href: "/admin/operations", icon: BarChart3 },
        { label: "举报工单", href: "/admin/reports", icon: AlertOctagon, badge: pendingCounts?.reports },
      ],
    },
    {
      group: "房产招聘",
      icon: Briefcase,
      items: [
        { label: "房产楼市", href: "/admin/content?kind=house", icon: Home },
        { label: "招聘岗位", href: "/admin/content?kind=job", icon: Briefcase },
        { label: "企业主体", href: "/admin/companies", icon: Briefcase },
        { label: "人才简历", href: "/admin/resumes", icon: Users },
        { label: "相亲交友", href: "/admin/love", icon: Heart },
      ],
    },
    {
      group: "同城生活",
      icon: ShoppingBag,
      items: [
        { label: "口碑好店", href: "/admin/content?kind=shop", icon: ShoppingBag },
        { label: "便民生活", href: "/admin/content?kind=listing", icon: ClipboardList },
        { label: "同城活动", href: "/admin/content?kind=event", icon: CalendarDays },
        { label: "贴吧社区", href: "/admin/content?kind=post", icon: MessageSquare },
        { label: "本地资讯", href: "/admin/content?kind=article", icon: Newspaper },
        { label: "便民电话", href: "/admin/bianmin", icon: Phone },
      ],
    },
    {
      group: "商业财务",
      icon: DollarSign,
      items: [
        { label: "便民商业化", href: "/admin/commercial", icon: DollarSign },
        { label: "全部订单", href: "/admin/orders", icon: PackageCheck, badge: pendingCounts?.orders },
        { label: "收费策略", href: "/admin/pricing", icon: DollarSign },
        { label: "商业配置", href: "/admin/billing", icon: CreditCard },
        { label: "广告运营", href: "/admin/ads", icon: Megaphone },
        { label: "提现结算", href: "/admin/withdrawals", icon: DollarSign },
      ],
    },
    {
      group: "微信生态",
      icon: Smartphone,
      items: [
        { label: "微信粉丝", href: "/admin/wechat/users", icon: Smartphone },
        { label: "微信配置", href: "/admin/wechat/settings", icon: Settings },
      ],
    },
    {
      group: "系统设置",
      icon: Settings,
      items: [
        { label: "用户管理", href: "/admin/users", icon: Users },
        { label: "管理员", href: "/admin/profile", icon: ShieldCheck },
        { label: "站点配置", href: "/admin/settings/site", icon: Settings },
        { label: "功能开关", href: "/admin/settings/features", icon: ToggleLeft },
        { label: "文件资源", href: "/admin/files", icon: FolderOpen },
        { label: "服务器监控", href: "/admin/system/health", icon: Server },
        { label: "缓存管理", href: "/admin/system/cache", icon: Zap },
        { label: "操作日志", href: "/admin/logs", icon: ScrollText },
      ],
    },
  ];

  /* ════════════════════════════════════════════
     DESKTOP LAYOUT
     ════════════════════════════════════════════ */
  if (!isMobile) {
    const currentFull = pathname + (typeof window !== "undefined" ? window.location.search : "");
    return (
      <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "#F5F7FA" }}>
        <AdminSidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} pendingCounts={pendingCounts} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%", overflow: "hidden" }}>
          <AdminHeader collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} session={session} pendingAuditCount={pendingCounts?.review} />
          {/* Tab bar */}
          <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "5px 16px", display: "flex", alignItems: "center", gap: "4px", overflowX: "auto", flexShrink: 0, fontSize: "12px", userSelect: "none" }}>
            {tabs.map((tab) => {
              const isActive = currentFull === tab.path || pathname === tab.path;
              return (
                <div key={tab.path} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px", borderRadius: "6px", cursor: "pointer", flexShrink: 0, border: isActive ? "1px solid #bfdbfe" : "1px solid transparent", background: isActive ? "rgba(22,119,255,0.06)" : "transparent", color: isActive ? "#1677FF" : "#6b7280", fontWeight: isActive ? 500 : 400, transition: "all 0.15s ease" }} onClick={() => { window.location.href = tab.path; }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: isActive ? "#1677FF" : "transparent", flexShrink: 0 }} />
                  <span>{tab.label}</span>
                  {tabs.length > 1 && (
                    <button onClick={(e) => closeTab(e, tab.path)} style={{ background: "none", border: "none", cursor: "pointer", padding: "1px", borderRadius: "3px", color: "#9ca3af", display: "flex", alignItems: "center" }}><X size={12} /></button>
                  )}
                </div>
              );
            })}
          </div>
          {/* Content */}
          <main style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            <div style={{ maxWidth: maxWidth || "1440px", margin: "0 auto", paddingBottom: "48px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#111827", lineHeight: 1.3 }}>{title}</h1>
                  {subtitle && <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0 0", lineHeight: 1.5 }}>{subtitle}</p>}
                </div>
                {actionButton && <div style={{ flexShrink: 0 }}>{actionButton}</div>}
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════
     MOBILE LAYOUT — 参考UI设计语言全面重设计
     ════════════════════════════════════════════════════════════════ */
  const pendingReviewCount = pendingCounts?.review ?? 0;

  /* ── Mobile bottom nav tabs ── */
  const mobileNavItems = [
    { label: "工作台", href: "/admin", Icon: LayoutDashboard },
    { label: "内容", href: "/admin/content", Icon: ClipboardList },
    { label: "审核", href: "/admin/review", Icon: ShieldCheck, badge: pendingReviewCount },
    { label: "订单", href: "/admin/orders", Icon: PackageCheck },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F5F7FA", color: "#111827", paddingBottom: "64px" }}>
      {/* ── Mobile responsive CSS ── */}
      <style>{`
        .adm-m-grid-6 { grid-template-columns: repeat(3, 1fr) !important; }
        .admin-m-grid-4, .adm-m-2col { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
        .adm-m-main > .admin-m-grid-2 { grid-template-columns: 1fr !important; gap: 12px !important; }
        .adm-m-main .adm-chart-bars { height: 70px !important; }
        .adm-m-main .adm-chart-bars > div > span:first-child { font-size: 10px !important; }
        .adm-m-main .adm-chart-bars > div > span:last-child { font-size: 10px !important; }
        .admin-m-grid-channels { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 10px !important; }
        .adm-m-main > div[style*="grid-template-columns"]:not(.admin-m-grid-2) {
          grid-template-columns: 1fr 1fr !important; gap: 8px !important;
        }
        .adm-m-main table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .adm-m-main h1 { font-size: 16px !important; }
        .adm-m-main h3 { font-size: 13px !important; }
        .adm-m-main > div { margin-bottom: 10px !important; }
        .adm-m-main a[style*="padding: 18px"], .adm-m-main a[style*="padding: 20px"],
        .adm-m-main div[style*="padding: 18px"], .adm-m-main div[style*="padding: 20px"] {
          padding: 12px !important;
        }
        .adm-m-main div[style*="fontSize: \\"26px\\""],
        .adm-m-main div[style*="font-size: 26px"] { font-size: 20px !important; }
        .adm-m-main div[style*="gap: \\"16px\\""] { gap: 8px !important; }
        .adm-m-main div[style*="gap: \\"20px\\""] { gap: 10px !important; }
        .adm-m-main div[style*="marginBottom: \\"20px\\""] { margin-bottom: 10px !important; }
        .adm-drawer-mask { animation: adm-fadeIn 0.2s ease; }
        .adm-drawer-panel { animation: adm-slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes adm-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes adm-slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>

      {/* ════════════════════════
         Mobile Header — 白色专业风格
         ════════════════════════ */}
      <header style={{
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 16px",
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        {/* Left: logo + page title */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <Link href="/admin" style={{ textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "8px",
              background: "#1677FF", display: "flex", alignItems: "center",
              justifyContent: "center", color: "white", fontWeight: 700,
              fontSize: "14px",
            }}>杨</div>
          </Link>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: "15px", fontWeight: 700, color: "#111827",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              lineHeight: 1.3,
            }}>{pageLabel}</div>
            {pathname === "/admin" && (
              <div style={{ fontSize: "10px", color: "#9ca3af", lineHeight: 1.2 }}>杨林生活网 · 运营中心</div>
            )}
          </div>
        </div>

        {/* Right: pending badge + avatar + frontend link */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {/* Pending review quick entry */}
          {pendingReviewCount > 0 && (
            <Link href="/admin/review" style={{
              display: "flex", alignItems: "center", gap: "4px",
              padding: "4px 10px", borderRadius: "14px",
              background: "#FFF7ED", border: "1px solid #FED7AA",
              textDecoration: "none", fontSize: "11px", fontWeight: 600,
              color: "#C2410C",
            }}>
              <ShieldCheck size={13} />
              <span>{pendingReviewCount}</span>
            </Link>
          )}

          {/* Frontend link */}
          <a href="/" target="_blank" rel="noreferrer" style={{
            width: "30px", height: "30px", borderRadius: "8px",
            background: "#F0FDF4", border: "1px solid #BBF7D0",
            display: "flex", alignItems: "center", justifyContent: "center",
            textDecoration: "none",
          }}>
            <ExternalLink size={14} style={{ color: "#15803d" }} />
          </a>

          {/* User avatar */}
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px",
            background: "#EFF6FF", border: "1px solid #BFDBFE",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: 700, color: "#1677FF",
          }}>
            {(session?.username || "A").charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* ════════════════════════
         Mobile Content Area
         ════════════════════════ */}
      <main className="adm-m-main" style={{
        padding: "12px 12px 0",
        maxWidth: "520px",
        margin: "0 auto",
        boxSizing: "border-box",
      }}>
        {children}
      </main>

      {/* ════════════════════════
         Mobile Bottom Nav — lucide 图标 + #1677FF 主色
         ════════════════════════ */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
        background: "#ffffff", borderTop: "1px solid #E5E7EB",
        display: "flex", alignItems: "stretch", height: "56px",
        boxShadow: "0 -1px 6px rgba(0,0,0,0.04)",
      }}>
        {mobileNavItems.map((item) => {
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} prefetch={false} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              textDecoration: "none", gap: "3px", position: "relative",
              color: isActive ? "#1677FF" : "#9CA3AF",
              transition: "color 0.15s ease",
            }}>
              <div style={{ position: "relative" }}>
                <item.Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                {/* Badge */}
                {(item.badge ?? 0) > 0 && (
                  <span style={{
                    position: "absolute", top: "-4px", right: "-8px",
                    minWidth: "16px", height: "16px", borderRadius: "8px",
                    background: "#EF4444", color: "white", fontSize: "9px",
                    fontWeight: 700, display: "flex", alignItems: "center",
                    justifyContent: "center", padding: "0 4px", lineHeight: 1,
                  }}>{item.badge}</span>
                )}
              </div>
              <span style={{ fontSize: "10px", fontWeight: isActive ? 600 : 400, letterSpacing: "0.2px" }}>
                {item.label}
              </span>
              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position: "absolute", top: "0px", left: "50%", transform: "translateX(-50%)",
                  width: "20px", height: "2px", borderRadius: "1px", background: "#1677FF",
                }} />
              )}
            </Link>
          );
        })}

        {/* More button → open drawer */}
        <button onClick={() => setDrawerOpen(true)} style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "none", border: "none", gap: "3px",
          color: drawerOpen ? "#1677FF" : "#9CA3AF",
          cursor: "pointer", position: "relative",
          transition: "color 0.15s ease",
        }}>
          <Menu size={20} strokeWidth={1.8} />
          <span style={{ fontSize: "10px", fontWeight: drawerOpen ? 600 : 400, letterSpacing: "0.2px" }}>更多</span>
          {drawerOpen && (
            <div style={{
              position: "absolute", top: "0px", left: "50%", transform: "translateX(-50%)",
              width: "20px", height: "2px", borderRadius: "1px", background: "#1677FF",
            }} />
          )}
        </button>
      </nav>

      {/* ════════════════════════
         Mobile Drawer — 参考UI设计语言
         ════════════════════════ */}
      {drawerOpen && (
        <div className="adm-drawer-mask" style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(0, 0, 0, 0.45)",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
        }} onClick={() => setDrawerOpen(false)}>
          <div className="adm-drawer-panel" style={{
            background: "#ffffff",
            borderTopLeftRadius: "20px", borderTopRightRadius: "20px",
            maxHeight: "82vh", overflowY: "auto",
            boxShadow: "0 -8px 30px rgba(0,0,0,0.12)",
          }} onClick={(e) => e.stopPropagation()}>

            {/* ── Drawer header (dark, matching sidebar) ── */}
            <div style={{
              background: "#001529",
              borderTopLeftRadius: "20px", borderTopRightRadius: "20px",
              padding: "16px 20px 14px",
            }}>
              {/* Drag handle */}
              <div style={{ width: "32px", height: "3px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", margin: "0 auto 14px" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px", background: "#1677FF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 700, fontSize: "14px",
                  }}>杨</div>
                  <div>
                    <div style={{ color: "white", fontWeight: 600, fontSize: "14px", lineHeight: 1.3 }}>全部功能</div>
                    <div style={{ color: "rgba(22,119,255,0.7)", fontSize: "10px", lineHeight: 1.2 }}>
                      {session?.username || "管理员"} · {session?.role || "ADMIN"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <a href="/" target="_blank" rel="noreferrer" style={{
                    padding: "6px 12px", borderRadius: "6px",
                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                    color: "white", textDecoration: "none", fontSize: "11px", fontWeight: 500,
                    display: "flex", alignItems: "center", gap: "4px",
                  }}>
                    <ExternalLink size={12} />
                    <span>前台</span>
                  </a>
                  <button onClick={() => {
                    fetch("/api/auth/logout", { method: "POST" }).then(() => { location.href = "/admin/login"; });
                  }} style={{
                    padding: "6px 12px", borderRadius: "6px",
                    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                    color: "#FCA5A5", fontSize: "11px", fontWeight: 500, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "4px",
                  }}>
                    <LogOut size={12} />
                    <span>退出</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Drawer menu groups ── */}
            <div style={{ padding: "12px 16px 28px" }}>
              {drawerGroups.map((grp, gIdx) => {
                const GrpIcon = grp.icon;
                return (
                  <div key={gIdx} style={{ marginBottom: "16px" }}>
                    {/* Group header */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "0 2px 8px", borderBottom: "1px solid #F3F4F6",
                      marginBottom: "10px",
                    }}>
                      <GrpIcon size={13} style={{ color: "#1677FF" }} />
                      <span style={{
                        fontSize: "12px", fontWeight: 700, color: "#374151",
                        letterSpacing: "0.3px",
                      }}>{grp.group}</span>
                    </div>

                    {/* Items grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                      {grp.items.map((item) => {
                        const ItemIcon = item.icon;
                        const Tag = item.href.includes("?") ? "a" : Link;
                        const fullHref = item.href;
                        const isActive = pathname === item.href || (item.href.includes("?") && (pathname + window.location.search) === item.href);

                        return (
                          <Tag key={fullHref + item.label} href={fullHref}
                            onClick={() => setDrawerOpen(false)}
                            style={{
                              display: "flex", flexDirection: "column",
                              alignItems: "center", gap: "5px",
                              padding: "12px 4px 10px", borderRadius: "10px",
                              textDecoration: "none",
                              background: isActive ? "#EFF6FF" : "#F9FAFB",
                              border: isActive ? "1px solid #BFDBFE" : "1px solid #F3F4F6",
                              transition: "all 0.12s ease",
                              position: "relative",
                            }}>
                            {/* Icon circle */}
                            <div style={{
                              width: "32px", height: "32px", borderRadius: "8px",
                              background: isActive ? "#DBEAFE" : "#F3F4F6",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <ItemIcon size={16} style={{ color: isActive ? "#1677FF" : "#6B7280" }} />
                            </div>

                            {/* Label */}
                            <span style={{
                              fontSize: "11px", fontWeight: isActive ? 600 : 500,
                              color: isActive ? "#1677FF" : "#374151",
                              textAlign: "center", lineHeight: 1.2,
                            }}>{item.label}</span>

                            {/* Badge */}
                            {(item.badge ?? 0) > 0 && (
                              <span style={{
                                position: "absolute", top: "4px", right: "4px",
                                minWidth: "16px", height: "16px", borderRadius: "8px",
                                background: "#EF4444", color: "white", fontSize: "9px",
                                fontWeight: 700, display: "flex", alignItems: "center",
                                justifyContent: "center", padding: "0 4px", lineHeight: 1,
                              }}>{item.badge}</span>
                            )}
                          </Tag>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Version footer */}
              <div style={{
                textAlign: "center", fontSize: "10px", color: "#D1D5DB",
                paddingTop: "12px", borderTop: "1px solid #F3F4F6",
              }}>
                杨林生活网 · 全业务运营管理中心 · v4.1
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
