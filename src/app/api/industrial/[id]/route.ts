import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/industrial/[id] - 获取单条详情
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const item = await prisma.industrialProperty.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "信息不存在或已被删除" }, { status: 404 });
    }

    // 浏览量轻量防刷递增
    await prisma.industrialProperty.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "获取失败" }, { status: 500 });
  }
}

// PUT /api/industrial/[id] - 更新 / 审核 / 编辑
export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const item = await prisma.industrialProperty.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "信息不存在" }, { status: 404 });
  }

  const isAdmin = ["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase());
  const isAuthor = item.userId === session.id;

  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: "无权修改该信息" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const updateData: any = {};

    // 管理员专用操作字段
    if (isAdmin) {
      if (data.status) updateData.status = data.status;
      if (data.rejectReason !== undefined) updateData.rejectReason = data.rejectReason;
      if (data.verifiedLevel) updateData.verifiedLevel = data.verifiedLevel;
      if (data.isTop !== undefined) updateData.isTop = !!data.isTop;
      if (data.featured !== undefined) updateData.featured = !!data.featured;
    }

    // 作者或管理员均可修改的基础内容字段
    const allowedFields = [
      "title", "description", "propertyType", "transactionType", "region",
      "parkName", "address", "buildingArea", "factoryArea", "landArea",
      "officeArea", "rentPrice", "salePrice", "priceUnit", "negotiable",
      "floorHeight", "floorCount", "isSingleFloor", "loadBearing", "columnSpacing",
      "powerCapacity", "hasCrane", "craneTonnage", "hasGas", "hasWater",
      "hasDrainage", "hasFireSystem", "fireStatus", "hasEnvironmentalCondition",
      "truckAccessible", "maxTruckLength", "roadWidth", "hasLoadingDock",
      "hasOffice", "hasDormitory", "hasCanteen", "hasParking", "parkingCount",
      "landUseType", "propertyRightStatus", "canSplit", "canBuild",
      "cooperationDemand", "minimumLeaseTerm", "availableDate",
      "suitableIndustries", "contactName", "contactPhone", "images"
    ];

    for (const f of allowedFields) {
      if (data[f] !== undefined) {
        updateData[f] = data[f];
      }
    }

    const updated = await prisma.industrialProperty.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "更新失败" }, { status: 500 });
  }
}

// DELETE /api/industrial/[id] - 删除 / 下架
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const item = await prisma.industrialProperty.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "信息不存在" }, { status: 404 });
  }

  const isAdmin = ["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase());
  const isAuthor = item.userId === session.id;

  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: "无权删除该信息" }, { status: 403 });
  }

  try {
    await prisma.industrialProperty.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "删除成功" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "删除失败" }, { status: 500 });
  }
}
