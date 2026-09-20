import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCategoryByKey, getCategoryByName } from "@/lib/info-categories";
import { cleanText } from "@/lib/strip-html";
import { executePublishWithBillingGuard } from "@/lib/billing-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const categoryParam = url.searchParams.get("category")?.trim();
    const subCategoryParam = url.searchParams.get("subCategory")?.trim();
    const areaParam = url.searchParams.get("area")?.trim();
    const itemTypeParam = url.searchParams.get("itemType")?.trim();
    const timeRangeParam = url.searchParams.get("timeRange")?.trim();
    const hasImageParam = url.searchParams.get("hasImage") === "true";
    const hasContactParam = url.searchParams.get("hasContact") === "true";
    const sortParam = url.searchParams.get("sort")?.trim() || "newest";
    const qParam = url.searchParams.get("q")?.trim();
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10)));
    const onlyMine = url.searchParams.get("onlyMine") === "true";

    const session = await getSession(request);
    const now = new Date();

    const where: any = {};

    if (onlyMine && session?.id) {
      where.authorId = session.id;
    } else {
      // 默认公开展示已审核通过的信息
      where.status = "APPROVED";
      // 默认不展示已过期的信息 (expiresAt 为空或大于当前时间)
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ];
    }

    // 1. 分类筛选 (支持 key 或 中文全称 / 简称)
    if (categoryParam && categoryParam !== "all" && categoryParam !== "全部" && categoryParam !== "全部信息") {
      const catObj = getCategoryByKey(categoryParam) || getCategoryByName(categoryParam);
      if (catObj) {
        where.category = { in: [catObj.key, catObj.name, catObj.shortName, catObj.enumKey] };
      } else {
        where.category = categoryParam;
      }
    }

    // 2. 二级细分子类筛选
    if (subCategoryParam && !subCategoryParam.startsWith("全部")) {
      where.subCategory = subCategoryParam;
    }

    // 3. 区域筛选
    if (areaParam && areaParam !== "all" && areaParam !== "全部区域" && areaParam !== "全部") {
      where.area = { contains: areaParam };
    }

    // 4. 供求类型
    if (itemTypeParam && itemTypeParam !== "all" && itemTypeParam !== "全部供求") {
      where.itemType = itemTypeParam.toUpperCase();
    }

    // 5. 时间跨度筛选
    if (timeRangeParam && timeRangeParam !== "all") {
      let threshold: Date | null = null;
      if (timeRangeParam === "today") {
        threshold = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (timeRangeParam === "3days") {
        threshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      } else if (timeRangeParam === "7days") {
        threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRangeParam === "30days") {
        threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      if (threshold) {
        where.refreshedAt = { gte: threshold };
      }
    }

    // 6. 是否有图
    if (hasImageParam) {
      where.images = { isEmpty: false };
    }

    // 7. 是否有联系方式
    if (hasContactParam) {
      where.contact = { not: "" };
    }

    // 8. 关键词全局检索
    if (qParam) {
      const searchOr = [
        { title: { contains: qParam, mode: "insensitive" } },
        { body: { contains: qParam, mode: "insensitive" } },
        { subCategory: { contains: qParam, mode: "insensitive" } },
        { fromPlace: { contains: qParam, mode: "insensitive" } },
        { toPlace: { contains: qParam, mode: "insensitive" } },
        { address: { contains: qParam, mode: "insensitive" } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOr }];
        delete where.OR;
      } else {
        where.OR = searchOr;
      }
    }

    // 9. 排序策略：置顶优先，其次推荐，再按指定维度
    const orderByList: any[] = [{ isTop: "desc" }, { isFeatured: "desc" }];

    if (sortParam === "hottest") {
      orderByList.push({ viewsCount: "desc" });
      orderByList.push({ refreshedAt: "desc" });
    } else if (sortParam === "price_asc") {
      orderByList.push({ priceNum: "asc" });
      orderByList.push({ refreshedAt: "desc" });
    } else if (sortParam === "price_desc") {
      orderByList.push({ priceNum: "desc" });
      orderByList.push({ refreshedAt: "desc" });
    } else {
      // newest: 刷新时间倒序优先
      orderByList.push({ refreshedAt: "desc" });
      orderByList.push({ createdAt: "desc" });
    }

    // 10. 并行查询数据与全站统计指标，以及首页精选推荐与认证服务商
    const [total, rawItems, totalAll, todayCount, homeFeaturedItems, featuredProviders] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        orderBy: orderByList,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.listing.count({ where: { status: "APPROVED" } }),
      prisma.listing.count({
        where: {
          status: "APPROVED",
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      // 首页/大厅精选推荐位
      prisma.listing.findMany({
        where: {
          status: "APPROVED",
          isHomeFeatured: true,
          OR: [{ homeFeaturedUntil: null }, { homeFeaturedUntil: { gt: now } }],
        },
        orderBy: [{ refreshedAt: "desc" }],
        take: 6,
      }),
      // 认证服务商精选条带
      prisma.serviceProvider.findMany({
        where: {
          verificationStatus: "APPROVED",
        },
        include: {
          user: {
            select: { id: true, nickname: true, username: true, phoneVerifiedAt: true },
          },
        },
        orderBy: [{ sortOrder: "desc" }, { isMember: "desc" }, { createdAt: "desc" }],
        take: 8,
      }),
    ]);

    const items = rawItems.map((item: any) => ({
      ...item,
      isTopActive: item.isTop && (!item.topUntil || item.topUntil > now),
      isFeaturedActive: item.isFeatured && (!item.featuredUntil || item.featuredUntil > now),
      isHomeFeaturedActive: item.isHomeFeatured && (!item.homeFeaturedUntil || item.homeFeaturedUntil > now),
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      success: true,
      items,
      homeFeaturedItems: homeFeaturedItems.map((item: any) => ({
        ...item,
        isTopActive: item.isTop && (!item.topUntil || item.topUntil > now),
        isFeaturedActive: item.isFeatured && (!item.featuredUntil || item.featuredUntil > now),
        isHomeFeaturedActive: true,
      })),
      featuredProviders,
      total,
      page,
      pageSize,
      totalPages,
      stats: {
        totalListings: totalAll,
        todayListings: todayCount,
      },
    });
  } catch (error: any) {
    console.error("[API /api/info GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "获取便民信息列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: "请先登录后再发布便民信息" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      category,
      subCategory,
      itemType = "OFFER",
      price,
      priceNum,
      priceUnit = "元",
      condition,
      area = "杨林经开区",
      address,
      contact,
      contactName,
      wechat,
      body: contentBody,
      images = [],
      departureTime,
      fromPlace,
      toPlace,
      extraData = {},
    } = body;

    const cleanTitle = cleanText(title || "").trim();
    const cleanContent = cleanText(contentBody || "").trim();
    const cleanContact = cleanText(contact || "").trim();

    if (!cleanTitle) {
      return NextResponse.json({ success: false, error: "信息标题不能为空" }, { status: 400 });
    }
    if (cleanTitle.length < 4) {
      return NextResponse.json({ success: false, error: "标题至少需要4个字" }, { status: 400 });
    }
    if (!cleanContent) {
      return NextResponse.json({ success: false, error: "详细描述不能为空" }, { status: 400 });
    }
    if (!cleanContact) {
      return NextResponse.json({ success: false, error: "联系电话不能为空" }, { status: 400 });
    }

    // 规范化分类
    const catObj = getCategoryByKey(category) || getCategoryByName(category);
    const normalizedCategory = catObj ? catObj.name : category || "二手闲置";

    // 解析价格
    let parsedPriceNum = priceNum !== undefined && priceNum !== null ? Number(priceNum) : null;
    if (parsedPriceNum === null && price && !isNaN(parseFloat(price))) {
      parsedPriceNum = parseFloat(price);
    }

    // 计算到期时间 expiresAt
    // 顺风车拼车默认发车后 48 小时过期；普通分类默认 30 天过期
    const isCarpool = catObj?.key === "carpool" || normalizedCategory.includes("拼车");
    let expiresAt: Date;
    if (isCarpool && departureTime) {
      // 拼车发车后 2 天到期
      expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    } else {
      // 默认 30 天有效期
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // 审核状态逻辑：管理员直接发布；普通用户进入待审核 PENDING
    const roleUpper = String(session.role || "").toUpperCase();
    const isAdmin = roleUpper === "ADMIN" || roleUpper === "EDITOR";
    const initialStatus = isAdmin ? "APPROVED" : "PENDING";

    const publishResult = await executePublishWithBillingGuard({
      module: "listing",
      action: "PUBLISH",
      userId: session.id,
      userRole: session.role,
      entitlementId: body.entitlementId,
      adminBypass: isAdmin,
      createResource: async (tx) => {
        const listing = await tx.listing.create({
          data: {
            title: cleanTitle,
            category: normalizedCategory,
            subCategory: subCategory ? cleanText(subCategory).trim() : null,
            itemType: (itemType || "OFFER").toUpperCase(),
            price: price ? cleanText(price).trim() : "面议",
            priceNum: parsedPriceNum,
            priceUnit: priceUnit || "元",
            condition: condition ? cleanText(condition).trim() : null,
            area: area ? cleanText(area).trim() : "杨林经开区",
            address: address ? cleanText(address).trim() : null,
            contact: cleanContact,
            contactName: contactName ? cleanText(contactName).trim() : null,
            wechat: wechat ? cleanText(wechat).trim() : null,
            body: cleanContent,
            images: Array.isArray(images) ? images.slice(0, 9) : [],
            departureTime: departureTime ? cleanText(departureTime).trim() : null,
            fromPlace: fromPlace ? cleanText(fromPlace).trim() : null,
            toPlace: toPlace ? cleanText(toPlace).trim() : null,
            status: initialStatus,
            expiresAt,
            extraData: extraData && typeof extraData === "object" ? extraData : {},
            authorId: session.id,
            refreshedAt: new Date(),
          },
        });

        await tx.operationLog.create({
          data: {
            action: "create_listing",
            targetId: listing.id,
            userId: session.id,
            metadata: {
              title: listing.title,
              category: listing.category,
              status: initialStatus,
            },
          },
        });

        return listing;
      },
    });

    if (!publishResult.success && publishResult.needPayment) {
      return NextResponse.json(
        {
          success: false,
          code: "NEED_PAYMENT",
          error: publishResult.error,
          quote: publishResult.quote,
        },
        { status: 402 }
      );
    }

    const listing = (publishResult as any).item;

    return NextResponse.json({
      success: true,
      item: listing,
      status: initialStatus,
      message: initialStatus === "APPROVED" ? "发布成功！" : "发布成功，已提交管理员审核！",
    });
  } catch (error: any) {
    console.error("[API /api/info POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "发布便民信息失败" },
      { status: 500 }
    );
  }
}
