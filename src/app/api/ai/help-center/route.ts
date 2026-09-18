import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { invokeAi } from "@/lib/ai-service";

const PLATFORM_RULES_KB = `
【杨林生活网官方规则与业务指南】
1. 信息发布规则：
- 便民信息、二手闲置、房屋出租、个人求职均支持完全免费发布。
- 严禁发布任何招聘中介费/体检费、涉赌涉诈、套现刷单及国家明令禁止的内容。
- 发布入口：网站顶部或底部「发布」大厅（/publish），提交后由管理员或审核中心 30 分钟内完成核验。

2. 线上交易与退款规则：
- 线上自营与师傅上门服务支持微信支付担保交易。
- 师傅或商家尚未上门接单/履约前，买家可随时在「个人中心 - 服务订单（/profile?tab=orders）」中点击【申请退款】。
- 商家确认或超时未争议的，平台款项将原路退回至微信零钱或银行卡（1-3个工作日内到账）。
- 严禁 AI 自动处理退款，所有退款争议由双方协商或平台人工客服（电话: 13619694207）介入仲裁。

3. 实名认证与企业入驻：
- 个人用户可在「个人中心 - 认证管理」提交身份证核验，提升信息可信度。
- 商家与师傅入驻服务大厅（/provider/apply），需提交营业执照或特种工种证书，平台工作人员在1个工作日内致电回访并审核。

4. 会员与积分说明：
- 每日签到、完善资料、发布合规信息均可获取金币与积分。
- VIP 会员享受全站信息刷新加速、专属橙色尊贵身份标识与服务折扣。
`;

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    const userId = session?.id !== "env-admin" ? session?.id : undefined;

    const body = await req.json();
    const question = (body.question || "").trim();

    if (!question) {
      return NextResponse.json({ error: "请输入咨询问题" }, { status: 400 });
    }

    // 本地快速规则问答匹配器
    const fallbackAnswer = (): string => {
      const q = question.toLowerCase();
      if (q.includes("退款") || q.includes("怎么退") || q.includes("多久到账")) {
        return "【退款指引】若商家尚未履约，您可在「个人中心 - 服务订单」找到对应订单发起申请。商家同意后，款项将在 1-3 个工作日内原路退回您的微信支付账户。如有纠纷可点击人工客服介入协助。";
      }
      if (q.includes("发布") || q.includes("发帖") || q.includes("怎么发") || q.includes("收费吗")) {
        return "【发布指引】杨林生活网普通便民、求职、租房信息完全免费发布！请点击页面顶部或底部的「发布」按钮（/publish），选择对应类别如实填写，审核通过后即刻在全站展示。";
      }
      if (q.includes("认证") || q.includes("实名") || q.includes("入驻") || q.includes("师傅")) {
        return "【认证与入驻】便民师傅与商户请前往「师傅入驻」向导（/provider/apply）提交店铺资质与技能证书；个人用户可在「个人中心」提交实名认证，审核通常在 1 个工作日内完成。";
      }
      if (q.includes("人工") || q.includes("客服电话") || q.includes("电话")) {
        return "【联系人工】您可直接致电平台客服专线：13619694207（服务时间 09:00 - 21:00），或在客服页面留下您的工单需求。";
      }
      return "您好！杨林生活网智能客服为您服务。您可以咨询关于“如何免费发布信息”、“服务预约与退款流程”、“商户入驻认证”或“会员积分权益”等问题。如需人工帮助可随时致电 13619694207。";
    };

    const systemPrompt =
      `你是一位专业的杨林生活网智能客服助手。\n` +
      `你的职责是解答用户对平台功能使用、规则、退款流程、发布流程与认证疑问。\n` +
      `【铁律】：\n` +
      `1. 严格依据下方【杨林生活网官方规则与业务指南】回答，绝对禁止承诺“我已为您办理退款”或“我已帮您修改订单”，你只有解释流程和指引操作的权限。\n` +
      `2. 用亲切温和的中文作答，分点罗列清晰（200字以内）。\n\n` +
      `${PLATFORM_RULES_KB}`;

    const aiResult = await invokeAi({
      scene: "CUSTOMER_SERVICE",
      systemPrompt,
      userPrompt: `用户咨询：“${question}”`,
      userId,
      fallbackFn: fallbackAnswer,
    });

    let actionLink: string | undefined;
    if (question.includes("发布")) actionLink = "/publish";
    else if (question.includes("退款") || question.includes("订单")) actionLink = "/profile?tab=orders";
    else if (question.includes("认证") || question.includes("入驻")) actionLink = "/provider/apply";

    return NextResponse.json({
      answer: aiResult.content,
      actionLink,
      isFallback: aiResult.isFallback,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "智能客服应答失败" }, { status: 500 });
  }
}
