import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "该接口已废弃，所有支付必须经由微信支付收银台安全通道完成。" },
    { status: 403 }
  );
}
