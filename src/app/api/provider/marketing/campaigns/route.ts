import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
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

    const campaigns = await prisma.merchantCampaign.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: campaigns });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "获取活动列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
      select: { id: true, isMember: true, verificationStatus: true },
    });

    if (!provider || provider.verificationStatus !== "APPROVED") {
      return NextResponse.json({ error: "只有已审核通过的服务商才可创建营销活动" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      badgeText = "限时特惠",
      bannerImage,
      content,
      discountRate,
      discountYuan,
      couponId,
      startAt,
      endAt,
    } = body;

    if (!title || !content || !startAt || !endAt) {
      return NextResponse.json({ error: "请完整填写活动标题、细则内容与活动起止时间" }, { status: 400 });
    }

    const discountCents = discountYuan ? Math.round(parseFloat(discountYuan) * 100) : null;
    const rateFloat = discountRate ? parseFloat(discountRate) : null;

    const campaign = await prisma.merchantCampaign.create({
      data: {
        providerId: provider.id,
        title: String(title).trim(),
        subtitle: subtitle ? String(subtitle).trim() : null,
        badgeText: badgeText ? String(badgeText).trim() : "店铺特惠",
        bannerImage: bannerImage ? String(bannerImage).trim() : null,
        content: String(content).trim(),
        discountRate: rateFloat,
        discountCents,
        couponId: couponId || null,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        status: "ACTIVE",
      },
    });

    // 触发对已关注粉丝的轻量消息提醒
    const followers = await prisma.followProvider.findMany({
      where: { providerId: provider.id },
      select: { userId: true },
    });

    if (followers.length > 0) {
      await prisma.notification.createMany({
        data: followers.map((f) => ({
          userId: f.userId,
          type: "SYSTEM_NOTICE",
          title: `您关注的商家发布了新活动：${campaign.title}`,
          content: `${campaign.subtitle || "限时特惠活动开启"}，快前往店铺主页查看参与！`,
          link: `/provider/${provider.id}`,
        })),
      }).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      message: "店铺活动发布成功！已向您的粉丝推送提醒",
      data: campaign,
    });
  } catch (err: any) {
    console.error("POST /api/provider/marketing/campaigns error:", err);
    return NextResponse.json({ error: err.message || "创建活动失败" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const body = await request.json();
    const { campaignId, status } = body;

    if (!campaignId || !status) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const updated = await prisma.merchantCampaign.updateMany({
      where: { id: campaignId, providerId: provider.id },
      data: { status },
    });

    return NextResponse.json({ success: true, message: "活动状态已更新" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "更新状态失败" }, { status: 500 });
  }
}
