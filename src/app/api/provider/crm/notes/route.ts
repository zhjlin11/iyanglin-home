import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
      select: { id: true },
    });

    if (!provider) {
      return NextResponse.json({ error: "您尚未认证为服务商" }, { status: 403 });
    }

    const body = await request.json();
    const { customerId, tags = [], notes, nextFollowUpAt, followUpCompleted } = body;

    if (!customerId) {
      return NextResponse.json({ error: "缺少客户ID" }, { status: 400 });
    }

    // 严格安全校验：该客户必须与当前服务商有真实订单、线索或咨询记录
    const [hasOrder, hasLead, hasContact] = await Promise.all([
      prisma.serviceOrder.count({ where: { providerId: provider.id, userId: customerId } }),
      prisma.serviceLead.count({
        where: { providerId: provider.id, request: { userId: customerId } },
      }),
      prisma.contactEvent.count({ where: { providerId: provider.id, userId: customerId } }),
    ]);

    if (hasOrder === 0 && hasLead === 0 && hasContact === 0) {
      return NextResponse.json({ error: "无权记录未建联用户的CRM档案" }, { status: 403 });
    }

    const noteRecord = await prisma.providerCustomerNote.upsert({
      where: {
        providerId_customerId: {
          providerId: provider.id,
          customerId,
        },
      },
      update: {
        tags: Array.isArray(tags) ? tags : [],
        notes: notes !== undefined ? String(notes).trim() : undefined,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
        followUpCompleted: typeof followUpCompleted === "boolean" ? followUpCompleted : undefined,
      },
      create: {
        providerId: provider.id,
        customerId,
        tags: Array.isArray(tags) ? tags : [],
        notes: notes !== undefined ? String(notes).trim() : null,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
        followUpCompleted: !!followUpCompleted,
      },
    });

    return NextResponse.json({
      success: true,
      message: "客户档案与回访任务保存成功！",
      data: noteRecord,
    });
  } catch (err: any) {
    console.error("POST /api/provider/crm/notes error:", err);
    return NextResponse.json({ error: err.message || "保存档案失败" }, { status: 500 });
  }
}
