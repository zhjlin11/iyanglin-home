import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const reports = await prisma.report.findMany({
    include: {
      user: {
        select: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ reports });
}

export async function PUT(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { reportId, status, action, handleNote } = body;

  if (!reportId) {
    return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
  }

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // 1. 处理高级管理处置动作（内容下架、物理删除等）
  if (action === "OFFLINE_CONTENT") {
    const resType = report.resourceType.toUpperCase();
    const resId = report.resourceId;

    if (resType === "JOB") {
      await prisma.job.updateMany({ where: { id: resId }, data: { status: "OFFLINE" } });
    } else if (resType === "HOUSE") {
      await prisma.house.updateMany({ where: { id: resId }, data: { status: "OFFLINE" } });
    } else if (resType === "INDUSTRIAL") {
      await prisma.industrialProperty.updateMany({ where: { id: resId }, data: { status: "OFFLINE" } });
    } else if (resType === "COMMUNITY_POST" || resType === "POST") {
      await prisma.post.updateMany({ where: { id: resId }, data: { status: "OFFLINE" } });
    } else if (resType === "MERCHANT" || resType === "SHOP") {
      await prisma.shop.updateMany({ where: { id: resId }, data: { status: "OFFLINE" } });
    } else if (resType === "ARTICLE") {
      await prisma.article.updateMany({ where: { id: resId }, data: { status: "OFFLINE" } });
    } else if (resType === "PRODUCT" || resType === "LISTING") {
      await prisma.listing.updateMany({ where: { id: resId }, data: { status: "OFFLINE" } });
    }
  }

  const finalStatus = status || (action === "OFFLINE_CONTENT" ? "RESOLVED" : report.status);

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: finalStatus,
    },
  });

  // Log action in OperationLog
  await prisma.operationLog.create({
    data: {
      userId: session.id,
      action: action || "update_report_status",
      targetId: reportId,
      metadata: {
        previousStatus: report.status,
        nextStatus: finalStatus,
        action: action || null,
        handleNote: handleNote || null,
        resourceType: report.resourceType,
        resourceId: report.resourceId,
      },
    },
  });

  return NextResponse.json({ success: true, report: updated });
}
