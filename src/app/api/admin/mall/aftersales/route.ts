import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendUnifiedNotification } from "@/lib/unified-notification";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权访问" }, { status: 403 });

    const list = await prisma.mallAfterSale.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          include: {
            items: true,
            user: { select: { id: true, nickname: true, phone: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    return NextResponse.json({ error: "获取售后列表失败" }, { status: 500 });
  }
}
