import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { invokeAi } from "@/lib/ai-service";

export interface QualityCheckResult {
  score: number; // 0-100
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  passed: boolean;
  issues: string[];
  suggestions: string[];
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    const userId = session?.id !== "env-admin" ? session?.id : undefined;

    const body = await req.json();
    const title = (body.title || "").trim();
    const content = (body.content || body.body || "").trim();
    const phone = (body.phone || "").trim();
    const type = (body.type || "INFO").toUpperCase();

    if (!title && !content) {
      return NextResponse.json({ error: "内容为空，无法评估" }, { status: 400 });
    }

    // 本地规则启发式质检引擎 (100% 离线可用兜底)
    const runRuleCheck = (): QualityCheckResult => {
      const issues: string[] = [];
      const suggestions: string[] = [];
      let score = 90;
      let riskLevel: QualityCheckResult["riskLevel"] = "LOW";

      // 标题长度与清晰度检查
      if (title.length < 5) {
        issues.push("标题过于简略（少于5个字）");
        suggestions.push("建议补充具体地名或关键品类，如“大学城转让小牛电动车”");
        score -= 20;
      }

      // 正文内容深度检查
      if (content.length < 15) {
        issues.push("正文描述较少");
        suggestions.push("建议详细补充物品成色、服务内容、交接时间等要素");
        score -= 15;
      }

      // 典型欺诈与高风险识别
      const riskKeywords = ["押金", "入职体检费", "刷单", "日结兼职500", "私聊加微信看照片", "贷款套现"];
      for (const kw of riskKeywords) {
        if (title.includes(kw) || content.includes(kw)) {
          issues.push(`包含高风险关键词【${kw}】`);
          suggestions.push("请如实说明收费性质，平台严禁任何形式的招聘收费或涉嫌刷单兼职行为");
          riskLevel = "HIGH";
          score -= 40;
        }
      }

      // 联系方式格式检查
      if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
        issues.push("填写的手机号码格式疑似不正确");
        suggestions.push("请填写11位标准中国大陆手机号以便意向买家与求职者致电联系");
        score -= 10;
      }

      if (score < 60 && riskLevel !== "HIGH") {
        riskLevel = "MEDIUM";
      }

      return {
        score: Math.max(score, 10),
        riskLevel,
        passed: score >= 60,
        issues,
        suggestions,
      };
    };

    const fallbackRes = runRuleCheck();

    const systemPrompt =
      `你是一位专业的杨林生活网内容质量与合规检查顾问。\n` +
      `请检查用户提交的发布内容是否存在表达不清、缺失关键要素、虚假中介营销或违规招聘收费的嫌疑。\n` +
      `【铁律】：\n` +
      `1. 评估结果仅作为辅助提示与修改建议，不能执行任何封禁操作。\n` +
      `2. 请严格以 JSON 格式输出，不要包含 markdown 代码块：\n` +
      `{"score": 85, "riskLevel": "LOW/MEDIUM/HIGH", "passed": true/false, "issues": ["问题1"], "suggestions": ["建议1"]}`;

    const userPrompt = `分类: ${type}\n标题: ${title}\n正文: ${content}\n电话: ${phone || "未提供"}`;

    const aiResult = await invokeAi({
      scene: "MODERATION_ASSIST",
      systemPrompt,
      userPrompt,
      userId,
      fallbackFn: () => JSON.stringify(fallbackRes),
    });

    let result: QualityCheckResult;
    try {
      const cleaned = aiResult.content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      result = fallbackRes;
    }

    return NextResponse.json({
      success: true,
      ...result,
      result,
      isFallback: aiResult.isFallback,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "质量自检失败" }, { status: 500 });
  }
}
