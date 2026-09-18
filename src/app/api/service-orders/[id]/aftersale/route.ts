import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/service-orders/[id]/aftersale — 提交售后争议与纠纷工单
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
    const { type, description, evidence } = body;

    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    if (order.userId !== session.id) {
      return NextResponse.json({ error: "只有下单客户才可提交售后申请" }, { status: 403 });
    }

    if (!description || description.trim().length < 5) {
      return NextResponse.json({ error: "请详细说明售后原因 (不少于5个字)" }, { status: 400 });
    }

    // 创建售后工单
    const afterSale = await prisma.afterSale.create({
      data: {
        orderId: order.id,
        applicantId: session.id,
        type: type || "服务质量差",
        description: String(description).trim(),
        evidence: Array.isArray(evidence) ? evidence : [],
        status: "OPEN",
      },
    });

    // 订单转为 DISPUTED (纠纷中)，并冻结结算单
    await prisma.serviceOrder.update({
      where: { id: order.id },
      data: { status: "DISPUTED" },
    });

    await prisma.settlement.updateMany({
      where: { orderId: order.id },
      data: {
        status: "HELD",
        remark: "客户已提起售后仲裁申请，结算资金已强制冻结",
      },
    });

    // 提醒服务商与管理员
    if (order.provider.userId) {
      await prisma.notification.create({
        data: {
          userId: order.provider.userId,
          type: "SYSTEM_NOTICE",
          title: "客户提交了订单售后纠纷",
          content: `订单【${order.productTitle}】客户已发起售后申请，结算资金暂时冻结，请积极与客户沟通协商或等待平台介入。`,
          link: `/provider/center?tab=orders`,
        },
      });
    }

    return NextResponse.json({ success: true, data: afterSale });
  } catch (err: any) {
    console.error("POST /api/service-orders/[id]/aftersale error:", err);
    return NextResponse.json({ error: err.message || "提交售后失败" }, { status: 500 });
  }
}
