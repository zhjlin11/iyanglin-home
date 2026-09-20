import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getOrCreateCoinWallet,
  rechargeCoins,
  spendCoins,
  listCoinTransactions,
  COIN_RECHARGE_PACKAGES,
} from "@/lib/coin-wallet-store";

/** GET /api/wallet/coins — 获取当前用户的金币钱包余额与近期明细 */
export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const wallet = await getOrCreateCoinWallet(session.id);
  const transactions = await listCoinTransactions(session.id, 20);

  const formattedPackages = COIN_RECHARGE_PACKAGES.map((pkg) => ({
    ...pkg,
    price: pkg.priceCents / 100,
    priceYuan: (pkg.priceCents / 100).toFixed(pkg.priceCents % 100 === 0 ? 0 : 2),
  }));

  return NextResponse.json({
    balance: wallet.balance,
    totalRecharged: wallet.totalRecharged,
    totalSpent: wallet.totalSpent,
    packages: formattedPackages,
    transactions,
  });
}

import { prisma } from "@/lib/prisma";
import { createUnifiedPaymentOrder } from "@/lib/wechat-pay";

/** POST /api/wallet/coins — 购买/充值金币套餐预下单（多场景微信支付）或金币直接扣费 */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "请求无效" }, { status: 400 });
  }

  // 1. 充值金币下单（根据客户端场景适配 JSAPI / H5 / NATIVE，禁止任何无抵押直接增加金币）
  if (body.action === "recharge" || (!body.action && body.packageId)) {
    const pkg = COIN_RECHARGE_PACKAGES.find((p) => p.id === body.packageId);
    if (!pkg) {
      return NextResponse.json({ error: "充值套餐不存在" }, { status: 400 });
    }

    const orderNo = `COIN${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
    const totalCoins = pkg.coins + pkg.bonusCoins;
    const paymentScene: "JSAPI" | "H5" | "NATIVE" = body.paymentScene || "NATIVE";

    // 创建待付款订单（防篡改凭证）
    const order = await prisma.billingOrder.create({
      data: {
        orderNo,
        planName: `金币充值-${pkg.name}`,
        targetKind: "coin",
        targetId: session.id, // targetId 记录充值主体 userId
        targetTitle: `充值${totalCoins}金币 (${pkg.name})`,
        amountCents: pkg.priceCents,
        assetType: "RMB",
        amountRmbCents: pkg.priceCents,
        paymentChannel: "WECHAT",
        status: "PENDING_PAYMENT",
        userId: session.id,
      },
    });

    try {
      const forwarded = request.headers.get("x-forwarded-for");
      const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
      const ua = request.headers.get("user-agent") || "";
      const isWeChat = /micromessenger/i.test(ua);
      const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);

      let resolvedScene: "JSAPI" | "H5" | "NATIVE" = "NATIVE";
      if (isWeChat || paymentScene === "JSAPI") {
        resolvedScene = "JSAPI";
      } else if (paymentScene === "H5" || (isMobile && paymentScene !== "NATIVE")) {
        resolvedScene = "H5";
      } else {
        resolvedScene = "NATIVE";
      }

      const payResult = await createUnifiedPaymentOrder({
        orderNo: order.orderNo,
        amountCents: order.amountCents,
        description: "杨林生活网 - " + order.planName,
        paymentScene: resolvedScene,
        userId: session.id,
        clientIp,
        returnUrl: body.returnUrl || "/profile",
      });

      return NextResponse.json({
        success: true,
        orderNo: order.orderNo,
        amountYuan: (order.amountCents / 100).toFixed(2),
        amountCents: order.amountCents,
        totalCoins,
        paymentScene: payResult.paymentScene,
        needOAuth: payResult.needOAuth,
        oauthUrl: payResult.oauthUrl,
        jsapiParams: payResult.jsapiParams,
        mwebUrl: payResult.mwebUrl,
        codeUrl: payResult.codeUrl,
        message: payResult.message || (payResult.paymentScene === "NATIVE" ? "微信支付订单创建成功，请扫码支付" : undefined),
        status: "PENDING_PAYMENT",
      });
    } catch (e: any) {
      console.error("[充值微信下单失败]:", e);
      return NextResponse.json({ error: e.message || "微信统一下单失败，请重试" }, { status: 500 });
    }
  }

  // 2. 金币支付/扣费
  if (body.action === "spend") {
    const amount = parseInt(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "扣费金额无效" }, { status: 400 });
    }

    const res = await spendCoins(
      session.id,
      amount,
      body.type || "POST_FEE",
      body.remark || "便民服务金币支付"
    );

    if (!res.success) {
      return NextResponse.json({ error: res.message, balance: res.balance }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: res.message, balance: res.balance });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
