import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/industrial - 列表检索与分页
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // FACTORY, WAREHOUSE, etc.
  const transaction = searchParams.get("transaction"); // RENT, SALE, etc.
  const region = searchParams.get("region");
  const wanted = searchParams.get("wanted"); // true | false
  const areaRange = searchParams.get("area"); // 0-500, 500-1000, 1000-3000, 3000-5000, 5000+
  const q = (searchParams.get("q") || "").trim();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "12", 10);

  // 关键特性条件 (Tag filter)
  const isSingleFloor = searchParams.get("singleFloor") === "true";
  const hasCrane = searchParams.get("crane") === "true";
  const hasFireSystem = searchParams.get("fire") === "true";
  const truckAccessible = searchParams.get("truck") === "true";
  const canSplit = searchParams.get("canSplit") === "true";
  const hasLoadingDock = searchParams.get("loadingBay") === "true";
  const hasOffice = searchParams.get("office") === "true";
  const hasDormitory = searchParams.get("dormitory") === "true";
  const heightRange = searchParams.get("height"); // 0-6, 6-9, 9-12, 12+
  const powerRange = searchParams.get("power"); // 0-100, 100-300, 300-500, 500-1000, 1000+

  const where: any = {
    status: "PUBLISHED",
  };

  if (type && type !== "all" && type !== "ALL") {
    where.propertyType = type.toUpperCase();
  }

  if (transaction && transaction !== "all" && transaction !== "ALL") {
    where.transactionType = transaction.toUpperCase();
  } else if (wanted === "true") {
    where.transactionType = { in: ["WANTED_RENT", "WANTED_BUY"] };
  } else if (wanted === "false") {
    where.transactionType = { notIn: ["WANTED_RENT", "WANTED_BUY"] };
  }

  if (region && region !== "all" && region !== "全部区域") {
    where.region = region;
  }

  // 面积区间筛选 (以 buildingArea 或 landArea 为主)
  if (areaRange) {
    if (areaRange === "0-500") {
      where.OR = [{ buildingArea: { lte: 500 } }, { landArea: { lte: 500 } }];
    } else if (areaRange === "500-1000") {
      where.OR = [
        { buildingArea: { gt: 500, lte: 1000 } },
        { landArea: { gt: 500, lte: 1000 } },
      ];
    } else if (areaRange === "1000-3000") {
      where.OR = [
        { buildingArea: { gt: 1000, lte: 3000 } },
        { landArea: { gt: 1000, lte: 3000 } },
      ];
    } else if (areaRange === "3000-5000") {
      where.OR = [
        { buildingArea: { gt: 3000, lte: 5000 } },
        { landArea: { gt: 3000, lte: 5000 } },
      ];
    } else if (areaRange === "5000+") {
      where.OR = [{ buildingArea: { gt: 5000 } }, { landArea: { gt: 5000 } }];
    }
  }

  // 层高区间 (floorHeight)
  if (heightRange) {
    if (heightRange === "0-6") where.floorHeight = { lte: 6 };
    else if (heightRange === "6-9") where.floorHeight = { gt: 6, lte: 9 };
    else if (heightRange === "9-12") where.floorHeight = { gt: 9, lte: 12 };
    else if (heightRange === "12+") where.floorHeight = { gt: 12 };
  }

  // 电力容量区间 (powerCapacity)
  if (powerRange) {
    if (powerRange === "0-100") where.powerCapacity = { lte: 100 };
    else if (powerRange === "100-300") where.powerCapacity = { gt: 100, lte: 300 };
    else if (powerRange === "300-500") where.powerCapacity = { gt: 300, lte: 500 };
    else if (powerRange === "500-1000") where.powerCapacity = { gt: 500, lte: 1000 };
    else if (powerRange === "1000+") where.powerCapacity = { gt: 1000 };
  }

  // 工业特性过滤
  if (isSingleFloor) where.isSingleFloor = true;
  if (hasCrane) where.hasCrane = true;
  if (hasFireSystem) where.hasFireSystem = true;
  if (truckAccessible) where.truckAccessible = true;
  if (canSplit) where.canSplit = true;
  if (hasLoadingDock) where.hasLoadingDock = true;
  if (hasOffice) where.hasOffice = true;
  if (hasDormitory) where.hasDormitory = true;

  // 关键词检索
  if (q) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { parkName: { contains: q, mode: "insensitive" } },
          { address: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }

  try {
    const [total, items] = await Promise.all([
      prisma.industrialProperty.count({ where }),
      prisma.industrialProperty.findMany({
        where,
        orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      items,
    });
  } catch (error: any) {
    console.error("GET /api/industrial error:", error);
    return NextResponse.json({ error: error.message || "获取失败" }, { status: 500 });
  }
}

// POST /api/industrial - 发布新物业/需求
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录后再发布园区招商信息" }, { status: 401 });
  }

  try {
    const data = await request.json();

    // 核心必填项校验
    if (!data.title || !data.title.trim()) {
      return NextResponse.json({ error: "请填写标题" }, { status: 400 });
    }
    if (!data.contactName || !data.contactName.trim()) {
      return NextResponse.json({ error: "请填写联系人姓名" }, { status: 400 });
    }
    if (!data.contactPhone || !data.contactPhone.trim()) {
      return NextResponse.json({ error: "请填写联系电话" }, { status: 400 });
    }
    if (!data.address || !data.address.trim()) {
      return NextResponse.json({ error: "请填写物业地址或具体位置" }, { status: 400 });
    }

    // 格式化数字型字段
    const parseNum = (val: any) => {
      if (val === undefined || val === null || val === "") return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    const parsePositiveInt = (val: any) => {
      if (val === undefined || val === null || val === "") return null;
      const num = parseInt(val, 10);
      return isNaN(num) ? null : Math.max(0, num);
    };

    // 疑似重复检查 (P0: 相同电话 + 相同标题在1小时内发布)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentDuplicate = await prisma.industrialProperty.findFirst({
      where: {
        contactPhone: data.contactPhone.trim(),
        title: data.title.trim(),
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentDuplicate) {
      return NextResponse.json(
        { error: "您在1小时内已发布过相同标题的招商信息，请勿重复发布" },
        { status: 400 }
      );
    }

    const newProperty = await prisma.industrialProperty.create({
      data: {
        userId: session.id === "env-admin" ? null : session.id,
        title: data.title.trim(),
        description: data.description ? data.description.trim() : "",
        propertyType: data.propertyType || "FACTORY",
        transactionType: data.transactionType || "RENT",
        status: "PUBLISHED", // 默认直接发布上线，后台可流转审核

        region: data.region || "杨林经开区",
        parkName: data.parkName ? data.parkName.trim() : null,
        address: data.address.trim(),

        buildingArea: parseNum(data.buildingArea),
        factoryArea: parseNum(data.factoryArea),
        landArea: parseNum(data.landArea),
        officeArea: parseNum(data.officeArea),

        rentPrice: parseNum(data.rentPrice),
        salePrice: parseNum(data.salePrice),
        priceUnit: data.priceUnit || "元/㎡/月",
        negotiable: !!data.negotiable,

        floorHeight: parseNum(data.floorHeight),
        floorCount: parsePositiveInt(data.floorCount) || 1,
        isSingleFloor: data.isSingleFloor !== undefined ? !!data.isSingleFloor : true,
        loadBearing: parseNum(data.loadBearing),
        columnSpacing: data.columnSpacing ? data.columnSpacing.trim() : null,
        powerCapacity: parsePositiveInt(data.powerCapacity),
        hasCrane: !!data.hasCrane,
        craneTonnage: parseNum(data.craneTonnage),

        hasGas: !!data.hasGas,
        hasWater: data.hasWater !== undefined ? !!data.hasWater : true,
        hasDrainage: data.hasDrainage !== undefined ? !!data.hasDrainage : true,
        hasFireSystem: data.hasFireSystem !== undefined ? !!data.hasFireSystem : true,
        fireStatus: data.fireStatus || "丙类",
        hasEnvironmentalCondition: !!data.hasEnvironmentalCondition,

        truckAccessible: data.truckAccessible !== undefined ? !!data.truckAccessible : true,
        maxTruckLength: data.maxTruckLength || "17.5米",
        roadWidth: parseNum(data.roadWidth),
        hasLoadingDock: !!data.hasLoadingDock,

        hasOffice: !!data.hasOffice,
        hasDormitory: !!data.hasDormitory,
        hasCanteen: !!data.hasCanteen,
        hasParking: data.hasParking !== undefined ? !!data.hasParking : true,
        parkingCount: parsePositiveInt(data.parkingCount),

        landUseType: data.landUseType || null,
        propertyRightStatus: data.propertyRightStatus || null,
        canSplit: !!data.canSplit,
        canBuild: data.canBuild !== undefined ? !!data.canBuild : true,

        cooperationDemand: data.cooperationDemand ? data.cooperationDemand.trim() : null,
        minimumLeaseTerm: data.minimumLeaseTerm || "1年",
        availableDate: data.availableDate || "随时可进驻",
        suitableIndustries: Array.isArray(data.suitableIndustries) ? data.suitableIndustries : [],

        contactName: data.contactName.trim(),
        contactPhone: data.contactPhone.trim(),
        verifiedLevel: "NONE",

        images: Array.isArray(data.images) ? data.images : [],
      },
    });

    return NextResponse.json({
      success: true,
      id: newProperty.id,
      message: "发布成功",
    });
  } catch (error: any) {
    console.error("POST /api/industrial error:", error);
    return NextResponse.json({ error: error.message || "发布失败，请重试" }, { status: 500 });
  }
}
