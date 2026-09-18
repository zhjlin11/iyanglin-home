import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getProviderTrustFacts } from "@/lib/info-promotions";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "ID不能为空" }, { status: 400 });
    }

    const session = await getSession(request);
    const roleUpper = String(session?.role || "").toUpperCase();
    const isAdmin = roleUpper === "ADMIN" || roleUpper === "EDITOR";

    const provider = await prisma.serviceProvider.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            phone: true,
            phoneVerifiedAt: true,
            createdAt: true,
            communityBadge: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ success: false, error: "服务者/商家主页不存在" }, { status: 404 });
    }

    const isOwner = session?.id === provider.userId;
    if (provider.verificationStatus !== "APPROVED" && !isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "该服务商正在审核中或暂未对外公开" },
        { status: 403 }
      );
    }

    // 获取真实可信度事实
    const trustFacts = await getProviderTrustFacts(provider.userId);

    // 获取该服务者名下的便民信息服务清单
    const listings = await prisma.listing.findMany({
      where: {
        authorId: provider.userId,
        status: "APPROVED",
      },
      orderBy: [
        { isTop: "desc" },
        { isFeatured: "desc" },
        { refreshedAt: "desc" },
      ],
      take: 20,
    });

    return NextResponse.json({
      success: true,
      provider: {
        ...provider,
        // 隐藏营业执照原件隐私，仅向管理员和本人展示
        licenseImages: isOwner || isAdmin ? provider.licenseImages : [],
      },
      trustFacts,
      listings,
    });
  } catch (error: any) {
    console.error("[API /api/provider/[id] GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "获取服务者资料失败" },
      { status: 500 }
    );
  }
}
