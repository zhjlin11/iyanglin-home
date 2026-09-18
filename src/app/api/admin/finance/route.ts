import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function checkAdminAuth(session: any): session is { id: string; role: string; [key: string]: any } {
  if (!session?.id) return false;
  const role = String(session.role || "").toUpperCase();
  return ["ADMIN", "EDITOR"].includes(role);
}

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!checkAdminAuth(session)) {
      return NextResponse.json({ error: "无权访问财务对账中心" }, { status: 403 });
    }

    // 1. 全局资金汇总
    const [serviceOrdersAggregate, billingOrdersAggregate, refundsAggregate] =
      await Promise.all([
        prisma.serviceOrder.aggregate({
          where: { status: { in: ["PAID", "SERVING", "COMPLETED"] } },
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
          _count: { id: true },
        }),
      ]);

    const serviceInCents = serviceOrdersAggregate._sum.payAmountCents || 0;
    const billingInCents = billingOrdersAggregate._sum.amountCents || 0;
    const totalInCents = serviceInCents + billingInCents;

    const refundOutCents = refundsAggregate._sum.amountCents || 0;
    const providerPayoutCents = serviceOrdersAggregate._sum.providerIncomeCents || 0;
    const platformCommissionCents = serviceOrdersAggregate._sum.platformFeeCents || 0;
    const netProfitCents = platformCommissionCents + billingInCents - refundOutCents;

    // 2. 最近 7 天每日财务流水趋势
    const dailyLogs = [];
    for (let i = 6; i >= 0; i--) {
      const dStart = new Date();
      dStart.setDate(dStart.getDate() - i);
      dStart.setHours(0, 0, 0, 0);

      const dEnd = new Date(dStart);
      dEnd.setHours(23, 59, 59, 999);

      const dateStr = dStart.toLocaleDateString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
      });

      // Daily service orders
      const dService = await prisma.serviceOrder.aggregate({
        where: {
          status: { in: ["PAID", "SERVING", "COMPLETED"] },
          createdAt: { gte: dStart, lte: dEnd },
        },
        _sum: { payAmountCents: true, platformFeeCents: true },
      });

      // Daily billing orders
      const dBilling = await prisma.billingOrder.aggregate({
        where: {
          status: "PAID",
          createdAt: { gte: dStart, lte: dEnd },
        },
        _sum: { amountCents: true },
      });

      const dayIn =
        ((dService._sum.payAmountCents || 0) +
          (dBilling._sum.amountCents || 0)) /
        100;
      const dayNet =
        ((dService._sum.platformFeeCents || 0) +
          (dBilling._sum.amountCents || 0)) /
        100;

      dailyLogs.push({
        date: dateStr,
        grossInYuan: dayIn.toFixed(2),
        netProfitYuan: dayNet.toFixed(2),
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalInYuan: (totalInCents / 100).toFixed(2),
        serviceInYuan: (serviceInCents / 100).toFixed(2),
        billingInYuan: (billingInCents / 100).toFixed(2),
        refundOutYuan: (refundOutCents / 100).toFixed(2),
        providerPayoutYuan: (providerPayoutCents / 100).toFixed(2),
        platformCommissionYuan: (platformCommissionCents / 100).toFixed(2),
        netProfitYuan: (netProfitCents / 100).toFixed(2),
        paidOrdersCount:
          (serviceOrdersAggregate._count.id || 0) +
          (billingOrdersAggregate._count.id || 0),
        refundCount: refundsAggregate._count.id || 0,
      },
      dailyLogs,
    });
  } catch (err: any) {
    console.error("[Admin Finance GET] error:", err);
    return NextResponse.json(
      { error: err.message || "拉取财务对账数据失败" },
      { status: 500 }
    );
  }
}
