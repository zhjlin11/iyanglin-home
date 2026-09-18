import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendUnifiedNotification } from "@/lib/unified-notification";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权操作" }, { status: 403 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { action, adminNotes, revertStock } = body; // action: APPROVE | REJECT

    const as = await prisma.mallAfterSale.findUnique({
      where: { id },
      include: { order: { include: { items: true } } },
    });

    if (!as) return NextResponse.json({ error: "售后记录不存在" }, { status: 404 });
    if (as.status !== "PENDING") {
      return NextResponse.json({ error: "该售后记录已处理完结", status: as.status }, { status: 400 });
    }

    if (action === "APPROVE") {
      await prisma.$transaction(async (tx) => {
        // 1. 更新售后记录
        await tx.mallAfterSale.update({
          where: { id },
          data: {
            status: "REFUNDED",
            adminNotes,
            revertStock: Boolean(revertStock),
          },
        });

        // 2. 更新订单状态
        await tx.mallOrder.update({
          where: { id: as.orderId },
          data: { status: "REFUNDED" },
        });

        // 3. 可选：回补库存
        if (revertStock && as.order.items) {
          for (const item of as.order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                salesCount: { decrement: item.quantity },
              },
            });
          }
        }

        // 4. 记录日志
        await tx.mallOrderLog.create({
          data: {
            orderId: as.orderId,
            operator: "ADMIN",
            operatorName: session.username,
            action: "REFUND",
            notes: `售后审核通过并退款 ¥${(as.refundAmountCents / 100).toFixed(2)}${
              revertStock ? "（已自动回滚商品库存）" : "（未回滚库存）"
            }`,
          },
        });
      });

      // 发送通知
      try {
        await sendUnifiedNotification({
          userId: as.userId,
          category: "ORDER",
          type: "MALL_REFUND_APPROVED",
          title: "💰 售后退款审核通过",
          content: `您的自营便利店订单售后申请已审核通过，退款金额 ¥${(as.refundAmountCents / 100).toFixed(2)} 将原路返回您的支付账户。`,
          link: `/mall/orders/${as.orderId}`,
          channels: ["IN_APP", "WECHAT"],
        });
      } catch {}

      return NextResponse.json({ success: true, message: "已审核通过并完成退款处理" });
    } else if (action === "REJECT") {
      await prisma.$transaction(async (tx) => {
        await tx.mallAfterSale.update({
          where: { id },
          data: {
            status: "REJECTED",
            adminNotes: adminNotes || "经店内核实不满足退款条件",
          },
        });

        await tx.mallOrder.update({
          where: { id: as.orderId },
          data: { status: "COMPLETED" },
        });

        await tx.mallOrderLog.create({
          data: {
            orderId: as.orderId,
            operator: "ADMIN",
            operatorName: session.username,
            action: "AFTERSALE_REJECT",
            notes: `售后审核驳回: ${adminNotes || "不满足退换条件"}`,
          },
        });
      });

      try {
        await sendUnifiedNotification({
          userId: as.userId,
          category: "ORDER",
          type: "MALL_REFUND_REJECTED",
          title: "⚠️ 售后申请已处理",
          content: `您的订单售后申请未通过：${adminNotes || "暂不满足退款条件"}。如有疑问可联系门店客服。`,
          link: `/mall/orders/${as.orderId}`,
          channels: ["IN_APP"],
        });
      } catch {}

      return NextResponse.json({ success: true, message: "已驳回售后申请" });
    }

    return NextResponse.json({ error: "不支持的审核操作" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "审核操作失败" }, { status: 500 });
  }
}
