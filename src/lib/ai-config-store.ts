import { prisma } from "@/lib/prisma";

export interface AiConfig {
  provider: "openai" | "qwen" | "deepseek" | "tencent" | "zhipu" | "custom";
  model: string;
  endpoint: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  enabled: boolean;
  // Feature flags
  searchAiEnabled: boolean;
  publishAiEnabled: boolean;
  customerAiEnabled: boolean;
  operationsAiEnabled: boolean;
  businessAiEnabled: boolean;
  // Quotas
  dailyTokenLimit: number;
  userDailyCallLimit: number;
  vipDailyCallLimit: number;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: "tencent",
  model: "glm-4-flash",
  endpoint: "https://api.tokenhub.cloud.tencent.com/v1",
  apiKey: "",
  temperature: 0.7,
  maxTokens: 1000,
  timeoutMs: 15000,
  enabled: true,
  searchAiEnabled: true,
  publishAiEnabled: true,
  customerAiEnabled: true,
  operationsAiEnabled: true,
  businessAiEnabled: true,
  dailyTokenLimit: 1000000,
  userDailyCallLimit: 30,
  vipDailyCallLimit: 150,
};

const CONFIG_KEY = "ai_config";

export async function getAiConfig(): Promise<AiConfig> {
  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key: CONFIG_KEY },
    });
    if (record?.value) {
      const parsed = JSON.parse(record.value);
      return {
        ...DEFAULT_AI_CONFIG,
        ...parsed,
        // Ensure apiKey falls back to env if not in DB
        apiKey: parsed.apiKey || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "",
      };
    }
  } catch (e) {
    console.error("[AiConfig] Failed to load config from DB:", e);
  }

  return {
    ...DEFAULT_AI_CONFIG,
    apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "",
  };
}

export async function saveAiConfig(newConfig: Partial<AiConfig>): Promise<AiConfig> {
  const current = await getAiConfig();
  const merged: AiConfig = {
    ...current,
    ...newConfig,
  };

  // If user left apiKey empty or "***", preserve existing apiKey
  if (!newConfig.apiKey || newConfig.apiKey.startsWith("****")) {
    merged.apiKey = current.apiKey;
  }

  await prisma.systemSetting.upsert({
    where: { key: CONFIG_KEY },
    create: {
      key: CONFIG_KEY,
      value: JSON.stringify(merged),
      description: "P6 AI 服务全局与模型参数配置",
      group: "AI",
    },
    update: {
      value: JSON.stringify(merged),
    },
  });

  return merged;
}

export async function getPublicAiStatus() {
  const config = await getAiConfig();
  return {
    enabled: config.enabled,
    provider: config.provider,
    model: config.model,
    hasApiKey: !!config.apiKey && config.apiKey.length > 5,
    features: {
      searchAi: config.searchAiEnabled,
      publishAi: config.publishAiEnabled,
      customerAi: config.customerAiEnabled,
      operationsAi: config.operationsAiEnabled,
      businessAi: config.businessAiEnabled,
    },
    quotas: {
      userDailyCallLimit: config.userDailyCallLimit,
      vipDailyCallLimit: config.vipDailyCallLimit,
    },
  };
}
