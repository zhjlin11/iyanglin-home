import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";

// GET: 获取便民电话列表(前台+后台)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeAll = url.searchParams.get("all") === "true"; // 后台获取全部

    const categories = await prisma.phoneCategory.findMany({
      where: includeAll ? {} : { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
      include: {
        phones: {
          where: includeAll ? {} : { status: "APPROVED" },
          orderBy: [{ isHot: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("bianmin GET failed", error);
    return NextResponse.json({ error: "便民电话服务暂时不可用" }, { status: 503 });
  }
}

// POST: 新增分类或电话条目 (管理员)
export async function POST(request: Request) {
  if (!requireAuth(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!hasRole(request, ["admin", "editor"])) return NextResponse.json({ error: "权限不足" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "无效请求" }, { status: 400 });

  try {
    // 新增分类
    if (body.type === "category") {
      if (!body.name?.trim()) return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });
      const cat = await prisma.phoneCategory.create({
        data: { name: body.name.trim(), icon: body.icon || "📞", sortOrder: body.sortOrder || 0 },
      });
      return NextResponse.json({ category: cat }, { status: 201 });
    }

    // 新增电话条目
    if (!body.categoryId || !body.name?.trim() || !body.phone?.trim()) {
      return NextResponse.json({ error: "分类、名称和电话号码不能为空" }, { status: 400 });
    }

    const entry = await prisma.phoneEntry.create({
      data: {
        categoryId: body.categoryId,
        name: body.name.trim(),
        phone: body.phone.trim(),
        address: body.address?.trim() || null,
        description: body.description?.trim() || null,
        sortOrder: body.sortOrder || 0,
        isHot: body.isHot || false,
      },
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("bianmin POST failed", error);
    return NextResponse.json({ error: "保存失败" }, { status: 503 });
  }
}

// PATCH: 更新分类或电话条目
export async function PATCH(request: Request) {
  if (!requireAuth(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!hasRole(request, ["admin", "editor"])) return NextResponse.json({ error: "权限不足" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

  try {
    if (body.type === "category") {
      const cat = await prisma.phoneCategory.update({
        where: { id: body.id },
        data: {
          ...(body.name ? { name: body.name.trim() } : {}),
          ...(body.icon !== undefined ? { icon: body.icon } : {}),
          ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
          ...(body.status ? { status: body.status } : {}),
        },
      });
      return NextResponse.json({ category: cat });
    }

    const entry = await prisma.phoneEntry.update({
      where: { id: body.id },
      data: {
        ...(body.name ? { name: body.name.trim() } : {}),
        ...(body.phone ? { phone: body.phone.trim() } : {}),
        ...(body.address !== undefined ? { address: body.address?.trim() || null } : {}),
        ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.isHot !== undefined ? { isHot: body.isHot } : {}),
        ...(body.status ? { status: body.status } : {}),
      },
    });
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("bianmin PATCH failed", error);
    return NextResponse.json({ error: "更新失败" }, { status: 503 });
  }
}

// DELETE: 删除分类或电话条目
export async function DELETE(request: Request) {
  if (!requireAuth(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!hasRole(request, ["admin"])) return NextResponse.json({ error: "仅管理员可删除" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

  try {
    if (body.type === "category") {
      await prisma.phoneCategory.delete({ where: { id: body.id } });
    } else {
      await prisma.phoneEntry.delete({ where: { id: body.id } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("bianmin DELETE failed", error);
    return NextResponse.json({ error: "删除失败" }, { status: 503 });
  }
}
