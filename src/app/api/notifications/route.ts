import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (session.id === "env-admin") {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session.id, readAt: null },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "获取通知失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { action, id } = await request.json();

    if (action === "read_all") {
      await prisma.notification.updateMany({
        where: { userId: session.id, readAt: null },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ success: true, message: "所有通知已标记为已读" });
    }

    if (id) {
      const notif = await prisma.notification.findUnique({ where: { id } });
      if (!notif || notif.userId !== session.id) {
        return NextResponse.json({ error: "通知不存在或无权操作" }, { status: 403 });
      }

      await prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });

      return NextResponse.json({ success: true, message: "通知已读" });
    }

    return NextResponse.json({ error: "无效的请求参数" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "操作失败" }, { status: 500 });
  }
}
