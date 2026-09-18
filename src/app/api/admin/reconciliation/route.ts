import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/reconciliation
 * 每日 / 周期性财务对账与资金审计数据接口
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (session?.role !== "ADMIN" && session?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = parseInt(searchParams.get("days") || "7", 10);
    const days = isNaN(daysParam) || daysParam <= 0 ? 7 : Math.min(daysParam, 90);

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // 1. 获取选定范围内的所有订单
    const orders = await prisma.serviceOrder.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      include: {
        settlement: true,
        refunds: true,
        product: { select: { category: true } },
        provider: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. 全局累计大盘指标 (以分为单位)
    let totalGmv = 0; // 累计已支付流水
    let totalCommission = 0; // 平台抽佣
    let totalProviderAmount = 0; // 师傅应得总额
    let inEscrowAmount = 0; // 平台托管资金池（已付未结算）
    let totalRefunded = 0; // 累计已退款金额

    // 针对指定周期的统计
    let periodPaidOrders = 0;
    let periodRefundOrders = 0;

    // 分类维度统计
    const categoryStats: Record<string, { count: number; gmv: number; commission: number }> = {};

    // 每日趋势序列
    const dailyMap: Record<string, { date: string; gmv: number; commission: number; refund: number; orderCount: number }> = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      dailyMap[dateStr] = { date: dateStr, gmv: 0, commission: 0, refund: 0, orderCount: 0 };
    }

    // 异常/不平衡订单排查 (平账审计)
    const discrepancyList: any[] = [];

    // 计算全局全量订单资金（不限天数）用于大盘卡片
    const allPaidOrders = await prisma.serviceOrder.findMany({
      where: {
        status: { in: ["PAID", "ACCEPTED", "IN_SERVICE", "COMPLETED", "CONFIRMED"] },
      },
      select: {
        id: true,
        orderNo: true,
        payAmountCents: true,
        platformFeeCents: true,
        providerIncomeCents: true,
        status: true,
        settlement: { select: { status: true, netAmountCents: true } },
        refunds: { select: { amountCents: true, status: true } },
      },
    });

    allPaidOrders.forEach((o) => {
      totalGmv += o.payAmountCents;
      totalCommission += o.platformFeeCents;
      totalProviderAmount += o.providerIncomeCents;

      // 平账核验: 实付金额必须严格等于 (佣金 + 商户金额)
      if (o.payAmountCents !== o.platformFeeCents + o.providerIncomeCents) {
        discrepancyList.push({
          orderNo: o.orderNo,
          type: "COMMISSION_MISMATCH",
          orderAmount: o.payAmountCents,
          expectedSum: o.platformFeeCents + o.providerIncomeCents,
          reason: "订单金额与佣金+商户分润之和不平",
        });
      }

      // 托管资金池（未真正结算划拨且未退款的订单）
      if (
        ["PAID", "ACCEPTED", "IN_SERVICE", "COMPLETED"].includes(o.status) &&
        (!o.settlement || o.settlement.status !== "SETTLED")
      ) {
        inEscrowAmount += o.payAmountCents;
      }

      // 统计退款
      const refunded = o.refunds
        .filter((r) => r.status === "SUCCESS")
        .reduce((sum, r) => sum + r.amountCents, 0);
      totalRefunded += refunded;

      if (refunded > o.payAmountCents) {
        discrepancyList.push({
          orderNo: o.orderNo,
          type: "REFUND_EXCEED_AMOUNT",
          orderAmount: o.payAmountCents,
          refunded,
          reason: "累计退款金额超过订单实际支付金额",
        });
      }
    });

    // 处理选定周期 orders 的日趋势与品类细分
    orders.forEach((o) => {
      const dateStr = o.createdAt.toISOString().split("T")[0];
      const isPaid = ["PAID", "ACCEPTED", "IN_SERVICE", "COMPLETED", "CONFIRMED"].includes(o.status);

      if (dailyMap[dateStr]) {
        if (isPaid) {
          dailyMap[dateStr].gmv += o.payAmountCents;
          dailyMap[dateStr].commission += o.platformFeeCents;
          dailyMap[dateStr].orderCount += 1;
          periodPaidOrders += 1;
        }

        const refundSum = o.refunds
          .filter((r) => r.status === "SUCCESS")
          .reduce((s, r) => s + r.amountCents, 0);
        dailyMap[dateStr].refund += refundSum;
        if (refundSum > 0) {
          periodRefundOrders += 1;
        }
      }

      // 统计品类
      if (isPaid) {
        const cat = o.product?.category || "标准服务";
        if (!categoryStats[cat]) {
          categoryStats[cat] = { count: 0, gmv: 0, commission: 0 };
        }
        categoryStats[cat].count += 1;
        categoryStats[cat].gmv += o.payAmountCents;
        categoryStats[cat].commission += o.platformFeeCents;
      }
    });

    // 累计商户已提现结算出账
    const settledSum = await prisma.settlement.aggregate({
      where: { status: "SETTLED" },
      _sum: { netAmountCents: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalGmv, // 累计交易总额 (分)
          totalCommission, // 累计平台佣金 (分)
          totalProviderAmount, // 累计商户分润 (分)
          totalRefunded, // 累计退款 (分)
          inEscrowAmount, // 当前平台担保托管资金池 (分)
          settledAmount: settledSum._sum?.netAmountCents || 0, // 累计已打款划拨金额 (分)
          discrepancyCount: discrepancyList.length,
          periodPaidOrders,
          periodRefundOrders,
        },
        dailyTrend: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
        categoryBreakdown: Object.entries(categoryStats).map(([category, stat]) => ({
          category,
          ...stat,
        })),
        discrepancies: discrepancyList,
      },
    });
  } catch (err: any) {
    console.error("GET /api/admin/reconciliation error:", err);
    return NextResponse.json({ error: "获取财务对账报表失败" }, { status: 500 });
  }
}
