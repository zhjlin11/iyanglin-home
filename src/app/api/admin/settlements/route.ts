import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/settlements — 财务结算单列表
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (session?.role !== "ADMIN" && session?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const settlements = await prisma.settlement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        provider: { select: { id: true, name: true, phone: true } },
        order: { select: { id: true, orderNo: true, productTitle: true, payAmountCents: true } },
      },
      take: 100,
    });

    const summary = {
      pendingAmountCents: (await prisma.settlement.aggregate({
        _sum: { netAmountCents: true },
        where: { status: "PENDING" },
      }))._sum.netAmountCents || 0,
      readyAmountCents: (await prisma.settlement.aggregate({
        _sum: { netAmountCents: true },
        where: { status: "READY" },
      }))._sum.netAmountCents || 0,
      settledAmountCents: (await prisma.settlement.aggregate({
        _sum: { netAmountCents: true },
        where: { status: "SETTLED" },
      }))._sum.netAmountCents || 0,
      platformFeeTotalCents: (await prisma.settlement.aggregate({
        _sum: { platformFeeCents: true },
        where: { status: { in: ["READY", "SETTLED"] } },
      }))._sum.platformFeeCents || 0,
    };

    const normalized = settlements.map((s) => ({
      ...s,
      amount: s.netAmountCents,
    }));

    return NextResponse.json({
      success: true,
      data: normalized,
      summary,
    });
  } catch (err: any) {
    console.error("GET /api/admin/settlements error:", err);
    return NextResponse.json({ error: "获取结算单失败" }, { status: 500 });
  }
}

/**
 * POST /api/admin/settlements — 财务审核出金确认
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (session?.role !== "ADMIN" && session?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const body = await request.json();
    const { settlementId, payoutMethod, payoutProof, remark } = body;

    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { provider: true, order: true },
    });

    if (!settlement) {
      return NextResponse.json({ error: "结算单不存在" }, { status: 404 });
    }

    if (settlement.status !== "READY") {
      return NextResponse.json({ error: `只有待结算 (READY) 状态单据方可确认出金打款` }, { status: 400 });
    }

    // 事务更新结算单并扣减服务商可用余额，增加累计出金
    await prisma.$transaction(async (tx) => {
      await tx.settlement.update({
        where: { id: settlement.id },
        data: {
          status: "SETTLED",
          settledAt: new Date(),
          operatorId: session.id,
          operatorName: session.username || "财务管理员",
          payoutMethod: payoutMethod || "WECHAT_TRANSFER",
          payoutProof: payoutProof ? String(payoutProof).trim() : null,
          remark: remark ? String(remark).trim() : "已完成真实出金对账打款",
        },
      });

      await tx.serviceProvider.update({
        where: { id: settlement.providerId },
        data: {
          availableBalance: { decrement: settlement.netAmountCents },
          settledAmount: { increment: settlement.netAmountCents },
        },
      });
    });

    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        userId: session.id,
        action: "ADMIN_SETTLEMENT_PAYOUT",
        targetId: settlement.id,
        metadata: {
          settlementNo: settlement.settlementNo,
          netAmountCents: settlement.netAmountCents,
          payoutMethod,
          payoutProof,
        },
      },
    });

    return NextResponse.json({ success: true, message: "出金结算已确认并入账" });
  } catch (err: any) {
    console.error("POST /api/admin/settlements error:", err);
    return NextResponse.json({ error: err.message || "结算处理失败" }, { status: 500 });
  }
}
