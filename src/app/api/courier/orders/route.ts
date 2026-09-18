import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const courierIdMatch = cookieHeader.match(/courier_token=([^;]+)/);
    const courierId = courierIdMatch ? courierIdMatch[1] : null;

    if (!courierId) {
      return NextResponse.json({ error: "请先登录配送员工作台" }, { status: 401 });
    }

    const courier = await prisma.courier.findUnique({ where: { id: courierId } });
    if (!courier || courier.status !== "ACTIVE") {
      return NextResponse.json({ error: "配送员凭据已失效" }, { status: 401 });
    }

    // 铁律：只能获取被分配给自己的订单，严禁暴露成本价、管理员财务等信息
    const orders = await prisma.mallOrder.findMany({
      where: {
        assignedCourierId: courierId,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNo: true,
        status: true,
        deliveryMethod: true,
        contactName: true,
        contactPhone: true,
        deliveryZoneName: true,
        addressDetail: true,
        expectedDeliveryTime: true,
        userRemark: true,
        goodsTotalCents: true,
        deliveryFeeCents: true,
        payAmountCents: true,
        deliveringAt: true,
        deliveredAt: true,
        completedAt: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productName: true,
            specification: true,
            unit: true,
            quantity: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      courier: { id: courier.id, name: courier.name, phone: courier.phone },
      data: orders,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "获取配送任务失败" }, { status: 500 });
  }
}
