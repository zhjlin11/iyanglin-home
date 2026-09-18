import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.id) {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
      include: {
        coupons: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!provider) {
      return NextResponse.json({
        success: true,
        data: { isProvider: false },
      });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 统计近7天数据指标
    const [profileViews, phoneCalls, wechatCopies, receivedLeadsCount] = await Promise.all([
      prisma.contactEvent.count({
        where: {
          providerId: provider.id,
          action: { in: ["VIEW_PROFILE", "CLICK_CONSULT"] },
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.contactEvent.count({
        where: {
          providerId: provider.id,
          action: { in: ["CALL", "VIEW_PHONE", "COPY_PHONE"] },
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.contactEvent.count({
        where: {
          providerId: provider.id,
          action: "COPY_WECHAT",
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.serviceLead.count({
        where: {
          providerId: provider.id,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    // 获取匹配给我的线索
    const myLeads = await prisma.serviceLead.findMany({
      where: { providerId: provider.id },
      include: {
        request: {
          include: {
            user: { select: { id: true, nickname: true, username: true } },
            review: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    // 获取同城待接单的新需求池 (同分类或全区待匹配需求)
    const nearbyRequests = await prisma.serviceRequest.findMany({
      where: {
        status: { in: ["PENDING_MATCH", "MATCHED"] },
        OR: [
          { category: { contains: provider.serviceCategory || "" } },
          { area: { in: provider.serviceAreas || [] } },
          { area: "杨林全区" },
        ],
        NOT: {
          leads: {
            some: { providerId: provider.id },
          },
        },
      },
      orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
      take: 15,
    });

    // 获取客户评价列表
    const reviews = await prisma.review.findMany({
      where: { providerId: provider.id },
      include: {
        user: { select: { id: true, nickname: true, username: true, avatar: true } },
        request: { select: { id: true, title: true, category: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: {
        isProvider: true,
        provider,
        stats: {
          profileViews,
          phoneCalls,
          wechatCopies,
          totalContacts: phoneCalls + wechatCopies,
          receivedLeadsCount,
          completedOrders: provider.completedOrders || 0,
          ratingAvg: provider.ratingAvg || 5.0,
          ratingCount: provider.ratingCount || 0,
        },
        myLeads,
        nearbyRequests,
        reviews,
        coupons: provider.coupons,
      },
    });
  } catch (error: any) {
    console.error("[PROVIDER_CENTER_GET_ERROR]", error);
    return NextResponse.json({ success: false, message: error.message || "获取商家中心数据失败" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.id) {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
    });

    if (!provider) {
      return NextResponse.json({ success: false, message: "服务商资料不存在" }, { status: 404 });
    }

    const body = await req.json();
    const { operatingStatus, businessHours, serviceAreas, intro, phone, wechat } = body;

    const updateData: any = {};
    if (operatingStatus && ["OPEN", "BUSY", "PAUSED"].includes(operatingStatus)) {
      updateData.operatingStatus = operatingStatus;
    }
    if (businessHours !== undefined) updateData.businessHours = businessHours;
    if (Array.isArray(serviceAreas)) updateData.serviceAreas = serviceAreas;
    if (intro !== undefined) updateData.intro = intro;
    if (phone !== undefined) updateData.phone = phone;
    if (wechat !== undefined) updateData.wechat = wechat;

    const updated = await prisma.serviceProvider.update({
      where: { id: provider.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "商家经营设置已更新！",
      data: updated,
    });
  } catch (error: any) {
    console.error("[PROVIDER_CENTER_PATCH_ERROR]", error);
    return NextResponse.json({ success: false, message: error.message || "更新设置失败" }, { status: 500 });
  }
}
