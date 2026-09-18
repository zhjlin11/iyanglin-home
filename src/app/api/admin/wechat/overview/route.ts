import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/wechat/overview
 * 公众号运营概览数据
 */
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 并行查询所有统计数据
    const [
      followerStats,
      todayFollows,
      todayUnfollows,
      todayKeywords,
      todayMenuClicks,
      todayScans,
      waitingConversations,
      newLeads,
      // 7天趋势数据
      dailyFollows,
      dailyKeywords,
      dailyScans,
      // 热门关键词
      hotKeywords,
      // 热门菜单
      hotMenus,
    ] = await Promise.all([
      // 粉丝统计
      prisma.wechatFollower.aggregate({
        _count: { id: true },
        where: { subscribed: true },
      }),
      // 今日新增关注
      prisma.wechatUserEvent.count({
        where: { eventType: "FOLLOW", createdAt: { gte: todayStart } },
      }),
      // 今日取消关注
      prisma.wechatUserEvent.count({
        where: { eventType: "UNFOLLOW", createdAt: { gte: todayStart } },
      }),
      // 今日关键词触发
      prisma.wechatUserEvent.count({
        where: { eventType: "KEYWORD", createdAt: { gte: todayStart } },
      }),
      // 今日菜单点击
      prisma.wechatUserEvent.count({
        where: { eventType: "MENU_CLICK", createdAt: { gte: todayStart } },
      }),
      // 今日二维码扫码
      prisma.wechatUserEvent.count({
        where: { eventType: "SCAN_QR", createdAt: { gte: todayStart } },
      }),
      // 待处理咨询
      prisma.wechatCustomerConversation.count({
        where: { status: "WAITING" },
      }),
      // 新线索
      prisma.businessLead.count({
        where: { status: "NEW" },
      }),
      // 7天关注趋势
      prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*)::int as count
        FROM "WechatUserEvent"
        WHERE "eventType" = 'FOLLOW' AND "createdAt" >= ${sevenDaysAgo}
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
        ORDER BY date
      `,
      // 7天关键词趋势
      prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*)::int as count
        FROM "WechatUserEvent"
        WHERE "eventType" = 'KEYWORD' AND "createdAt" >= ${sevenDaysAgo}
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
        ORDER BY date
      `,
      // 7天扫码趋势
      prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*)::int as count
        FROM "WechatUserEvent"
        WHERE "eventType" = 'SCAN_QR' AND "createdAt" >= ${sevenDaysAgo}
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
        ORDER BY date
      `,
      // 热门关键词 (7天)
      prisma.$queryRaw<Array<{ name: string; count: number }>>`
        SELECT "eventName" as name, COUNT(*)::int as count
        FROM "WechatUserEvent"
        WHERE "eventType" = 'KEYWORD' AND "eventName" != '__unmatch__' AND "createdAt" >= ${sevenDaysAgo}
        GROUP BY "eventName"
        ORDER BY count DESC
        LIMIT 10
      `,
      // 热门菜单 (7天)
      prisma.$queryRaw<Array<{ name: string; count: number }>>`
        SELECT "eventName" as name, COUNT(*)::int as count
        FROM "WechatUserEvent"
        WHERE "eventType" = 'MENU_CLICK' AND "createdAt" >= ${sevenDaysAgo}
        GROUP BY "eventName"
        ORDER BY count DESC
        LIMIT 10
      `,
    ]);

    // 补齐7天趋势（缺失日期填0）
    function fillDays(data: Array<{ date: string; count: number }>) {
      const map = new Map(data.map((d) => [d.date, d.count]));
      const result: Array<{ date: string; count: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split("T")[0];
        result.push({ date: key, count: map.get(key) || 0 });
      }
      return result;
    }

    return NextResponse.json({
      success: true,
      data: {
        cards: {
          currentFollowers: followerStats._count.id,
          todayFollows,
          todayUnfollows,
          todayKeywords,
          todayMenuClicks,
          todayScans,
          waitingConversations,
          newLeads,
        },
        trends: {
          follows: fillDays(dailyFollows),
          keywords: fillDays(dailyKeywords),
          scans: fillDays(dailyScans),
        },
        hotKeywords,
        hotMenus,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "获取概览数据失败" },
      { status: 500 }
    );
  }
}
