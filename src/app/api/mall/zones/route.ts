import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const zones = await prisma.deliveryZone.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: zones });
  } catch (err: any) {
    console.error("GET /api/mall/zones error:", err);
    return NextResponse.json({ error: "获取配送区域失败" }, { status: 500 });
  }
}
