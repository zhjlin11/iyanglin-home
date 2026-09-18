import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserOrganizations, verifyOrgAccess } from "@/lib/organization-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const organizations = await getUserOrganizations(session.id);
  const searchParams = req.nextUrl.searchParams;
  const activeOrgId = searchParams.get("orgId") || (organizations[0]?.id ?? null);

  let activeWorkspace: any = null;

  if (activeOrgId) {
    const access = await verifyOrgAccess(session.id, activeOrgId);
    if (access.authorized) {
      const org = access.organization;
      // 聚合工作台关键 KPI
      if (org.type === "MERCHANT" && org.providerId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [todayOrders, todayRev, pendingOrders, leadsCount, membersCount] = await Promise.all([
          prisma.serviceOrder.count({
            where: { providerId: org.providerId, createdAt: { gte: today } },
          }),
          prisma.serviceOrder.aggregate({
            where: { providerId: org.providerId, status: { in: ["PAID", "ACCEPTED", "IN_SERVICE", "COMPLETED"] }, createdAt: { gte: today } },
            _sum: { payAmountCents: true },
          }),
          prisma.serviceOrder.count({
            where: { providerId: org.providerId, status: { in: ["PAID", "ACCEPTED", "IN_SERVICE"] } },
          }),
          prisma.serviceLead.count({
            where: { providerId: org.providerId, status: { in: ["NEW", "CONTACTED", "FOLLOWING"] } },
          }),
          prisma.organizationMember.count({
            where: { organizationId: org.id, status: "ACTIVE" },
          }),
        ]);

        activeWorkspace = {
          ...org,
          currentRole: access.role,
          kpi: {
            todayOrders,
            todayRevenueYuan: ((todayRev._sum.payAmountCents || 0) / 100).toFixed(2),
            pendingOrders,
            activeLeads: leadsCount,
            membersCount,
          },
        };
      } else {
        // 企业招聘 ATS 概况
        const [jobsCount, candidatesCount, pendingInterviews, boundCompany] = await Promise.all([
          prisma.job.count({ where: { organizationId: org.id } }),
          prisma.candidate.count({ where: { organizationId: org.id, stage: { in: ["APPLIED", "SCREENING", "INTERVIEW"] } } }),
          prisma.candidateInterview.count({
            where: {
              candidate: { organizationId: org.id },
              status: "SCHEDULED",
            },
          }),
          prisma.company.findUnique({
            where: { organizationId: org.id },
          }),
        ]);

        activeWorkspace = {
          ...org,
          company: boundCompany || null,
          currentRole: access.role,
          kpi: {
            activeJobs: jobsCount,
            pendingCandidates: candidatesCount,
            scheduledInterviews: pendingInterviews,
          },
        };
      }
    }
  }

  return NextResponse.json({
    success: true,
    user: session,
    workspaces: organizations,
    activeWorkspace,
  });
}
