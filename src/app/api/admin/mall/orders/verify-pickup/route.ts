import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { verifyAndPickupOrder } from "@/lib/mall/mall-order-machine";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权操作" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const pickupCode = body.pickupCode;

    if (!pickupCode) return NextResponse.json({ error: "请输入6位取货码" }, { status: 400 });

    const updated = await verifyAndPickupOrder({
      pickupCode,
      operatorName: session.username,
    });

    return NextResponse.json({
      success: true,
      message: `订单【${updated.orderNo}】核销成功！客户已提货。`,
      data: updated,
    });
  } catch (err: any) {
    console.error("POST /api/admin/mall/orders/verify-pickup error:", err);
    return NextResponse.json({ error: err.message || "核销失败" }, { status: 400 });
  }
}
