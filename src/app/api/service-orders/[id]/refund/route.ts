import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { executeOrderRefund } from "@/lib/wechat-refund";

/**
 * POST /api/service-orders/[id]/refund — 申请/执行订单退款
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
    const { amountCents, reason } = body;

    const result = await executeOrderRefund({
      orderId: id,
      amountCents: parseInt(amountCents, 10),
      reason: String(reason || "客户申请退款").trim(),
      operatorId: session.id,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("POST /api/service-orders/[id]/refund error:", err);
    return NextResponse.json({ error: err.message || "退款处理失败" }, { status: 500 });
  }
}
