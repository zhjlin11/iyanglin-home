import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getFollowerCount, getWechatCredentials } from "@/lib/wechat-service";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/wechat/stats
 * 获取公众号概览数据
 */
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const { appId } = await getWechatCredentials();

    // 并行获取粉丝数和数据库中的微信用户数
    const [followerCount, dbWechatUsers] = await Promise.all([
      getFollowerCount().catch(() => -1),
      prisma.user.count({ where: { wechatOpenId: { not: null } } }),
    ]);

    // 查看集成配置状态
    const integration = await prisma.integrationConfig.findUnique({
      where: { provider: "WECHAT_OFFICIAL" },
      select: { status: true, config: true, lastCheck: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        appId,
        followerCount,
        dbWechatUsers,
        status: integration?.status || "NOT_CONFIGURED",
        lastCheck: integration?.lastCheck,
        webhookUrl: "https://iyanglin.com/api/wechat/official",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "获取公众号数据失败" },
      { status: 500 }
    );
  }
}
