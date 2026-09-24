import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AUDIT_ACTION_REGISTRY, AuditCategoryKey } from "@/lib/audit-log-presenter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession(request);
  const allowedRoles = ["ADMIN", "SUPERADMIN", "EDITOR", "REVIEWER", "AUDIT_ADMIN"];
  if (!session || !allowedRoles.includes((session.role || "").toUpperCase())) {
    return NextResponse.json({ error: "无权限访问操作审计日志" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get("limit") || "20", 10)));
    const search = (url.searchParams.get("search") || "").trim();
    const category = (url.searchParams.get("category") || "ALL").toUpperCase();
    const status = (url.searchParams.get("status") || "ALL").toUpperCase();
    const timeRange = url.searchParams.get("timeRange") || "ALL";

    // 1. 构造时间范围
    const now = new Date();
    let timeFilter: { gte?: Date; lte?: Date } | undefined;

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const endOfYesterday = new Date(startOfToday.getTime() - 1);

    if (timeRange === "today") {
      timeFilter = { gte: startOfToday };
    } else if (timeRange === "yesterday") {
      timeFilter = { gte: startOfYesterday, lte: endOfYesterday };
    } else if (timeRange === "7days") {
      timeFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (timeRange === "30days") {
      timeFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    } else if (url.searchParams.get("startDate") || url.searchParams.get("endDate")) {
      const s = url.searchParams.get("startDate");
      const e = url.searchParams.get("endDate");
      timeFilter = {};
      if (s) timeFilter.gte = new Date(s);
      if (e) timeFilter.lte = new Date(e);
    }

    // 2. 构造分类匹配 Action 集合
    let categoryActions: string[] | undefined;
    if (category !== "ALL") {
      categoryActions = Object.entries(AUDIT_ACTION_REGISTRY)
        .filter(([, def]) => def.category === (category as AuditCategoryKey))
        .map(([action]) => action);
    }

    // 3. 构造 Prisma Where 过滤条件
    const where: any = {};

    if (timeFilter) {
      where.createdAt = timeFilter;
    }

    if (categoryActions && categoryActions.length > 0) {
      where.action = { in: categoryActions };
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { targetId: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { username: { contains: search, mode: "insensitive" } },
              { nickname: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    // 4. 并行执行：当前过滤总数、分页数据、顶部4大统计
    const [totalCount, logs, todayTotal, todayAdmin, todayPayment, todaySecurity] = await Promise.all([
      prisma.operationLog.count({ where }),
      prisma.operationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              nickname: true,
              phone: true,
            },
          },
        },
      }),
      // 今日操作总数
      prisma.operationLog.count({ where: { createdAt: { gte: startOfToday } } }),
      // 今日管理员操作
      prisma.operationLog.count({
        where: {
          createdAt: { gte: startOfToday },
          OR: [
            { action: { startsWith: "ADMIN_" } },
            { action: { startsWith: "review_" } },
            { user: { role: "ADMIN" } },
          ],
        },
      }),
      // 今日支付事件
      prisma.operationLog.count({
        where: {
          createdAt: { gte: startOfToday },
          action: {
            in: [
              "WECHAT_PAY_SUCCESS",
              "ADMIN_REFUND_ORDER",
              "BILLING_ORDER_PAID",
              "SERVICE_ORDER_PAID",
              "coin_recharge",
            ],
          },
        },
      }),
      // 今日安全异常
      prisma.operationLog.count({
        where: {
          createdAt: { gte: startOfToday },
          action: {
            in: [
              "login_failed",
              "ADMIN_MANAGE_USER_LOGOUT_ALL",
              "change_own_password",
              "disable_user",
              "rate_limit_exceeded",
            ],
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      stats: {
        todayTotal,
        todayAdmin,
        todayPayment,
        todaySecurity,
      },
    });
  } catch (error: any) {
    console.error("[API_ADMIN_LOGS] Query error:", error);
    return NextResponse.json({ error: "操作审计日志加载失败", details: error?.message }, { status: 500 });
  }
}
