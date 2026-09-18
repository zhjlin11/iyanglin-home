import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskPhoneNumber } from "@/lib/service-matching";

/**
 * GET /api/provider/orders — 服务商工作台客户订单管理
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
    });

    if (!provider) {
      return NextResponse.json({ error: "未找到对应的服务商档案" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "ALL";

    const where: any = { providerId: provider.id };

    if (tab === "PENDING_ACCEPT") {
      where.status = "PAID";
    } else if (tab === "IN_PROGRESS") {
      where.status = { in: ["ACCEPTED", "IN_SERVICE"] };
    } else if (tab === "WAITING_CONFIRM") {
      where.status = "WAITING_CONFIRM";
    } else if (tab === "COMPLETED") {
      where.status = "COMPLETED";
    } else if (tab === "DISPUTED") {
      where.status = { in: ["DISPUTED", "REFUNDING", "REFUNDED"] };
    }

    const orders = await prisma.serviceOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, nickname: true, username: true, avatar: true } },
        product: true,
        review: true,
        settlement: true,
        afterSales: true,
      },
      take: 50,
    });

    // 针对待接单状态脱敏详细门牌号与手机，并注入友好兼容字段
    const sanitized = orders.map((o) => {
      const isMasked = o.status === "PAID" || o.status === "PENDING_PAYMENT";
      return {
        ...o,
        amount: o.payAmountCents,
        providerAmount: o.providerIncomeCents,
        platformCommission: o.platformFeeCents,
        productTitle: o.productTitle || o.product?.title || "标准化服务",
        bookedTime: o.appointmentAt ? new Date(o.appointmentAt).toLocaleString("zh-CN") : "尽快上门",
        serviceArea: o.serviceArea || "嵩明杨林",
        serviceAddress: isMasked ? "【接单后系统自动解密门牌】" : o.addressDetail,
        addressDetail: isMasked ? "【接单后系统自动解密门牌】" : o.addressDetail,
        contactPhone: isMasked ? maskPhoneNumber(o.contactPhone) : o.contactPhone,
      };
    });

    return NextResponse.json({
      success: true,
      data: sanitized,
      counts: {
        pendingAccept: await prisma.serviceOrder.count({ where: { providerId: provider.id, status: "PAID" } }),
        inProgress: await prisma.serviceOrder.count({ where: { providerId: provider.id, status: { in: ["ACCEPTED", "IN_SERVICE"] } } }),
        waitingConfirm: await prisma.serviceOrder.count({ where: { providerId: provider.id, status: "WAITING_CONFIRM" } }),
        completed: await prisma.serviceOrder.count({ where: { providerId: provider.id, status: "COMPLETED" } }),
      },
    });
  } catch (err: any) {
    console.error("GET /api/provider/orders error:", err);
    return NextResponse.json({ error: "获取服务商订单失败" }, { status: 500 });
  }
}
