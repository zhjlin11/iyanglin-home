import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    // Increment sessionVersion to invalidate ALL active sessions across all devices
    await prisma.user.update({
      where: { id: session.id },
      data: {
        sessionVersion: { increment: 1 },
      },
    });

    const response = NextResponse.json({ success: true, message: "已成功退出所有设备登录状态！" });
    response.headers.set(
      "Set-Cookie",
      "yanglin_session=; Path=/; HttpOnly; Max-Age=0"
    );

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器异常" }, { status: 500 });
  }
}
