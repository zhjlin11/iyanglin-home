import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.userAddress.findFirst({
      where: { id, userId: session.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "地址不存在或无权操作" }, { status: 404 });
    }

    const body = await request.json();
    if (body.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: session.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.userAddress.update({
      where: { id },
      data: {
        contactName: body.contactName ? String(body.contactName).trim() : existing.contactName,
        phone: body.phone ? String(body.phone).trim() : existing.phone,
        area: body.area ? String(body.area).trim() : existing.area,
        addressDetail: body.addressDetail ? String(body.addressDetail).trim() : existing.addressDetail,
        tag: body.tag !== undefined ? String(body.tag).trim() : existing.tag,
        isDefault: body.isDefault !== undefined ? Boolean(body.isDefault) : existing.isDefault,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("PUT /api/user/addresses/[id] error:", err);
    return NextResponse.json({ error: "更新地址失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.userAddress.findFirst({
      where: { id, userId: session.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "地址不存在或无权操作" }, { status: 404 });
    }

    await prisma.userAddress.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/user/addresses/[id] error:", err);
    return NextResponse.json({ error: "删除地址失败" }, { status: 500 });
  }
}
