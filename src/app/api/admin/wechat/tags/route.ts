import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/wechat/tags
 * 获取用户标签列表
 */
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const tags = await prisma.wechatUserTag.findMany({
      orderBy: [{ category: "asc" }, { usageCount: "desc" }],
      include: { _count: { select: { relations: true } } },
    });

    return NextResponse.json({ success: true, data: tags });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "获取失败" }, { status: 500 });
  }
}

/**
 * POST /api/admin/wechat/tags
 * 创建用户标签
 */
export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, category, color, description, autoRule } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "标签名不能为空" }, { status: 400 });
    }

    const existing = await prisma.wechatUserTag.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return NextResponse.json({ error: `标签"${name}"已存在` }, { status: 400 });
    }

    const tag = await prisma.wechatUserTag.create({
      data: {
        name: name.trim(),
        category: category || "CUSTOM",
        color: color || "#3b82f6",
        description: description || null,
        autoRule: autoRule || null,
        enabled: true,
        createdBy: session.id,
      },
    });

    return NextResponse.json({ success: true, data: tag });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "创建失败" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/wechat/tags
 * 更新标签
 */
export async function PUT(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, category, color, description, autoRule, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少ID" }, { status: 400 });
    }

    const updated = await prisma.wechatUserTag.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(autoRule !== undefined ? { autoRule } : {}),
        ...(enabled !== undefined ? { enabled } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "更新失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/wechat/tags
 * 删除标签
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

    // 先删除关联
    await prisma.wechatTagRelation.deleteMany({ where: { tagId: id } });
    await prisma.wechatUserTag.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "已删除" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "删除失败" }, { status: 500 });
  }
}
