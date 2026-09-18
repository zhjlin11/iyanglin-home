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

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job || job.authorId !== session.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json();
  const { title, company, body: jobBody, salary, area, jobType } = body;

  const updated = await prisma.job.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(company !== undefined ? { company } : {}),
      ...(jobBody !== undefined ? { body: jobBody } : {}),
      ...(salary !== undefined ? { salary } : {}),
      ...(area !== undefined ? { area } : {}),
      ...(jobType !== undefined ? { jobType } : {}),
    },
  });

  return NextResponse.json({ job: updated });
}
