import { NextResponse } from "next/server";
import { getPromotionPackages } from "@/lib/info-promotions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as "PROMOTION" | "VERIFICATION" | "MEMBERSHIP" | undefined;

    const packages = await getPromotionPackages(category || undefined);

    return NextResponse.json({
      success: true,
      packages,
    });
  } catch (error: any) {
    console.error("[API /api/info/packages GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "获取商业化套餐失败" },
      { status: 500 }
    );
  }
}
