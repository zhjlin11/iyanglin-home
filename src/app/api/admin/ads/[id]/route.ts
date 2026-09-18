import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { title, image, link, sort, status } = body;

  const ad = await prisma.advertisement.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(image !== undefined ? { image } : {}),
      ...(link !== undefined ? { link } : {}),
      ...(sort !== undefined ? { sort: Number(sort) } : {}),
      ...(status !== undefined ? { status } : {}),
    },
  });

  await prisma.operationLog.create({
    data: {
      userId: session.id,
      action: "update_advertisement",
      targetId: ad.id,
      metadata: { title: ad.title, status: ad.status },
    },
  });

  return NextResponse.json({ ad });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const session = await getSession(req);
  if (!session || session.role.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await ctx.params;

  await prisma.advertisement.delete({ where: { id } });

  await prisma.operationLog.create({
    data: {
      userId: session.id,
      action: "delete_advertisement",
      targetId: id,
      metadata: {},
    },
  });

  return NextResponse.json({ success: true });
}
