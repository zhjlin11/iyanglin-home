import { NextResponse } from "next/server";
import {
  getIndustrialRecommendations,
  getJobRecommendations,
  getHouseRecommendations,
} from "@/lib/recommendation-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetType = (searchParams.get("targetType") || "").toUpperCase();
  const targetId = searchParams.get("targetId") || "";
  const area = searchParams.get("area") || "杨林";

  try {
    let groups: any[] = [];
    if (targetType === "INDUSTRIAL") {
      groups = await getIndustrialRecommendations(targetId, area);
    } else if (targetType === "JOB") {
      groups = await getJobRecommendations(targetId, area);
    } else if (targetType === "HOUSE") {
      groups = await getHouseRecommendations(targetId, area);
    }

    return NextResponse.json({
      success: true,
      groups,
    });
  } catch (err: any) {
    console.error("[CrossChannel Recommendations] error:", err);
    return NextResponse.json(
      { error: err.message || "推荐数据拉取异常" },
      { status: 500 }
    );
  }
}
