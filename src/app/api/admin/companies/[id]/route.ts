import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computeCompleteness,
  diagnoseCompanyIssues,
} from "@/lib/companyGovernance";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "缺少公司ID" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      organization: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, username: true, phone: true, role: true },
              },
            },
          },
        },
      },
      jobs: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: "企业主体不存在" }, { status: 404 });
  }

  const completeness = computeCompleteness(company);
  const issues = diagnoseCompanyIssues({
    isVerified: company.isVerified,
    verificationStatus: company.verificationStatus,
    businessLicenseImage: company.businessLicenseImage,
    isFeaturedEmployer: company.isFeaturedEmployer,
    jobCount: company.jobs.length,
    status: company.status,
    hasActiveJobs: company.jobs.some((j) => j.status === "APPROVED"),
  });

  // 获取该企业相关的操作日志
  const auditLogs = await prisma.operationLog.findMany({
    where: { targetId: id },
    orderBy: { createdAt: "desc" },
    take: 15,
    include: {
      user: {
        select: { username: true, role: true },
      },
    },
  }).catch(() => []);

  return NextResponse.json({
    success: true,
    company: {
      ...company,
      completeness,
      issues,
      auditLogs,
    },
  });
}
