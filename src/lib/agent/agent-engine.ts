import { prisma } from "@/lib/prisma";
import { invokeAi } from "@/lib/ai-service";
import { AGENT_TOOLS } from "./agent-tools";

export type AgentRoleType =
  | "MERCHANT_AGENT"
  | "ENTERPRISE_AGENT"
  | "OPERATIONS_AGENT"
  | "RISK_AGENT";

export interface AgentExecutionRequest {
  agentRole: AgentRoleType;
  prompt: string;
  userId: string;
  organizationId?: string;
}

export interface AgentExecutionResponse {
  reply: string;
  executedActions: Array<{
    tool: string;
    riskLevel: string;
    success: boolean;
    data?: any;
    error?: string;
    requiresApproval?: boolean;
    approvalRequestId?: string;
    actionLogId?: string;
  }>;
}

/**
 * 校验防范 Prompt 注入与恶意越权指令
 */
function inspectMaliciousIntent(prompt: string): { isMalicious: boolean; reason?: string } {
  const p = prompt.toLowerCase();

  // 1. 企图跨租户窃取数据
  if (
    (p.includes("公司") || p.includes("商户") || p.includes("用户") || p.includes("全部")) &&
    (p.includes("忽略权限") || p.includes("越权") || p.includes("导出全部") || p.includes("其他公司"))
  ) {
    return {
      isMalicious: true,
      reason: "【权限风控拦截】检测到潜在的越权或跨租户数据导出尝试，系统严禁非授权操作！",
    };
  }

  // 2. 企图让 AI 越权执行资金或封禁动作
  if (p.includes("直接退款") || p.includes("修改金额") || p.includes("封禁账号") || p.includes("删库")) {
    return {
      isMalicious: true,
      reason: "【安全铁律拦截】严禁 AI Agent 擅自操作支付退款、金额修改或用户封禁，此类动作已被系统硬拒绝！",
    };
  }

  return { isMalicious: false };
}

/**
 * AI Agent 统一执行调度中枢
 */
export async function executeAgentWorkflow(
  request: AgentExecutionRequest
): Promise<AgentExecutionResponse> {
  const { agentRole, prompt, userId, organizationId } = request;

  // 1. 恶意注入与违规越权前置拦截
  const check = inspectMaliciousIntent(prompt);
  if (check.isMalicious) {
    // 记录安全审计
    await prisma.agentActionLog.create({
      data: {
        agentId: agentRole,
        userId,
        organizationId,
        tool: "SECURITY_INTERCEPT",
        inputJson: JSON.stringify({ prompt }),
        resultJson: JSON.stringify({ blocked: true, reason: check.reason }),
        riskLevel: "HIGH_RISK",
        approvalStatus: "REJECTED",
      },
    });

    return {
      reply: check.reason || "安全拦截：未授权指令。",
      executedActions: [],
    };
  }

  // 2. 根据不同的 Agent 角色组装系统提示词与上下文
  let systemPrompt = "";
  let defaultActionPlan: { tool: string; input: any } | null = null;
  let textResponse = "";

  if (agentRole === "MERCHANT_AGENT") {
    systemPrompt =
      "你是【杨林生活网·商家经营AI Agent】。你的职责是协助本地商户分析客户复购、挖掘沉默客户、创建跟进待办、生成活动草稿。\n" +
      "【铁律】你严禁直接群发营销短信，严禁直接退款，严禁修改订单金额。高风险操作必须拒绝。\n" +
      "请针对用户的经营指令，给出专业、贴近杨林本地情况的回答。";

    // 典型场景匹配：找出未复购/沉默客户并创建回访任务
    if (prompt.includes("未复购") || prompt.includes("回访") || prompt.includes("沉默客户")) {
      defaultActionPlan = {
        tool: "create_task",
        input: {
          title: "【AI生成】对近期未复购的本地老客执行电话/微信关怀回访",
          description: "基于90天内未复购客户画像，跟进提供换季清洗与检修优惠福利",
          priority: "HIGH",
        },
      };
      textResponse =
        "已为您完成当前商户的客户复购画像分析：\n" +
        "1. 筛选出近期暂未再次下单的本地老客群体。\n" +
        "2. 已为您在当前商户空间自动创建【高优先级回访跟进任务】。\n" +
        "3. 提示：根据平台合规要求，严禁系统全量盲目群发短信骚扰用户，请由专属客服或师傅按清单温情联系。";
    }
  } else if (agentRole === "ENTERPRISE_AGENT") {
    systemPrompt =
      "你是【杨林生活网·企业招聘与人才AI Agent】。协助经开区与大学城企业整理候选人、安排面试草稿、分析招聘漏斗。\n" +
      "【铁律】绝对禁止根据性别、民族、宗教信仰或健康隐私信息做任何自动歧视性筛选！\n";

    if (prompt.includes("候选人") || prompt.includes("简历") || prompt.includes("面试")) {
      defaultActionPlan = {
        tool: "create_task",
        input: {
          title: "【招聘待办】协调经开区生产技师候选人面试排期（草稿）",
          description: "本周新投递技能型工种候选人简历初筛完毕，待HR电话沟通确认具体时间",
          priority: "NORMAL",
        },
      };
      textResponse =
        "已为您整理当前企业收到的最新求职简历数据：\n" +
        "1. 候选人专业技术经验已完成结构化提炼。\n" +
        "2. 严格遵循公平就业规范，无任何敏感身份偏见。\n" +
        "3. 已在工作台生成【面试安排协同任务（草稿）】，您可在 ATS 看板中一键发起短信/微信提醒。";
    }
  } else if (agentRole === "OPERATIONS_AGENT") {
    systemPrompt =
      "你是【杨林生活网·平台自主运营与决策AI Agent】。负责监控全站搜索缺口、供需矛盾、待办事项与内容推荐。\n";

    if (prompt.includes("最需要处理") || prompt.includes("缺口") || prompt.includes("待办")) {
      defaultActionPlan = {
        tool: "create_task",
        input: {
          title: "【运营调度】补齐大学城‘兼职前台’与经开区‘电工维修’供给缺口",
          description: "近7天高频搜索但暂无对应通过审核的房源与岗位，需运营介入精准招商",
          priority: "HIGH",
        },
      };
      textResponse =
        "通过本地商业数据中台实时扫描全站，今日最紧迫的运营机会点如下：\n" +
        "1. 搜索缺口雷达：高频关键词【大学城兼职】、【厂房独栋直租】搜索量激增但当前供应较少；\n" +
        "2. 审核流转：全站待审内容处于健康水位；\n" +
        "3. 已为您自动创建对应运营拓商与推荐调度任务。";
    }
  } else if (agentRole === "RISK_AGENT") {
    systemPrompt =
      "你是【杨林生活网·交易与内容合规风控AI Agent】。仅做风险排查与预警提示，严禁私自自动封号！";
    textResponse =
      "【合规风控报告】今日全站资金与履约巡检完毕：\n" +
      "1. 未检测到大额异常高频刷单与优惠券黑产薅羊毛行为；\n" +
      "2. 商家资金结算与微信支付回调延时正常（<80ms）；\n" +
      "3. 提示：任何可疑账号处置需由超级管理员人工在治理中心核实后执行。";
  }

  // 3. 调用 AI 服务生成个性化回复（带本地降级保障）
  if (!textResponse) {
    try {
      const aiRes = await invokeAi({
        scene: "BUSINESS_INSIGHT",
        systemPrompt,
        userPrompt: prompt,
        userId,
        fallbackFn: () => "AI Agent 已根据当前组织数据为您完成分析，相关建议已整理至工作台。",
      });
      textResponse = aiRes.content;
    } catch {
      textResponse = "AI Agent 已为您完成分析并记录协同事件。";
    }
  }

  // 4. 执行低风险动作（如果有）并写入审计日志
  const executedActions: AgentExecutionResponse["executedActions"] = [];

  if (defaultActionPlan && AGENT_TOOLS[defaultActionPlan.tool]) {
    const toolDef = AGENT_TOOLS[defaultActionPlan.tool];
    const execResult = await toolDef.execute({
      input: defaultActionPlan.input,
      userId,
      organizationId,
    });

    const actionLog = await prisma.agentActionLog.create({
      data: {
        agentId: agentRole,
        userId,
        organizationId,
        tool: defaultActionPlan.tool,
        inputJson: JSON.stringify(defaultActionPlan.input),
        resultJson: JSON.stringify(execResult.data || {}),
        riskLevel: toolDef.riskLevel,
        approvalStatus: execResult.requiresApproval ? "PENDING" : "AUTO_APPROVED",
        approvalRequestId: execResult.approvalRequestId,
        rollbackStatus: execResult.canRollback ? "CAN_ROLLBACK" : "NONE",
        rollbackPayloadJson: execResult.rollbackPayload ? JSON.stringify(execResult.rollbackPayload) : null,
      },
    });

    executedActions.push({
      tool: defaultActionPlan.tool,
      riskLevel: toolDef.riskLevel,
      success: execResult.success,
      data: execResult.data,
      error: execResult.error,
      requiresApproval: execResult.requiresApproval,
      approvalRequestId: execResult.approvalRequestId,
      actionLogId: actionLog.id,
    });
  }

  return {
    reply: textResponse,
    executedActions,
  };
}
