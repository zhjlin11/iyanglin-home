import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const identities = await prisma.wechatIdentity.findMany({
    where: { userId: session.id },
    select: {
      id: true,
      appType: true,
      appId: true,
      openId: true,
      unionId: true,
      subscribed: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, identities });
}
