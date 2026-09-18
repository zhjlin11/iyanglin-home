import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权访问" }, { status: 403 });

    const zones = await prisma.deliveryZone.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: zones });
  } catch (err: any) {
    return NextResponse.json({ error: "获取配送区域配置失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权操作" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const { name, feeCents, freeShippingThresholdCents, estimatedMinutes, enabled, sortOrder } = body;

    if (!name) return NextResponse.json({ error: "区域名称不能为空" }, { status: 400 });

    const zone = await prisma.deliveryZone.create({
      data: {
        name: String(name).trim(),
        feeCents: parseInt(feeCents || 300, 10),
        freeShippingThresholdCents: parseInt(freeShippingThresholdCents || 2900, 10),
        estimatedMinutes: estimatedMinutes ? String(estimatedMinutes).trim() : "30-45分钟",
        enabled: enabled !== undefined ? Boolean(enabled) : true,
        sortOrder: parseInt(sortOrder || 0, 10),
      },
    });

    return NextResponse.json({ success: true, data: zone });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "创建区域失败" }, { status: 500 });
  }
}
