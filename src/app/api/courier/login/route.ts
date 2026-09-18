import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = body.phone?.trim();
    const accessCode = body.accessCode?.trim();

    if (!phone || !accessCode) {
      return NextResponse.json({ error: "请输入配送员手机号和授权码" }, { status: 400 });
    }

    const courier = await prisma.courier.findUnique({
      where: { phone },
    });

    if (!courier) {
      return NextResponse.json({ error: "未找到该配送员记录，请联系站长或便利店管理员配置" }, { status: 404 });
    }

    if (courier.status !== "ACTIVE") {
      return NextResponse.json({ error: "该配送员账号处于停用状态" }, { status: 403 });
    }

    if (courier.accessCode !== accessCode) {
      return NextResponse.json({ error: "授权码错误" }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      message: "登录成功",
      data: {
        id: courier.id,
        name: courier.name,
        phone: courier.phone,
      },
    });

    // 写入轻量 HttpOnly Cookie
    response.cookies.set("courier_token", courier.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 3600,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "配送员登录失败" }, { status: 500 });
  }
}
