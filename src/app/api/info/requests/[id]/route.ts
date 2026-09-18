import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getMatchedProvidersForRequest, maskPhoneNumber, maskWechat } from "@/lib/service-matching";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession(req);

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, nickname: true, username: true, avatar: true } },
        selectedProvider: {
          include: {
            user: { select: { id: true, nickname: true, avatar: true } },
          },
        },
        review: {
          include: {
            user: { select: { id: true, nickname: true, avatar: true } },
          },
        },
        leads: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                avatar: true,
                phone: true,
                serviceCategory: true,
                serviceAreas: true,
                ratingAvg: true,
                ratingCount: true,
                isMember: true,
                operatingStatus: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ success: false, message: "需求不存在或已被删除" }, { status: 404 });
    }

    // 检查访问者是否拥有查看完整手机号的权限
    let canViewFullContact = false;
    let providerLead = null;

    if (session?.id) {
      if (session.id === request.userId || session.role === "ADMIN") {
        canViewFullContact = true;
      } else {
        // 检查当前登录用户是否是已认证服务商，且该线索已解锁或该服务商为会员
        const currentProvider = await prisma.serviceProvider.findUnique({
          where: { userId: session.id },
        });

        if (currentProvider && currentProvider.verificationStatus === "APPROVED") {
          const lead = await prisma.serviceLead.findUnique({
            where: {
              requestId_providerId: {
                requestId: request.id,
                providerId: currentProvider.id,
              },
            },
          });
          providerLead = lead;

          if (lead?.isUnlocked || currentProvider.isMember || request.selectedProviderId === currentProvider.id) {
            canViewFullContact = true;
          }
        }
      }
    }

    // 获取匹配到的服务商卡片
    const matchedProviders = await getMatchedProvidersForRequest(request.id);

    const data = {
      ...request,
      contactPhone: canViewFullContact ? request.contactPhone : maskPhoneNumber(request.contactPhone),
      contactWechat: canViewFullContact ? request.contactWechat : maskWechat(request.contactWechat),
      addressDetail: canViewFullContact ? request.addressDetail : null,
      canViewFullContact,
      providerLead,
      matchedProviders,
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[SERVICE_REQUEST_DETAIL_ERROR]", error);
    return NextResponse.json({ success: false, message: error.message || "获取需求详情失败" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession(req);
    if (!session?.id) {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }

    const body = await req.json();
    const { status, selectedProviderId, cancelReason } = body;

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: { selectedProvider: true },
    });

    if (!request) {
      return NextResponse.json({ success: false, message: "需求不存在" }, { status: 404 });
    }

    const isOwner = session.id === request.userId;
    const isAdmin = session.role === "ADMIN";

    // 检查服务商身份
    const currentProvider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
    });
    const isAssignedProvider = currentProvider && request.selectedProviderId === currentProvider.id;

    if (!isOwner && !isAdmin && !isAssignedProvider) {
      return NextResponse.json({ success: false, message: "无权更改此需求状态" }, { status: 403 });
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;

      if (status === "COMPLETED") {
        updateData.completedAt = new Date();

        // 完工时，为选定的服务商递增完工单量
        const targetProviderId = selectedProviderId || request.selectedProviderId;
        if (targetProviderId) {
          await prisma.serviceProvider.update({
            where: { id: targetProviderId },
            data: { completedOrders: { increment: 1 } },
          });

          // 通知用户去评价
          await prisma.notification.create({
            data: {
              userId: request.userId,
              type: "SERVICE_REQUEST_COMPLETED",
              title: "🎉 服务已完工，请评价师傅！",
              content: `您的需求【${request.title}】已标记完成，诚邀您为师傅留下真实评价，共同打造杨林诚信服务生态！`,
              link: `/info/requests/${request.id}`,
            },
          });
        }
      }

      if (status === "CANCELLED") {
        updateData.cancelReason = cancelReason || "用户主动取消";
      }
    }

    if (selectedProviderId !== undefined) {
      updateData.selectedProviderId = selectedProviderId;
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: "需求状态已更新", data: updated });
  } catch (error: any) {
    console.error("[SERVICE_REQUEST_PATCH_ERROR]", error);
    return NextResponse.json({ success: false, message: error.message || "更新需求状态失败" }, { status: 500 });
  }
}
