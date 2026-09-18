import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/wechat/events
 * 用户行为事件列表（支持过滤、分页）
 */
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));
    const eventType = searchParams.get("eventType") || undefined;
    const openId = searchParams.get("openId") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (openId) where.openId = openId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + "T23:59:59");
    }

    const [events, total] = await Promise.all([
      prisma.wechatUserEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.wechatUserEvent.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "获取失败" }, { status: 500 });
  }
}
