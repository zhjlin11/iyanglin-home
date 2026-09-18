import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function checkAdminAuth(session: any): session is { id: string; role: string; [key: string]: any } {
  if (!session?.id) return false;
  const role = String(session.role || "").toUpperCase();
  return ["ADMIN", "EDITOR"].includes(role);
}

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!checkAdminAuth(session)) {
      return NextResponse.json({ error: "无权访问风控中心" }, { status: 403 });
    }

    const [reports, openAfterSales, pendingRefunds] = await Promise.all([
      prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          user: { select: { id: true, username: true, phone: true } },
        },
      }),
      prisma.afterSale.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          applicant: { select: { id: true, username: true, phone: true } },
        },
      }),
      prisma.refund.findMany({
        where: { status: "REQUESTED" },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: { select: { id: true, username: true, phone: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      reportsCount: reports.length,
      afterSalesCount: openAfterSales.length,
      refundsCount: pendingRefunds.length,
      reports,
      openAfterSales,
      pendingRefunds,
    });
  } catch (err: any) {
    console.error("[Admin Risk GET] error:", err);
    return NextResponse.json(
      { error: err.message || "拉取风控数据失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!checkAdminAuth(session)) {
      return NextResponse.json({ error: "无权执行风控操作" }, { status: 403 });
    }

    const body = await request.json();
    const { reportId, action, note } = body;

    if (!reportId || !action || !["RESOLVED", "REJECTED"].includes(action)) {
      return NextResponse.json({ error: "参数不合法" }, { status: 400 });
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: { status: action },
    });

    return NextResponse.json({
      success: true,
      message: `举报已处理为「${action === "RESOLVED" ? "已处理下线" : "已驳回/属实正常"}」`,
      record: updated,
    });
  } catch (err: any) {
    console.error("[Admin Risk POST] error:", err);
    return NextResponse.json(
      { error: err.message || "风控操作失败" },
      { status: 500 }
    );
  }
}
