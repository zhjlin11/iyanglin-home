/**
 * 微信支付前端工具库
 * 场景检测 + JSAPI 支付封装
 */

export type PaymentScene = "JSAPI" | "H5" | "NATIVE";

/** JSAPI 支付参数（从后端获取） */
export interface WeixinPayParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: "MD5";
  paySign: string;
}

/** 支付 API 响应类型 */
export interface PaymentResponse {
  codeUrl?: string;
  jsapiParams?: WeixinPayParams;
  mwebUrl?: string;
  needOAuth?: boolean;
  oauthUrl?: string;
  orderNo: string;
  amountYuan?: string;
  planName?: string;
  paid?: boolean;
  error?: string;
}

/**
 * 检测当前支付场景
 */
export function detectPaymentScene(): PaymentScene {
  if (typeof window === "undefined") return "NATIVE";
  const ua = navigator.userAgent.toLowerCase();
  if (/micromessenger/i.test(ua)) return "JSAPI";
  if (/android|iphone|ipad|ipod|mobile/i.test(ua)) return "H5";
  return "NATIVE";
}

/**
 * 判断是否在微信内置浏览器中
 */
export function isWeChatBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return /micromessenger/i.test(navigator.userAgent);
}

/**
 * 调用微信 JSAPI 支付（WeixinJSBridge）
 */
export function invokeWeixinPay(
  params: WeixinPayParams
): Promise<"success" | "cancel" | "fail"> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("非浏览器环境"));
      return;
    }

    const doInvoke = () => {
      const jsBridge = (window as any).WeixinJSBridge;
      if (!jsBridge) {
        reject(new Error("WeixinJSBridge 不可用"));
        return;
      }

      jsBridge.invoke(
        "getBrandWCPayRequest",
        {
          appId: params.appId,
          timeStamp: params.timeStamp,
          nonceStr: params.nonceStr,
          package: params.package,
          signType: params.signType,
          paySign: params.paySign,
        },
        (res: { err_msg: string }) => {
          if (res.err_msg === "get_brand_wcpay_request:ok") {
            resolve("success");
          } else if (res.err_msg === "get_brand_wcpay_request:cancel") {
            resolve("cancel");
          } else {
            resolve("fail");
          }
        }
      );
    };

    if ((window as any).WeixinJSBridge) {
      doInvoke();
    } else {
      document.addEventListener("WeixinJSBridgeReady", doInvoke, false);
      setTimeout(() => {
        document.removeEventListener("WeixinJSBridgeReady", doInvoke);
        reject(new Error("等待 WeixinJSBridge 超时"));
      }, 5000);
    }
  });
}
