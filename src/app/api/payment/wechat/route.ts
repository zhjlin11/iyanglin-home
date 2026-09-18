import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unifiedOrder, getPayConfig, signMD5, nonceStr } from "@/lib/wechat-pay";

/**
 * POST /api/payment/wechat — 创建微信支付订单（三模式）
 *
 * Body: { orderNo: string, paymentScene?: "JSAPI" | "H5" | "NATIVE" }
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.orderNo) {
    return NextResponse.json({ error: "缺少订单号 orderNo" }, { status: 400 });
  }

  const paymentScene = body.paymentScene || "NATIVE";

  const order = await prisma.billingOrder.findUnique({
    where: { orderNo: String(body.orderNo) },
  });

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  if (order.status === "PAID") {
    return NextResponse.json({ error: "订单已支付", paid: true }, { status: 400 });
  }

  if (order.amountCents <= 0) {
    return NextResponse.json({ error: "订单金额异常" }, { status: 400 });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

  try {
    const config = getPayConfig();

    // ========== JSAPI 支付（微信内置浏览器） ==========
    if (paymentScene === "JSAPI") {
      const session = await getSession();
      if (!session?.id) {
        return NextResponse.json({ error: "请先登录" }, { status: 401 });
      }

      const wechatAccount = await prisma.wechatAccount.findFirst({
        where: { userId: session.id, appId: config.appId },
        select: { openId: true },
      });

      if (!wechatAccount?.openId) {
        const redirectUri = encodeURIComponent(
          "https://iyanglin.com/api/auth/wechat/callback?redirect=/profile"
        );
        const oauthUrl =
          "https://open.weixin.qq.com/connect/oauth2/authorize" +
          "?appid=" + config.appId +
          "&redirect_uri=" + redirectUri +
          "&response_type=code" +
          "&scope=snsapi_base" +
          "&state=pay_bind" +
          "#wechat_redirect";

        return NextResponse.json({
          needOAuth: true,
          oauthUrl,
          orderNo: order.orderNo,
          message: "需要微信授权以完成支付",
        });
      }

      const result = await unifiedOrder({
        orderNo: order.orderNo,
        description: "杨林生活网 - " + order.planName,
        amountCents: order.amountCents,
        clientIp,
        tradeType: "JSAPI",
        openid: wechatAccount.openId,
      });

      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonce = nonceStr();
      const pkg = "prepay_id=" + result.prepayId;
      const paySignParams = {
        appId: config.appId,
        timeStamp: timestamp,
        nonceStr: nonce,
        package: pkg,
        signType: "MD5",
      };
      const paySign = signMD5(paySignParams, config.apiKey);

      return NextResponse.json({
        jsapiParams: {
          appId: config.appId,
          timeStamp: timestamp,
          nonceStr: nonce,
          package: pkg,
          signType: "MD5",
          paySign,
        },
        orderNo: order.orderNo,
        amountYuan: (order.amountCents / 100).toFixed(2),
        planName: order.planName,
      });
    }

    // ========== H5 支付（手机浏览器） ==========
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
      const mwebUrl = result.mwebUrl + "&redirect_url=" + returnUrl;

      return NextResponse.json({
        mwebUrl,
        orderNo: order.orderNo,
        amountYuan: (order.amountCents / 100).toFixed(2),
        planName: order.planName,
      });
    }

    // ========== NATIVE 扫码支付（PC，默认） ==========
    const result = await unifiedOrder({
      orderNo: order.orderNo,
      description: "杨林生活网 - " + order.planName,
      amountCents: order.amountCents,
      clientIp,
      tradeType: "NATIVE",
    });

    return NextResponse.json({
      codeUrl: result.codeUrl,
      orderNo: order.orderNo,
      amountYuan: (order.amountCents / 100).toFixed(2),
      planName: order.planName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "微信下单失败";
    console.error("[微信支付下单失败]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
