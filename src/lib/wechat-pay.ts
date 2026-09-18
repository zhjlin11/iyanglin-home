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
