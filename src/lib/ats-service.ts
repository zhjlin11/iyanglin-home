import { prisma } from "@/lib/prisma";

export type CandidateStage =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

/**
 * 获取组织下收到的候选人投递列表 (严格组织隔离)
 */
export async function getOrganizationCandidates(params: {
  organizationId: string;
  jobId?: string;
  stage?: CandidateStage;
  search?: string;
}) {
  const where: any = {
    organizationId: params.organizationId,
  };

  if (params.jobId) {
    where.jobId = params.jobId;
  }
  if (params.stage) {
    where.stage = params.stage;
  }

  const candidates = await prisma.candidate.findMany({
    where,
    include: {
      job: { select: { id: true, title: true, salary: true, area: true } },
      resume: {
        select: {
          id: true,
          name: true,
          gender: true,
          birthYear: true,
          education: true,
          experience: true,
          targetJob: true,
          targetSalary: true,
          skills: true,
          intro: true,
          phone: true,
          wechat: true,
          avatar: true,
        },
      },
      interviews: {
        orderBy: { interviewTime: "desc" },
      },
    },
    orderBy: { appliedAt: "desc" },
  });

  return candidates;
}

/**
 * 流转候选人招聘阶段
 */
export async function transitionCandidateStage(params: {
  candidateId: string;
  organizationId: string;
  toStage: CandidateStage;
  operatorId: string;
  notes?: string;
  rejectedReason?: string;
}) {
  const candidate = await prisma.candidate.findFirst({
    where: { id: params.candidateId, organizationId: params.organizationId },
    include: { job: true, resume: true },
  });

  if (!candidate) {
    throw new Error("候选人记录不存在或跨组织越权");
  }

  const updated = await prisma.candidate.update({
    where: { id: params.candidateId },
    data: {
      stage: params.toStage,
      notes: params.notes ? `${candidate.notes ? candidate.notes + "\n" : ""}[${new Date().toLocaleDateString()}] ${params.notes}` : candidate.notes,
      rejectedReason: params.rejectedReason || candidate.rejectedReason,
    },
  });

  return updated;
}

/**
 * 排期安排面试
 */
export async function scheduleInterview(params: {
  candidateId: string;
  organizationId: string;
  interviewTime: Date;
  location: string;
  interviewer?: string;
  notes?: string;
}) {
  const candidate = await prisma.candidate.findFirst({
    where: { id: params.candidateId, organizationId: params.organizationId },
    include: { job: true, resume: true, user: true },
  });

  if (!candidate) {
    throw new Error("候选人不存在或跨组织越权");
  }

  const interview = await prisma.candidateInterview.create({
    data: {
      candidateId: params.candidateId,
      interviewTime: params.interviewTime,
      location: params.location,
      interviewer: params.interviewer || "HR团队",
      feedback: params.notes,
      status: "SCHEDULED",
    },
  });

  await prisma.candidate.update({
    where: { id: params.candidateId },
    data: { stage: "INTERVIEW" },
  });

  // 站内信通知求职者
  try {
    await prisma.notification.create({
      data: {
        userId: candidate.userId,
        category: "ORDER",
        type: "INTERVIEW_INVITE",
        title: `🎯 面试邀请: ${candidate.job.title}`,
        content: `您投递的岗位 [${candidate.job.title}] 已由企业安排面试，时间: ${params.interviewTime.toLocaleString('zh-CN')}，地点: ${params.location}。请准时参加！`,
        link: `/jobs/${candidate.jobId}`,
      },
    });
  } catch (e) {
    console.error("[ATS_NOTIF] Failed to send interview notification:", e);
  }

  return interview;
}
