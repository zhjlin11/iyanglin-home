import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transitionMallOrderStatus } from "@/lib/mall/mall-order-machine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权访问" }, { status: 403 });

    const { id } = await params;
    const order = await prisma.mallOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        courier: true,
        user: true,
        logs: { orderBy: { createdAt: "asc" } },
        afterSale: true,
      },
    });

    if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    return NextResponse.json({ success: true, data: order });
  } catch (err: any) {
    return NextResponse.json({ error: "获取订单详情失败" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleOrderUpdate(request, params);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleOrderUpdate(request, params);
}

async function handleOrderUpdate(
  request: Request,
  paramsPromise: Promise<{ id: string }>
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权操作" }, { status: 403 });

    const { id } = await paramsPromise;
    const body = await request.json().catch(() => ({}));
    const targetStatus = body.targetStatus || body.status;
    const notes = body.notes || body.note;
    let deliveryType = body.deliveryType;
    let courierId = body.courierId;
    let thirdPartyData = body.thirdPartyData;

    if (body.thirdPartyRunner || body.runnerName) {
      deliveryType = "THIRD_PARTY";
      thirdPartyData = {
        platform: body.thirdPartyRunner || "第三方跑腿",
        riderName: body.runnerName || "",
        riderPhone: body.runnerPhone || "",
        notes: body.runnerTrackingNo || "",
      };
    } else if (courierId) {
      deliveryType = "COURIER";
    }

    if (!targetStatus) return NextResponse.json({ error: "目标状态不能为空" }, { status: 400 });

    const updated = await transitionMallOrderStatus({
      orderId: id,
      targetStatus,
      operator: "ADMIN",
      operatorName: session.username,
      notes,
      deliveryType,
      courierId,
      thirdPartyData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("PUT/PATCH /api/admin/mall/orders/[id] error:", err);
    return NextResponse.json({ error: err.message || "更新订单状态失败" }, { status: 500 });
  }
}
