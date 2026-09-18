import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权操作" }, { status: 403 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = String(body.name).trim();
    if (body.feeCents !== undefined) updateData.feeCents = parseInt(body.feeCents, 10);
    if (body.freeShippingThresholdCents !== undefined) updateData.freeShippingThresholdCents = parseInt(body.freeShippingThresholdCents, 10);
    if (body.estimatedMinutes !== undefined) updateData.estimatedMinutes = String(body.estimatedMinutes).trim();
    if (body.enabled !== undefined) updateData.enabled = Boolean(body.enabled);
    if (body.sortOrder !== undefined) updateData.sortOrder = parseInt(body.sortOrder, 10);

    const zone = await prisma.deliveryZone.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: zone });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "更新区域失败" }, { status: 500 });
  }
}
