import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问管理后台数据" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") || "";
    const status = searchParams.get("status") || "ALL";
    const propertyType = searchParams.get("propertyType") || "ALL";
    const transactionType = searchParams.get("transactionType") || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10));

    const where: any = {};

    if (status !== "ALL") {
      where.status = status;
    }

    if (propertyType !== "ALL") {
      where.propertyType = propertyType;
    }

    if (transactionType !== "ALL") {
      if (transactionType === "SUPPLY") {
        where.transactionType = { notIn: ["WANTED_RENT", "WANTED_BUY"] };
      } else if (transactionType === "WANTED") {
        where.transactionType = { in: ["WANTED_RENT", "WANTED_BUY"] };
      } else {
        where.transactionType = transactionType;
      }
    }

    if (keyword.trim()) {
      where.OR = [
        { title: { contains: keyword.trim(), mode: "insensitive" } },
        { parkName: { contains: keyword.trim(), mode: "insensitive" } },
        { contactName: { contains: keyword.trim(), mode: "insensitive" } },
        { contactPhone: { contains: keyword.trim(), mode: "insensitive" } },
        { region: { contains: keyword.trim(), mode: "insensitive" } },
      ];
    }

    const [items, total, pendingReviewCount, totalApprovedCount] = await Promise.all([
      prisma.industrialProperty.findMany({
        where,
        orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: { id: true, username: true, nickname: true, phone: true },
          },
        },
      }),
      prisma.industrialProperty.count({ where }),
      prisma.industrialProperty.count({ where: { status: "PENDING" } }),
      prisma.industrialProperty.count({ where: { status: "PUBLISHED" } }),
    ]);

    return NextResponse.json({
      items,
      total,
      pendingReviewCount,
      totalApprovedCount,
      page,
      pageSize,
    });
  } catch (error: any) {
    console.error("GET /api/admin/industrial error:", error);
    return NextResponse.json({ error: "获取园区招商数据失败" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权执行管理操作" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, isTop, isFeatured, verifiedLevel, rejectReason } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少物业ID" }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (isTop !== undefined) updateData.isTop = Boolean(isTop);
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (verifiedLevel !== undefined) updateData.verifiedLevel = verifiedLevel;
    if (rejectReason !== undefined) updateData.rejectReason = rejectReason;

    const updated = await prisma.industrialProperty.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/industrial error:", error);
    return NextResponse.json({ error: "更新园区招商数据失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权执行删除操作" }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少物业ID" }, { status: 400 });
    }

    await prisma.industrialProperty.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "删除成功" });
  } catch (error: any) {
    console.error("DELETE /api/admin/industrial error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
