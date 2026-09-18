import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onMallOrderPaymentSuccess } from "@/lib/mall/mall-order-machine";

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
    const mock = body.mock === true; // 支持开发测试环境模拟支付

    const order = await prisma.mallOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    if (order.status !== "WAITING_PAYMENT") {
      return NextResponse.json({ error: "订单已支付或已关闭", status: order.status }, { status: 400 });
    }

    // 模拟快捷支付 (仅在非生产开发测试环境下使用)
    if (mock) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "生产环境已禁用模拟支付，请通过微信支付完成安全结算" },
          { status: 403 }
        );
      }
      const mockTransId = `MOCK_WX_${Date.now()}`;
      const updated = await onMallOrderPaymentSuccess(order.orderNo, mockTransId);

      // 同步 BillingOrder 状态
      await prisma.billingOrder.updateMany({
        where: { orderNo: order.orderNo },
        data: { status: "PAID" },
      });

      return NextResponse.json({
        success: true,
        mock: true,
        message: "测试模拟支付成功",
        data: {
          orderNo: updated.orderNo,
          status: updated.status,
          pickupCode: updated.pickupCode,
        },
      });
    }

    // 生产环境调起现有微信支付统一下单
    const wechatPayUrl = `/api/payment/wechat`;
    return NextResponse.json({
      success: true,
      orderNo: order.orderNo,
      amountCents: order.payAmountCents,
      payApi: wechatPayUrl,
    });
  } catch (err: any) {
    console.error("POST /api/mall/orders/[id]/pay error:", err);
    return NextResponse.json({ error: err.message || "支付发起失败" }, { status: 500 });
  }
}
