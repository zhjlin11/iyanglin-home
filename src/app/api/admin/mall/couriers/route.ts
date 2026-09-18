import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权访问" }, { status: 403 });

    const couriers = await prisma.courier.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            orders: { where: { status: { in: ["READY", "DELIVERING"] } } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: couriers });
  } catch (err: any) {
    return NextResponse.json({ error: "获取配送员列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权操作" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const { name, phone, accessCode, remark } = body;

    if (!name || !phone) return NextResponse.json({ error: "姓名和手机号必填" }, { status: 400 });

    const courier = await prisma.courier.create({
      data: {
        name: String(name).trim(),
        phone: String(phone).trim(),
        accessCode: accessCode ? String(accessCode).trim() : "888888",
        status: "ACTIVE",
        remark: remark ? String(remark).trim() : null,
      },
    });

    return NextResponse.json({ success: true, data: courier });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "创建配送员失败" }, { status: 500 });
  }
}
