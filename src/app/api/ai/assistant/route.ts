import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { processAssistantMessage } from "@/lib/ai-assistant-core";

/**
 * POST /api/ai/assistant
 * 问问杨林生活助手对话核心接口 (兼容独立快速提问、游客体验及会话持久化)
 */
export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    const userId = session?.id !== "env-admin" ? session?.id : undefined;

    const body = await req.json();
    const message = (body.message || body.query || "").trim();
    let conversationId = body.conversationId as string | undefined;

    if (!message) {
      return NextResponse.json({ error: "咨询内容不能为空" }, { status: 400 });
    }

    // 1. 如果已登录且提供了 conversationId，校验该会话是否属于当前用户（防越权）
    let activeConversation = null;
    if (userId && conversationId) {
      activeConversation = await prisma.aiConversation.findFirst({
        where: { id: conversationId, userId, deletedAt: null },
        include: { _count: { select: { messages: true } } },
      });
      if (!activeConversation) {
        return NextResponse.json({ error: "会话不存在或无权访问" }, { status: 404 });
      }
    } else if (userId && !conversationId) {
      // 已登录但未建会话，自动创建新会话
      activeConversation = await prisma.aiConversation.create({
        data: {
          userId,
          title: "新对话",
          status: "ACTIVE",
          lastMessageAt: new Date(),
        },
        include: { _count: { select: { messages: true } } },
      });
      conversationId = activeConversation.id;
    }

    // 2. 如果已存在会话，先持久化 User Message
    if (activeConversation && conversationId) {
      await prisma.aiMessage.create({
        data: {
          conversationId,
          role: "user",
          content: message,
        },
      });
    }

    // 3. 执行核心业务检索与回答生成
    const result = await processAssistantMessage({
      message,
      userId,
      conversationId,
      isFirstMessage: activeConversation ? activeConversation._count.messages === 0 : true,
    });

    // 4. 持久化 Assistant 回答并更新会话
    if (activeConversation && conversationId) {
      await prisma.aiMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: result.reply,
          resourcesJson: JSON.stringify(result.resources),
          sourcesJson: JSON.stringify(result.resources),
          intentJson: JSON.stringify(result.intent),
          metadataJson: JSON.stringify({
            suggestedFollowUps: result.suggestedFollowUps,
            isFallback: result.isFallback,
            totalMatches: result.totalMatches,
            moreUrl: result.moreUrl,
            moreText: result.moreText,
          }),
        },
      });

      const updateData: any = { lastMessageAt: new Date() };
      if (activeConversation.title === "新对话" || activeConversation._count.messages === 0) {
        updateData.title = result.conversationTitle || message.slice(0, 20);
      }
      await prisma.aiConversation.update({
        where: { id: conversationId },
        data: updateData,
      });
    }

    return NextResponse.json({
      reply: result.reply,
      isFallback: result.isFallback,
      intent: result.intent,
      resources: result.resources,
      suggestedFollowUps: result.suggestedFollowUps,
      totalMatches: result.totalMatches,
      moreUrl: result.moreUrl,
      moreText: result.moreText,
      conversationId,
      conversationTitle: result.conversationTitle,
      isGuest: !userId,
    });
  } catch (err: any) {
    console.error("[AssistantRoute] Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "生活助手处理失败，请稍后重试" },
      { status: 500 }
    );
  }
}
