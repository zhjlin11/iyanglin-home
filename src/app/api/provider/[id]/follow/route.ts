import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: providerId } = await params;
    const session = await getSession();

    const [followersCount, userFollow] = await Promise.all([
      prisma.followProvider.count({
        where: { providerId },
      }),
      session?.id
        ? prisma.followProvider.findUnique({
            where: {
              userId_providerId: {
                userId: session.id,
                providerId,
              },
            },
          })
        : null,
    ]);

    return NextResponse.json({
      success: true,
      data: {
        isFollowed: !!userFollow,
        followersCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "查询关注状态失败" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: providerId } = await params;
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
      select: { id: true, name: true, userId: true },
    });

    if (!provider) {
      return NextResponse.json({ error: "服务商不存在" }, { status: 404 });
    }

    if (provider.userId === session.id) {
      return NextResponse.json({ error: "不能关注自己的店铺" }, { status: 400 });
    }

    const existing = await prisma.followProvider.findUnique({
      where: {
        userId_providerId: {
          userId: session.id,
          providerId,
        },
      },
    });

    let isFollowed = false;
    if (existing) {
      // 取消关注
      await prisma.followProvider.delete({
        where: { id: existing.id },
      });
      isFollowed = false;
    } else {
      // 新增关注
      await prisma.followProvider.create({
        data: {
          userId: session.id,
          providerId,
        },
      });
      isFollowed = true;

      // 向服务商发送关注提醒通知
      if (provider.userId) {
        const user = await prisma.user.findUnique({
          where: { id: session.id },
          select: { nickname: true, username: true },
        });
        const userName = user?.nickname || user?.username || "同城客户";

        await prisma.notification.create({
          data: {
            userId: provider.userId,
            type: "SYSTEM_NOTICE",
            title: "您收到了一位新粉丝的关注！",
            content: `客户【${userName}】刚刚关注了您的服务店铺，发布新服务或特惠活动将第一时间通知该客户。`,
            link: "/provider/center?tab=crm",
          },
        }).catch(() => null);
      }
    }

    const followersCount = await prisma.followProvider.count({
      where: { providerId },
    });

    return NextResponse.json({
      success: true,
      message: isFollowed ? "已成功关注该服务商" : "已取消关注",
      data: {
        isFollowed,
        followersCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "操作失败" }, { status: 500 });
  }
}
