import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { claimCoupon } from "@/lib/coupon-engine";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录后再领取优惠券" }, { status: 401 });
    }

    const body = await request.json();
    const { couponId } = body;

    if (!couponId) {
      return NextResponse.json({ error: "缺少优惠券ID" }, { status: 400 });
    }

    const userCoupon = await claimCoupon(session.id, couponId);

    return NextResponse.json({
      success: true,
      message: "🎉 优惠券领取成功！已存入您的个人卡包",
      data: userCoupon,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "领取优惠券失败" }, { status: 400 });
  }
}
