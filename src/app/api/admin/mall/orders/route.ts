import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "无权访问" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const deliveryMethod = searchParams.get("deliveryMethod") || searchParams.get("fulfillmentType") || undefined;
    const q = searchParams.get("q") || searchParams.get("search")?.trim() || undefined;

    const where: any = {};
    if (status && status.toUpperCase() !== "ALL") where.status = status;
    if (deliveryMethod && deliveryMethod.toUpperCase() !== "ALL") where.deliveryMethod = deliveryMethod;
    if (q) {
      where.OR = [
        { orderNo: { contains: q, mode: "insensitive" } },
        { contactName: { contains: q, mode: "insensitive" } },
        { contactPhone: { contains: q, mode: "insensitive" } },
        { pickupCode: { contains: q, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.mallOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        courier: { select: { id: true, name: true, phone: true } },
        user: { select: { id: true, username: true, nickname: true, phone: true } },
        afterSale: true,
        logs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (err: any) {
    console.error("GET /api/admin/mall/orders error:", err);
    return NextResponse.json({ error: "获取订单列表失败" }, { status: 500 });
  }
}
