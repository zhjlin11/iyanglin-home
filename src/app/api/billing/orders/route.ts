import { NextResponse } from "next/server";
import { createBillingOrder, getBillingStats } from "@/lib/billing-store";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "无管理员权限" }, { status: 403 });
  }

  const stats = await getBillingStats();
  return NextResponse.json(stats);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.planId || !body.targetKind || !body.targetId || !body.targetTitle) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  try {
    const order = await createBillingOrder({
      planId: String(body.planId),
      targetKind: String(body.targetKind),
      targetId: String(body.targetId),
      targetTitle: String(body.targetTitle),
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "创建置顶订单失败" }, { status: 400 });
  }
}
