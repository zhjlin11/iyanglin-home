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
  const house = await prisma.house.findUnique({ where: { id } });
  if (!house || house.authorId !== session.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json();
  const { title, price, layout, areaSize, location, contact, body: houseBody, houseType } = body;

  const updated = await prisma.house.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(layout !== undefined ? { layout } : {}),
      ...(areaSize !== undefined ? { areaSize } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(contact !== undefined ? { contact } : {}),
      ...(houseBody !== undefined ? { body: houseBody } : {}),
      ...(houseType !== undefined ? { houseType } : {}),
    },
  });

  return NextResponse.json({ house: updated });
}
