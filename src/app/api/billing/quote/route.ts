import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateBillingQuote, getUserAssetBalances } from "@/lib/billing-guard";

/**
 * POST /api/billing/quote — 获取发帖/增值服务防篡改服务端即时报价
 */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.module) {
    return NextResponse.json({ error: "缺少模块标识 module" }, { status: 400 });
  }

  const module = String(body.module).trim();
  const action = body.action ? String(body.action).trim().toUpperCase() : "PUBLISH";
  const days = body.days ? parseInt(body.days, 10) : undefined;
  const companyId = body.companyId ? String(body.companyId).trim() : undefined;

  // 确定主体：招聘优先企业主体，其余默认个人主体
  const subjectType = (module === "job" && companyId) ? "COMPANY" : "USER";
  const subjectId = subjectType === "COMPANY" ? companyId! : session.id;

  try {
    const [quote, userBalances] = await Promise.all([
      generateBillingQuote({
        module,
        action: action as any,
        subjectType,
        subjectId,
        userId: session.id,
        days,
        metadata: body.metadata,
      }),
      getUserAssetBalances(session.id),
    ]);

    return NextResponse.json({
      success: true,
      quote,
      userBalances,
    });
  } catch (err: any) {
    console.error("[/api/billing/quote] 生成报价失败:", err);
    return NextResponse.json({ error: err.message || "报价生成失败" }, { status: 500 });
  }
}
