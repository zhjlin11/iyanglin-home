import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncAllWechatFollowers } from "@/lib/wechat-service";
import {
  getWechatFollowerAdminStats,
  listWechatFollowerRecords,
} from "@/lib/wechat-followers";

export const dynamic = "force-dynamic";

/**
 * GET: 获取微信粉丝统计与用户列表
 */
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
  const search = searchParams.get("search") || "";

  try {
    const [stats, listing] = await Promise.all([
      getWechatFollowerAdminStats(),
      listWechatFollowerRecords({ page, limit, search }),
    ]);

    return NextResponse.json({
      success: true,
      stats,
      pagination: {
        page,
        limit,
        total: listing.total,
        totalPages: Math.ceil(listing.total / limit),
      },
      users: listing.records,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "获取微信用户失败" }, { status: 500 });
  }
}

/**
 * POST: 触发全量同步微信粉丝
 */
export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session || session.role.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Only superadmin can trigger WeChat sync" }, { status: 403 });
  }

  try {
    const result = await syncAllWechatFollowers();

    await prisma.operationLog.create({
      data: {
        userId: session.id,
        action: "sync_wechat_followers",
        metadata: result,
      },
    });

    return NextResponse.json({
      success: true,
      message: `关注状态同步成功：当前关注 ${result.currentFollowers} 人，其中已关联网站会员 ${result.linkedFollowers} 人；本次没有批量创建会员或赠送积分。`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "同步微信粉丝失败" }, { status: 500 });
  }
}
