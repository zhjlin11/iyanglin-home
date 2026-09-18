import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason, description, images, refundAmountCents } = body;

    const order = await prisma.mallOrder.findUnique({
      where: { id },
      include: { afterSale: true },
    });

    if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    if (order.userId !== session.id) return NextResponse.json({ error: "无权操作该订单" }, { status: 403 });

    if (order.status === "WAITING_PAYMENT" || order.status === "CANCELLED") {
      return NextResponse.json({ error: "未支付或已取消订单不可申请售后" }, { status: 400 });
    }

    if (order.afterSale) {
      return NextResponse.json({ error: "该订单已有正在处理或已完结的售后记录", afterSale: order.afterSale }, { status: 400 });
    }

    const refundCents = Math.min(order.payAmountCents, Math.max(1, parseInt(refundAmountCents || order.payAmountCents, 10)));
    const afterSaleNo = `AS${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

    const afterSale = await prisma.$transaction(async (tx) => {
      const as = await tx.mallAfterSale.create({
        data: {
          afterSaleNo,
          orderId: id,
          userId: session.id,
          reason: reason || "商品损坏或有质量问题",
          description: description || "用户提交售后申请",
          images: Array.isArray(images) ? images : [],
          refundAmountCents: refundCents,
          status: "PENDING",
        },
      });

      await tx.mallOrder.update({
        where: { id },
        data: { status: "REFUNDING" },
      });

      await tx.mallOrderLog.create({
        data: {
          orderId: id,
          operator: "USER",
          operatorName: session.username,
          action: "AFTERSALE",
          notes: `用户发起售后申请 [${as.reason}]，申请退款金额: ¥${(refundCents / 100).toFixed(2)}`,
        },
      });

      return as;
    });

    return NextResponse.json({
      success: true,
      message: "售后申请已提交，店内客服将尽快为您核对处理！",
      data: afterSale,
    });
  } catch (err: any) {
    console.error("POST /api/mall/orders/[id]/aftersale error:", err);
    return NextResponse.json({ error: err.message || "提交售后失败" }, { status: 500 });
  }
}
