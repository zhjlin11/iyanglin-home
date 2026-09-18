import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiToken } from "@/lib/developer/developer-service";

/**
 * 开放平台 API: 商机线索查询 (需 leads:read 权限)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  const auth = await verifyApiToken(token, "leads:read");
  if (!auth.valid || !auth.organizationId) {
    return NextResponse.json({ success: false, error: auth.error || "未授权" }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: auth.organizationId },
    select: { id: true, providerId: true },
  });

  if (!org?.providerId) {
    return NextResponse.json({ success: true, organizationId: auth.organizationId, leads: [] });
  }

  const leads = await prisma.serviceLead.findMany({
    where: { providerId: org.providerId },
    take: 50,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      stage: true,
      notes: true,
      createdAt: true,
      request: {
        select: {
          id: true,
          title: true,
          category: true,
          description: true,
          contactName: true,
          area: true,
        },
      },
    },
  });

  return NextResponse.json({ success: true, organizationId: auth.organizationId, leads });
}
