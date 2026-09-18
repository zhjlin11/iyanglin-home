import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * 创建开发者应用凭证 (Secret 仅显示一次并安全哈希存储)
 */
export async function createDeveloperApp(params: {
  organizationId: string;
  name: string;
  scopes?: string[];
}) {
  const keyPrefix = "yl_live_" + crypto.randomBytes(4).toString("hex");
  const rawSecret = "sec_live_" + crypto.randomBytes(16).toString("hex");
  const keyHash = crypto.createHash("sha256").update(rawSecret).digest("hex");

  const apiKey = await prisma.apiKeyConfig.create({
    data: {
      organizationId: params.organizationId,
      name: params.name,
      keyPrefix,
      keyHash,
      scopes: params.scopes || ["jobs:read", "orders:read", "leads:read"],
      enabled: true,
    },
  });

  return {
    appId: apiKey.id,
    name: apiKey.name,
    keyPrefix,
    rawSecret, // 仅在创建时下发一次
    scopes: apiKey.scopes,
  };
}

/**
 * 校验外部 API 请求凭证与 Scope
 */
export async function verifyApiToken(
  token: string,
  requiredScope: string
): Promise<{ valid: boolean; organizationId?: string; error?: string }> {
  if (!token || !token.startsWith("sec_live_")) {
    return { valid: false, error: "无效的开发者 Token 格式" };
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const apiKey = await prisma.apiKeyConfig.findFirst({
    where: {
      keyHash: tokenHash,
      enabled: true,
    },
  });

  if (!apiKey) {
    return { valid: false, error: "API Key 不存在或已被禁用" };
  }

  if (!apiKey.scopes.includes(requiredScope) && !apiKey.scopes.includes("*")) {
    return { valid: false, error: `权限不足：该 Token 缺少必要权限 [${requiredScope}]` };
  }

  // 更新最后使用时间
  await prisma.apiKeyConfig.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return { valid: true, organizationId: apiKey.organizationId };
}

/**
 * 分发业务 Webhook 至订阅终端 (带 HMAC-SHA256 签名)
 */
export async function dispatchWebhooks(params: {
  eventType: string;
  organizationId?: string;
  payload: any;
}) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      enabled: true,
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
      events: { has: params.eventType },
    },
  });

  for (const ep of endpoints) {
    const payloadStr = JSON.stringify(params.payload);
    const signature = crypto
      .createHmac("sha256", ep.secret)
      .update(payloadStr)
      .digest("hex");

    const startTime = Date.now();
    let status = "SUCCESS";
    let statusCode: number | null = null;
    let responseText: string | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(ep.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Yanglin-Event": params.eventType,
          "X-Signature-SHA256": signature,
          "User-Agent": "Yanglin-Webhook/1.0",
        },
        body: payloadStr,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      statusCode = res.status;
      responseText = await res.text().catch(() => "");

      if (!res.ok) {
        status = "FAILED";
        await prisma.webhookEndpoint.update({
          where: { id: ep.id },
          data: { failureCount: { increment: 1 } },
        });
      } else {
        await prisma.webhookEndpoint.update({
          where: { id: ep.id },
          data: { lastDeliveredAt: new Date(), failureCount: 0 },
        });
      }
    } catch (e: any) {
      status = "FAILED";
      responseText = e.message;
      await prisma.webhookEndpoint.update({
        where: { id: ep.id },
        data: { failureCount: { increment: 1 } },
      });
    }

    await prisma.webhookDelivery.create({
      data: {
        endpointId: ep.id,
        event: params.eventType,
        payloadJson: payloadStr,
        status,
        statusCode,
        response: (responseText || "").slice(0, 500),
        durationMs: Date.now() - startTime,
      },
    });
  }
}
