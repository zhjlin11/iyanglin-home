import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const updateResult = await prisma.notification.updateMany({
      where: {
        userId: session.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: updateResult.count,
    });
  } catch (err: any) {
    console.error("[Notifications read-all] error:", err);
    return NextResponse.json(
      { error: err.message || "更新已读状态失败" },
      { status: 500 }
    );
  }
}
