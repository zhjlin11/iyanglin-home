import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCoreBrand, computeCompleteness } from "@/lib/companyGovernance";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const companyAId = searchParams.get("companyAId");
  const companyBId = searchParams.get("companyBId");
  const name = (searchParams.get("name") || "").trim();
  const creditCode = (searchParams.get("creditCode") || "").trim();

  // 1. 如果传了 companyAId 和 companyBId，返回两两深度对比数据
  if (companyAId && companyBId) {
    const [compA, compB] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyAId },
        include: {
          organization: { select: { id: true, name: true } },
          jobs: { select: { id: true, title: true, salary: true, status: true, updatedAt: true } },
        },
      }),
      prisma.company.findUnique({
        where: { id: companyBId },
        include: {
          organization: { select: { id: true, name: true } },
          jobs: { select: { id: true, title: true, salary: true, status: true, updatedAt: true } },
        },
      }),
    ]);

    if (!compA || !compB) {
      return NextResponse.json({ error: "对比企业主体未找到" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      comparison: {
        companyA: {
          ...compA,
          completeness: computeCompleteness(compA),
        },
        companyB: {
          ...compB,
          completeness: computeCompleteness(compB),
        },
      },
    });
  }

  // 2. 如果输入了 name 或 creditCode，实时检索相似企业
  if (name || creditCode) {
    const core = getCoreBrand(name);
    const orConditions: any[] = [];

    if (name) {
      orConditions.push({ name: { contains: name, mode: "insensitive" } });
    }
    if (core && core.length >= 2) {
      orConditions.push({ name: { contains: core, mode: "insensitive" } });
    }
    if (creditCode && creditCode.length >= 6) {
      orConditions.push({ creditCode: { contains: creditCode } });
    }

    const matches = await prisma.company.findMany({
      where: {
        status: { not: "ARCHIVED" },
        OR: orConditions,
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        creditCode: true,
        address: true,
        industry: true,
        verificationStatus: true,
        isFeaturedEmployer: true,
        _count: { select: { jobs: true } },
      },
      take: 6,
    });

    return NextResponse.json({
      success: true,
      hasSimilar: matches.length > 0,
      matches: matches.map((m) => ({
        ...m,
        jobCount: m._count.jobs,
      })),
    });
  }

  return NextResponse.json({ error: "缺少检索参数" }, { status: 400 });
}
