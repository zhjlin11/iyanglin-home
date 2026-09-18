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
    const { reviewId, replyContent } = body;

    if (!reviewId || !replyContent?.trim()) {
      return NextResponse.json({ success: false, message: "请填写回复内容" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { user: true, request: true },
    });

    if (!review || review.providerId !== provider.id) {
      return NextResponse.json({ success: false, message: "评价不存在或无权回复" }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        replyContent: replyContent.trim(),
        replyAt: new Date(),
      },
    });

    // 发送站内信通知评价人
    await prisma.notification.create({
      data: {
        userId: review.userId,
        type: "SERVICE_REVIEW_REPLY",
        title: `💬 【${provider.name}】回复了您的评价`,
        content: `“${replyContent.trim().slice(0, 50)}...”`,
        link: `/info/requests/${review.requestId}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "回复成功！已向用户展示您的回复",
      data: updated,
    });
  } catch (error: any) {
    console.error("[PROVIDER_REPLY_REVIEW_ERROR]", error);
    return NextResponse.json({ success: false, message: error.message || "回复失败" }, { status: 500 });
  }
}
