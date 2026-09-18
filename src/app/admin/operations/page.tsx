import { headers } from "next/headers";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

// 搜索耗时性能等级颜色指示器
function getSearchPerf(ms: number): { color: string; bg: string; label: string } {
  if (ms < 300) return { color: "#52C41A", bg: "#F6FFED", label: "快速" };
  if (ms <= 800) return { color: "#FAAD14", bg: "#FFFBE6", label: "一般" };
  return { color: "#FF4D4F", bg: "#FFF2F0", label: "⚠ 慢" };
}

export default async function OperationsDashboardPage() {
  const reqHeaders = await headers();
  const req = new Request("http://localhost/admin/operations", {
    headers: reqHeaders,
  });
  const session = await getSession(req);

  const isServerAdmin = session && ["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase());
  if (!isServerAdmin) {
    return (
      <AdminLayout title="⛔ 403 权限被拒绝" subtitle="运营管理后台仅供平台管理员与运营人员访问，普通用户无权调取。">
        <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <h2>⛔ 权限不足</h2>
          <p style={{ color: "#64748b" }}>您当前登录的账号无权访问运营控制台大厅。</p>
          <a href="/" className="button button-primary" style={{ marginTop: "1rem", display: "inline-block", background: "#0B7A75", borderColor: "#0B7A75" }}>
            返回首页
          </a>
        </div>
      </AdminLayout>
    );
  }

  // Aggregate Real Live Database Metrics
  const [totalUsers, totalJobs, totalHouses, totalListings, totalShops, totalEvents, totalDating, totalPosts, totalArticles, pendingReports, searchLogsCount, recentSearchLogs] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.house.count(),
    prisma.listing.count(),
    prisma.shop.count(),
    prisma.event.count(),
    prisma.datingProfile.count(),
    prisma.post.count(),
    prisma.article.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.searchLog.count(),
    prisma.searchLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const totalContent = totalJobs + totalHouses + totalListings + totalShops + totalEvents + totalDating + totalPosts + totalArticles;

  return (
    <AdminLayout
      title="📈 全站运营看板与搜索审计"
      subtitle="监控全站注册用户、8 大模块便民内容分布与搜索耗时审计日志。点击任意卡片即可跳转。"
      actionButton={
        <Link href="/admin/content" style={{ background: "#0B7A75", color: "white", textDecoration: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          进入统一内容大厅 →
        </Link>
      }
    >
      {/* 移动端响应式样式 */}
      <style>{`
        @media (max-width: 768px) {
          .adm-m-main .ops-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 12px !important;
          }
          .ops-kpi-grid > a {
            padding: 14px 12px !important;
            border-radius: 12px !important;
          }
          .ops-kpi-grid > a > div:first-child {
            font-size: 20px !important;
          }
          .ops-kpi-grid > a > div:last-child {
            font-size: 11px !important;
          }
          .adm-m-main .ops-main-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .ops-main-grid > div {
            padding: 14px !important;
            border-radius: 12px !important;
          }
          .adm-m-main .ops-mobile-header {
            display: block !important;
          }
          .ops-module-en {
            display: none !important;
          }
          .ops-section-title {
            font-size: 14px !important;
          }
          .ops-module-row {
            padding: 10px 12px !important;
          }
          .ops-module-row span:first-child {
            font-size: 13px !important;
          }
          .ops-module-row b {
            font-size: 12px !important;
          }
        }
      `}</style>

      {/* 移动端页面标题（桌面端由 AdminLayout 的 title/subtitle 属性渲染） */}
      <div className="ops-mobile-header" style={{ display: "none", marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#111827" }}>📈 运营数据看板</h2>
            <p style={{ fontSize: "11px", color: "#9CA3AF", margin: "3px 0 0 0", lineHeight: 1.4 }}>用户 · 内容 · 搜索审计一览</p>
          </div>
          <Link href="/admin/content" style={{ background: "#1677FF", color: "white", textDecoration: "none", padding: "6px 14px", borderRadius: "8px", fontWeight: 600, fontSize: "12px", whiteSpace: "nowrap", flexShrink: 0 }}>
            内容大厅 →
          </Link>
        </div>
      </div>

      {/* 6 KPI 核心指标卡片（全部支持点击跳转） */}
      <div className="ops-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
        <Link href="/admin/users" style={{ textDecoration: "none", background: "white", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", transition: "all 0.15s" }}>
          <div style={{ fontSize: "22px", fontWeight: "900", color: "#0369a1" }}>{totalUsers}</div>
          <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px", fontWeight: "700" }}>👥 全站注册用户 →</div>
        </Link>
        <Link href="/admin/content" style={{ textDecoration: "none", background: "white", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", transition: "all 0.15s" }}>
          <div style={{ fontSize: "22px", fontWeight: "900", color: "#15803d" }}>{totalContent}</div>
          <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px", fontWeight: "700" }}>📦 便民内容总量 →</div>
        </Link>
        <Link href="/admin/logs" style={{ textDecoration: "none", background: "white", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", transition: "all 0.15s" }}>
          <div style={{ fontSize: "22px", fontWeight: "900", color: "#7e22ce" }}>{searchLogsCount}</div>
          <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px", fontWeight: "700" }}>🔍 搜索审计日志 →</div>
        </Link>
        <Link href="/admin/reports" style={{ textDecoration: "none", background: "white", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", transition: "all 0.15s" }}>
          <div style={{ fontSize: "22px", fontWeight: "900", color: "#b91c1c" }}>{pendingReports}</div>
          <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px", fontWeight: "700" }}>⚠️ 待处理举报 →</div>
        </Link>
        <Link href="/admin/content?kind=job" style={{ textDecoration: "none", background: "white", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", transition: "all 0.15s" }}>
          <div style={{ fontSize: "22px", fontWeight: "900", color: "#4338ca" }}>{totalJobs + totalHouses}</div>
          <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px", fontWeight: "700" }}>💼 招聘与房产总量 →</div>
        </Link>
        <Link href="/admin/love" style={{ textDecoration: "none", background: "white", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", transition: "all 0.15s" }}>
          <div style={{ fontSize: "22px", fontWeight: "900", color: "#be185d" }}>{totalDating + totalEvents}</div>
          <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px", fontWeight: "700" }}>💌 相亲与同城活动 →</div>
        </Link>
      </div>

      <div className="ops-main-grid admin-m-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem" }}>
        {/* Left Column: Breakdown by Module */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <h3 className="ops-section-title" style={{ fontSize: "1.1rem", fontWeight: "800", marginTop: 0, marginBottom: "1rem", color: "#0f172a" }}>
            📊 8 大核心业务板块数据分布与直达
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { cn: "💼 求职招聘", en: "Jobs", count: totalJobs, href: "/admin/content?kind=job", color: "#0369a1" },
              { cn: "🏠 房产楼市", en: "Houses", count: totalHouses, href: "/admin/content?kind=house", color: "#15803d" },
              { cn: "🏪 口碑好店", en: "Shops", count: totalShops, href: "/admin/content?kind=shop", color: "#b45309" },
              { cn: "📋 便民分类", en: "Listings", count: totalListings, href: "/admin/content?kind=listing", color: "#475569" },
              { cn: "💬 贴吧社区", en: "Posts", count: totalPosts, href: "/admin/content?kind=post", color: "#7e22ce" },
              { cn: "💌 相亲交友", en: "Dating", count: totalDating, href: "/admin/love", color: "#be185d" },
              { cn: "📰 新闻资讯", en: "Articles", count: totalArticles, href: "/admin/content?kind=article", color: "#0f766e" },
              { cn: "🎉 同城活动", en: "Events", count: totalEvents, href: "/admin/content?kind=event", color: "#c2410c" },
            ].map((m) => (
              <Link
                key={m.cn}
                href={m.href}
                className="ops-module-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
              >
                <span style={{ color: "#334155", fontWeight: "700", fontSize: "13.5px" }}>
                  {m.cn}<span className="ops-module-en" style={{ color: "#94a3b8", fontWeight: 400, fontSize: "12px" }}> ({m.en})</span>
                </span>
                <b style={{ color: m.color, fontSize: "14px", whiteSpace: "nowrap" }}>{m.count} 条 →</b>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Search Audit Logs */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0, color: "#0f172a" }}>
              🔍 实时搜索审计流
            </h3>
            <Link href="/admin/logs" style={{ fontSize: "12px", color: "#0B7A75", fontWeight: "700", textDecoration: "none" }}>
              明细 →
            </Link>
          </div>

          {recentSearchLogs.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "13px" }}>暂无搜索审计日志</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {recentSearchLogs.map((log) => {
                const perf = getSearchPerf(log.durationMs ?? 0);
                return (
                  <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "9px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontWeight: "bold", color: "#0f172a" }}>&quot;{log.keyword}&quot;</span>
                      <span style={{ color: "#94a3b8", marginLeft: "6px" }}>({log.resultCount}条)</span>
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: perf.bg, color: perf.color, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, marginLeft: "8px" }}>
                      {perf.label} {log.durationMs}ms
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
