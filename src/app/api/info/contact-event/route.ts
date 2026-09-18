import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    const body = await req.json();
    const { providerId, requestId, listingId, action, source = "INFO_DETAIL" } = body;

    const allowedActions = [
      "CALL",
      "COPY_PHONE",
      "COPY_WECHAT",
      "CLICK_CONSULT",
      "VIEW_PROFILE",
      "VIEW_PHONE",
    ];

    if (!action || !allowedActions.includes(action)) {
      return NextResponse.json({ success: false, message: "无效的联系动作类型" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");

    await prisma.contactEvent.create({
      data: {
        userId: session?.id || null,
        providerId: providerId || null,
        requestId: requestId || null,
        listingId: listingId || null,
        action,
        source,
        ip: ip || null,
        userAgent: userAgent?.slice(0, 255) || null,
      },
    });

    return NextResponse.json({ success: true, message: "事件已记录" });
  } catch (error: any) {
    console.error("[CONTACT_EVENT_ERROR]", error);
    return NextResponse.json({ success: false, message: error.message || "打点失败" }, { status: 500 });
  }
}
