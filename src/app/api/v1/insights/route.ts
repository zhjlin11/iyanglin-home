import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLocalCommercialInsights } from "@/lib/data-platform";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  try {
    const data = await getLocalCommercialInsights();
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
