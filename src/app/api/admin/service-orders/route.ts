import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { executeOrderRefund } from "@/lib/wechat-refund";

/**
 * GET /api/admin/service-orders — 后台全量服务订单检索
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (session?.role !== "ADMIN" && session?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const keyword = searchParams.get("q");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword, mode: "insensitive" } },
        { productTitle: { contains: keyword, mode: "insensitive" } },
        { contactName: { contains: keyword, mode: "insensitive" } },
        { contactPhone: { contains: keyword, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.serviceOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        provider: { select: { id: true, name: true, phone: true } },
        user: { select: { id: true, username: true, nickname: true } },
        settlement: true,
        refunds: true,
        afterSales: true,
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: orders,
      total: orders.length,
    });
  } catch (err: any) {
    console.error("GET /api/admin/service-orders error:", err);
    return NextResponse.json({ error: "获取后台订单失败" }, { status: 500 });
  }
}

/**
 * POST /api/admin/service-orders — 管理员仲裁与退款处理
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (session?.role !== "ADMIN" && session?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const body = await request.json();
    const { action, orderId, refundAmountCents, reason } = body;

    if (action === "ARBITRATE_REFUND") {
      const result = await executeOrderRefund({
        orderId,
        amountCents: parseInt(refundAmountCents, 10),
        reason: `管理员仲裁退款: ${reason || "纠纷结案退款"}`,
        operatorId: session.id,
      });

      // 结案更新售后工单
      await prisma.afterSale.updateMany({
        where: { orderId, status: { in: ["OPEN", "UNDER_REVIEW"] } },
        data: {
          status: "RESOLVED",
          handledBy: session.id,
          result: `平台仲裁同意退款 ¥${(parseInt(refundAmountCents, 10) / 100).toFixed(2)}`,
        },
      });

      return NextResponse.json({ success: true, data: result });
    }

    if (action === "ARBITRATE_DISMISS") {
      // 驳回售后，恢复结算
      await prisma.afterSale.updateMany({
        where: { orderId, status: { in: ["OPEN", "UNDER_REVIEW"] } },
        data: {
          status: "CLOSED",
          handledBy: session.id,
          result: `平台仲裁驳回售后申请: ${reason || "证据不足，维持完工结果"}`,
        },
      });

      await prisma.serviceOrder.update({
        where: { id: orderId },
        data: { status: "COMPLETED" },
      });

      await prisma.settlement.updateMany({
        where: { orderId, status: "HELD" },
        data: {
          status: "READY",
          remark: "纠纷驳回，恢复可结状态",
        },
      });

      return NextResponse.json({ success: true, message: "已驳回纠纷并恢复结算" });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/admin/service-orders error:", err);
    return NextResponse.json({ error: err.message || "仲裁处理失败" }, { status: 500 });
  }
}
