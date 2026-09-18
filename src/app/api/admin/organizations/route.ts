import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get("type") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { contactPhone: { contains: search } },
    ];
  }

  const organizations = await prisma.organization.findMany({
    where,
    include: {
      owner: { select: { id: true, username: true, nickname: true, phone: true } },
      _count: {
        select: {
          members: true,
          jobs: true,
          tasks: true,
          candidates: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: organizations.length,
    enterpriseCount: organizations.filter((o) => o.type === "ENTERPRISE").length,
    merchantCount: organizations.filter((o) => o.type === "MERCHANT").length,
    riskCount: organizations.filter((o) => o.riskFlag).length,
  };

  return NextResponse.json({ success: true, stats, organizations });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "权限不足，仅超级管理员可操作" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, status, riskFlag, canExport } = body;

  if (!id) return NextResponse.json({ error: "缺少组织ID" }, { status: 400 });

  const updated = await prisma.organization.update({
    where: { id },
    data: {
      status: status || undefined,
      riskFlag: typeof riskFlag === "boolean" ? riskFlag : undefined,
      canExport: typeof canExport === "boolean" ? canExport : undefined,
    },
  });

  return NextResponse.json({ success: true, organization: updated });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "权限不足，仅管理员可录入企业或组织" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const type = body.type === "MERCHANT" ? "MERCHANT" : "ENTERPRISE";
  const industry = String(body.industry || "").trim() || undefined;
  const address = String(body.address || "").trim() || undefined;
  const contactName = String(body.contactName || "").trim() || undefined;
  const contactPhone = String(body.contactPhone || "").trim() || undefined;
  const intro = String(body.intro || "").trim() || undefined;

  if (!name) {
    return NextResponse.json({ error: "公司或组织名称不能为空" }, { status: 400 });
  }

  // 检查是否已有同名企业/组织
  const existing = await prisma.organization.findFirst({
    where: { name },
  });
  if (existing) {
    return NextResponse.json({ error: "已存在同名企业或组织，请勿重复录入" }, { status: 400 });
  }

  const newOrg = await prisma.organization.create({
    data: {
      name,
      type,
      industry,
      address,
      contactName,
      contactPhone,
      intro,
      ownerId: session.id,
      status: "ACTIVE",
      members: {
        create: {
          userId: session.id,
          role: "OWNER",
          title: "系统管理员",
          status: "ACTIVE",
        },
      },
    },
    include: {
      owner: { select: { id: true, username: true, nickname: true, phone: true } },
      _count: { select: { members: true, jobs: true, tasks: true, candidates: true } },
    },
  });

  // 记录操作日志
  await prisma.operationLog.create({
    data: {
      userId: session.id,
      action: "create_organization",
      targetId: newOrg.id,
      metadata: { name: newOrg.name, type: newOrg.type, industry: newOrg.industry },
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, organization: newOrg }, { status: 201 });
}
