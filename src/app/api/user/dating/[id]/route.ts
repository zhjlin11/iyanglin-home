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
  const profile = await prisma.datingProfile.findUnique({ where: { id } });
  if (!profile || profile.authorId !== session.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json();
  const { nickname, occupation, income, location, requirement, intro, contact, education, maritalStatus } = body;

  const updated = await prisma.datingProfile.update({
    where: { id },
    data: {
      ...(nickname !== undefined ? { nickname } : {}),
      ...(occupation !== undefined ? { occupation } : {}),
      ...(income !== undefined ? { income } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(requirement !== undefined ? { requirement } : {}),
      ...(intro !== undefined ? { intro } : {}),
      ...(contact !== undefined ? { contact } : {}),
      ...(education !== undefined ? { education } : {}),
      ...(maritalStatus !== undefined ? { maritalStatus } : {}),
    },
  });

  return NextResponse.json({ profile: updated });
}
