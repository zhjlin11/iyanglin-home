import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const flags = await prisma.featureFlag.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, flags });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  try {
    const { key, enabled, percentage } = await req.json();
    const updated = await prisma.featureFlag.update({
      where: { key },
      data: {
        ...(enabled !== undefined ? { enabled } : {}),
        ...(percentage !== undefined ? { percentage } : {}),
      },
    });

    return NextResponse.json({ success: true, flag: updated });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
