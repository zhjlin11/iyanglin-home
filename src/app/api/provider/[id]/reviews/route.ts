import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { recalculateProviderRating } from "@/lib/service-matching";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const provider = await prisma.serviceProvider.findUnique({
      where: { id },
      select: { id: true, name: true, ratingAvg: true, ratingCount: true },
    });

    if (!provider) {
      return NextResponse.json({ success: false, message: "服务商不存在" }, { status: 404 });
    }

    const reviews = await prisma.review.findMany({
      where: {
        providerId: id,
        status: "APPROVED",
      },
      include: {
        user: { select: { id: true, nickname: true, username: true, avatar: true } },
        request: { select: { id: true, title: true, category: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 统计标签分布
    const tagsCount: Record<string, number> = {};
    reviews.forEach((r) => {
      r.tags?.forEach((t) => {
        tagsCount[t] = (tagsCount[t] || 0) + 1;
      });
    });

    const tagsSummary = Object.entries(tagsCount).map(([tag, count]) => ({ tag, count }));

    return NextResponse.json({
      success: true,
      data: {
        total: reviews.length,
        ratingAvg: provider.ratingAvg,
        ratingCount: provider.ratingCount,
        hasEnoughReviews: (provider.ratingCount || 0) >= 3,
        tagsSummary,
        reviews,
      },
    });
  } catch (error: any) {
    console.error("[PROVIDER_REVIEWS_GET_ERROR]", error);
    return NextResponse.json({ success: false, message: error.message || "获取评价失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: providerId } = await params;
    const session = await getSession(req);
    if (!session?.id) {
      return NextResponse.json({ success: false, message: "请先登录" }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, rating, tags = [], content, images = [] } = body;

    if (!requestId || !rating || !content) {
      return NextResponse.json(
        { success: false, message: "请提供完整的评价星级、评价内容与对应需求" },
        { status: 400 }
      );
    }

    const star = parseInt(rating);
    if (isNaN(star) || star < 1 || star > 5) {
      return NextResponse.json({ success: false, message: "评价星级必须在 1 至 5 星之间" }, { status: 400 });
    }

    if (content.trim().length < 5) {
      return NextResponse.json({ success: false, message: "评价内容不少于 5 个字" }, { status: 400 });
    }

    // 校验需求真实性与权限 (防刷单与虚假评价核心逻辑)
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { review: true },
    });

    if (!request) {
      return NextResponse.json({ success: false, message: "关联的服务需求不存在" }, { status: 404 });
    }

    if (request.userId !== session.id) {
      return NextResponse.json({ success: false, message: "只有需求发布人才能提交真实评价" }, { status: 403 });
    }

    if (request.status !== "COMPLETED") {
      return NextResponse.json(
        { success: false, message: "该服务需求尚未完工，只有完工后才可评价" },
        { status: 400 }
      );
    }

    if (request.review) {
      return NextResponse.json(
        { success: false, message: "该需求已经评价过，严禁重复提交评价" },
        { status: 400 }
      );
    }

    // 校验服务商
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });
    if (!provider) {
      return NextResponse.json({ success: false, message: "被评价的服务商不存在" }, { status: 404 });
    }

    // 创建评价
    const newReview = await prisma.review.create({
      data: {
        requestId: request.id,
        providerId: provider.id,
        userId: session.id,
        rating: star,
        tags: Array.isArray(tags) ? tags : [],
        content: content.trim(),
        images: Array.isArray(images) ? images : [],
        status: "APPROVED",
      },
    });

    // 重新计算并更新服务商星级和评价数
    await recalculateProviderRating(provider.id);

    // 发送站内消息通知师傅
    if (provider.userId) {
      await prisma.notification.create({
        data: {
          userId: provider.userId,
          type: "SERVICE_REVIEW_RECEIVED",
          title: `⭐ 收到新客户 ${star} 星好评！`,
          content: `客户为您关于【${request.title}】的服务给出了真实评价：“${content.slice(0, 40)}...”，前往工作台查看并回复！`,
          link: `/provider/center`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "评价成功！感谢您对杨林诚信服务生态的建设支持！",
      data: newReview,
    });
  } catch (error: any) {
    console.error("[PROVIDER_REVIEW_SUBMIT_ERROR]", error);
    return NextResponse.json({ success: false, message: error.message || "提交评价失败" }, { status: 500 });
  }
}
