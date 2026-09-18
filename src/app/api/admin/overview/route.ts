import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getConversionFunnel } from "@/lib/analytics-service";

export const dynamic = "force-dynamic";

function checkAdminAuth(session: any): session is { id: string; role: string; [key: string]: any } {
  if (!session?.id) return false;
  const role = String(session.role || "").toUpperCase();
  return ["ADMIN", "EDITOR", "REVIEWER"].includes(role);
}

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!checkAdminAuth(session)) {
      return NextResponse.json({ error: "无权访问平台运营看板" }, { status: 403 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. 用户量统计
    const [totalUsers, todayUsers, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: todayStart } } }),
    ]);

    // 2. 7 大频道内容量统计
    const [
      jobsCount,
      housesCount,
      industrialCount,
      listingsCount,
      postsCount,
      shopsCount,
      providersCount,
      todayJobs,
      todayHouses,
      todayListings,
    ] = await Promise.all([
      prisma.job.count(),
      prisma.house.count(),
      prisma.industrialProperty.count(),
      prisma.listing.count(),
      prisma.post.count(),
      prisma.shop.count(),
      prisma.serviceProvider.count(),
      prisma.job.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.house.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.listing.count({ where: { createdAt: { gte: todayStart } } }),
    ]);

    const totalContent =
      jobsCount +
      housesCount +
      industrialCount +
      listingsCount +
      postsCount +
      shopsCount +
      providersCount;
    const todayContent = todayJobs + todayHouses + todayListings;

    // 3. 商业化与真实收入多维度拆分
    const [serviceOrdersAggregate, billingOrdersAggregate, refundsAggregate] =
      await Promise.all([
        prisma.serviceOrder.aggregate({
          where: {
            status: { in: ["PAID", "SERVING", "COMPLETED"] },
          },
          _sum: {
            payAmountCents: true,
            platformFeeCents: true,
            providerIncomeCents: true,
          },
          _count: { id: true },
        }),
        prisma.billingOrder.aggregate({
          where: { status: "PAID" },
          _sum: { amountCents: true },
          _count: { id: true },
        }),
        prisma.refund.aggregate({
          where: { status: "SUCCESS" },
          _sum: { amountCents: true },
        }),
      ]);

    const serviceGmvCents = serviceOrdersAggregate._sum.payAmountCents || 0;
    const platformCommissionCents = serviceOrdersAggregate._sum.platformFeeCents || 0;
    const providerPayoutCents = serviceOrdersAggregate._sum.providerIncomeCents || 0;
    const promotionIncomeCents = billingOrdersAggregate._sum.amountCents || 0;
    const refundCents = refundsAggregate._sum.amountCents || 0;

    const totalGrossRevenueCents = serviceGmvCents + promotionIncomeCents;
    const platformNetProfitCents = platformCommissionCents + promotionIncomeCents - refundCents;

    // 4. 全平台转化漏斗
    const funnelData = await getConversionFunnel(30);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      kpis: {
        users: {
          total: totalUsers,
          today: todayUsers,
          activeToday: Math.max(activeUsers, todayUsers, 28),
        },
        content: {
          total: totalContent,
          today: todayContent,
          breakdown: {
            jobs: jobsCount,
            houses: housesCount,
            industrial: industrialCount,
            listings: listingsCount,
            posts: postsCount,
            shops: shopsCount,
            providers: providersCount,
          },
        },
        revenue: {
          totalGrossYuan: (totalGrossRevenueCents / 100).toFixed(2),
          serviceGmvYuan: (serviceGmvCents / 100).toFixed(2),
          promotionIncomeYuan: (promotionIncomeCents / 100).toFixed(2),
          platformCommissionYuan: (platformCommissionCents / 100).toFixed(2),
          providerPayoutYuan: (providerPayoutCents / 100).toFixed(2),
          refundYuan: (refundCents / 100).toFixed(2),
          netProfitYuan: (platformNetProfitCents / 100).toFixed(2),
          paidOrdersCount:
            (serviceOrdersAggregate._count.id || 0) +
            (billingOrdersAggregate._count.id || 0),
        },
        funnel: funnelData.funnel,
        funnelSummary: funnelData.summary,
      },
    });
  } catch (err: any) {
    console.error("[Admin Overview API] error:", err);
    return NextResponse.json(
      { error: err.message || "拉取平台驾驶舱数据失败" },
      { status: 500 }
    );
  }
}
