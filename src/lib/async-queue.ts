import { prisma } from "@/lib/prisma";

export type QueueHandler = (payload: any) => Promise<any>;

const HANDLERS = new Map<string, QueueHandler>();

/**
 * 注册异步任务处理器
 */
export function registerQueueHandler(handlerName: string, fn: QueueHandler) {
  HANDLERS.set(handlerName, fn);
}

/**
 * 任务入队 (轻量、可靠、持久化在数据库中)
 */
export async function enqueueJob(params: {
  queueName?: string;
  handler: string;
  payload: any;
  runAt?: Date;
  maxRetries?: number;
}) {
  const job = await prisma.asyncJob.create({
    data: {
      queueName: params.queueName || "DEFAULT",
      handler: params.handler,
      payloadJson: JSON.stringify(params.payload || {}),
      runAt: params.runAt || new Date(),
      maxRetries: params.maxRetries || 3,
      status: "PENDING",
    },
  });

  // 非阻塞触发消费
  setTimeout(() => {
    processNextJobs(1).catch(() => {});
  }, 100);

  return job;
}

/**
 * 消费并执行待处理任务
 */
export async function processNextJobs(limit = 5) {
  const now = new Date();
  const jobs = await prisma.asyncJob.findMany({
    where: {
      status: "PENDING",
      runAt: { lte: now },
    },
    take: limit,
    orderBy: { runAt: "asc" },
  });

  for (const job of jobs) {
    await prisma.asyncJob.update({
      where: { id: job.id },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    try {
      const handlerFn = HANDLERS.get(job.handler);
      if (!handlerFn) {
        throw new Error(`未找到任务处理器: ${job.handler}`);
      }

      const payload = JSON.parse(job.payloadJson || "{}");
      await handlerFn(payload);

      await prisma.asyncJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          errorMsg: null,
        },
      });
    } catch (err: any) {
      const isLastRetry = job.retryCount + 1 >= job.maxRetries;
      await prisma.asyncJob.update({
        where: { id: job.id },
        data: {
          status: isLastRetry ? "FAILED" : "PENDING",
          retryCount: job.retryCount + 1,
          errorMsg: err?.message || String(err),
          runAt: new Date(Date.now() + Math.pow(2, job.retryCount + 1) * 1000 * 10), // 指数退避
        },
      });
    }
  }
}
