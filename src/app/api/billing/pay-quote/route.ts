import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  payQuoteByCoin,
  payQuoteByPoint,
  getUserAssetBalances,
} from "@/lib/billing-guard";
import { createNativeOrder, getPayConfig } from "@/lib/wechat-pay";

/**
 * POST /api/billing/pay-quote — 支付报价快照并获取权益凭证
 */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.quoteId || !body.payMethod) {
    return NextResponse.json({ error: "参数不完整 (quoteId, payMethod)" }, { status: 400 });
  }

  const quoteId = String(body.quoteId).trim();
  const payMethod = String(body.payMethod).trim().toUpperCase();

  const quote = await prisma.billingQuote.findUnique({
    where: { id: quoteId },
  });

  if (!quote) {
    return NextResponse.json({ error: "报价单不存在" }, { status: 404 });
  }
  if (quote.userId !== session.id) {
    return NextResponse.json({ error: "无权操作该报价单" }, { status: 403 });
  }
  if (quote.status === "PAID") {
    // 查找已生成的权益
    const existingEnt = await prisma.billingEntitlement.findFirst({
      where: { quoteId: quote.id, status: "AVAILABLE" },
    });
    return NextResponse.json({
      success: true,
      paid: true,
      entitlementId: existingEnt?.id,
      message: "报价单已支付",
    });
  }
  if (quote.expiresAt < new Date()) {
    return NextResponse.json({ error: "报价单已过期，请重新发起" }, { status: 400 });
  }

  // 1. 金币支付
  if (payMethod === "COIN") {
    try {
      const result = await payQuoteByCoin({ quoteId, userId: session.id });
      return NextResponse.json({
        success: true,
        payMethod: "COIN",
        entitlementId: result.entitlementId,
        orderNo: result.orderNo,
        balanceAfter: result.balanceAfter,
      });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "金币支付失败" }, { status: 400 });
    }
  }

  // 2. 积分支付
  if (payMethod === "POINT") {
    try {
      const result = await payQuoteByPoint({ quoteId, userId: session.id });
      return NextResponse.json({
        success: true,
        payMethod: "POINT",
        entitlementId: result.entitlementId,
        orderNo: result.orderNo,
        balanceAfter: result.balanceAfter,
      });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "积分支付失败" }, { status: 400 });
    }
  }

  // 3. 微信扫码支付 (RMB)
  if (payMethod === "WECHAT_NATIVE") {
    try {
      const orderNo = `RMB${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
      const amountCents = quote.priceRmbCents;

      // 创建待支付订单
      const order = await prisma.billingOrder.create({
        data: {
          orderNo,
          planName: `微信发布支付-${quote.module}`,
          targetKind: quote.module,
          targetId: quote.id,
          targetTitle: `发布-${quote.module}`,
          amountCents,
          assetType: "RMB",
          amountRmbCents: amountCents,
          quoteId: quote.id,
          paymentChannel: "WECHAT_PAY",
          status: "PENDING_PAYMENT",
          userId: session.id,
          organizationId: quote.companyId || quote.organizationId,
        },
      });

      // 尝试调用微信 Native 支付下单
      let codeUrl = "";
      try {
        const payConfig = getPayConfig();
        if (payConfig.appId && payConfig.mchId && payConfig.apiKey) {
          const wxRes = await createNativeOrder({
            orderNo,
            amountCents,
            description: `杨林在线-${quote.module}发帖服务`,
          });
          codeUrl = wxRes.codeUrl || "";
        }
      } catch (wxErr: any) {
        console.warn("[pay-quote] 微信支付直连未配置或失败，切换调试模式:", wxErr.message);
      }

      return NextResponse.json({
        success: true,
        payMethod: "WECHAT_NATIVE",
        orderNo,
        codeUrl: codeUrl || `/api/payment/mock-qr?orderNo=${orderNo}&amount=${amountCents}`,
        amountRmbCents: amountCents,
        isMock: !codeUrl,
      });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "微信下单失败" }, { status: 500 });
    }
  }

  // 4. 模拟/测试支付通道 — 生产环境严格禁用，杜绝资金绕过
  if (payMethod === "MOCK_PAY" || payMethod === "MOCK") {
    return NextResponse.json(
      { error: "安全审计拦截：系统已永久禁用模拟支付通道，请使用微信真实支付、金币或积分支付" },
      { status: 403 }
    );
  }

  return NextResponse.json({ error: "不支持的支付方式" }, { status: 400 });
}

/**
 * GET /api/billing/pay-quote?quoteId=...&orderNo=... — 轮询查询报价支付状态
 */
export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const url = new URL(request.url);
  const quoteId = url.searchParams.get("quoteId");
  const orderNo = url.searchParams.get("orderNo");

  if (!quoteId && !orderNo) {
    return NextResponse.json({ error: "缺少查询参数" }, { status: 400 });
  }

  if (quoteId) {
    const quote = await prisma.billingQuote.findUnique({
      where: { id: quoteId },
    });
    if (!quote) return NextResponse.json({ error: "报价单未找到" }, { status: 404 });

    const entitlement = await prisma.billingEntitlement.findFirst({
      where: { quoteId: quote.id, status: "AVAILABLE" },
    });

    return NextResponse.json({
      paid: quote.status === "PAID" || !!entitlement,
      status: quote.status,
      entitlementId: entitlement?.id,
    });
  }

  if (orderNo) {
    const order = await prisma.billingOrder.findUnique({
      where: { orderNo },
    });
    if (!order) return NextResponse.json({ error: "订单未找到" }, { status: 404 });

    return NextResponse.json({
      paid: order.status === "PAID",
      status: order.status,
      entitlementId: order.entitlementId,
    });
  }

  return NextResponse.json({ paid: false });
}
