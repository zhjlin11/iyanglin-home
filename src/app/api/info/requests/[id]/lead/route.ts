import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession(req);
    if (!session?.id) {
      return NextResponse.json({ success: false, message: "请先登录服务商账号" }, { status: 401 });
    }

    // 检查当前用户是否是认证服务商
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
    });

    if (!provider || provider.verificationStatus !== "APPROVED") {
      return NextResponse.json(
        { success: false, message: "只有平台已通过审核的认证师傅/商家才可以接单或查看客户联系方式" },
        { status: 403 }
      );
    }

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json({ success: false, message: "需求不存在" }, { status: 404 });
    }

    if (request.status === "COMPLETED" || request.status === "CANCELLED") {
      return NextResponse.json({ success: false, message: "该需求已结束，无法接单" }, { status: 400 });
    }

    // 更新或创建 ServiceLead 记录
    const lead = await prisma.serviceLead.upsert({
      where: {
        requestId_providerId: {
          requestId: request.id,
          providerId: provider.id,
        },
      },
      create: {
        requestId: request.id,
        providerId: provider.id,
        status: "CONTACTED",
        isUnlocked: true,
        unlockedAt: new Date(),
        contactedAt: new Date(),
      },
      update: {
        isUnlocked: true,
        unlockedAt: new Date(),
        status: "CONTACTED",
        contactedAt: new Date(),
      },
    });

    // 记录联系行为审计打点 ContactEvent
    await prisma.contactEvent.create({
      data: {
        userId: session.id,
        providerId: provider.id,
        requestId: request.id,
        action: "VIEW_PHONE",
        source: "REQUEST_DETAIL",
      },
    });

    // 若需求尚未指定服务商且状态在匹配中，自动关联为选定服务商
    if (!request.selectedProviderId && request.status === "MATCHED") {
      await prisma.serviceRequest.update({
        where: { id: request.id },
        data: {
          selectedProviderId: provider.id,
          status: "IN_PROGRESS",
        },
      });

      // 通知客户有师傅接单
      await prisma.notification.create({
        data: {
          userId: request.userId,
          type: "SERVICE_REQUEST_ACCEPTED",
          title: "👨‍🔧 师傅已接单！",
          content: `【${provider.name}】已查看您的需求【${request.title}】，正在准备与您联系！`,
          link: `/info/requests/${request.id}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "已成功解锁客户联系方式！",
      data: {
        contactName: request.contactName,
        contactPhone: request.contactPhone,
        contactWechat: request.contactWechat,
        addressDetail: request.addressDetail,
        lead,
      },
    });
  } catch (error: any) {
    console.error("[SERVICE_LEAD_UNLOCK_ERROR]", error);
    return NextResponse.json({ success: false, message: error.message || "接单失败" }, { status: 500 });
  }
}
