import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWechatSubscriptionForUser } from "@/lib/wechat-followers";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (session.id === "env-admin") {
    return NextResponse.json({
      user: {
        id: "env-admin",
        username: session.username,
        role: "ADMIN",
        nickname: "系统管理员",
        avatar: null,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      },
      counts: {
        published: 0,
        favorites: 0,
        comments: 0,
        signups: 0,
        unreadNotifications: 0,
      },
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        nicknameSource: true,
        avatarSource: true,
        wechatNickname: true,
        wechatAvatar: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const [jobs, houses, listings, shops, events, dating, posts, favorites, comments, signups, unreadNotifications, wechatSubscription] = await Promise.all([
      prisma.job.count({ where: { authorId: user.id } }),
      prisma.house.count({ where: { authorId: user.id } }),
      prisma.listing.count({ where: { authorId: user.id } }),
      prisma.shop.count({ where: { authorId: user.id } }),
      prisma.event.count({ where: { authorId: user.id } }),
      prisma.datingProfile.count({ where: { authorId: user.id } }),
      prisma.post.count({ where: { authorId: user.id } }),
      prisma.favorite.count({ where: { userId: user.id } }),
      prisma.postComment.count({ where: { authorId: user.id } }),
      prisma.eventSignup.count({ where: { userId: user.id } }),
      prisma.notification.count({ where: { userId: user.id, readAt: null } }),
      getWechatSubscriptionForUser(user.id),
    ]);

    const totalPublished = jobs + houses + listings + shops + events + dating + posts;

    const cleanUsername = user.username.startsWith("user_") && user.username.includes("_legacy_")
      ? user.username.replace(/^user_\d+_legacy_/, "")
      : user.username;
    const effectiveNickname = user.nickname || user.wechatNickname || cleanUsername;
    const effectiveAvatar = user.avatar || user.wechatAvatar || null;

    return NextResponse.json({
      user: {
        ...user,
        nickname: effectiveNickname,
        avatar: effectiveAvatar,
        wechatSubscribed: wechatSubscription?.subscribed ?? false,
      },
      counts: {
        published: totalPublished,
        favorites,
        comments,
        signups,
        unreadNotifications,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession(request);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "未登录或不支持此操作" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nickname, avatar } = body;

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: {
        ...(nickname !== undefined ? {
          nickname: String(nickname).trim(),
          nicknameSource: "USER_EDIT",
        } : {}),
        ...(avatar !== undefined ? {
          avatar: String(avatar).trim(),
          avatarSource: "USER_UPLOAD",
        } : {}),
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        nicknameSource: true,
        avatarSource: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "更新失败" }, { status: 500 });
  }
}
