import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { processAssistantMessage } from "@/lib/ai-assistant-core";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/ai/conversations/[id]/messages
 * 在指定会话中发送新消息并获取真实检索结果
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await getSession(req);
    if (!session || session.id === "env-admin") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const body = await req.json();
    const message = (body?.message || body?.content || "").trim();

    if (!message) {
      return NextResponse.json({ error: "消息内容不能为空" }, { status: 400 });
    }

    // 1. 防越权校验
    const conversation = await prisma.aiConversation.findFirst({
      where: {
        id: conversationId,
        userId: session.id,
        deletedAt: null,
      },
      include: {
        _count: { select: { messages: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "会话不存在或无权访问" }, { status: 404 });
    }

    // 2. 消息发送一致性：先持久化 User Message
    const userMsg = await prisma.aiMessage.create({
      data: {
        conversationId,
        role: "user",
        content: message,
      },
    });

    // 3. 执行真实数据检索、意图分析与 AI 生成
    try {
      const result = await processAssistantMessage({
        message,
        userId: session.id,
        conversationId,
        isFirstMessage: conversation._count.messages === 0,
      });

      // 4. 持久化 Assistant Message
      const botMsg = await prisma.aiMessage.create({
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

      // 5. 若为首条消息或标题仍为“新对话”，自动更新为精简的智能标题
      const updateData: any = {
        lastMessageAt: new Date(),
      };
      if (conversation.title === "新对话" || conversation._count.messages === 0) {
        updateData.title = result.conversationTitle || message.slice(0, 20);
      }

      await prisma.aiConversation.update({
        where: { id: conversationId },
        data: updateData,
      });

      return NextResponse.json({
        reply: botMsg.content,
        resources: result.resources,
        sources: result.resources,
        suggestedFollowUps: result.suggestedFollowUps,
        totalMatches: result.totalMatches,
        moreUrl: result.moreUrl,
        moreText: result.moreText,
        isFallback: result.isFallback,
        conversationId,
        userMessage: {
          id: userMsg.id,
          role: userMsg.role,
          content: userMsg.content,
          createdAt: userMsg.createdAt,
        },
        assistantMessage: {
          id: botMsg.id,
          role: botMsg.role,
          content: botMsg.content,
          resources: result.resources,
          suggestedFollowUps: result.suggestedFollowUps,
          totalMatches: result.totalMatches,
          moreUrl: result.moreUrl,
          moreText: result.moreText,
          isFallback: result.isFallback,
          createdAt: botMsg.createdAt,
        },
        conversationTitle: updateData.title || conversation.title,
      });
    } catch (aiErr: any) {
      console.error("[AiAssistant] Generation failed:", aiErr);
      const fallbackBotMsg = await prisma.aiMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: "抱歉，检索或回答组织过程中发生短暂波动，请点击下方重试按钮重新查询。",
          metadataJson: JSON.stringify({ status: "error" }),
        },
      });

      return NextResponse.json(
        {
          reply: fallbackBotMsg.content,
          resources: [],
          sources: [],
          error: "AI 生成异常，请重试",
          userMessage: {
            id: userMsg.id,
            role: userMsg.role,
            content: userMsg.content,
            createdAt: userMsg.createdAt,
          },
          assistantMessage: {
            id: fallbackBotMsg.id,
            role: fallbackBotMsg.role,
            content: fallbackBotMsg.content,
            resources: [],
            suggestedFollowUps: ["重新尝试", "查看本地便民大厅"],
            status: "error",
            createdAt: fallbackBotMsg.createdAt,
          },
        },
        { status: 200 }
      );
    }
  } catch (err: any) {
    console.error("[AiConversation Message] Route error:", err);
    return NextResponse.json({ error: err.message || "发送失败，请稍后重试" }, { status: 500 });
  }
}
