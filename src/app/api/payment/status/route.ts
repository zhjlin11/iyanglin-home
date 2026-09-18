import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queryOrder } from "@/lib/wechat-pay";
import { COIN_RECHARGE_PACKAGES, rechargeCoins } from "@/lib/coin-wallet-store";
import { grantMembership } from "@/lib/membership-store";

/**
 * GET /api/payment/status?orderNo=xxx
 * 前端轮询用：检查订单是否已支付
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNo = searchParams.get("orderNo");

  if (!orderNo) {
    return NextResponse.json({ error: "缺少 orderNo" }, { status: 400 });
  }

  const order = await prisma.billingOrder.findUnique({
    where: { orderNo },
  });

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  return NextResponse.json({
    orderNo: order.orderNo,
    status: order.status,
    paid: order.status === "PAID",
  });
}

/**
 * POST /api/payment/status — 主动向微信查询订单支付结果
 * 安全机制：调用微信订单查询 API 验证后才更新状态
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.orderNo) {
    return NextResponse.json({ error: "缺少 orderNo" }, { status: 400 });
  }

  const orderNo = String(body.orderNo);

  const existing = await prisma.billingOrder.findUnique({
    where: { orderNo },
  });

  if (!existing) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  if (existing.status === "PAID") {
    return NextResponse.json({ ok: true, paid: true, orderNo });
  }

  // 向微信查询真实支付状态
  try {
    const wxResult = await queryOrder(orderNo);

    if (wxResult.trade_state !== "SUCCESS") {
      return NextResponse.json({
        ok: false,
        paid: false,
        orderNo,
        tradeState: wxResult.trade_state || "UNKNOWN",
        message: wxResult.trade_state === "NOTPAY"
          ? "订单尚未支付，请先完成微信支付"
          : wxResult.trade_state === "CLOSED"
          ? "订单已关闭"
          : "当前支付状态: " + (wxResult.trade_state || "查询中"),
      });
    }

    // 金额校验
    const totalFee = parseInt(wxResult.total_fee, 10);
    if (totalFee !== existing.amountCents) {
      console.error("[支付核验] 金额不匹配: 订单 " + existing.amountCents + " 分, 微信 " + totalFee + " 分");
      return NextResponse.json({ error: "金额校验失败" }, { status: 400 });
    }

    // 微信确认已支付 → 更新订单状态
    await prisma.billingOrder.update({
      where: { orderNo },
      data: { status: "PAID" },
    });

    // 执行业务入账
    const { targetKind, targetId } = existing;

    if (targetKind === "coin") {
      const pkg = COIN_RECHARGE_PACKAGES.find(
        (p) => p.priceCents === existing.amountCents
      ) || { coins: Math.floor(existing.amountCents / 10), bonusCoins: 0 };
      const totalCoins = pkg.coins + (pkg.bonusCoins || 0);
      await rechargeCoins(targetId, totalCoins, orderNo,
        "微信支付充值: " + (existing.targetTitle || "金币套餐")
      ).catch(() => {});
    } else if (targetKind === "membership") {
      await grantMembership(targetId, existing.planId || existing.targetTitle).catch(() => {});
    } else if (targetKind === "mall_order") {
      const { onMallOrderPaymentSuccess } = await import("@/lib/mall/mall-order-machine");
      await onMallOrderPaymentSuccess(orderNo, wxResult.transaction_id).catch((e: Error) => {
        console.warn("[支付核验] 自营商城订单入账失败:", e.message);
      });
    } else if (targetKind === "service_order") {
      const { onOrderPaymentSuccess } = await import("@/lib/service-order-machine");
      await onOrderPaymentSuccess(orderNo, wxResult.transaction_id).catch((e: Error) => {
        console.warn("[支付核验] 服务订单入账失败:", e.message);
      });
    } else {
      // 置顶类业务
      const plan = existing.planId
        ? await prisma.billingPlan.findUnique({ where: { id: existing.planId } })
        : null;
      const durationDays = plan ? plan.durationDays : 7;
      const topUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
      const modelMap = {
        shop: "shop", house: "house", listing: "listing", job: "job",
        post: "post", event: "event", article: "article", love: "datingProfile",
      };
      const modelName = modelMap[targetKind as keyof typeof modelMap];
      if (modelName && (prisma as Record<string, any>)[modelName]) {
        await (prisma as Record<string, any>)[modelName].update({
          where: { id: targetId },
          data: { isTop: true, topUntil },
        }).catch((e: Error) => {
          console.warn("[支付核验] 激活置顶失败 (" + targetKind + "/" + targetId + "):", e.message);
        });
      }
    }

    await prisma.operationLog.create({
      data: {
        action: "PAYMENT_VERIFY_SUCCESS",
        targetId: existing.id,
        metadata: { orderNo, transactionId: wxResult.transaction_id || "", amountCents: existing.amountCents, targetKind, targetId },
      },
    }).catch(() => {});

    console.log("[支付核验] 订单 " + orderNo + " 微信确认已支付");
    return NextResponse.json({ ok: true, paid: true, orderNo });
  } catch (err) {
    const message = err instanceof Error ? err.message : "微信查询失败";
    console.error("[支付核验] 查询微信订单失败:", message);
    return NextResponse.json({ error: "微信支付查询失败，请稍后重试" }, { status: 500 });
  }
}
