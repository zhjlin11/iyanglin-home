import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/wechat/welcome-flows
 * 获取欢迎流程列表（含步骤）
 */
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const flows = await prisma.welcomeFlow.findMany({
      include: {
        steps: { orderBy: { order: "asc" } },
      },
      orderBy: [{ isDefault: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: flows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "获取失败" }, { status: 500 });
  }
}

/**
 * POST /api/admin/wechat/welcome-flows
 * 创建/更新欢迎流程（含步骤）
 */
export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, scene, description, enabled, isDefault, priority, steps } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "流程名称不能为空" }, { status: 400 });
    }

    // 如果设为默认，取消其他默认
    if (isDefault) {
      await prisma.welcomeFlow.updateMany({
        where: { isDefault: true, ...(id ? { id: { not: id } } : {}) },
        data: { isDefault: false },
      });
    }

    if (id) {
      // 更新
      const flow = await prisma.welcomeFlow.update({
        where: { id },
        data: {
          name: name.trim(),
          scene: scene?.trim() || null,
          description: description || null,
          enabled: enabled !== false,
          isDefault: isDefault || false,
          priority: priority || 0,
        },
      });

      // 删除旧步骤，重建
      if (Array.isArray(steps)) {
        await prisma.welcomeFlowStep.deleteMany({ where: { flowId: id } });
        for (let i = 0; i < steps.length; i++) {
          const s = steps[i];
          await prisma.welcomeFlowStep.create({
            data: {
              flowId: id,
              order: i,
              type: s.type || "TEXT",
              content: s.content || null,
              title: s.title || null,
              description: s.description || null,
              imageUrl: s.imageUrl || null,
              linkUrl: s.linkUrl || null,
              mediaId: s.mediaId || null,
              enabled: s.enabled !== false,
              delayMs: s.delayMs || 0,
            },
          });
        }
      }

      const updated = await prisma.welcomeFlow.findUnique({
        where: { id },
        include: { steps: { orderBy: { order: "asc" } } },
      });

      return NextResponse.json({ success: true, data: updated });
    } else {
      // 创建
      const flow = await prisma.welcomeFlow.create({
        data: {
          name: name.trim(),
          scene: scene?.trim() || null,
          description: description || null,
          enabled: enabled !== false,
          isDefault: isDefault || false,
          priority: priority || 0,
          steps: {
            create: (steps || []).map((s: any, i: number) => ({
              order: i,
              type: s.type || "TEXT",
              content: s.content || null,
              title: s.title || null,
              description: s.description || null,
              imageUrl: s.imageUrl || null,
              linkUrl: s.linkUrl || null,
              mediaId: s.mediaId || null,
              enabled: s.enabled !== false,
              delayMs: s.delayMs || 0,
            })),
          },
        },
        include: { steps: { orderBy: { order: "asc" } } },
      });

      return NextResponse.json({ success: true, data: flow });
    }
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "该渠道场景已关联其他流程" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "保存失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/wechat/welcome-flows?id=xxx
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

    // 步骤会级联删除（onDelete: Cascade）
    await prisma.welcomeFlow.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "已删除" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "删除失败" }, { status: 500 });
  }
}
