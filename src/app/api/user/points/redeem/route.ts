import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { redeemPoints, RedemptionType } from "@/lib/points-engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { redemptionType } = body;

    if (
      !redemptionType ||
      !["COUPON_10", "TOPPING_3D", "PLUS_15D"].includes(redemptionType)
    ) {
      return NextResponse.json({ error: "无效的积分兑换项目" }, { status: 400 });
    }

    const result = await redeemPoints(
      session.id,
      redemptionType as RedemptionType
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "积分兑换失败" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `恭喜！成功兑换「${result.rewardName}」`,
      rewardName: result.rewardName,
      remainingPoints: result.remainingPoints,
    });
  } catch (err: any) {
    console.error("[Points Redeem] error:", err);
    return NextResponse.json(
      { error: err.message || "积分兑换服务异常" },
      { status: 500 }
    );
  }
}
