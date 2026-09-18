import { prisma } from "@/lib/prisma";
import { sendUnifiedNotification } from "@/lib/unified-notification";

export interface WorkflowContext {
  eventId?: string;
  eventType?: string;
  organizationId?: string;
  userId?: string;
  payload: Record<string, any>;
  depth?: number;
}

/**
 * 预置 7 大经典业务工作流规则模板
 */
export const BUILTIN_WORKFLOW_TEMPLATES = [
  {
    name: "订单完成·履约评价邀请",
    triggerEvent: "ORDER_COMPLETED",
    actionType: "SEND_NOTIFICATION",
    description: "在服务订单确认完工后，自动向客户推送真实评价邀请",
  },
  {
    name: "新线索录入·即时指派跟进",
    triggerEvent: "LEAD_CREATED",
    actionType: "CREATE_TASK",
    description: "需求大厅生成新需求线索时，自动为组织生成高优先级跟进工单",
  },
  {
    name: "候选人投递·自动通知HR",
    triggerEvent: "CANDIDATE_APPLIED",
    actionType: "SEND_NOTIFICATION",
    description: "求职者投递职位时，向企业HR发送即时待办提醒",
  },
  {
    name: "服务好评·奖励老客复购券",
    triggerEvent: "REVIEW_CREATED",
    actionType: "ISSUE_COUPON",
    description: "客户给出5星好评时，自动为其发放5元便民复购代金券",
  },
];

/**
 * 确保内置自动化规则在数据库中就绪
 */
export async function ensureBuiltinWorkflows() {
  for (const t of BUILTIN_WORKFLOW_TEMPLATES) {
    const existing = await prisma.workflowRule.findFirst({
      where: { name: t.name, organizationId: null },
    });
    if (!existing) {
      await prisma.workflowRule.create({
        data: {
          name: t.name,
          description: t.description,
          triggerType: "EVENT",
          triggerEvent: t.triggerEvent,
          actionType: t.actionType,
          enabled: true,
          depthLimit: 3,
        },
      });
    }
  }
}

/**
 * 当业务事件触发时执行工作流规则
 */
export async function triggerWorkflowOnEvent(context: WorkflowContext) {
  const currentDepth = context.depth || 1;
  if (currentDepth > 3) {
    console.warn(`[WorkflowEngine] Max recursion depth reached (${currentDepth}), skipping event.`);
    return;
  }

  await ensureBuiltinWorkflows();

  // 匹配全局或当前租户匹配的活跃规则
  const rules = await prisma.workflowRule.findMany({
    where: {
      enabled: true,
      triggerType: "EVENT",
      triggerEvent: context.eventType,
      OR: [
        { organizationId: null }, // 全局规则
        ...(context.organizationId ? [{ organizationId: context.organizationId }] : []),
      ],
    },
  });

  for (const rule of rules) {
    const startTime = Date.now();
    let status = "SUCCESS";
    let error: string | null = null;
    let outputJson = "{}";

    try {
      // 执行动作
      if (rule.actionType === "SEND_NOTIFICATION" && context.userId) {
        await sendUnifiedNotification({
          userId: context.userId,
          title: `【杨林生活自动化】${rule.name}`,
          content: "系统已自动为您处理相关业务流转并记录通知。",
          category: "SYSTEM",
          type: "SYSTEM_NOTIFICATION",
          dedupeKey: `wf_${rule.id}_${context.eventId || Date.now()}`,
        });
        outputJson = JSON.stringify({ notified: true, userId: context.userId });
      } else if (rule.actionType === "CREATE_TASK" && context.organizationId) {
        const task = await prisma.organizationTask.create({
          data: {
            organizationId: context.organizationId,
            title: `【自动化待办】${rule.name}`,
            content: `由自动化总线触发: 事件 [${context.eventType}]`,
            type: "ORDER_SERVICE",
            priority: "NORMAL",
            status: "PENDING",
          },
        });
        outputJson = JSON.stringify({ createdTaskId: task.id });
      } else {
        outputJson = JSON.stringify({ executed: true, actionType: rule.actionType });
      }

      // 更新成功计数
      await prisma.workflowRule.update({
        where: { id: rule.id },
        data: {
          executionCount: { increment: 1 },
          successCount: { increment: 1 },
          lastExecutedAt: new Date(),
        },
      });
    } catch (err: any) {
      status = "FAILED";
      error = err.message;
      await prisma.workflowRule.update({
        where: { id: rule.id },
        data: {
          executionCount: { increment: 1 },
          failureCount: { increment: 1 },
          lastExecutedAt: new Date(),
        },
      });
    }

    // 记录执行历史
    await prisma.workflowExecution.create({
      data: {
        ruleId: rule.id,
        triggerEventId: context.eventId,
        organizationId: context.organizationId,
        status,
        depth: currentDepth,
        inputJson: JSON.stringify(context.payload || {}),
        outputJson,
        error,
        durationMs: Date.now() - startTime,
      },
    });
  }
}
