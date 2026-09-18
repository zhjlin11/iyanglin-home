import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/addresses — 获取当前用户的服务地址列表
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const addresses = await prisma.userAddress.findMany({
      where: { userId: session.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: addresses });
  } catch (err: any) {
    console.error("GET /api/user/addresses error:", err);
    return NextResponse.json({ error: "获取地址失败" }, { status: 500 });
  }
}

/**
 * POST /api/user/addresses — 新增服务地址
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { contactName, phone, area, addressDetail, tag, isDefault } = body;

    if (!contactName || !phone || !area || !addressDetail) {
      return NextResponse.json({ error: "请完整填写联系人、手机号、片区与详细门牌地址" }, { status: 400 });
    }

    // 如果设为默认地址，先重置已有默认
    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: session.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // 检查是否为用户第一条地址，第一条自动设为默认
    const count = await prisma.userAddress.count({ where: { userId: session.id } });

    const address = await prisma.userAddress.create({
      data: {
        userId: session.id,
        contactName: String(contactName).trim(),
        phone: String(phone).trim(),
        area: String(area).trim(),
        addressDetail: String(addressDetail).trim(),
        tag: tag ? String(tag).trim() : "家",
        isDefault: isDefault || count === 0,
      },
    });

    return NextResponse.json({ success: true, data: address });
  } catch (err: any) {
    console.error("POST /api/user/addresses error:", err);
    return NextResponse.json({ error: "创建地址失败" }, { status: 500 });
  }
}
