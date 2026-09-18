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
    if (body.phone !== undefined) updateData.phone = String(body.phone).trim();
    if (body.accessCode !== undefined) updateData.accessCode = String(body.accessCode).trim();
    if (body.status !== undefined) updateData.status = body.status;
    if (body.remark !== undefined) updateData.remark = body.remark ? String(body.remark).trim() : null;

    const courier = await prisma.courier.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: courier });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "更新配送员失败" }, { status: 500 });
  }
}
