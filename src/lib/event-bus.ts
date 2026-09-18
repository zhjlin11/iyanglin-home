import { prisma } from "@/lib/prisma";
import { enqueueJob } from "@/lib/async-queue";

export type BusinessEventType =
  | "USER_REGISTERED"
  | "USER_LOGIN"
  | "JOB_PUBLISHED"
  | "HOUSE_PUBLISHED"
  | "SERVICE_ORDER_CREATED"
  | "PAYMENT_SUCCEEDED"
  | "REFUND_SUCCEEDED"
  | "ORDER_COMPLETED"
  | "LEAD_CREATED"
  | "LEAD_CONTACTED"
  | "REVIEW_CREATED"
  | "MEMBERSHIP_ACTIVATED"
  | "PROMOTION_STARTED"
  | "TASK_CREATED"
  | "CANDIDATE_APPLIED"
  | "INTERVIEW_SCHEDULED";

export interface PublishEventParams {
  eventType: BusinessEventType | string;
  userId?: string;
  organizationId?: string;
  resourceType?: string;
  resourceId?: string;
  payload?: Record<string, any>;
  source?: "WEB" | "MINI_PROGRAM" | "WORKSPACE" | "OPEN_API" | "SYSTEM" | "AGENT";
}

/**
 * 业务事件总线核心发布接口 (Append-Only)
 * 写入不可篡改的事件日志，并自动分发至异步可靠队列进行消费
 */
export async function publishEvent(params: PublishEventParams) {
  try {
    const payloadJson = JSON.stringify(params.payload || {});

    // 1. 严格只追加写入事件表
    const event = await prisma.businessEvent.create({
      data: {
        eventType: params.eventType,
        userId: params.userId,
        organizationId: params.organizationId,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        payloadJson,
        source: params.source || "SYSTEM",
        status: "PENDING",
      },
    });

    // 2. 投递至可靠异步任务队列进行非阻塞消费
    await enqueueJob({
      queueName: "BUSINESS_EVENTS",
      handler: "BUSINESS_EVENT_DISPATCH",
      payload: {
        eventId: event.id,
        eventType: event.eventType,
        organizationId: event.organizationId,
        userId: event.userId,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        payload: params.payload || {},
      },
      maxRetries: 3,
    });

    return { success: true, eventId: event.id };
  } catch (err: any) {
    console.error("[EventBus] Failed to publish event:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 消费单个业务事件 (由队列 Worker 调用)
 */
export async function consumeEvent(eventId: string) {
  const event = await prisma.businessEvent.findUnique({
    where: { id: eventId },
  });

  if (!event || event.status === "PROCESSED") return;

  try {
    let payload = {};
    try {
      payload = JSON.parse(event.payloadJson);
    } catch {}

    // A. 触发自动化工作流引擎
    try {
      const { triggerWorkflowOnEvent } = await import("@/lib/workflow/workflow-engine");
      await triggerWorkflowOnEvent({
        eventId: event.id,
        eventType: event.eventType,
        organizationId: event.organizationId || undefined,
        userId: event.userId || undefined,
        payload,
      });
    } catch (weErr) {
      console.warn("[EventBus] Workflow trigger warning:", weErr);
    }

    // B. 触发开发者 Webhook 分发
    try {
      const { dispatchWebhooks } = await import("@/lib/developer/developer-service");
      await dispatchWebhooks({
        eventType: event.eventType,
        organizationId: event.organizationId || undefined,
        payload: {
          eventId: event.id,
          eventType: event.eventType,
          occurredAt: event.occurredAt.toISOString(),
          data: payload,
        },
      });
    } catch (whErr) {
      console.warn("[EventBus] Webhook dispatch warning:", whErr);
    }

    // 标记为成功已处理
    await prisma.businessEvent.update({
      where: { id: eventId },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
      },
    });
  } catch (consumeErr: any) {
    console.error(`[EventBus] Error processing event ${eventId}:`, consumeErr);
    const retryCount = event.retryCount + 1;
    const isDead = retryCount >= 3;

    await prisma.businessEvent.update({
      where: { id: eventId },
      data: {
        retryCount,
        status: isDead ? "DEAD_LETTER" : "FAILED",
        error: consumeErr.message,
      },
    });
  }
}
