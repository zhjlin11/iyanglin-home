import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/provider/settlement — 服务商财务中心资产与结算单列表
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
      select: {
        id: true,
        name: true,
        pendingBalance: true,
        availableBalance: true,
        settledAmount: true,
        commissionRate: true,
      },
    });

    if (!provider) {
      return NextResponse.json({ error: "服务商不存在" }, { status: 404 });
    }

    // 统计今日与本月已完工收入
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

    const todaySettlements = await prisma.settlement.findMany({
      where: {
        providerId: provider.id,
        status: { in: ["READY", "SETTLED"] },
        createdAt: { gte: startOfToday },
      },
      select: { netAmountCents: true },
    });
    const todayIncomeCents = todaySettlements.reduce((sum, s) => sum + s.netAmountCents, 0);

    const monthSettlements = await prisma.settlement.findMany({
      where: {
        providerId: provider.id,
        status: { in: ["READY", "SETTLED"] },
        createdAt: { gte: startOfMonth },
      },
      select: { netAmountCents: true },
    });
    const monthIncomeCents = monthSettlements.reduce((sum, s) => sum + s.netAmountCents, 0);

    // 查询最近结算单明细
    const settlements = await prisma.settlement.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            orderNo: true,
            productTitle: true,
            contactName: true,
            completedAt: true,
          },
        },
      },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          pendingBalance: provider.pendingBalance,
          availableBalance: provider.availableBalance,
          settledAmount: provider.settledAmount,
          todayIncomeCents,
          monthIncomeCents,
          commissionRate: provider.commissionRate || 0.10,
        },
        settlements,
      },
    });
  } catch (err: any) {
    console.error("GET /api/provider/settlement error:", err);
    return NextResponse.json({ error: "获取财务结算信息失败" }, { status: 500 });
  }
}

/**
 * POST /api/provider/settlement — 服务商申请提现/结算出金
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
    });

    if (!provider) {
      return NextResponse.json({ error: "服务商不存在" }, { status: 404 });
    }

    const body = await request.json();
    const amountCents = parseInt(body.amountCents, 10);
    const payoutMethod = body.payoutMethod || "WECHAT_TRANSFER";
    const payoutAccount = body.payoutAccount;

    if (isNaN(amountCents) || amountCents <= 0) {
      return NextResponse.json({ error: "提现金额不合法" }, { status: 400 });
    }

    if (amountCents > provider.availableBalance) {
      return NextResponse.json({ error: `可提现余额不足，当前仅有 ¥${(provider.availableBalance / 100).toFixed(2)}` }, { status: 400 });
    }

    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        userId: session.id,
        action: "PROVIDER_PAYOUT_APPLIED",
        targetId: provider.id,
        metadata: {
          amountCents,
          payoutMethod,
          payoutAccount,
          providerName: provider.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "提现申请已提交，平台财务审核将在1-3个工作日内核验并原路打款",
    });
  } catch (err: any) {
    console.error("POST /api/provider/settlement error:", err);
    return NextResponse.json({ error: "申请提现失败" }, { status: 500 });
  }
}
