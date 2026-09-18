import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const follows = await prisma.followProvider.findMany({
      where: { userId: session.id },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            avatar: true,
            serviceCategory: true,
            serviceAreas: true,
            phone: true,
            operatingStatus: true,
            ratingAvg: true,
            ratingCount: true,
            completedOrders: true,
            isMember: true,
            campaigns: {
              where: { status: "ACTIVE" },
              take: 2,
              select: {
                id: true,
                title: true,
                badgeText: true,
                discountRate: true,
                discountCents: true,
              },
            },
            coupons: {
              where: { enabled: true },
              take: 2,
              select: {
                id: true,
                title: true,
                discountCents: true,
                minSpendCents: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = follows.map((f) => ({
      followId: f.id,
      followedAt: f.createdAt,
      provider: f.provider,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("GET /api/provider/follow error:", err);
    return NextResponse.json({ error: err.message || "获取关注列表失败" }, { status: 500 });
  }
}
