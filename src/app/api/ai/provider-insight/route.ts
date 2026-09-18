import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { invokeAi } from "@/lib/ai-service";

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.id === "env-admin") {
      return NextResponse.json({ error: "请先登录服务商账号" }, { status: 401 });
    }

    const body = await req.json();
    const promptType = body.type || "WEEKLY_REPORT"; // WEEKLY_REPORT | QUESTION
    const question = (body.question || "").trim();

    // 查找当前用户绑定的服务商
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
      include: {
        products: { where: { status: "ONLINE" } },
        reviews: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: "未找到绑定的认证店铺/服务者档案" }, { status: 404 });
    }

    // 聚合真实统计数据
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [recentOrders, totalOrdersCount, contactEventsCount] = await Promise.all([
      prisma.serviceOrder.findMany({
        where: {
          providerId: provider.id,
          createdAt: { gte: sevenDaysAgo },
        },
        select: { status: true, totalAmountCents: true },
      }),
      prisma.serviceOrder.count({ where: { providerId: provider.id } }),
      prisma.contactEvent.count({ where: { providerId: provider.id } }),
    ]);

    const weekPaidOrders = recentOrders.filter((o) =>
      ["PAID", "ACCEPTED", "COMPLETED"].includes(o.status)
    );
    const weekRevenueYuan = (
      weekPaidOrders.reduce((sum, o) => sum + o.totalAmountCents, 0) / 100
    ).toFixed(2);

    const statsContext = `
【商户真实经营指标数据】:
- 店铺名称: ${provider.name}
- 主营分类: ${provider.serviceCategory}
- 历史综合评分: ${provider.ratingAvg.toFixed(1)}分 (${provider.ratingCount}条真实评价)
- 在架上门服务项目: ${provider.products.length}项 (包含: ${provider.products.map((s: any) => s.title).slice(0, 3).join("、") || "暂无"})
- 累计历史完成单量: ${provider.completedOrders}单
- 近7天线上新增订单: ${recentOrders.length}单 (其中已支付/完成: ${weekPaidOrders.length}单)
- 近7天线上营收: ¥${weekRevenueYuan}
- 累计用户拨打/联系行为: ${contactEventsCount}次
`;

    // 本地降级周报与问答生成器
    const fallbackInsight = (): string => {
      if (promptType === "WEEKLY_REPORT") {
        return (
          `📊 【${provider.name}】本周经营简报：\n\n` +
          `1. 核心业务流水：近7天线上共计接收 ${recentOrders.length} 笔订单，实收营收约 ¥${weekRevenueYuan}，服务好评稳定在 ${provider.ratingAvg.toFixed(1)} 分。\n` +
          `2. 流量与转化：累计触达联系客户 ${contactEventsCount} 次，在架服务 ${provider.products.length} 项。\n` +
          `3. 经营提升建议：建议保持快速接单响应（建议5分钟内联系用户），对已完工客户积极引导发布真实带图评价，以提升在杨林便民大厅的综合排名！`
        );
      }
      return `根据您店铺近期的真实数据（近7天订单 ${recentOrders.length} 笔，评分 ${provider.ratingAvg.toFixed(1)}分），建议您：重点维护高频评价服务，并可在大学城开学季/周末租房高发期配置专属卡券提升客单转化。`;
    };

    const systemPrompt =
      `你是一位实事求是的杨林本地生活商家数字化经营顾问。\n` +
      `你的任务是根据商户真实的近7天经营数据，出具客观、接地气、切实可行的经营诊断与周报。\n` +
      `【铁律】：\n` +
      `1. 只能基于下方提供的【商户真实经营指标数据】进行分析，绝对禁止瞎编“预计增长50%单量”等虚假承诺。\n` +
      `2. 分段明确（经营现状概括、转化亮点与痛点、下周落地执行建议），语言简明专业（250字以内）。\n\n` +
      `${statsContext}`;

    const userPrompt =
      promptType === "WEEKLY_REPORT"
        ? `请为我生成一份本周经营简报与增长建议。`
        : `商家咨询问题：“${question || "如何提升我目前的客户转化与口碑？"}”`;

    const aiResult = await invokeAi({
      scene: "BUSINESS_INSIGHT",
      systemPrompt,
      userPrompt,
      userId: session.id,
      fallbackFn: fallbackInsight,
    });

    return NextResponse.json({
      insight: aiResult.content,
      metrics: {
        weekOrdersCount: recentOrders.length,
        weekRevenueYuan,
        ratingAvg: provider.ratingAvg,
        completedOrders: provider.completedOrders,
        activeServicesCount: provider.products.length,
      },
      isFallback: aiResult.isFallback,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "生成经营分析失败" }, { status: 500 });
  }
}
