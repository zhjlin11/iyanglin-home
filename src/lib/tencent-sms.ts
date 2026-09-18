/**
 * 腾讯云短信 (Tencent Cloud SMS) — 验证码发送
 *
 * 使用腾讯云短信旧版 API (与老站 163k CMS 相同的认证方式)
 * 通过 sdkappid + appkey 进行 HMAC-SHA256 签名
 *
 * 环境变量:
 *   TENCENT_SMS_APP_ID       — 短信应用 SDK AppID (如 1401074830)
 *   TENCENT_SMS_APP_KEY      — 短信应用 AppKey
 *   TENCENT_SMS_SIGN         — 短信签名 (如 嵩明杰腾科技有限公司)
 *   TENCENT_SMS_TEMPLATE_ID  — 验证码模板ID
 */

import crypto from "crypto";

interface SmsConfig {
  appId: string;
  appKey: string;
  sign: string;
  templateId: string;
}

export function getSmsConfig(): SmsConfig {
  const appId = process.env.TENCENT_SMS_APP_ID || "";
  const appKey = process.env.TENCENT_SMS_APP_KEY || "";
  const sign = process.env.TENCENT_SMS_SIGN || "";
  const templateId = process.env.TENCENT_SMS_TEMPLATE_ID || "";

  if (!appId || !appKey || !templateId) {
    throw new Error(
      "短信服务配置缺失: 请在 .env 中设置 TENCENT_SMS_APP_ID, TENCENT_SMS_APP_KEY, TENCENT_SMS_TEMPLATE_ID"
    );
  }

  return { appId, appKey, sign, templateId };
}

/** 生成 6 位随机验证码 */
export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * 发送短信验证码 (使用腾讯云短信旧版 REST API)
 *
 * API 文档: https://cloud.tencent.com/document/product/382/5976
 *
 * @param phoneNumber 手机号码 (如 13800138000)
 * @param code 验证码
 * @param expireMinutes 有效分钟数 (模板参数)
 */
export async function sendSmsCode(
  phoneNumber: string,
  code: string,
  expireMinutes = 5
): Promise<{ success: boolean; error?: string }> {
  const config = getSmsConfig();

  const random = Math.floor(Math.random() * 2147483647);
  const curTime = Math.floor(Date.now() / 1000);

  // 签名: sha256(appkey=xxx&random=xxx&time=xxx&mobile=xxx)
  const sigContent = `appkey=${config.appKey}&random=${random}&time=${curTime}&mobile=${phoneNumber}`;
  const sig = crypto.createHash("sha256").update(sigContent).digest("hex");

  const url = `https://yun.tim.qq.com/v5/tlssmssvr/sendsms?sdkappid=${config.appId}&random=${random}`;

  const body = {
    tel: {
      nationcode: "86",
      mobile: phoneNumber,
    },
    sign: config.sign,
    tpl_id: Number(config.templateId),
    params: [code, String(expireMinutes)],
    sig,
    time: curTime,
    extend: "",
    ext: "",
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.result !== 0) {
      console.error("[腾讯云短信] 发送失败:", data);
      return {
        success: false,
        error: data.errmsg || "短信发送失败",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("[腾讯云短信] 网络异常:", err);
    return { success: false, error: "短信服务网络异常" };
  }
}
