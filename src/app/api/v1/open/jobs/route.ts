import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiToken } from "@/lib/developer/developer-service";

/**
 * 开放平台 API: 职位查询 (需 jobs:read 权限)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  const auth = await verifyApiToken(token, "jobs:read");
  if (!auth.valid || !auth.organizationId) {
    return NextResponse.json({ success: false, error: auth.error || "未授权" }, { status: 403 });
  }

  // 严格根据 Token 对应的 organizationId 隔离查询，严禁跨租户窃取
  const jobs = await prisma.job.findMany({
    where: { organizationId: auth.organizationId },
    take: 50,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      company: true,
      area: true,
      salary: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, organizationId: auth.organizationId, jobs });
}

/**
 * 开放平台 API: 外部系统发布职位 (需 jobs:write 权限)
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  const auth = await verifyApiToken(token, "jobs:write");
  if (!auth.valid || !auth.organizationId) {
    return NextResponse.json({ success: false, error: auth.error || "未授权" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, companyName, workLocation, salaryRange, description } = body;

    if (!title || !companyName) {
      return NextResponse.json({ success: false, error: "缺少职位名称或公司名称" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
    });

    const job = await prisma.job.create({
      data: {
        organizationId: auth.organizationId,
        authorId: org?.ownerId || null,
        title,
        company: companyName,
        area: workLocation || "杨林经开区",
        salary: salaryRange || "面议",
        body: description || title,
        status: "APPROVED", // 企业正式接入默认直接发布
      },
    });

    return NextResponse.json({ success: true, job });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
