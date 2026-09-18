import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { verifyOrgAccess } from "@/lib/organization-service";
import { getOrganizationCandidates, transitionCandidateStage, scheduleInterview, CandidateStage } from "@/lib/ats-service";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get("organizationId");
  if (!orgId) return NextResponse.json({ error: "缺少 organizationId" }, { status: 400 });

  const access = await verifyOrgAccess(session.id, orgId, "candidates:read");
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: 403 });

  const jobId = req.nextUrl.searchParams.get("jobId") || undefined;
  const stage = (req.nextUrl.searchParams.get("stage") as CandidateStage) || undefined;

  const candidates = await getOrganizationCandidates({
    organizationId: orgId,
    jobId,
    stage,
  });

  return NextResponse.json({ success: true, candidates });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { organizationId, action, candidateId, toStage, notes, rejectedReason, interviewTime, location, interviewer } = body;

  const access = await verifyOrgAccess(session.id, organizationId, "candidates:write");
  if (!access.authorized) return NextResponse.json({ error: access.error }, { status: 403 });

  if (action === "transition") {
    const updated = await transitionCandidateStage({
      candidateId,
      organizationId,
      toStage,
      operatorId: session.id,
      notes,
      rejectedReason,
    });
    return NextResponse.json({ success: true, candidate: updated });
  }

  if (action === "schedule_interview") {
    const interview = await scheduleInterview({
      candidateId,
      organizationId,
      interviewTime: new Date(interviewTime),
      location,
      interviewer,
      notes,
    });
    return NextResponse.json({ success: true, interview });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
