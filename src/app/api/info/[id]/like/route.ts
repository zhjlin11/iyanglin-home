import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "ID不能为空" }, { status: 400 });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        likesCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      likesCount: updated.likesCount,
    });
  } catch (error: any) {
    console.error("[API /api/info/[id]/like POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "点赞失败" },
      { status: 500 }
    );
  }
}
