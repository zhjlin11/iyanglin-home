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
import { unifiedOrder, getPayConfig, signMD5, nonceStr } from "@/lib/wechat-pay";

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
      const config = getPayConfig();
      const forwarded = request.headers.get("x-forwarded-for");
      const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

      // 微信内网页 -> JSAPI 支付
      if (paymentScene === "JSAPI") {
        let openId: string | null = null;
        const wechatAccount = await prisma.wechatAccount.findFirst({
          where: { userId: session.id, appId: config.appId },
          select: { openId: true },
        });
        if (wechatAccount?.openId) {
          openId = wechatAccount.openId;
        } else {
          const userObj = await prisma.user.findUnique({
            where: { id: session.id },
            select: { wechatOpenId: true },
          });
          if (userObj?.wechatOpenId) openId = userObj.wechatOpenId;
        }

        if (!openId) {
          const redirectUri = encodeURIComponent(
            "https://iyanglin.com/api/auth/wechat/callback?redirect=/profile"
          );
          const oauthUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${config.appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_base&state=pay_bind#wechat_redirect`;

          return NextResponse.json({
            needOAuth: true,
            oauthUrl,
            orderNo: order.orderNo,
            message: "需要微信授权以拉起微信支付",
          });
        }

        const result = await unifiedOrder({
          orderNo: order.orderNo,
          description: "杨林生活网 - " + order.planName,
          amountCents: order.amountCents,
          clientIp,
          tradeType: "JSAPI",
          openid: openId,
        });

        const timestamp = String(Math.floor(Date.now() / 1000));
        const nonce = nonceStr();
        const pkgStr = "prepay_id=" + result.prepayId;
        const paySignParams = {
          appId: config.appId,
          timeStamp: timestamp,
          nonceStr: nonce,
          package: pkgStr,
          signType: "MD5",
        };
        const paySign = signMD5(paySignParams, config.apiKey);

        return NextResponse.json({
          success: true,
          orderNo: order.orderNo,
          amountYuan: (order.amountCents / 100).toFixed(2),
          amountCents: order.amountCents,
          totalCoins,
          paymentScene: "JSAPI",
          jsapiParams: {
            appId: config.appId,
            timeStamp: timestamp,
            nonceStr: nonce,
            package: pkgStr,
            signType: "MD5",
            paySign,
          },
          status: "PENDING_PAYMENT",
        });
      }

      // 手机外部浏览器 -> H5 支付
      if (paymentScene === "H5") {
        const sceneInfo = JSON.stringify({
          h5_info: {
            type: "Wap",
            wap_url: "https://iyanglin.com",
            wap_name: "杨林生活网",
          },
        });

        const result = await unifiedOrder({
          orderNo: order.orderNo,
          description: "杨林生活网 - " + order.planName,
          amountCents: order.amountCents,
          clientIp,
          tradeType: "MWEB",
          sceneInfo,
        });

        const returnUrl = encodeURIComponent(
          "https://iyanglin.com/payment/return?orderNo=" + order.orderNo
        );

        return NextResponse.json({
          success: true,
          orderNo: order.orderNo,
          amountYuan: (order.amountCents / 100).toFixed(2),
          amountCents: order.amountCents,
          totalCoins,
          paymentScene: "H5",
          mwebUrl: result.mwebUrl + "&redirect_url=" + returnUrl,
          status: "PENDING_PAYMENT",
        });
      }

      // PC 网页默认 -> Native 扫码支付
      const result = await unifiedOrder({
        orderNo: order.orderNo,
        description: "杨林生活网 - " + order.planName,
        amountCents: order.amountCents,
        clientIp,
        tradeType: "NATIVE",
      });

      return NextResponse.json({
        success: true,
        orderNo: order.orderNo,
        amountYuan: (order.amountCents / 100).toFixed(2),
        amountCents: order.amountCents,
        totalCoins,
        paymentScene: "NATIVE",
        codeUrl: result.codeUrl,
        status: "PENDING_PAYMENT",
        message: "微信支付订单创建成功，请扫码支付",
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
