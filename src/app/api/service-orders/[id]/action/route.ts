import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canTransition, completeOrderSettlement } from "@/lib/service-order-machine";
import { executeOrderRefund } from "@/lib/wechat-refund";

/**
 * POST /api/service-orders/[id]/action — 订单状态流转动作执行
 *
 * Body: { action: "ACCEPT" | "REJECT" | "START" | "COMPLETE" | "CONFIRM" | "CANCEL", notes?: string, images?: string[] }
 */
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
    const body = await request.json();
    const { action, notes, images } = body;

    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        provider: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    const isCustomer = order.userId === session.id;
    const isProvider = order.provider.userId === session.id;
    const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";

    // ========================================================
    // 1. 服务商接单 (PAID -> ACCEPTED)
    // ========================================================
    if (action === "ACCEPT") {
      if (!isProvider && !isAdmin) {
        return NextResponse.json({ error: "只有接单师傅本人才可接单" }, { status: 403 });
      }
      if (!canTransition(order.status, "ACCEPTED")) {
        return NextResponse.json({ error: `当前状态 [${order.status}] 不支持接单操作` }, { status: 400 });
      }

      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          providerNotes: notes ? String(notes).trim() : order.providerNotes,
        },
      });

      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: "SYSTEM_NOTICE",
          title: "师傅已确认接单",
          content: `您的订单【${order.productTitle}】已被师傅确认接单，已排期，师傅将按预约时间为您上门服务。`,
          link: `/orders/${order.id}`,
        },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // ========================================================
    // 2. 服务商拒单 (PAID -> REFUNDING -> REFUNDED)
    // ========================================================
    if (action === "REJECT") {
      if (!isProvider && !isAdmin) {
        return NextResponse.json({ error: "只有接单师傅本人才可拒单" }, { status: 403 });
      }
      if (order.status !== "PAID") {
        return NextResponse.json({ error: `只有已付款待接单状态才可拒单` }, { status: 400 });
      }

      const rejectReason = notes ? String(notes).trim() : "师傅日程冲突暂时无法承接，系统已自动全额退款";
      await executeOrderRefund({
        orderId: order.id,
        amountCents: order.payAmountCents,
        reason: `师傅拒单: ${rejectReason}`,
        operatorId: session.id,
      });

      return NextResponse.json({ success: true, message: "已拒单并全额退款给用户" });
    }

    // ========================================================
    // 3. 服务商开始服务 (ACCEPTED -> IN_SERVICE)
    // ========================================================
    if (action === "START") {
      if (!isProvider && !isAdmin) {
        return NextResponse.json({ error: "只有接单师傅本人才可标记开始服务" }, { status: 403 });
      }
      if (!canTransition(order.status, "IN_SERVICE")) {
        return NextResponse.json({ error: `当前状态 [${order.status}] 不支持开始服务` }, { status: 400 });
      }

      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: {
          status: "IN_SERVICE",
          startedAt: new Date(),
        },
      });

      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: "SYSTEM_NOTICE",
          title: "师傅已到达并开始服务",
          content: `您的订单【${order.productTitle}】师傅已到达现场并正式开始施工服务。`,
          link: `/orders/${order.id}`,
        },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // ========================================================
    // 4. 服务商提交完工 (IN_SERVICE -> WAITING_CONFIRM)
    // ========================================================
    if (action === "COMPLETE") {
      if (!isProvider && !isAdmin) {
        return NextResponse.json({ error: "只有接单师傅本人才可提交完工" }, { status: 403 });
      }
      if (!canTransition(order.status, "WAITING_CONFIRM")) {
        return NextResponse.json({ error: `当前状态 [${order.status}] 不支持提交完工` }, { status: 400 });
      }

      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: {
          status: "WAITING_CONFIRM",
          completedAt: new Date(),
          completionNotes: notes ? String(notes).trim() : "师傅已完成现场全部作业，请客户验收",
          completionImages: Array.isArray(images) ? images : [],
        },
      });

      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: "SYSTEM_NOTICE",
          title: "服务已完工，请您验收确认",
          content: `师傅已提交订单【${order.productTitle}】完工报告，请前往核验服务成果并点击「确认完成」。若 72 小时内未提出异议系统将自动确认。`,
          link: `/orders/${order.id}`,
        },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // ========================================================
    // 5. 客户确认完工 (WAITING_CONFIRM -> COMPLETED)
    // ========================================================
    if (action === "CONFIRM") {
      if (!isCustomer && !isAdmin) {
        return NextResponse.json({ error: "只有下单客户才可确认完工" }, { status: 403 });
      }
      if (!canTransition(order.status, "COMPLETED")) {
        return NextResponse.json({ error: `当前状态 [${order.status}] 不支持确认完工` }, { status: 400 });
      }

      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: {
          status: "COMPLETED",
          confirmedAt: new Date(),
        },
      });

      // 触发结算单转入 READY，更新商家可用余额
      await completeOrderSettlement(order.id, false);

      return NextResponse.json({ success: true, data: updated });
    }

    // ========================================================
    // 6. 客户取消订单 (PENDING_PAYMENT -> CANCELLED, or PAID -> REFUNDING)
    // ========================================================
    if (action === "CANCEL") {
      if (!isCustomer && !isAdmin) {
        return NextResponse.json({ error: "只有下单客户才可取消订单" }, { status: 403 });
      }

      if (order.status === "PENDING_PAYMENT") {
        const updated = await prisma.serviceOrder.update({
          where: { id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelReason: notes ? String(notes).trim() : "用户主动取消未付款订单",
          },
        });
        await prisma.billingOrder.updateMany({
          where: { orderNo: order.orderNo, status: "PENDING_PAYMENT" },
          data: { status: "CANCELLED" },
        });
        return NextResponse.json({ success: true, data: updated });
      }

      if (order.status === "PAID") {
        // 未接单全额退款
        await executeOrderRefund({
          orderId: order.id,
          amountCents: order.payAmountCents,
          reason: notes ? String(notes).trim() : "客户在师傅接单前主动取消订单",
          operatorId: session.id,
        });
        return NextResponse.json({ success: true, message: "已全额退款" });
      }

      return NextResponse.json({ error: `当前状态 [${order.status}] 无法直接取消，请联系师傅或申请售后` }, { status: 400 });
    }

    return NextResponse.json({ error: "未知的操作动作" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/service-orders/[id]/action error:", err);
    return NextResponse.json({ error: err.message || "执行动作失败" }, { status: 500 });
  }
}
