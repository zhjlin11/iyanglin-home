import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { verifyOrgAccess } from "@/lib/organization-service";
import { getProviderCrmData, maskPhone } from "@/lib/crm-engine";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get("organizationId");
  if (!orgId) return NextResponse.json({ error: "缺少 organizationId" }, { status: 400 });

  const access = await verifyOrgAccess(session.id, orgId, "crm:read");
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: 403 });

  const org = access.organization;
  if (!org.providerId) {
    return NextResponse.json({ success: true, customers: [], summary: { totalCustomers: 0, repurchaseRate: "0%" } });
  }

  const crmData = await getProviderCrmData(org.providerId);
  const canSeeFullPhone = access.role === "OWNER" || access.role === "ADMIN";

  const safeCustomers = crmData.customers.map((c: any) => ({
    ...c,
    phone: canSeeFullPhone ? c.phone : maskPhone(c.phone),
  }));

  return NextResponse.json({
    success: true,
    stats: crmData.stats,
    customers: safeCustomers,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { organizationId, customerId, tags, notes, nextFollowUpAt } = body;

  const access = await verifyOrgAccess(session.id, organizationId, "crm:write");
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: 403 });

  const providerId = access.organization.providerId;
  if (!providerId) return NextResponse.json({ error: "该组织未绑定商户实体" }, { status: 400 });

  const note = await prisma.providerCustomerNote.upsert({
    where: {
      providerId_customerId: { providerId, customerId },
    },
    create: {
      providerId,
      customerId,
      tags: tags || [],
      notes,
      nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
    },
    update: {
      tags: tags || undefined,
      notes: notes || undefined,
      nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : undefined,
    },
  });

  return NextResponse.json({ success: true, note });
}
