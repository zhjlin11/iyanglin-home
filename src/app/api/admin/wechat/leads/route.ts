import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/wechat/leads
 * 商业线索列表
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
    const source = searchParams.get("source") || undefined;

    const where: any = {};
    if (status) where.status = status;
    if (source) where.source = source;

    const [leads, total] = await Promise.all([
      prisma.businessLead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.businessLead.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: leads,
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
 * PUT /api/admin/wechat/leads
 * 更新线索状态
 */
export async function PUT(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, status, assignedTo, note, contactInfo } = body;

    if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

    const updated = await prisma.businessLead.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
        ...(note !== undefined ? { note } : {}),
        ...(contactInfo !== undefined ? { contactInfo } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "更新失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/wechat/leads
 * 删除线索
 */
export async function DELETE(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

    await prisma.businessLead.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "已删除" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "删除失败" }, { status: 500 });
  }
}
