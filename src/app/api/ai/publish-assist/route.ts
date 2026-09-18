import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { invokeAi } from "@/lib/ai-service";

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    const userId = session?.id !== "env-admin" ? session?.id : undefined;

    const body = await req.json();
    const type = (body.type || "INFO").toUpperCase();
    const rawInput = (body.rawInput || "").trim();
    const existingTitle = (body.title || "").trim();

    if (!rawInput && !existingTitle) {
      return NextResponse.json({ error: "请输入需要整理的信息草稿内容" }, { status: 400 });
    }

    // 本地降级草稿生成器
    const fallbackGenerator = (): string => {
      if (type === "JOB") {
        return JSON.stringify({
          title: existingTitle || "杨林经开区招聘诚聘英才",
          description:
            `【岗位概述】\n${rawInput}\n\n` +
            `【主要职责】\n1. 负责相关岗位的日常工作执行与配合；\n2. 遵守企业安全生产纪律与工作流程。\n\n` +
            `【任职要求】\n1. 身体健康，踏实稳重，吃苦耐劳；\n2. 具备相关岗位基本经验者优先。\n\n` +
            `【工作地点】\n杨林经开区周边，支持就近面试。`,
          tags: ["包吃住", "招工", "经开区"],
          suggestedCategory: "生产普工",
        });
      } else if (type === "HOUSE") {
        return JSON.stringify({
          title: existingTitle || "大学城精装舒适好房 随时可看 拎包入住",
          description:
            `【房源概况】\n${rawInput}\n\n` +
            `【户型配套】\n采光通风良好，基础生活家电齐全，独立卫浴。\n\n` +
            `【周边交通与生活】\n周边生活便利，临近商超便利店与餐饮街，出行便捷。\n\n` +
            `【看房联系】\n房东直租/诚心出租，欢迎提前致电预约现场看房。`,
          tags: ["精装修", "随时看房", "大学城"],
          suggestedCategory: "整套出租",
        });
      } else {
        return JSON.stringify({
          title: existingTitle || "同城转让/便民生活精选信息",
          description:
            `【基本情况】\n${rawInput}\n\n` +
            `【物品/服务状态】\n如实描述，成色良好，具体可当面核对。\n\n` +
            `【交易/联系说明】\n杨林本地支持同城自提或就近交接，有意者请直接致电咨询。`,
          tags: ["同城自提", "诚信转让"],
          suggestedCategory: "二手闲置",
        });
      }
    };

    const systemPrompt =
      `你是一位专业的杨林本地生活信息采编助手。\n` +
      `你的任务是将用户输入的一段口语化、零散的发布要求，整理成格式规范、排版清晰的发布草稿。\n` +
      `【铁律】：\n` +
      `1. 严格禁止无中生有捏造企业虚假五险一金、虚假企业资质，禁止为房产捏造“环评已过”、“消防验收”等法律承诺。\n` +
      `2. 保持事实真实，仅优化排版段落、错别字纠正与专业度润色。\n` +
      `3. 必须严格以 JSON 格式输出，不要包含任何 markdown 代码块标记，格式如下：\n` +
      `{"title": "精炼标题(30字内)", "description": "排版好的正文", "tags": ["标签1", "标签2"], "suggestedCategory": "推荐分类"}`;

    const userPrompt = `发布类别: ${type}\n现有标题: ${existingTitle || "（空）"}\n用户输入原文: ${rawInput}`;

    const aiResult = await invokeAi({
      scene: "CONTENT_ASSIST",
      systemPrompt,
      userPrompt,
      userId,
      fallbackFn: fallbackGenerator,
    });

    let draft: { title: string; description: string; tags: string[]; suggestedCategory?: string };
    try {
      const cleaned = aiResult.content
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      draft = JSON.parse(cleaned);
    } catch {
      draft = JSON.parse(fallbackGenerator());
    }

    return NextResponse.json({
      draft,
      isFallback: aiResult.isFallback,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "生成辅助草稿失败" }, { status: 500 });
  }
}
