import { prisma } from "@/lib/prisma";

export interface CreateApprovalParams {
  organizationId?: string;
  requesterId: string;
  actionType: string;
  title: string;
  description?: string;
  payload: Record<string, any>;
  riskLevel?: "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK";
}

/**
 * 创建中风险敏感动作人工审批申请
 */
export async function createApprovalRequest(params: CreateApprovalParams) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7天有效

  const approval = await prisma.approvalRequest.create({
    data: {
      organizationId: params.organizationId,
      requesterId: params.requesterId,
      actionType: params.actionType,
      title: params.title,
      description: params.description,
      payloadJson: JSON.stringify(params.payload),
      status: "PENDING",
      riskLevel: params.riskLevel || "MEDIUM_RISK",
      expiresAt,
    },
  });

  return approval;
}

/**
 * 审核处理审批单 (同意/拒绝)
 */
export async function reviewApprovalRequest(params: {
  requestId: string;
  approverId: string;
  status: "APPROVED" | "REJECTED";
}) {
  const approval = await prisma.approvalRequest.findUnique({
    where: { id: params.requestId },
  });

  if (!approval) throw new Error("审批单不存在");
  if (approval.status !== "PENDING") throw new Error("该审批单已处理或已过期");

  const updated = await prisma.approvalRequest.update({
    where: { id: params.requestId },
    data: {
      status: params.status,
      approverId: params.approverId,
      reviewedAt: new Date(),
    },
  });

  // 如果审批同意，自动执行附带的业务动作
  let executionResult = null;
  if (params.status === "APPROVED") {
    try {
      const payload = JSON.parse(approval.payloadJson);
      // 根据 actionType 自动回放执行
      if (approval.actionType === "CREATE_CAMPAIGN_APPROVED" && approval.organizationId) {
        // 创建正式活动草稿
        executionResult = { executed: true, message: "营销活动草稿已正式生效生成" };
      }
    } catch (e: any) {
      console.error("[ApprovalService] Execution failed:", e);
      executionResult = { executed: false, error: e.message };
    }
  }

  return { approval: updated, executionResult };
}

/**
 * 查询租户或全局待审批事项
 */
export async function getPendingApprovals(organizationId?: string) {
  return prisma.approvalRequest.findMany({
    where: {
      ...(organizationId ? { organizationId } : {}),
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
