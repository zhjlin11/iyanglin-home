import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { verifyOrgAccess } from "@/lib/organization-service";
import { prisma } from "@/lib/prisma";
import { invokeAi } from "@/lib/ai-service";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get("organizationId");
  if (!orgId) return NextResponse.json({ error: "缺少 organizationId" }, { status: 400 });

  const access = await verifyOrgAccess(session.id, orgId, "leads:read");
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: 403 });

  const providerId = access.organization.providerId;
  if (!providerId) {
    return NextResponse.json({ success: true, leads: [] });
  }

  const leads = await prisma.serviceLead.findMany({
    where: { providerId },
    include: {
      request: {
        select: {
          id: true,
          title: true,
          area: true,
          category: true,
          budgetMin: true,
          budgetMax: true,
          preferredTime: true,
          description: true,
          contactName: true,
          contactPhone: true,
          addressDetail: true,
          createdAt: true,
        },
      },
      followUps: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, leads });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { organizationId, action, leadId, stage, content, nextFollowAt } = body;

  const access = await verifyOrgAccess(session.id, organizationId, "leads:write");
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: 403 });

  const providerId = access.organization.providerId;
  const lead = await prisma.serviceLead.findUnique({
    where: { id: leadId },
    include: { request: true },
  });

  if (!lead || lead.providerId !== providerId) {
    return NextResponse.json({ error: "线索不存在或跨组织越权" }, { status: 400 });
  }

  if (action === "follow_up") {
    const followUp = await prisma.leadFollowUp.create({
      data: {
        leadId,
        operatorId: session.id,
        operatorName: session.username,
        stage: stage || lead.stage,
        content: content || "客户跟进记录",
        nextFollowAt: nextFollowAt ? new Date(nextFollowAt) : null,
      },
    });

    await prisma.serviceLead.update({
      where: { id: leadId },
      data: {
        stage: stage || undefined,
        nextFollowAt: nextFollowAt ? new Date(nextFollowAt) : undefined,
      },
    });

    return NextResponse.json({ success: true, followUp });
  }

  if (action === "ai_assist") {
    const prompt = `客户需求: ${lead.request.title} | 分类: ${lead.request.category} | 区域: ${lead.request.area} | 描述: ${lead.request.description}`;
    const aiRes = await invokeAi({
      scene: "BUSINESS_INSIGHT",
      systemPrompt: "你是一名杨林本地生活商户经营助手，请总结客户核心诉求并撰写一条专业礼貌的跟进回复草稿。",
      userPrompt: prompt,
      userId: session.id,
    });
    return NextResponse.json({ success: true, suggestion: aiRes.content });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
