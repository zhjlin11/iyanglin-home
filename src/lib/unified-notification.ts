import { prisma } from "@/lib/prisma";
import { enqueueJob, registerQueueHandler } from "@/lib/async-queue";

export type NotificationChannel = "IN_APP" | "WECHAT" | "SMS" | "EMAIL";

export interface SendNotificationParams {
  userId: string;
  title: string;
  content: string;
  category?: string; // ALL | ORDER | INTERACTION | SYSTEM | PROMOTION
  type: string;
  link?: string;
  channels?: NotificationChannel[];
  dedupeKey?: string; // 消息去重键，防止同一事件多次推送
  meta?: any;
}

// 内存防重复窗口 (10秒内相同 dedupeKey 自动过滤)
const dedupeCache = new Map<string, number>();

/**
 * 统一多渠道消息发送引擎 (带防重、事务优先、异步队列降级)
 */
export async function sendUnifiedNotification(params: SendNotificationParams) {
  if (params.dedupeKey) {
    const lastSent = dedupeCache.get(params.dedupeKey);
    const now = Date.now();
    if (lastSent && now - lastSent < 10000) {
      console.log(`[NOTIF_DEDUPE] Filtered duplicate notification for key: ${params.dedupeKey}`);
      return null;
    }
    dedupeCache.set(params.dedupeKey, now);
    if (dedupeCache.size > 5000) {
      for (const [k, ts] of dedupeCache.entries()) {
        if (now - ts > 60000) dedupeCache.delete(k);
      }
    }
  }

  const channels = params.channels || ["IN_APP"];

  // 1. 站内消息 (即时写入)
  let inAppNotif = null;
  if (channels.includes("IN_APP")) {
    try {
      inAppNotif = await prisma.notification.create({
        data: {
          userId: params.userId,
          category: params.category || "SYSTEM",
          type: params.type,
          title: params.title,
          content: params.content,
          link: params.link,
        },
      });
    } catch (e) {
      console.error("[NOTIF_IN_APP] Failed to create in-app notification:", e);
    }
  }

  // 2. 外部渠道 (微信服务号 / 短信) 异步排队分发，避免阻塞调用方
  if (channels.includes("WECHAT") || channels.includes("SMS")) {
    await enqueueJob({
      queueName: "NOTIFICATION",
      handler: "sendExternalNotification",
      payload: {
        userId: params.userId,
        title: params.title,
        content: params.content,
        link: params.link,
        channels: channels.filter((c) => c !== "IN_APP"),
      },
    });
  }

  return inAppNotif;
}

// 注册异步外部通知分发器
registerQueueHandler("sendExternalNotification", async (payload: any) => {
  const { userId, title, content, link, channels } = payload;
  if (channels.includes("WECHAT")) {
    const follower = await prisma.wechatFollower.findFirst({
      where: { userId, subscribed: true },
    });
    if (follower) {
      console.log(`[WECHAT_ASYNC_DISPATCH] Dispatching to openId: ${follower.openId}, title: ${title}`);
    }
  }
});
