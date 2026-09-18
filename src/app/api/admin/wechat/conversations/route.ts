import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/wechat/conversations
 * 客服咨询列表
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
    const status = searchParams.get("status") || undefined;

    const where: any = {};
    if (status) where.status = status;

    const [conversations, total] = await Promise.all([
      prisma.wechatCustomerConversation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.wechatCustomerConversation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: conversations,
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

/**
 * PUT /api/admin/wechat/conversations
 * 更新咨询状态
 */
export async function PUT(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, status, assignedTo, note } = body;

    if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (assignedTo !== undefined) data.assignedTo = assignedTo;
    if (note !== undefined) data.note = note;

    if (status === "ACTIVE") {
      data.assignedTo = data.assignedTo || session.id;
    } else if (status === "CLOSED") {
      data.closedAt = new Date();
    }

    const updated = await prisma.wechatCustomerConversation.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "更新失败" }, { status: 500 });
  }
}
