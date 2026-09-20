/**
 * 微信支付 APIv2 — Native 扫码支付 (JSAPI 备用)
 *
 * 环境变量:
 *   WECHAT_PAY_MCH_ID      — 商户号 (10位数字)
 *   WECHAT_PAY_API_KEY      — APIv2 密钥 (32位)
 *   WECHAT_MP_APP_ID        — 公众号 AppID (已有)
 *   WECHAT_PAY_NOTIFY_URL   — 支付结果回调地址
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/* ---------- 配置 ---------- */

export function getPayConfig() {
  const appId = process.env.WECHAT_MP_APP_ID || "";
  const mchId = process.env.WECHAT_PAY_MCH_ID || "";
  const apiKey = process.env.WECHAT_PAY_API_KEY || "";
  const notifyUrl =
    process.env.WECHAT_PAY_NOTIFY_URL ||
    "https://iyanglin.com/api/payment/wechat/notify";

  if (!appId || !mchId || !apiKey) {
    throw new Error(
      "微信支付配置缺失: 请在 .env 中设置 WECHAT_MP_APP_ID, WECHAT_PAY_MCH_ID, WECHAT_PAY_API_KEY"
    );
  }

  return { appId, mchId, apiKey, notifyUrl };
}

/* ---------- 签名 ---------- */

/** APIv2 MD5 签名 */
export function signMD5(params: Record<string, string>, apiKey: string): string {
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== "" && params[k] !== undefined)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const stringSignTemp = `${sorted}&key=${apiKey}`;
  return crypto.createHash("md5").update(stringSignTemp, "utf8").digest("hex").toUpperCase();
}

/** 生成随机字符串 */
export function nonceStr(len = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/* ---------- XML 工具 ---------- */

/** 对象 → XML */
export function toXml(obj: Record<string, string>): string {
  const items = Object.entries(obj)
    .map(([k, v]) => `<${k}><![CDATA[${v}]]></${k}>`)
    .join("");
  return `<xml>${items}</xml>`;
}

/** XML → 对象 (简单解析，不依赖第三方库) */
export function parseXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  // 先去掉外层 <xml>...</xml> 包裹，只解析内层标签
  const inner = xml.replace(/^[\s\S]*?<xml>([\s\S]*)<\/xml>[\s\S]*$/, "$1");
  const regex = /<(\w+)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/\1>/g;
  let match;
  while ((match = regex.exec(inner)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

/* ---------- 统一下单 ---------- */

export interface UnifiedOrderParams {
  orderNo: string;
  description: string;
  amountCents: number;
  clientIp: string;
  tradeType?: "NATIVE" | "JSAPI" | "MWEB";
  openid?: string; // JSAPI 支付时必传
  sceneInfo?: string; // H5 支付时必传 (MWEB)
}

export interface UnifiedOrderResult {
  prepayId: string;
  codeUrl?: string; // NATIVE 扫码支付链接
  mwebUrl?: string; // H5 支付跳转链接
  returnCode: string;
  resultCode: string;
  errCodeDes?: string;
}

/**
 * 微信统一下单
 * 文档: https://pay.weixin.qq.com/wiki/doc/api/native.php?chapter=9_1
 */
export async function unifiedOrder(
  params: UnifiedOrderParams
): Promise<UnifiedOrderResult> {
  const config = getPayConfig();
  const tradeType = params.tradeType || "NATIVE";

  const reqParams: Record<string, string> = {
    appid: config.appId,
    mch_id: config.mchId,
    nonce_str: nonceStr(),
    body: params.description,
    out_trade_no: params.orderNo,
    total_fee: String(params.amountCents),
    spbill_create_ip: params.clientIp,
    notify_url: config.notifyUrl,
    trade_type: tradeType,
  };

  if (tradeType === "JSAPI" && params.openid) {
    reqParams.openid = params.openid;
  }

  if (tradeType === "MWEB" && params.sceneInfo) {
    reqParams.scene_info = params.sceneInfo;
  }

  reqParams.sign = signMD5(reqParams, config.apiKey);

  const xmlBody = toXml(reqParams);

  const response = await fetch("https://api.mch.weixin.qq.com/pay/unifiedorder", {
    method: "POST",
    headers: { "Content-Type": "text/xml; charset=utf-8" },
    body: xmlBody,
  });

  const resText = await response.text();
  const parsed = parseXml(resText);

  if (parsed.return_code !== "SUCCESS") {
    throw new Error(`微信下单失败: ${parsed.return_msg || "未知错误"}`);
  }

  if (parsed.result_code !== "SUCCESS") {
    throw new Error(`微信下单业务失败: ${parsed.err_code_des || parsed.err_code || "未知"}`);
  }

  // 验签
  const resSign = parsed.sign;
  delete parsed.sign;
  const checkSign = signMD5(parsed, config.apiKey);
  if (resSign !== checkSign) {
    throw new Error("微信下单响应签名验证失败");
  }

  return {
    prepayId: parsed.prepay_id,
    codeUrl: parsed.code_url,
    mwebUrl: parsed.mweb_url,
    returnCode: parsed.return_code,
    resultCode: parsed.result_code,
  };
}

/**
 * 微信 Native 扫码下单快捷封装
 */
export async function createNativeOrder(params: {
  orderNo: string;
  amountCents: number;
  description: string;
  clientIp?: string;
}): Promise<UnifiedOrderResult> {
  return unifiedOrder({
    ...params,
    tradeType: "NATIVE",
    clientIp: params.clientIp || "127.0.0.1",
  });
}

/* ---------- 验证回调签名 ---------- */

export function verifyNotifySign(
  parsed: Record<string, string>,
  apiKey: string
): boolean {
  const sign = parsed.sign;
  if (!sign) return false;

  const copy = { ...parsed };
  delete copy.sign;

  const checkSign = signMD5(copy, apiKey);
  return sign === checkSign;
}

/* ---------- 订单查询 ---------- */

export async function queryOrder(orderNo: string): Promise<Record<string, string>> {
  const config = getPayConfig();

  const reqParams: Record<string, string> = {
    appid: config.appId,
    mch_id: config.mchId,
    out_trade_no: orderNo,
    nonce_str: nonceStr(),
  };
  reqParams.sign = signMD5(reqParams, config.apiKey);

  const response = await fetch("https://api.mch.weixin.qq.com/pay/orderquery", {
    method: "POST",
    headers: { "Content-Type": "text/xml; charset=utf-8" },
    body: toXml(reqParams),
  });

  const resText = await response.text();
  return parseXml(resText);
}

/* ---------- 统一微信支付服务封装 (JSAPI / H5 / NATIVE) ---------- */

export interface WeixinJsapiParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: "MD5";
  paySign: string;
}

export interface UnifiedPaymentOrderParams {
  orderNo: string;
  amountCents: number;
  description: string;
  paymentScene?: "JSAPI" | "H5" | "NATIVE";
  clientIp?: string;
  userId?: string;
  openId?: string;
  returnUrl?: string;
}

export interface UnifiedPaymentOrderResult {
  paymentScene: "JSAPI" | "H5" | "NATIVE";
  orderNo: string;
  amountCents: number;
  needOAuth?: boolean;
  oauthUrl?: string;
  jsapiParams?: WeixinJsapiParams;
  mwebUrl?: string;
  codeUrl?: string;
  message?: string;
}

/**
 * 统一获取用户的微信公众号 OpenID
 */
export async function getWechatUserOpenId(
  userId: string,
  appId?: string
): Promise<string | null> {
  if (!userId) return null;
  const config = getPayConfig();
  const targetAppId = appId || config.appId;
  if (targetAppId) {
    const account = await prisma.wechatAccount.findFirst({
      where: { userId, appId: targetAppId },
      select: { openId: true },
    });
    if (account?.openId) return account.openId;
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { wechatOpenId: true },
  });
  return user?.wechatOpenId || null;
}

/**
 * 微信 JSAPI 下单快捷封装（微信内置浏览器，原生支付）
 */
export async function createJsapiOrder(params: {
  orderNo: string;
  amountCents: number;
  description: string;
  openid: string;
  clientIp?: string;
}): Promise<{ prepayId: string; jsapiParams: WeixinJsapiParams }> {
  const config = getPayConfig();
  const result = await unifiedOrder({
    orderNo: params.orderNo,
    description: params.description,
    amountCents: params.amountCents,
    clientIp: params.clientIp || "127.0.0.1",
    tradeType: "JSAPI",
    openid: params.openid,
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

  return {
    prepayId: result.prepayId,
    jsapiParams: {
      appId: config.appId,
      timeStamp: timestamp,
      nonceStr: nonce,
      package: pkgStr,
      signType: "MD5",
      paySign,
    },
  };
}

/**
 * 微信 H5 下单快捷封装（普通手机外部浏览器，跳转微信支付）
 */
export async function createH5Order(params: {
  orderNo: string;
  amountCents: number;
  description: string;
  clientIp?: string;
  returnUrl?: string;
}): Promise<{ prepayId: string; mwebUrl: string }> {
  const sceneInfo = JSON.stringify({
    h5_info: {
      type: "Wap",
      wap_url: "https://iyanglin.com",
      wap_name: "杨林生活网",
    },
  });

  const result = await unifiedOrder({
    orderNo: params.orderNo,
    description: params.description,
    amountCents: params.amountCents,
    clientIp: params.clientIp || "127.0.0.1",
    tradeType: "MWEB",
    sceneInfo,
  });

  const redirectUrl = params.returnUrl
    ? encodeURIComponent(
        params.returnUrl.startsWith("http")
          ? params.returnUrl
          : `https://iyanglin.com${params.returnUrl}`
      )
    : encodeURIComponent(`https://iyanglin.com/payment/return?orderNo=${params.orderNo}`);
  const mwebUrl = (result.mwebUrl || "") + "&redirect_url=" + redirectUrl;

  return {
    prepayId: result.prepayId,
    mwebUrl,
  };
}

/**
 * 统一微信支付下单入口（智能裁决 JSAPI / H5 / NATIVE）
 */
export async function createUnifiedPaymentOrder(
  params: UnifiedPaymentOrderParams
): Promise<UnifiedPaymentOrderResult> {
  const scene = params.paymentScene || "NATIVE";
  const clientIp = params.clientIp || "127.0.0.1";
  const config = getPayConfig();

  // 1. 微信内置浏览器 -> JSAPI 支付
  if (scene === "JSAPI") {
    let openId = params.openId;
    if (!openId && params.userId) {
      openId = (await getWechatUserOpenId(params.userId, config.appId)) || undefined;
    }

    if (!openId) {
      const returnTarget = params.returnUrl || "/profile";
      const redirectUri = encodeURIComponent(
        `https://iyanglin.com/api/auth/wechat/callback?redirect=${encodeURIComponent(returnTarget)}`
      );
      const oauthUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${config.appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_base&state=pay_bind#wechat_redirect`;

      return {
        paymentScene: "JSAPI",
        orderNo: params.orderNo,
        amountCents: params.amountCents,
        needOAuth: true,
        oauthUrl,
        message: "需要微信授权以拉起微信支付",
      };
    }

    const { jsapiParams } = await createJsapiOrder({
      orderNo: params.orderNo,
      amountCents: params.amountCents,
      description: params.description,
      openid: openId,
      clientIp,
    });

    return {
      paymentScene: "JSAPI",
      orderNo: params.orderNo,
      amountCents: params.amountCents,
      jsapiParams,
    };
  }

  // 2. 外部手机浏览器 -> H5 支付
  if (scene === "H5") {
    const { mwebUrl } = await createH5Order({
      orderNo: params.orderNo,
      amountCents: params.amountCents,
      description: params.description,
      clientIp,
      returnUrl: params.returnUrl,
    });

    return {
      paymentScene: "H5",
      orderNo: params.orderNo,
      amountCents: params.amountCents,
      mwebUrl,
    };
  }

  // 3. 桌面电脑浏览器 -> NATIVE 扫码支付
  const nativeRes = await createNativeOrder({
    orderNo: params.orderNo,
    amountCents: params.amountCents,
    description: params.description,
    clientIp,
  });

  return {
    paymentScene: "NATIVE",
    orderNo: params.orderNo,
    amountCents: params.amountCents,
    codeUrl: nativeRes.codeUrl,
  };
}

