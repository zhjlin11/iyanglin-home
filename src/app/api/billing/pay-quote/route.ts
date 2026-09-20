import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  payQuoteByCoin,
  payQuoteByPoint,
  getUserAssetBalances,
} from "@/lib/billing-guard";
import { createUnifiedPaymentOrder, queryOrder, getPayConfig } from "@/lib/wechat-pay";

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

  // 3. 微信人民币支付 (智能适配 JSAPI, H5, NATIVE，微信内绝对不展示二维码)
  if (
    payMethod === "WECHAT_NATIVE" ||
    payMethod === "WECHAT" ||
    payMethod === "WECHAT_JSAPI" ||
    payMethod === "WECHAT_H5" ||
    payMethod === "RMB"
  ) {
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

      // 智能识别支付场景：根据 User-Agent 与前端场景标识
      const ua = request.headers.get("user-agent") || "";
      const isWeChat = /micromessenger/i.test(ua);
      const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
      const requestedScene = body.paymentScene;

      let paymentScene: "JSAPI" | "H5" | "NATIVE" = "NATIVE";
      if (isWeChat || requestedScene === "JSAPI" || payMethod === "WECHAT_JSAPI") {
        paymentScene = "JSAPI";
      } else if (requestedScene === "H5" || payMethod === "WECHAT_H5" || (isMobile && payMethod !== "WECHAT_NATIVE" && requestedScene !== "NATIVE")) {
        paymentScene = "H5";
      } else {
        paymentScene = "NATIVE";
      }

      const forwarded = request.headers.get("x-forwarded-for");
      const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
      const returnUrl = body.returnUrl || `/jobs/new`;

      const payResult = await createUnifiedPaymentOrder({
        orderNo,
        amountCents,
        description: `杨林在线-${quote.module}发帖服务`,
        paymentScene,
        userId: session.id,
        clientIp,
        returnUrl,
      });

      return NextResponse.json({
        success: true,
        payMethod: "WECHAT",
        paymentScene: payResult.paymentScene,
        orderNo,
        amountRmbCents: amountCents,
        needOAuth: payResult.needOAuth,
        oauthUrl: payResult.oauthUrl,
        jsapiParams: payResult.jsapiParams,
        mwebUrl: payResult.mwebUrl,
        codeUrl: payResult.codeUrl,
        message: payResult.message,
      });
    } catch (e: any) {
      console.error("[pay-quote] 微信下单失败:", e);
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
    let order = await prisma.billingOrder.findUnique({
      where: { orderNo },
    });
    if (!order) return NextResponse.json({ error: "订单未找到" }, { status: 404 });

    // 若本地仍为 PENDING_PAYMENT，向微信官方实时对账，防止回调网络延迟
    if (order.status !== "PAID") {
      try {
        const wxQuery = await queryOrder(orderNo);
        if (
          wxQuery.return_code === "SUCCESS" &&
          wxQuery.result_code === "SUCCESS" &&
          wxQuery.trade_state === "SUCCESS"
        ) {
          const totalFee = parseInt(wxQuery.total_fee || "0", 10);
          if (totalFee === order.amountCents) {
            // 微信核验真实到账，执行事务原子发券并标记已支付
            const updated = await prisma.$transaction(async (tx) => {
              const freshOrder = await tx.billingOrder.findUnique({ where: { orderNo } });
              if (!freshOrder || freshOrder.status === "PAID") return freshOrder;

              let entId = freshOrder.entitlementId;
              if (freshOrder.quoteId) {
                const quote = await tx.billingQuote.findUnique({ where: { id: freshOrder.quoteId } });
                if (quote) {
                  await tx.billingQuote.update({ where: { id: quote.id }, data: { status: "PAID" } });
                  const ent = await tx.billingEntitlement.create({
                    data: {
                      userId: quote.userId,
                      companyId: quote.companyId,
                      module: quote.module,
                      action: quote.action,
                      assetType: "RMB",
                      sourceOrderId: freshOrder.id,
                      quoteId: quote.id,
                      status: "AVAILABLE",
                      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
                    },
                  });
                  entId = ent.id;
                }
              }

              return tx.billingOrder.update({
                where: { orderNo },
                data: {
                  status: "PAID",
                  paidAt: new Date(),
                  entitlementId: entId,
                },
              });
            });
            if (updated) {
              order = updated;
            }
          }
        }
      } catch (err: any) {
        console.warn("[pay-quote GET] 主动核查微信订单状态异常:", err.message);
      }
    }

    return NextResponse.json({
      paid: order.status === "PAID",
      status: order.status,
      entitlementId: order.entitlementId,
    });
  }

  return NextResponse.json({ paid: false });
}
