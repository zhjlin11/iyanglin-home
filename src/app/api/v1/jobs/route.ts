import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  const [total, pending, processing, completed, failed, retrying, recent] =
    await Promise.all([
      prisma.asyncJob.count(),
      prisma.asyncJob.count({ where: { status: "PENDING" } }),
      prisma.asyncJob.count({ where: { status: "PROCESSING" } }),
      prisma.asyncJob.count({ where: { status: "COMPLETED" } }),
      prisma.asyncJob.count({ where: { status: "FAILED" } }),
      prisma.asyncJob.count({ where: { status: "RETRYING" } }),
      prisma.asyncJob.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return NextResponse.json({
    success: true,
    stats: {
      total,
      pending,
      processing,
      completed,
      failed,
      retrying,
    },
    recent,
  });
}
