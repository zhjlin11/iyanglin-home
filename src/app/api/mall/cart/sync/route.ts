import { NextResponse } from "next/server";
import { calculateMallOrder } from "@/lib/mall/cart-service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const items = body.items || [];
    const deliveryMethod = body.deliveryMethod || "DELIVERY";
    const zoneId = body.zoneId || undefined;

    const result = await calculateMallOrder({
      items,
      deliveryMethod,
      zoneId,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("POST /api/mall/cart/sync error:", err);
    return NextResponse.json({ error: "购物车同步失败" }, { status: 500 });
  }
}
