import { prisma } from "@/lib/prisma";
import { searchResourcesUnified } from "@/lib/resource-service";
import { createApprovalRequest } from "./approval-service";

export type RiskLevel = "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK";

export interface AgentToolDefinition {
  name: string;
  description: string;
  riskLevel: RiskLevel;
  requiredScopes: string[];
  execute: (params: {
    input: any;
    userId: string;
    organizationId?: string;
  }) => Promise<{
    success: boolean;
    data?: any;
    error?: string;
    requiresApproval?: boolean;
    approvalRequestId?: string;
    canRollback?: boolean;
    rollbackPayload?: any;
  }>;
}

export const AGENT_TOOLS: Record<string, AgentToolDefinition> = {
  // 1. 跨频道资源检索 (LOW_RISK)
  search_resources: {
    name: "search_resources",
    description: "检索杨林生活网真实招聘、房产、服务或好店资源",
    riskLevel: "LOW_RISK",
    requiredScopes: ["resources:read"],
    execute: async ({ input, organizationId }) => {
      const results = await searchResourcesUnified({
        keyword: input.keyword,
        resourceType: input.resourceType,
        organizationId,
        limit: input.limit || 5,
      });
      return { success: true, data: results, canRollback: false };
    },
  },

  // 2. 创建组织内部待办任务 (LOW_RISK - 支持 Undo 回滚)
  create_task: {
    name: "create_task",
    description: "在当前组织空间创建待办事项或员工跟进任务",
    riskLevel: "LOW_RISK",
    requiredScopes: ["tasks:write"],
    execute: async ({ input, userId, organizationId }) => {
      if (!organizationId) {
        return { success: false, error: "必须在具体企业或商户空间内创建任务" };
      }
      if (!input.title?.trim()) {
        return { success: false, error: "任务标题不能为空" };
      }

      const task = await prisma.organizationTask.create({
        data: {
          organizationId,
          title: input.title.trim(),
          content: input.description || `由 AI Agent 自动生成: ${input.title}`,
          type: "CUSTOMER_CARE",
          priority: input.priority || "NORMAL",
          status: "PENDING",
          assigneeId: input.assigneeId || userId,
        },
      });

      return {
        success: true,
        data: task,
        canRollback: true,
        rollbackPayload: { action: "delete_task", taskId: task.id },
      };
    },
  },

  // 3. 记录客户跟进进度 (LOW_RISK)
  create_followup: {
    name: "create_followup",
    description: "记录商机或客户的最新沟通跟进备注",
    riskLevel: "LOW_RISK",
    requiredScopes: ["crm:write"],
    execute: async ({ input, userId, organizationId }) => {
      if (!input.leadId && !input.customerId) {
        return { success: false, error: "必须指定跟进的线索或客户ID" };
      }

      if (input.leadId) {
        const lead = await prisma.serviceLead.findUnique({
          where: { id: input.leadId },
        });
        if (!lead) {
          return { success: false, error: "未找到对应线索" };
        }
        if (organizationId) {
          const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { providerId: true },
          });
          if (org?.providerId && lead.providerId !== org.providerId) {
            return { success: false, error: "权限不足：不可跨组织记录跟进" };
          }
        }

        const followup = await prisma.leadFollowUp.create({
          data: {
            leadId: input.leadId,
            content: input.content || "AI Agent 自动登记跟进待办",
            stage: input.stage || "FOLLOWING",
            operatorId: userId || "system",
            operatorName: input.operatorName || "AI 助理",
          },
        });

        return {
          success: true,
          data: followup,
          canRollback: true,
          rollbackPayload: { action: "delete_followup", followupId: followup.id },
        };
      }

      return { success: true, data: { message: "客户备忘已更新" } };
    },
  },

  // 4. 生成营销活动草稿 (LOW_RISK)
  create_campaign_draft: {
    name: "create_campaign_draft",
    description: "为商户或企业生成优惠券或营销活动策划草稿（仅保存为草稿，严禁自动群发）",
    riskLevel: "LOW_RISK",
    requiredScopes: ["marketing:write"],
    execute: async ({ input, organizationId }) => {
      if (!organizationId) {
        return { success: false, error: "必须在商户空间创建活动草稿" };
      }

      // 创建活动草稿对象
      const draft = {
        organizationId,
        title: input.title || "初秋便民老客关怀活动（草稿）",
        couponAmount: input.couponAmount || 10,
        minSpend: input.minSpend || 50,
        targetSegment: input.targetSegment || "DORMANT_CUSTOMERS",
        status: "DRAFT",
        note: "AI 生成营销草稿，需商户负责人人工确认后方可发布",
      };

      return { success: true, data: draft, canRollback: false };
    },
  },

  // 5. 检索知识库 (LOW_RISK)
  query_knowledge_base: {
    name: "query_knowledge_base",
    description: "查询平台规则、经开区政策或本组织私有内部知识",
    riskLevel: "LOW_RISK",
    requiredScopes: ["knowledge:read"],
    execute: async ({ input, organizationId }) => {
      const kw = input.keyword?.trim() || "";
      const articles = await prisma.knowledgeArticle.findMany({
        where: {
          status: "VERIFIED",
          OR: [
            { organizationId: null }, // 平台公共知识
            ...(organizationId ? [{ organizationId }] : []), // 本组织私有知识
          ],
          ...(kw ? { title: { contains: kw, mode: "insensitive" } } : {}),
        },
        take: 3,
        orderBy: { helpfulCount: "desc" },
      });

      return {
        success: true,
        data: articles.map((a) => ({
          title: a.title,
          category: a.category,
          content: a.content.slice(0, 300),
          source: a.source || "杨林生活网官方知识库",
        })),
      };
    },
  },

  // 6. 批量营销群发申请 (MEDIUM_RISK - 触发人工审批)
  batch_marketing_draft: {
    name: "batch_marketing_draft",
    description: "大批量向客户推送营销消息或优惠券（属于中风险动作，强制进入人工审批）",
    riskLevel: "MEDIUM_RISK",
    requiredScopes: ["marketing:admin"],
    execute: async ({ input, userId, organizationId }) => {
      const approval = await createApprovalRequest({
        organizationId,
        requesterId: userId,
        actionType: "BULK_MARKETING",
        title: `批量营销推送审批：${input.title || "全员老客关怀券"}`,
        description: `计划向 ${input.recipientCount || "若干"} 位客户推送营销活动，涉及优惠券发放。`,
        payload: input,
        riskLevel: "MEDIUM_RISK",
      });

      return {
        success: true,
        requiresApproval: true,
        approvalRequestId: approval.id,
        data: { message: "已触发中风险保护机制，已生成审批申请单，需负责人审核确认。" },
      };
    },
  },

  // 7. 高风险禁止动作：自动退款 (HIGH_RISK - 严禁执行)
  refund_order: {
    name: "refund_order",
    description: "直接触发订单原路退款（高风险动作，系统硬拦截）",
    riskLevel: "HIGH_RISK",
    requiredScopes: [],
    execute: async () => {
      return {
        success: false,
        error: "【安全风控拦截】根据 P8 平台铁律，严禁 AI Agent 直接触发任何退款、调账或资金变动！",
      };
    },
  },

  // 8. 高风险禁止动作：修改订单支付金额 (HIGH_RISK - 严禁执行)
  modify_payment_amount: {
    name: "modify_payment_amount",
    description: "直接修改订单待支付金额（高风险动作，系统硬拦截）",
    riskLevel: "HIGH_RISK",
    requiredScopes: [],
    execute: async () => {
      return {
        success: false,
        error: "【安全风控拦截】根据 P8 平台铁律，严禁 AI Agent 篡改交易订单金额！",
      };
    },
  },

  // 9. 高风险禁止动作：自动封禁用户 (HIGH_RISK - 严禁执行)
  ban_user: {
    name: "ban_user",
    description: "封禁用户账号或吊销系统权限（高风险动作，系统硬拦截）",
    riskLevel: "HIGH_RISK",
    requiredScopes: [],
    execute: async () => {
      return {
        success: false,
        error: "【安全风控拦截】根据 P8 平台铁律，严禁 AI Agent 封禁账号或注销用户，必须由超管人工操作！",
      };
    },
  },

  // 10. 低风险动作回滚 (Undo)
  undo_action: {
    name: "undo_action",
    description: "撤销此前由 AI Agent 自动创建的任务或跟进记录",
    riskLevel: "LOW_RISK",
    requiredScopes: ["tasks:write"],
    execute: async ({ input, organizationId }) => {
      const { actionLogId } = input;
      if (!actionLogId) return { success: false, error: "缺少 actionLogId" };

      const log = await prisma.agentActionLog.findUnique({
        where: { id: actionLogId },
      });

      if (!log || log.rollbackStatus !== "CAN_ROLLBACK" || !log.rollbackPayloadJson) {
        return { success: false, error: "该动作不支持撤销或已经被撤销" };
      }

      if (organizationId && log.organizationId && log.organizationId !== organizationId) {
        return { success: false, error: "不可跨组织撤销动作" };
      }

      try {
        const payload = JSON.parse(log.rollbackPayloadJson);
        if (payload.action === "delete_task" && payload.taskId) {
          await prisma.organizationTask.delete({ where: { id: payload.taskId } }).catch(() => {});
        } else if (payload.action === "delete_followup" && payload.followupId) {
          await prisma.leadFollowUp.delete({ where: { id: payload.followupId } }).catch(() => {});
        }

        await prisma.agentActionLog.update({
          where: { id: actionLogId },
          data: { rollbackStatus: "ROLLED_BACK" },
        });

        return { success: true, data: { message: "已成功撤销该动作！" } };
      } catch (err: any) {
        return { success: false, error: `撤销失败: ${err.message}` };
      }
    },
  },
};
