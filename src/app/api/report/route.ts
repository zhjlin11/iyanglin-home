import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录后再提交举报" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.resourceType || !body.resourceId || !body.title || !body.reason) {
    return NextResponse.json({ error: "请填写完整的举报原因和信息" }, { status: 400 });
  }

  const report = await prisma.report.create({
    data: {
      userId: session.id,
      resourceType: String(body.resourceType).toUpperCase(),
      resourceId: String(body.resourceId),
      title: String(body.title).trim(),
      reason: String(body.reason).trim(),
      status: "PENDING",
    },
  });

  return NextResponse.json({ success: true, report });
}
