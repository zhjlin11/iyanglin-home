import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { orderNo } = body;

  if (!orderNo) return NextResponse.json({ error: "缺少订单号" }, { status: 400 });

  // 查找订单 (ServiceOrder 或 BillingOrder)
  const serviceOrder = await prisma.serviceOrder.findUnique({
    where: { orderNo },
  });

  const billingOrder = !serviceOrder
    ? await prisma.billingOrder.findUnique({ where: { orderNo } })
    : null;

  if (!serviceOrder && !billingOrder) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  // 生成小程序 JSAPI 调起参数
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString("hex");
  const prepayId = "wx_prepay_" + crypto.randomBytes(12).toString("hex");
  const pkg = `prepay_id=${prepayId}`;
  const paySign = crypto.createHash("md5").update(`appId=wx_mini_mock&nonceStr=${nonceStr}&package=${pkg}&signType=MD5&timeStamp=${timeStamp}&key=mock_key`).digest("hex").toUpperCase();

  return NextResponse.json({
    success: true,
    payParams: {
      timeStamp,
      nonceStr,
      package: pkg,
      signType: "MD5",
      paySign,
    },
    order: {
      orderNo,
      amountCents: serviceOrder?.payAmountCents || billingOrder?.amountCents,
    },
  });
}
