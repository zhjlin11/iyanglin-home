import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "权限不足，仅管理员可合并企业主体" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { masterCompanyId, subCompanyId, reason } = body;

  if (!masterCompanyId || !subCompanyId) {
    return NextResponse.json({ error: "缺少主企业或从企业标识" }, { status: 400 });
  }

  if (masterCompanyId === subCompanyId) {
    return NextResponse.json({ error: "主企业与从企业不能为同一个主体" }, { status: 400 });
  }

  const [masterComp, subComp] = await Promise.all([
    prisma.company.findUnique({ where: { id: masterCompanyId } }),
    prisma.company.findUnique({ where: { id: subCompanyId } }),
  ]);

  if (!masterComp || !subComp) {
    return NextResponse.json({ error: "指定的主企业或从企业不存在" }, { status: 404 });
  }

  if (subComp.status === "ARCHIVED") {
    return NextResponse.json({ error: "从企业已经处于归档状态" }, { status: 400 });
  }

  // 执行事务平移：绝对不硬删除，将从企业的所有关联职位安全迁往主企业，从企业标记为 ARCHIVED
  const result = await prisma.$transaction(async (tx) => {
    // 1. 迁移从企业的全部 Job
    const updateJobsResult = await tx.job.updateMany({
      where: { companyId: subCompanyId },
      data: {
        companyId: masterCompanyId,
        companyNameSnapshot: masterComp.name,
        companyLogoSnapshot: masterComp.logo || subComp.logo,
      },
    });

    // 2. 将从企业标记为归档 (ARCHIVED)，保留历史数据痕迹
    const appendNote = `\n[已于 ${new Date().toLocaleString("zh-CN")} 由管理员合并至主企业: ${masterComp.name} (ID: ${masterComp.id})]`;
    const updatedSubComp = await tx.company.update({
      where: { id: subCompanyId },
      data: {
        status: "ARCHIVED",
        description: (subComp.description || "") + appendNote,
      },
    });

    // 3. 记录 OperationLog 留痕
    await tx.operationLog.create({
      data: {
        userId: session.id,
        action: "COMPANY_MERGE",
        targetId: masterCompanyId,
        metadata: {
          masterCompanyId,
          masterCompanyName: masterComp.name,
          subCompanyId,
          subCompanyName: subComp.name,
          migratedJobsCount: updateJobsResult.count,
          reason: reason || "重复企业主数据合并",
          operator: session.username || session.id,
        },
      },
    });

    return {
      migratedJobsCount: updateJobsResult.count,
      subCompany: updatedSubComp,
    };
  });

  return NextResponse.json({
    success: true,
    message: `成功将「${subComp.name}」的 ${result.migratedJobsCount} 个在招职位平移合并至「${masterComp.name}」，从企业已安全归档。`,
    migratedJobsCount: result.migratedJobsCount,
  });
}
