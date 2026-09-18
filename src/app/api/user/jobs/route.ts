import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const jobs = await prisma.job.findMany({
    where: { authorId: session.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ jobs });
}
