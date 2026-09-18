import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/ai/conversations
 * 获取当前登录用户的 AI 历史会话列表（不携带巨量 messages，提升性能）
 */
export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.id === "env-admin") {
      return NextResponse.json({ conversations: [], isGuest: true });
    }

    const conversations = await prisma.aiConversation.findMany({
      where: {
        userId: session.id,
        deletedAt: null,
        status: { not: "DELETED" },
      },
      select: {
        id: true,
        title: true,
        status: true,
        lastMessageAt: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ conversations, isGuest: false });
  } catch (err: any) {
    console.error("[AiConversations] GET error:", err);
    return NextResponse.json({ error: err.message || "获取会话列表失败" }, { status: 500 });
  }
}

/**
 * POST /api/ai/conversations
 * 新建会话
 */
export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.id === "env-admin") {
      return NextResponse.json({ error: "请登录后使用会话管理功能" }, { status: 401 });
    }

    let title = "新对话";
    try {
      const body = await req.json();
      if (body?.title && typeof body.title === "string") {
        title = body.title.trim().slice(0, 25) || "新对话";
      }
    } catch {
      // 容忍空 body
    }

    const conversation = await prisma.aiConversation.create({
      data: {
        userId: session.id,
        title,
        status: "ACTIVE",
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({ conversation });
  } catch (err: any) {
    console.error("[AiConversations] POST error:", err);
    return NextResponse.json({ error: err.message || "创建新会话失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/ai/conversations
 * 清空全部历史（需强二次确认）
 */
export async function DELETE(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.id === "env-admin") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 软删除当前用户的所有生活助手会话
    await prisma.aiConversation.updateMany({
      where: { userId: session.id, deletedAt: null },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[AiConversations] Bulk DELETE error:", err);
    return NextResponse.json({ error: err.message || "清空会话失败" }, { status: 500 });
  }
}
