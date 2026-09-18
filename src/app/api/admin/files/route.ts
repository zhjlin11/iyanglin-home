import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const files = await prisma.mediaFile.findMany({
    orderBy: { createdAt: "desc" },
    include: { references: true },
    take: 100,
  });

  return NextResponse.json({ files });
}
