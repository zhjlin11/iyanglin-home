import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const session = await getSession(req);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const shop = await prisma.shop.findUnique({ where: { id } });
  if (!shop || shop.authorId !== session.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json();
  const { name, phone, address, hours, intro, logo, images, category } = body;

  const updated = await prisma.shop.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(hours !== undefined ? { hours } : {}),
      ...(intro !== undefined ? { intro } : {}),
      ...(logo !== undefined ? { logo } : {}),
      ...(images !== undefined ? { images } : {}),
      ...(category !== undefined ? { category } : {}),
    },
  });

  return NextResponse.json({ shop: updated });
}
