import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request);

    if (!session) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ success: false, error: "信息不存在" }, { status: 404 });
    }

    const isAuthor = listing.authorId === session.id;
    const isAdmin = session.role === "admin" || session.role === "editor";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ success: false, error: "仅发布者本人或管理员可刷新信息" }, { status: 403 });
    }

    // 检查刷新冷却时间 (例如 10 分钟内不能重复刷新)
    const now = new Date();
    if (listing.refreshedAt) {
      const diffMinutes = (now.getTime() - new Date(listing.refreshedAt).getTime()) / (1000 * 60);
      if (diffMinutes < 5 && !isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: `刷新过于频繁，请等待 ${Math.ceil(5 - diffMinutes)} 分钟后再试`,
          },
          { status: 429 }
        );
      }
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        refreshedAt: now,
      },
    });

    await prisma.operationLog.create({
      data: {
        action: "refresh_listing",
        targetId: id,
        userId: session.id,
        metadata: { title: listing.title, refreshedAt: now.toISOString() },
      },
    });

    return NextResponse.json({
      success: true,
      refreshedAt: updated.refreshedAt,
      message: "信息已成功刷新排位，重新提升至首页前列！",
    });
  } catch (error: any) {
    console.error("[API /api/info/[id]/refresh POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "刷新排位失败" },
      { status: 500 }
    );
  }
}
