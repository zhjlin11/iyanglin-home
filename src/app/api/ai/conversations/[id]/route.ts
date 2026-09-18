import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ai/conversations/[id]
 * 获取特定会话的历史消息（防越权：严格限制 userId 为当前登录用户）
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await getSession(req);
    if (!session || session.id === "env-admin") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    // 严格按照 id + userId 查询，杜绝越权
    const conversation = await prisma.aiConversation.findFirst({
      where: {
        id,
        userId: session.id,
        deletedAt: null,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 100,
        },
      },
    });

    if (!conversation) {
      // 若会话不存在或不属于当前用户，返回 404 / 403
      return NextResponse.json({ error: "会话不存在或无权访问" }, { status: 404 });
    }

    // 格式化输出消息中的资源字段
    const formattedMessages = conversation.messages.map((m) => {
      let resources = [];
      let metadata: any = {};
      try {
        if (m.sourcesJson) resources = JSON.parse(m.sourcesJson);
        else if (m.resourcesJson) resources = JSON.parse(m.resourcesJson);
      } catch {}
      try {
        if (m.metadataJson) metadata = JSON.parse(m.metadataJson);
      } catch {}

      return {
        id: m.id,
        role: m.role,
        content: m.content,
        resources,
        metadata,
        createdAt: m.createdAt,
      };
    });

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        status: conversation.status,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: formattedMessages,
      },
    });
  } catch (err: any) {
    console.error("[AiConversation Detail] GET error:", err);
    return NextResponse.json({ error: err.message || "获取会话详情失败" }, { status: 500 });
  }
}

/**
 * PATCH /api/ai/conversations/[id]
 * 重命名会话或归档（防越权）
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await getSession(req);
    if (!session || session.id === "env-admin") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const title = body?.title?.trim()?.slice(0, 30);
    const status = body?.status;

    // 先校验会话所有权
    const existing = await prisma.aiConversation.findFirst({
      where: { id, userId: session.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "会话不存在或无权操作" }, { status: 404 });
    }

    const updated = await prisma.aiConversation.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json({ success: true, conversation: updated });
  } catch (err: any) {
    console.error("[AiConversation Update] PATCH error:", err);
    return NextResponse.json({ error: err.message || "更新会话失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/ai/conversations/[id]
 * 删除当前会话（防越权，软删除）
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getSession(req);
    if (!session || session.id === "env-admin") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;

    // 校验所有权
    const existing = await prisma.aiConversation.findFirst({
      where: { id, userId: session.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "会话不存在或无权操作" }, { status: 404 });
    }

    // 软删除
    await prisma.aiConversation.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "ARCHIVED",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[AiConversation Delete] DELETE error:", err);
    return NextResponse.json({ error: err.message || "删除会话失败" }, { status: 500 });
  }
}
