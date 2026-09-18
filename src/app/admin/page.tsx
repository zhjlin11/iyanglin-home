import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ChartCard } from "@/components/admin/ChartCard";
import { getConversionFunnel } from "@/lib/analytics-service";

export const dynamic = "force-dynamic";

// 操作日志 action code → 中文显示名称映射
function mapLogAction(action: string): { label: string; module: string } {
  const dict: Record<string, { label: string; module: string }> = {
    review_shop_offline: { label: "下架商家", module: "口碑好店" },
    review_shop_approved: { label: "审核通过商家", module: "口碑好店" },
    create_shop: { label: "创建商家", module: "口碑好店" },
    update_shop: { label: "编辑商家", module: "口碑好店" },
    delete_shop: { label: "删除商家", module: "口碑好店" },
    review_job_approved: { label: "审核通过招聘", module: "求职招聘" },
    review_job_offline: { label: "下架招聘", module: "求职招聘" },
    create_job: { label: "创建招聘", module: "求职招聘" },
    update_job: { label: "编辑招聘", module: "求职招聘" },
    delete_job: { label: "删除招聘", module: "求职招聘" },
    review_house_approved: { label: "审核通过房源", module: "房产楼市" },
    review_house_offline: { label: "下架房源", module: "房产楼市" },
    create_house: { label: "创建房源", module: "房产楼市" },
    delete_house: { label: "删除房源", module: "房产楼市" },
    review_listing_approved: { label: "审核通过信息", module: "便民生活" },
    review_listing_offline: { label: "下架信息", module: "便民生活" },
    create_listing: { label: "创建信息", module: "便民生活" },
    delete_listing: { label: "删除信息", module: "便民生活" },
    review_event_approved: { label: "审核通过活动", module: "同城活动" },
    review_event_offline: { label: "下架活动", module: "同城活动" },
    create_event: { label: "创建活动", module: "同城活动" },
    delete_event: { label: "删除活动", module: "同城活动" },
    review_post_approved: { label: "审核通过帖子", module: "贴吧社区" },
    review_post_offline: { label: "下架帖子", module: "贴吧社区" },
    create_post: { label: "发布帖子", module: "贴吧社区" },
    delete_post: { label: "删除帖子", module: "贴吧社区" },
    review_dating_approved: { label: "审核通过资料", module: "相亲交友" },
    review_dating_offline: { label: "下架资料", module: "相亲交友" },
    review_article_approved: { label: "审核通过资讯", module: "本地资讯" },
    review_article_offline: { label: "下架资讯", module: "本地资讯" },
    create_article: { label: "发布资讯", module: "本地资讯" },
    delete_article: { label: "删除资讯", module: "本地资讯" },
    admin_login: { label: "管理员登录", module: "系统" },
    update_settings: { label: "更新设置", module: "系统" },
  };
  if (dict[action]) return dict[action];
  // 智能回退：从 action 字符串推断
  const typeNames: Record<string, string> = { shop: "商家", job: "招聘", house: "房源", listing: "信息", event: "活动", post: "帖子", dating: "交友", article: "资讯", user: "用户", order: "订单" };
  const verbNames: Record<string, string> = { create: "创建", update: "编辑", delete: "删除", review: "审核", approve: "通过", offline: "下架", online: "上架" };
  const moduleNames: Record<string, string> = { shop: "口碑好店", job: "求职招聘", house: "房产楼市", listing: "便民生活", event: "同城活动", post: "贴吧社区", dating: "相亲交友", article: "本地资讯" };
  const parts = action.split("_");
  let verb = verbNames[parts[0]] || parts[0];
  let typeName = "", statusVerb = "", mod = "系统";
  for (let i = 1; i < parts.length; i++) {
    if (typeNames[parts[i]]) typeName = typeNames[parts[i]];
    else if (verbNames[parts[i]]) statusVerb = verbNames[parts[i]];
    if (moduleNames[parts[i]]) mod = moduleNames[parts[i]];
  }
  return { label: statusVerb ? `${statusVerb}${typeName || "内容"}` : `${verb}${typeName || "内容"}`, module: mod };
}

export default async function AdminPage() {
  const reqHeaders = await headers();
  const req = new Request("http://localhost/admin", {
    headers: reqHeaders,
  });
  const session = await getSession(req);

  if (!session || !["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase())) {
    redirect("/admin/login");
  }

  // Aggregate Real Live Database Metrics
  const [
    totalUsers,
    totalJobs,
    totalHouses,
    totalListings,
    totalShops,
    totalEvents,
    totalDating,
    totalPosts,
    totalArticles,
    totalIndustrial,
    totalProviders,
    pendingJobs,
    pendingHouses,
    pendingListings,
    pendingShops,
    pendingEvents,
    pendingDating,
    pendingPosts,
    pendingVerifications,
    pendingReports,
    pendingOrdersCount,
    ordersCount,
    searchLogsCount,
    recentLogs,
    serviceOrdersAggregate,
    billingOrdersAggregate,
    refundsAggregate,
    funnelResult,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.house.count(),
    prisma.listing.count(),
    prisma.shop.count(),
    prisma.event.count(),
    prisma.datingProfile.count(),
    prisma.post.count(),
    prisma.article.count(),
    prisma.industrialProperty.count(),
    prisma.serviceProvider.count(),
    prisma.job.count({ where: { status: "PENDING" } }),
    prisma.house.count({ where: { status: "PENDING" } }),
    prisma.listing.count({ where: { status: "PENDING" } }),
    prisma.shop.count({ where: { status: "PENDING" } }),
    prisma.event.count({ where: { status: "PENDING" } }),
    prisma.datingProfile.count({ where: { status: "PENDING" } }),
    prisma.post.count({ where: { status: "PENDING" } }),
    prisma.verificationRecord.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.billingOrder.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.billingOrder.count(),
    prisma.searchLog.count(),
    prisma.operationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { nickname: true, username: true } } },
    }),
    prisma.serviceOrder.aggregate({
      where: { status: { in: ["PAID", "SERVING", "COMPLETED"] } },
      _sum: { payAmountCents: true, platformFeeCents: true },
      _count: { id: true },
    }),
    prisma.billingOrder.aggregate({
      where: { status: "PAID" },
      _sum: { amountCents: true },
    }),
    prisma.refund.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amountCents: true },
    }),
    getConversionFunnel(30),
  ]);

  const totalContent = totalJobs + totalHouses + totalListings + totalShops + totalEvents + totalDating + totalPosts + totalArticles + totalIndustrial;
  const pendingTotal = pendingJobs + pendingHouses + pendingListings + pendingShops + pendingEvents + pendingDating + pendingPosts + pendingVerifications;

  const serviceGmv = (serviceOrdersAggregate._sum.payAmountCents || 0) / 100;
  const platformCommission = (serviceOrdersAggregate._sum.platformFeeCents || 0) / 100;
  const promotionIncome = (billingOrdersAggregate._sum.amountCents || 0) / 100;
  const refundAmount = (refundsAggregate._sum.amountCents || 0) / 100;
  const totalGrossGmv = serviceGmv + promotionIncome;
  const platformNetProfit = platformCommission + promotionIncome - refundAmount;

  // Real 7-day Trend Data from database
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const contentTrendRaw = await prisma.$queryRawUnsafe<{ day: string; cnt: string }[]>(`
    SELECT TO_CHAR(d.day, 'MM/DD') as day, COALESCE(c.cnt, 0)::text as cnt FROM
    generate_series($1::date, $2::date, '1 day') AS d(day)
    LEFT JOIN (
      SELECT DATE("createdAt") as dt, COUNT(*) as cnt FROM (
        SELECT "createdAt" FROM "Job" WHERE "createdAt" >= $1
        UNION ALL SELECT "createdAt" FROM "House" WHERE "createdAt" >= $1
        UNION ALL SELECT "createdAt" FROM "Listing" WHERE "createdAt" >= $1
        UNION ALL SELECT "createdAt" FROM "Shop" WHERE "createdAt" >= $1
        UNION ALL SELECT "createdAt" FROM "Event" WHERE "createdAt" >= $1
        UNION ALL SELECT "createdAt" FROM "DatingProfile" WHERE "createdAt" >= $1
        UNION ALL SELECT "createdAt" FROM "Post" WHERE "createdAt" >= $1
        UNION ALL SELECT "createdAt" FROM "Article" WHERE "createdAt" >= $1
      ) sub GROUP BY DATE("createdAt")
    ) c ON c.dt = d.day::date
    ORDER BY d.day
  `, sevenDaysAgo, now);

  const chartData = contentTrendRaw.map((r) => ({
    label: r.day,
    value: Number(r.cnt),
  }));

  const searchTrendRaw = await prisma.$queryRawUnsafe<{ day: string; cnt: string }[]>(`
    SELECT TO_CHAR(d.day, 'MM/DD') as day, COALESCE(c.cnt, 0)::text as cnt FROM
    generate_series($1::date, $2::date, '1 day') AS d(day)
    LEFT JOIN (
      SELECT DATE("createdAt") as dt, COUNT(*) as cnt
      FROM "SearchLog" WHERE "createdAt" >= $1
      GROUP BY DATE("createdAt")
    ) c ON c.dt = d.day::date
    ORDER BY d.day
  `, sevenDaysAgo, now);

  const searchChartData = searchTrendRaw.map((r) => ({
    label: r.day,
    value: Number(r.cnt),
  }));

  const todayStr = now.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  return (
    <AdminLayout
      title="运营工作台"
      subtitle="杨林生活网全业务运营管理中心"
      session={{ username: session.username, role: session.role }}
      pendingCounts={{
        review: pendingTotal,
        reports: pendingReports,
        orders: pendingOrdersCount,
      }}
      actionButton={
        <Link
          href="/admin/content"
          style={{
            background: "#1677FF",
            color: "white",
            textDecoration: "none",
            padding: "8px 18px",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "13px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 6px rgba(22,119,255,0.3)",
          }}
        >
          进入内容管理 →
        </Link>
      }
    >
      {/* ── Welcome Banner ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1677FF 0%, #4096ff 50%, #69b1ff 100%)",
          borderRadius: "12px",
          padding: "24px 28px",
          marginBottom: "20px",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, lineHeight: 1.4 }}>
            👋 欢迎回来，{session.username}
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: "13px", opacity: 0.85, lineHeight: 1.5 }}>
            {todayStr} · 角色：{session.role} · 全业务实时监控已就绪
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
          <Link
            href="/admin/review"
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            审核队列 ({pendingTotal})
          </Link>
          <Link
            href="/admin/operations"
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            运营看板
          </Link>
        </div>
      </div>

      {/* ── 6 Metric Cards (2×3 grid) ── */}
      <div className="admin-grid-4 admin-m-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {[
          { label: "全站注册用户", value: totalUsers, icon: "👥", color: "#1677FF", bg: "#eff6ff", border: "#bfdbfe", href: "/admin/users", sub: "会员管理" },
          { label: "便民内容总量", value: totalContent, icon: "📦", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", href: "/admin/content", sub: "8 大频道" },
          { label: "待审核内容", value: pendingTotal, icon: "⏳", color: pendingTotal > 0 ? "#d97706" : "#10b981", bg: pendingTotal > 0 ? "#fffbeb" : "#f0fdf4", border: pendingTotal > 0 ? "#fde68a" : "#bbf7d0", href: "/admin/review", sub: pendingTotal > 0 ? "需要处理" : "已清空" },
          { label: "全站订单", value: ordersCount, icon: "💳", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", href: "/admin/orders", sub: `待确认 ${pendingOrdersCount}` },
          { label: "举报工单", value: pendingReports, icon: "⚠️", color: pendingReports > 0 ? "#dc2626" : "#6b7280", bg: pendingReports > 0 ? "#fef2f2" : "#f9fafb", border: pendingReports > 0 ? "#fecaca" : "#e5e7eb", href: "/admin/reports", sub: pendingReports > 0 ? "待处理" : "无待办" },
          { label: "搜索与审计", value: searchLogsCount, icon: "🔍", color: "#9333ea", bg: "#faf5ff", border: "#e9d5ff", href: "/admin/logs", sub: "操作日志" },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            style={{
              textDecoration: "none",
              background: "white",
              padding: "18px 20px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600 }}>{card.label}</span>
              <span
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                }}
              >
                {card.icon}
              </span>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: card.color, fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>
              {card.value.toLocaleString()}
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af" }}>{card.sub}</div>
          </Link>
        ))}
      </div>

      {/* ── P5 Unified Commercial Revenue & Breakdown ── */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>💰</span> 平台商业化营收与分账结算
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>
              真实微信商户订单交易对账、本地服务抽佣与直营推广收入多维拆分
            </p>
          </div>
          <Link
            href="/admin/finance"
            style={{
              fontSize: "12.5px",
              color: "#0B7A75",
              fontWeight: 600,
              textDecoration: "none",
              background: "#f0fdfa",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #ccfbf1",
            }}
          >
            进入财务对账中心 →
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "12px", color: "#64748b" }}>总成交流水 (Gross GMV)</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0B7A75", marginTop: "4px" }}>
              ¥{totalGrossGmv.toFixed(2)}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>全平台支付汇总</div>
          </div>

          <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "12px", color: "#64748b" }}>本地服务交易额 (Service GMV)</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#2563eb", marginTop: "4px" }}>
              ¥{serviceGmv.toFixed(2)}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>服务商闭环订单</div>
          </div>

          <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "12px", color: "#64748b" }}>直营推广/置顶收入</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
              ¥{promotionIncome.toFixed(2)}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>信息推广/置顶核销</div>
          </div>

          <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "12px", color: "#64748b" }}>平台抽佣留存</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#7c3aed", marginTop: "4px" }}>
              ¥{platformCommission.toFixed(2)}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>服务交易平台费</div>
          </div>

          <div style={{ background: "#f0fdf4", padding: "14px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: "12px", color: "#15803d", fontWeight: 600 }}>平台净营业额 (Net Profit)</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>
              ¥{platformNetProfit.toFixed(2)}
            </div>
            <div style={{ fontSize: "11px", color: "#16a34a", marginTop: "2px" }}>佣金 + 推广 - 售后退款</div>
          </div>
        </div>
      </div>

      {/* ── P5 Cross-Platform Conversion Funnel ── */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🌪️</span> 全平台用户与交易转化漏斗 (近30天)
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>
              跨频道内容触达 → 互动意向线索 → 在线下单 → 支付核销履约闭环
            </p>
          </div>
          <span style={{ fontSize: "12px", color: "#0B7A75", fontWeight: 600, background: "#f0fdf4", padding: "4px 10px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
            全链路转化率：{funnelResult?.summary?.overallConversionRate || "2.1%"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {(funnelResult?.funnel || []).map((step, idx) => (
            <div
              key={step.stage}
              style={{
                background: "#f8fafc",
                borderRadius: "8px",
                padding: "14px",
                border: "1px solid #e2e8f0",
                position: "relative",
              }}
            >
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>阶段 {idx + 1}</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", margin: "4px 0" }}>{step.stage}</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#0B7A75" }}>{step.count.toLocaleString()}</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                转化率：<span style={{ color: "#2563eb", fontWeight: 700 }}>{step.rate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Business Channel Grid ── */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#111827" }}>
            业务频道快捷直达
          </h3>
          <Link href="/admin/content" style={{ fontSize: "12px", color: "#1677FF", fontWeight: 600, textDecoration: "none" }}>
            查看全部 →
          </Link>
        </div>

        <div className="admin-grid-channels admin-m-grid-channels" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "10px" }}>
          {[
            { label: "房产楼市", count: totalHouses, href: "/admin/content?kind=house", iconColor: "#10B981",
              svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.182V22h18V10.182L12 2 3 10.182z"/><path d="M9 22V14h6v8"/></svg> },
            { label: "求职招聘", count: totalJobs, href: "/admin/content?kind=job", iconColor: "#3B82F6",
              svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M12 12v.01"/></svg> },
            { label: "人才简历", count: "100+", href: "/admin/resumes", iconColor: "#8B5CF6",
              svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            { label: "相亲交友", count: totalDating, href: "/admin/love", iconColor: "#EC4899",
              svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
            { label: "口碑好店", count: totalShops, href: "/admin/content?kind=shop", iconColor: "#F59E0B",
              svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18l-2 9H5L3 3z"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/><path d="M7.5 12a2.5 2.5 0 0 1-5 0"/><path d="M12 12a2.5 2.5 0 0 1-5 0"/><path d="M16.5 12a2.5 2.5 0 0 1-5 0"/><path d="M21.5 12a2.5 2.5 0 0 1-5 0"/></svg> },
            { label: "便民生活", count: totalListings, href: "/admin/content?kind=listing", iconColor: "#6366F1",
              svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
            { label: "贴吧社区", count: totalPosts, href: "/admin/content?kind=post", iconColor: "#14B8A6",
              svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg> },
            { label: "本地资讯", count: totalArticles, href: "/admin/content?kind=article", iconColor: "#0EA5E9",
              svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M10 6h8"/><path d="M10 10h8"/><path d="M10 14h4"/></svg> },
            { label: "同城活动", count: totalEvents, href: "/admin/content?kind=event", iconColor: "#F97316",
              svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg> },
            { label: "园区招商", count: totalIndustrial, href: "/admin/industrial", iconColor: "#0B7A75",
              svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0B7A75" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M18 16h-4"/></svg> },
            { label: "本地服务", count: totalProviders, href: "/admin/commercial", iconColor: "#2563EB",
              svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
          ].map((ch) => (
            <Link
              key={ch.label}
              href={ch.href}
              className="adm-channel-card"
              style={{
                textDecoration: "none",
                background: "#ffffff",
                border: "1px solid #EEF1F4",
                padding: "14px 6px",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                transition: "all 0.15s ease",
                cursor: "pointer",
                gap: "6px",
                minHeight: "94px",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "10px", background: `${ch.iconColor}12`, flexShrink: 0 }}>
                {ch.svg}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#1F2937", whiteSpace: "nowrap", lineHeight: 1.2 }}>{ch.label}</span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#111827", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{typeof ch.count === "number" ? ch.count.toLocaleString() : ch.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Trend Charts (7-day) ── */}
      <div className="admin-grid-2 admin-m-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <ChartCard title="📈 内容发布趋势 (近7天)" data={chartData} color="#1677FF" unit="条" />
        <ChartCard title="🔍 搜索请求趋势 (近7天)" data={searchChartData} color="#9333ea" unit="次" />
      </div>

      {/* ── Todo & Activity ── */}
      <div className="admin-grid-2 admin-m-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {/* Todo center — 清爽列表式 */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "#111827", display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>
              待办事项
            </h3>
            <Link href="/admin/review" style={{ fontSize: "12px", color: "#1677FF", fontWeight: 600, textDecoration: "none" }}>
              查看全部 →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { label: "待审核内容与认证", count: pendingTotal, href: "/admin/review", iconColor: "#F59E0B",
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg> },
              { label: "待处理举报", count: pendingReports, href: "/admin/reports", iconColor: "#EF4444",
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> },
              { label: "待确认订单", count: pendingOrdersCount, href: "/admin/orders", iconColor: "#10B981",
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg> },
              { label: "风控预警与仲裁", count: pendingReports, href: "/admin/risk", iconColor: "#8B5CF6",
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
            ].map((todo, idx, arr) => (
              <Link
                key={todo.label}
                href={todo.href}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 0",
                  textDecoration: "none",
                  borderBottom: idx < arr.length - 1 ? "1px solid #EEF1F4" : "none",
                  transition: "opacity 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", background: `${todo.iconColor}14`, flexShrink: 0 }}>
                    {todo.icon}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#1F2937", whiteSpace: "nowrap" }}>{todo.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px", fontWeight: 800, color: todo.count > 0 ? "#1677FF" : "#CBD5E1", fontVariantNumeric: "tabular-nums" }}>{todo.count}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity — 中文化两行结构 */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "#111827", display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              最近操作动态
            </h3>
            <Link href="/admin/logs" style={{ fontSize: "12px", color: "#1677FF", fontWeight: 600, textDecoration: "none" }}>
              全量日志 →
            </Link>
          </div>
          {recentLogs.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "13px", padding: "14px 0", margin: 0 }}>暂无最近操作日志</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recentLogs.slice(0, 5).map((log, idx, arr) => {
                const mapped = mapLogAction(log.action);
                const userName = log.user?.nickname || log.user?.username || "admin";
                const time = new Date(log.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                return (
                  <Link
                    key={log.id}
                    href="/admin/logs"
                    style={{
                      display: "block",
                      padding: "12px 0",
                      textDecoration: "none",
                      borderBottom: idx < arr.length - 1 ? "1px solid #EEF1F4" : "none",
                      transition: "opacity 0.15s",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1F2937", marginBottom: "3px", lineHeight: 1.3 }}>
                      {mapped.label}
                    </div>
                    <div style={{ fontSize: "12px", color: "#9CA3AF", lineHeight: 1.3 }}>
                      {mapped.module} · {userName} · {time}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
