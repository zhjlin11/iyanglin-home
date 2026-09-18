import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPendingApprovals, reviewApprovalRequest } from "@/lib/agent/approval-service";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  const orgId = req.nextUrl.searchParams.get("organizationId") || undefined;
  const approvals = await getPendingApprovals(orgId);

  return NextResponse.json({ success: true, approvals });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  try {
    const { requestId, status } = await req.json();
    if (!requestId || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ success: false, error: "参数无效" }, { status: 400 });
    }

    const result = await reviewApprovalRequest({
      requestId,
      approverId: session.userId,
      status,
    });

    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
