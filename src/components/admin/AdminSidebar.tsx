"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Briefcase,
  Home,
  Heart,
  ShoppingBag,
  PackageCheck,
  Newspaper,
  Megaphone,
  AlertOctagon,
  BarChart3,
  Settings,
  Star,
  Search,
  ChevronRight,
  ChevronDown,
  Phone,
  MessageSquare,
  CalendarDays,
  ClipboardList,
  DollarSign,
  CreditCard,
  FileText,
  Server,
  Zap,
  ScrollText,
  Map,
  BookOpen,
  Smartphone,
  ToggleLeft,
  FolderOpen,
  ArrowDownToLine,
  Factory,
} from "lucide-react";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */
interface SubItem {
  id: string;
  label: string;
  href: string;
  badge?: number;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  badge?: number;
  badgeColor?: string;
  subItems?: SubItem[];
}

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  pendingCounts?: {
    review?: number;
    reports?: number;
    orders?: number;
  };
}

/* ────────────────────────────────────────────
   Sidebar Component
   ──────────────────────────────────────────── */
export function AdminSidebar({ collapsed, onToggleCollapse, pendingCounts }: AdminSidebarProps) {
  const pathname = usePathname();
  const [fullPath, setFullPath] = useState(pathname);
  const [menuSearch, setMenuSearch] = useState("");
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({
    content_domain: true,
    users_domain: true,
  });
  const [favoriteMenus, setFavoriteMenus] = useState<string[]>([]);

  // Sync full path with query string
  useEffect(() => {
    setFullPath(pathname + window.location.search);
  }, [pathname]);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_sidebar_favs");
      if (saved) setFavoriteMenus(JSON.parse(saved));
    } catch {}
  }, []);

  const saveFavorites = useCallback((favs: string[]) => {
    setFavoriteMenus(favs);
    try { localStorage.setItem("admin_sidebar_favs", JSON.stringify(favs)); } catch {}
  }, []);

  /* ── 统一管理系统 9 大业务领域菜单规范 ── */
  const menuList: MenuItem[] = [
    {
      id: "dashboard",
      label: "【概览】工作台",
      icon: LayoutDashboard,
      href: "/admin",
    },
    {
      id: "users_domain",
      label: "【用户与企业】",
      icon: Users,
      subItems: [
        { id: "users", label: "会员用户管理", href: "/admin/users" },
        { id: "job_companies", label: "🏢 招聘企业主体", href: "/admin/companies" },
        { id: "organizations", label: "组织治理中心", href: "/admin/organizations" },
        { id: "resumes", label: "人才简历库", href: "/admin/resumes" },
        { id: "profile", label: "角色与管理员", href: "/admin/profile" },
      ],
    },
    {
      id: "content_domain",
      label: "【内容管理】",
      icon: ClipboardList,
      subItems: [
        { id: "info_mgmt", label: "便民分类管理", href: "/admin/info" },
        { id: "job_list", label: "招聘岗位管理", href: "/admin/content?kind=job" },
        { id: "house_list", label: "房产楼市管理", href: "/admin/content?kind=house" },
        { id: "industrial_all", label: "园区招商物业", href: "/admin/industrial" },
        { id: "posts", label: "贴吧社区管理", href: "/admin/content?kind=post" },
        { id: "events", label: "同城活动管理", href: "/admin/content?kind=event" },
        { id: "love", label: "相亲交友管理", href: "/admin/love" },
        { id: "articles", label: "本地资讯管理", href: "/admin/content?kind=article" },
        { id: "shops", label: "口碑好店管理", href: "/admin/content?kind=shop" },
        { id: "bianmin", label: "便民电话管理", href: "/admin/bianmin" },
        { id: "content_all", label: "跨模块内容总表", href: "/admin/content" },
      ],
    },
    {
      id: "mall_domain",
      label: "【商城与订单】",
      icon: PackageCheck,
      badge: pendingCounts?.orders,
      badgeColor: "#3b82f6",
      subItems: [
        { id: "orders", label: "全部订单管理", href: "/admin/orders", badge: pendingCounts?.orders },
        { id: "mall_dashboard", label: "便利店经营大盘", href: "/admin/mall" },
        { id: "mall_orders", label: "便利店订单", href: "/admin/mall/orders" },
        { id: "mall_products", label: "商品与库存", href: "/admin/mall/products" },
        { id: "mall_categories", label: "商品分类管理", href: "/admin/mall/categories" },
        { id: "mall_delivery", label: "配送与骑手", href: "/admin/mall/delivery" },
        { id: "mall_zones", label: "配送网格与运费", href: "/admin/mall/zones" },
        { id: "mall_aftersales", label: "售后退款处理", href: "/admin/mall/aftersales" },
      ],
    },
    {
      id: "review_domain",
      label: "【审核治理】",
      icon: ShieldCheck,
      badge: (pendingCounts?.review ?? 0) + (pendingCounts?.reports ?? 0) > 0 ? (pendingCounts?.review ?? 0) + (pendingCounts?.reports ?? 0) : undefined,
      badgeColor: "#ef4444",
      subItems: [
        { id: "review", label: "全站审核队列", href: "/admin/review", badge: pendingCounts?.review },
        { id: "reports", label: "违规举报工单", href: "/admin/reports", badge: pendingCounts?.reports },
        { id: "risk_monitor", label: "风控预警与仲裁", href: "/admin/risk" },
      ],
    },
    {
      id: "finance_domain",
      label: "【财务中心】",
      icon: DollarSign,
      subItems: [
        { id: "pricing", label: "收费策略定价", href: "/admin/pricing" },
        { id: "billing", label: "商业配置中心", href: "/admin/billing" },
        { id: "commercial_info", label: "便民商业化运营", href: "/admin/commercial" },
        { id: "withdrawals", label: "提现结算申请", href: "/admin/withdrawals" },
        { id: "finance", label: "财务对账中心", href: "/admin/finance" },
      ],
    },
    {
      id: "ai_domain",
      label: "【AI与自动化】",
      icon: Zap,
      subItems: [
        { id: "ai_settings", label: "🤖 AI 模型与用量", href: "/admin/settings/ai" },
        { id: "workflows", label: "🔄 自动化工作流", href: "/admin/workflows" },
      ],
    },
    {
      id: "operations_domain",
      label: "【运营与增长】",
      icon: BarChart3,
      subItems: [
        { id: "operations", label: "运营数据看板", href: "/admin/operations" },
        { id: "operations_opportunities", label: "🎯 运营商机与缺口", href: "/admin/operations/opportunities" },
        { id: "ads", label: "广告排期运营", href: "/admin/ads" },
        { id: "wechat_overview", label: "微信公众号概览", href: "/admin/wechat/overview" },
        { id: "wechat_menu", label: "微信自定义菜单", href: "/admin/wechat/menu" },
        { id: "wechat_reply", label: "微信自动回复", href: "/admin/wechat/reply" },
        { id: "wechat_welcome_flows", label: "微信欢迎流程", href: "/admin/wechat/welcome-flows" },
        { id: "wechat_users", label: "微信粉丝管理", href: "/admin/wechat/users" },
        { id: "wechat_leads", label: "微信商业线索", href: "/admin/wechat/leads" },
        { id: "wechat_settings", label: "微信公众号配置", href: "/admin/wechat/settings" },
        { id: "insights", label: "📊 本地商业洞察", href: "/admin/insights" },
      ],
    },
    {
      id: "system_domain",
      label: "【系统设置】",
      icon: Settings,
      subItems: [
        { id: "site_settings", label: "站点基础配置", href: "/admin/settings/site" },
        { id: "features", label: "全站功能开关", href: "/admin/settings/features" },
        { id: "dictionaries", label: "数据字典配置", href: "/admin/dictionaries" },
        { id: "regions", label: "区域网格管理", href: "/admin/regions" },
        { id: "files", label: "文件存储资源", href: "/admin/files" },
        { id: "knowledge", label: "📚 平台知识库", href: "/admin/knowledge" },
        { id: "health", label: "服务器健康监控", href: "/admin/system/health" },
        { id: "cache", label: "系统缓存治理", href: "/admin/system/cache" },
        { id: "logs", label: "管理员操作日志", href: "/admin/logs" },
      ],
    },
  ];

  /* ── Helpers ── */
  const isHrefActive = (href: string): boolean => {
    if (href.includes("?")) return fullPath === href;
    if (pathname === href) return fullPath === href;
    return href !== "/admin" && pathname.startsWith(`${href}/`);
  };

  const isMenuActive = (menu: MenuItem): boolean => {
    if (menu.href && isHrefActive(menu.href)) return true;
    if (menu.subItems) return menu.subItems.some((s) => isHrefActive(s.href));
    return false;
  };

  const isSubActive = (href: string): boolean => isHrefActive(href);

  const toggleParent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = favoriteMenus.includes(id) ? favoriteMenus.filter((f) => f !== id) : [...favoriteMenus, id];
    saveFavorites(next);
  };

  const filteredMenus = menuList.filter(
    (m) =>
      m.label.toLowerCase().includes(menuSearch.toLowerCase()) ||
      m.subItems?.some((s) => s.label.toLowerCase().includes(menuSearch.toLowerCase()))
  );

  /* ── Styles ── */
  const S = {
    aside: {
      background: "#001529",
      color: "#a6adb4",
      display: "flex",
      flexDirection: "column" as const,
      transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      width: collapsed ? "64px" : "220px",
      minHeight: "100vh",
      flexShrink: 0,
      zIndex: 20,
      userSelect: "none" as const,
      overflow: "hidden",
    },
    brandWrap: {
      height: "56px",
      padding: collapsed ? "0 12px" : "0 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: collapsed ? "center" : "flex-start",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      gap: "10px",
      flexShrink: 0,
    },
    logo: {
      width: "32px",
      height: "32px",
      borderRadius: "8px",
      background: "#1677FF",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: "bold" as const,
      fontSize: "15px",
      flexShrink: 0,
    },
    searchWrap: {
      padding: "10px 12px",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      flexShrink: 0,
    },
    searchInput: {
      width: "100%",
      background: "#000c17",
      color: "#a6adb4",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "6px",
      padding: "6px 8px 6px 30px",
      fontSize: "12px",
      outline: "none",
      boxSizing: "border-box" as const,
    },
    menuArea: {
      flex: 1,
      overflowY: "auto" as const,
      padding: "8px",
      scrollbarWidth: "thin" as const,
      scrollbarColor: "rgba(255, 255, 255, 0.18) transparent",
    },
    footer: {
      padding: "10px 12px",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      background: "#000c17",
      fontSize: "10px",
      color: "#4b5563",
      flexShrink: 0,
    },
  };

  return (
    <aside style={S.aside}>
      <style>{`
        .admin-sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
        }
        .admin-sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .admin-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .admin-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 4px;
        }
        .admin-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.35);
        }
      `}</style>
      {/* ── Brand Header ── */}
      <div style={S.brandWrap}>
        <div style={S.logo}>杨</div>
        {!collapsed && (
          <div style={{ overflow: "hidden", minWidth: 0 }}>
            <div style={{ color: "white", fontWeight: 600, fontSize: "13.5px", lineHeight: 1.3, letterSpacing: "0.3px", whiteSpace: "nowrap" }}>杨林生活网</div>
            <div style={{ fontSize: "10px", color: "rgba(22,119,255,0.7)", fontWeight: 300, whiteSpace: "nowrap" }}>全业务运营管理中心</div>
          </div>
        )}
      </div>

      {/* ── Menu Search ── */}
      {!collapsed && (
        <div style={S.searchWrap}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="搜索功能菜单..."
              style={S.searchInput}
            />
            <Search
              size={13}
              style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "#4b5563", pointerEvents: "none" }}
            />
          </div>
        </div>
      )}

      {/* ── Menu Navigation ── */}
      <div style={S.menuArea} className="admin-sidebar-scroll">
        {filteredMenus.map((menu) => {
          const Icon = menu.icon;
          const active = isMenuActive(menu);
          // The group containing the current route must remain open after navigation/remount.
          const expanded = Boolean(expandedParents[menu.id] || active);
          const isFav = favoriteMenus.includes(menu.id);
          const hasChildren = !!menu.subItems;
          const menuHref = menu.href;

          // For items with href (no sub-items), render as Link
          const MenuTag = menuHref && !hasChildren ? Link : "div";
          const menuProps = menuHref && !hasChildren ? { href: menuHref } : {};

          return (
            <div key={menu.id} style={{ marginBottom: "2px" }}>
              {/* Parent menu item */}
              <MenuTag
                {...(menuProps as any)}
                onClick={() => {
                  if (hasChildren) {
                    setExpandedParents((prev) => ({ ...prev, [menu.id]: !prev[menu.id] }));
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "space-between",
                  padding: collapsed ? "10px 0" : "9px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: active ? 500 : 400,
                  background: active && !hasChildren ? "#1677FF" : "transparent",
                  color: active && !hasChildren ? "white" : "#a6adb4",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                title={collapsed ? menu.label : undefined}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden", minWidth: 0 }}>
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{menu.label}</span>}
                </div>

                {!collapsed && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                    {/* Badge */}
                    {menu.badge != null && menu.badge > 0 && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: "10px",
                          background: menu.badgeColor || "#ef4444",
                          color: "white",
                          lineHeight: "16px",
                        }}
                      >
                        {menu.badge}
                      </span>
                    )}

                    {/* Star favorite */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(menu.id, e)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "2px",
                        cursor: "pointer",
                        color: isFav ? "#facc15" : "transparent",
                        transition: "color 0.15s",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => { if (!isFav) (e.currentTarget.style.color = "#6b7280"); }}
                      onMouseLeave={(e) => { if (!isFav) (e.currentTarget.style.color = "transparent"); }}
                      title={isFav ? "已收藏" : "收藏"}
                    >
                      <Star size={12} fill={isFav ? "#facc15" : "none"} />
                    </button>

                    {/* Expand chevron */}
                    {hasChildren && (
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                    )}
                  </div>
                )}
              </MenuTag>

              {/* Sub-items */}
              {!collapsed && hasChildren && expanded && menu.subItems && (
                <div style={{ marginLeft: "16px", paddingLeft: "12px", borderLeft: "1px solid rgba(255,255,255,0.06)", marginTop: "2px", marginBottom: "4px" }}>
                  {menu.subItems.map((sub) => {
                    const subActive = isSubActive(sub.href);
                    const SubTag = sub.href.includes("?") ? "a" : Link;
                    return (
                      <SubTag
                        key={sub.id}
                        href={sub.href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "7px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: subActive ? 500 : 400,
                          color: subActive ? "white" : "#6b7280",
                          background: subActive ? "rgba(22,119,255,0.35)" : "transparent",
                          textDecoration: "none",
                          transition: "all 0.12s ease",
                          cursor: "pointer",
                        }}
                      >
                        <span>{sub.label}</span>
                        {sub.badge != null && sub.badge > 0 && (
                          <span style={{ fontSize: "9px", background: "#ef4444", color: "white", padding: "1px 5px", borderRadius: "8px" }}>
                            {sub.badge}
                          </span>
                        )}
                      </SubTag>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div style={S.footer}>
        {!collapsed ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>系统版本</span>
              <span style={{ color: "#6b7280", fontFamily: "monospace" }}>v4.1 PROD</span>
            </div>
            <div style={{ marginTop: "3px", color: "#4b5563" }}>嵩明县 · 杨林运营中心</div>
          </div>
        ) : (
          <div style={{ textAlign: "center", fontFamily: "monospace", color: "#4b5563" }}>v4</div>
        )}
      </div>
    </aside>
  );
}
