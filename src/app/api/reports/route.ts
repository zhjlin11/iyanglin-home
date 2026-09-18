import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanText } from "@/lib/strip-html";

export const dynamic = "force-dynamic";

// 内存简单限流：记录用户上次举报时间戳，同一用户 10 秒内只能提交一次举报
const reporterRateLimitMap = new Map<string, number>();

async function verifyResourceExists(type: string, id: string): Promise<{ exists: boolean; title?: string }> {
  const normType = type.toUpperCase();
  switch (normType) {
    case "JOB": {
      const j = await prisma.job.findUnique({ where: { id }, select: { title: true } });
      return { exists: !!j, title: j?.title };
    }
    case "HOUSE": {
      const h = await prisma.house.findUnique({ where: { id }, select: { title: true } });
      return { exists: !!h, title: h?.title };
    }
    case "INDUSTRIAL": {
      const ind = await prisma.industrialProperty.findUnique({ where: { id }, select: { title: true } });
      return { exists: !!ind, title: ind?.title };
    }
    case "COMMUNITY_POST":
    case "POST": {
      const p = await prisma.post.findUnique({ where: { id }, select: { title: true } });
      return { exists: !!p, title: p?.title };
    }
    case "MERCHANT":
    case "SHOP": {
      const s = await prisma.shop.findUnique({ where: { id }, select: { name: true } });
      return { exists: !!s, title: s?.name };
    }
    case "ARTICLE": {
      let a = await prisma.article.findUnique({ where: { id }, select: { title: true } });
      if (!a) {
        a = await prisma.article.findFirst({ where: { oldId: id }, select: { title: true } });
      }
      if (!a && (id === "user-agreement" || id === "privacy-policy")) {
        return { exists: true, title: id === "user-agreement" ? "杨林生活网用户服务协议" : "杨林生活网隐私保护指引与个人信息处理规则" };
      }
      return { exists: !!a, title: a?.title };
    }
    case "PRODUCT":
    case "LISTING": {
      const l = await prisma.listing.findUnique({ where: { id }, select: { title: true } });
      return { exists: !!l, title: l?.title };
    }
    case "DATING": {
      const d = await prisma.datingProfile.findUnique({ where: { id }, select: { nickname: true } });
      return { exists: !!d, title: d?.nickname };
    }
    case "EVENT": {
      const ev = await prisma.event.findUnique({ where: { id }, select: { title: true } });
      return { exists: !!ev, title: ev?.title };
    }
    default:
      return { exists: false };
  }
}

/**
 * POST /api/reports
 * 提交违法违规/虚假内容举报
 */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "请先登录后再提交举报" }, { status: 401 });
  }

  // 频率限制 (10秒内一次)
  const now = Date.now();
  const lastTime = reporterRateLimitMap.get(session.id) || 0;
  if (now - lastTime < 10000) {
    return NextResponse.json({ error: "提交过于频繁，请稍后再试" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { resourceType, resourceId, reason, description } = body;

    if (!resourceType || !resourceId || !reason) {
      return NextResponse.json({ error: "缺少举报参数（资源类型、ID或原因）" }, { status: 400 });
    }

    const normType = String(resourceType).toUpperCase();
    const id = String(resourceId).trim();

    // 验证资源真实性
    const check = await verifyResourceExists(normType, id);
    if (!check.exists) {
      return NextResponse.json({ error: "被举报的资源不存在或已被删除" }, { status: 404 });
    }

    // 防重复举报检查：同一用户对同一资源如果已有未处理（PENDING/PROCESSING）的举报，禁止重复提交
    const pendingReport = await prisma.report.findFirst({
      where: {
        userId: session.id,
        resourceType: normType,
        resourceId: id,
        status: { in: ["PENDING", "PROCESSING"] },
      },
    });

    if (pendingReport) {
      return NextResponse.json(
        { error: "您已提交过对该内容的举报，平台审核人员正在加紧核实中，请勿重复提交。" },
        { status: 400 }
      );
    }

    // XSS 防护与字符串清洗
    const cleanReason = cleanText(String(reason)).slice(0, 100);
    const cleanDesc = description ? cleanText(String(description)).slice(0, 500) : "";
    const combinedReason = cleanDesc ? `${cleanReason} - ${cleanDesc}` : cleanReason;
    const finalTitle = String(body.title || check.title || "举报对象").slice(0, 100);

    const report = await prisma.report.create({
      data: {
        userId: session.id,
        resourceType: normType,
        resourceId: id,
        title: finalTitle,
        reason: combinedReason,
        status: "PENDING",
      },
    });

    reporterRateLimitMap.set(session.id, now);

    return NextResponse.json({
      success: true,
      message: "感谢反馈，我们会尽快核实处理。",
      reportId: report.id,
    });
  } catch (err: any) {
    console.error("[Report POST] Error:", err);
    return NextResponse.json({ error: err.message || "提交举报失败" }, { status: 500 });
  }
}
