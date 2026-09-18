import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export type QrResourceType =
  | "MERCHANT"
  | "ENTERPRISE"
  | "JOB"
  | "HOUSE"
  | "SERVICE"
  | "EVENT"
  | "SHOP";

/**
 * 生成或获取统一多端二维码
 */
export async function getOrCreateUnifiedQrCode(params: {
  title: string;
  resourceType: QrResourceType;
  resourceId?: string;
  organizationId?: string;
  source?: string;
  campaign?: string;
}) {
  const codeKey = [
    params.resourceType.toLowerCase(),
    params.resourceId || "main",
    params.source || "poster",
    params.campaign || "default",
  ].join("_");

  const existing = await prisma.unifiedQrCode.findUnique({
    where: { codeKey },
  });

  if (existing) {
    return existing;
  }

  let targetUrl = `https://iyanglin.com`;
  let miniProgramPath = `/pages/index/index`;

  switch (params.resourceType) {
    case "JOB":
      targetUrl = `https://iyanglin.com/jobs/${params.resourceId}`;
      miniProgramPath = `/pages/jobs/detail?id=${params.resourceId}`;
      break;
    case "HOUSE":
      targetUrl = `https://iyanglin.com/house/${params.resourceId}`;
      miniProgramPath = `/pages/house/detail?id=${params.resourceId}`;
      break;
    case "SERVICE":
      targetUrl = `https://iyanglin.com/services/${params.resourceId}`;
      miniProgramPath = `/pages/services/detail?id=${params.resourceId}`;
      break;
    case "MERCHANT":
      targetUrl = `https://iyanglin.com/provider/${params.resourceId}`;
      miniProgramPath = `/pages/provider/detail?id=${params.resourceId}`;
      break;
    case "ENTERPRISE":
      targetUrl = `https://iyanglin.com/jobs?company=${encodeURIComponent(params.resourceId || "")}`;
      miniProgramPath = `/pages/enterprise/detail?id=${params.resourceId}`;
      break;
    case "SHOP":
      targetUrl = `https://iyanglin.com/haodian/${params.resourceId}`;
      miniProgramPath = `/pages/haodian/detail?id=${params.resourceId}`;
      break;
  }

  const qr = await prisma.unifiedQrCode.create({
    data: {
      codeKey,
      title: params.title,
      organizationId: params.organizationId || null,
      resourceType: params.resourceType,
      resourceId: params.resourceId || null,
      source: params.source || "POSTER",
      campaign: params.campaign || null,
      targetUrl,
      miniProgramPath,
    },
  });

  return qr;
}

/**
 * 记录二维码扫码访问来源追踪
 */
export async function recordQrScan(codeKey: string) {
  try {
    const updated = await prisma.unifiedQrCode.update({
      where: { codeKey },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date(),
      },
    });
    return updated;
  } catch {
    return null;
  }
}
