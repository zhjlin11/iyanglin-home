import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cleanText } from "@/lib/strip-html";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    const roleUpper = String(session?.role || "").toUpperCase();
    if (!session?.id || (roleUpper !== "ADMIN" && roleUpper !== "EDITOR")) {
      return NextResponse.json({ success: false, error: "无权访问管理接口" }, { status: 403 });
    }

    const url = new URL(request.url);
    const statusTab = (url.searchParams.get("tab") || "ALL").toUpperCase();
    const query = url.searchParams.get("q")?.trim();
    const category = url.searchParams.get("category")?.trim();
    const area = url.searchParams.get("area")?.trim();
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10)));

    const now = new Date();
    const where: any = {};

    // 状态筛选
    if (statusTab === "PENDING") {
      where.status = "PENDING";
    } else if (statusTab === "APPROVED") {
      where.status = "APPROVED";
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];
    } else if (statusTab === "REJECTED") {
      where.status = "REJECTED";
    } else if (statusTab === "OFFLINE") {
      where.status = "OFFLINE";
    } else if (statusTab === "EXPIRED") {
      where.OR = [
        { status: "EXPIRED" },
        { expiresAt: { lte: now } },
      ];
    } else if (statusTab === "TOP") {
      where.isTop = true;
    } else if (statusTab === "FEATURED") {
      where.isFeatured = true;
    }

    if (category && category !== "ALL" && category !== "全部") {
      where.category = { contains: category };
    }

    if (area && area !== "ALL" && area !== "全部") {
      where.area = { contains: area };
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { body: { contains: query, mode: "insensitive" } },
        { contact: { contains: query, mode: "insensitive" } },
        { contactName: { contains: query, mode: "insensitive" } },
        { subCategory: { contains: query, mode: "insensitive" } },
      ];
    }

    // 并行计算 KPI 统计指标
    const [
      items,
      total,
      pendingCount,
      approvedCount,
      rejectedCount,
      offlineCount,
      expiredCount,
      topCount,
      todayCount,
    ] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: [{ isTop: "desc" }, { refreshedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
              phone: true,
              phoneVerifiedAt: true,
              role: true,
            },
          },
        },
      }),
      prisma.listing.count({ where }),
      prisma.listing.count({ where: { status: "PENDING" } }),
      prisma.listing.count({
        where: {
          status: "APPROVED",
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      prisma.listing.count({ where: { status: "REJECTED" } }),
      prisma.listing.count({ where: { status: "OFFLINE" } }),
      prisma.listing.count({
        where: {
          OR: [{ status: "EXPIRED" }, { expiresAt: { lte: now } }],
        },
      }),
      prisma.listing.count({ where: { isTop: true } }),
      prisma.listing.count({
        where: {
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
      }),
    ]);

    // 智能重复检测：检查当前列表中是否有相同联系电话或相似标题的短时间重复发布
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let isDuplicateSuspect = false;
        if (item.contact && item.contact.length >= 7) {
          const dupCount = await prisma.listing.count({
            where: {
              id: { not: item.id },
              contact: item.contact,
              createdAt: {
                gte: new Date(item.createdAt.getTime() - 48 * 60 * 60 * 1000),
                lte: new Date(item.createdAt.getTime() + 48 * 60 * 60 * 1000),
              },
            },
          });
          if (dupCount > 0) isDuplicateSuspect = true;
        }
        return {
          ...item,
          isDuplicateSuspect,
          isExpired: item.status === "EXPIRED" || (item.expiresAt && item.expiresAt < now),
        };
      })
    );

    return NextResponse.json({
      success: true,
      items: enrichedItems,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      kpi: {
        pendingCount,
        approvedCount,
        rejectedCount,
        offlineCount,
        expiredCount,
        topCount,
        todayCount,
      },
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        offline: offlineCount,
        expired: expiredCount,
        top: topCount,
        today: todayCount,
      },
    });
  } catch (error: any) {
    console.error("[API /api/admin/info GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "获取便民信息管理列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    const roleUpper = String(session?.role || "").toUpperCase();
    if (!session?.id || (roleUpper !== "ADMIN" && roleUpper !== "EDITOR")) {
      return NextResponse.json({ success: false, error: "无权执行管理操作" }, { status: 403 });
    }

    const body = await request.json();
    const { action, id, reason } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, error: "缺少必要参数" }, { status: 400 });
    }

    const target = await prisma.listing.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ success: false, error: "目标信息不存在" }, { status: 404 });
    }

    let updated: any;
    let logAction = "";

    switch (action) {
      case "APPROVE": {
        updated = await prisma.listing.update({
          where: { id },
          data: { status: "APPROVED", rejectReason: null },
        });
        logAction = "admin_approve_listing";
        break;
      }
      case "REJECT": {
        const cleanReason = cleanText(reason || "内容不符合便民信息发布规范").trim();
        updated = await prisma.listing.update({
          where: { id },
          data: { status: "REJECTED", rejectReason: cleanReason },
        });
        logAction = "admin_reject_listing";
        break;
      }
      case "TOGGLE_TOP": {
        updated = await prisma.listing.update({
          where: { id },
          data: { isTop: !target.isTop },
        });
        logAction = "admin_toggle_top_listing";
        break;
      }
      case "TOGGLE_FEATURED": {
        updated = await prisma.listing.update({
          where: { id },
          data: { isFeatured: !target.isFeatured },
        });
        logAction = "admin_toggle_featured_listing";
        break;
      }
      case "OFFLINE": {
        updated = await prisma.listing.update({
          where: { id },
          data: { status: "OFFLINE" },
        });
        logAction = "admin_offline_listing";
        break;
      }
      case "RESTORE": {
        updated = await prisma.listing.update({
          where: { id },
          data: { status: "APPROVED" },
        });
        logAction = "admin_restore_listing";
        break;
      }
      case "DELETE": {
        await prisma.listing.delete({ where: { id } });
        logAction = "admin_delete_listing";
        break;
      }
      default:
        return NextResponse.json({ success: false, error: "不支持的操作" }, { status: 400 });
    }

    await prisma.operationLog.create({
      data: {
        action: logAction,
        targetId: id,
        userId: session.id,
        metadata: {
          action,
          title: target.title,
          category: target.category,
          reason,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "操作执行成功",
      item: updated,
    });
  } catch (error: any) {
    console.error("[API /api/admin/info POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "操作失败" },
      { status: 500 }
    );
  }
}
