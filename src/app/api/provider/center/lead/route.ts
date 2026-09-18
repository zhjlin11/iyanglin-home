import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.id) {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
    });

    if (!provider) {
      return NextResponse.json({ success: false, message: "无服务商权限" }, { status: 403 });
    }

    const body = await req.json();
    const { leadId, status, notes } = body;

    if (!leadId) {
      return NextResponse.json({ success: false, message: "缺少线索 ID" }, { status: 400 });
    }

    const lead = await prisma.serviceLead.findUnique({
      where: { id: leadId },
      include: { request: true },
    });

    if (!lead || lead.providerId !== provider.id) {
      return NextResponse.json({ success: false, message: "线索不存在或无权操作" }, { status: 404 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "VIEWED" && !lead.viewedAt) updateData.viewedAt = new Date();
      if (status === "CONTACTED" && !lead.contactedAt) updateData.contactedAt = new Date();
      if (status === "ACCEPTED" && !lead.acceptedAt) {
        updateData.acceptedAt = new Date();
        // 同步需求状态为处理中并指派服务商
        await prisma.serviceRequest.update({
          where: { id: lead.requestId },
          data: {
            selectedProviderId: provider.id,
            status: "IN_PROGRESS",
          },
        });
      }
      if (status === "COMPLETED" && !lead.completedAt) {
        updateData.completedAt = new Date();
        // 同步需求完成
        await prisma.serviceRequest.update({
          where: { id: lead.requestId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
        await prisma.serviceProvider.update({
          where: { id: provider.id },
          data: { completedOrders: { increment: 1 } },
        });
      }
    }
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.serviceLead.update({
      where: { id: leadId },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: "线索状态已更新", data: updated });
  } catch (error: any) {
    console.error("[PROVIDER_LEAD_UPDATE_ERROR]", error);
    return NextResponse.json({ success: false, message: error.message || "更新线索失败" }, { status: 500 });
  }
}
