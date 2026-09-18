import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 验证资源类型与资源是否存在
async function verifyResourceExists(type: string, id: string): Promise<{ exists: boolean; title?: string }> {
  const normType = type.toUpperCase();
  switch (normType) {
    case "JOB": {
      const j = await prisma.job.findUnique({ where: { id }, select: { title: true } });
      return { exists: !!j, title: j?.title };
    }
    case "HOUSE": {
      const h = await prisma.house.findUnique({ where: { id }, select: { title: true } });
      return { exists: !!h, title: h?.title };
    }
    case "INDUSTRIAL": {
      const ind = await prisma.industrialProperty.findUnique({ where: { id }, select: { title: true } });
      return { exists: !!ind, title: ind?.title };
    }
    case "COMMUNITY_POST":
    case "POST": {
      const p = await prisma.post.findUnique({ where: { id }, select: { title: true } });
      return { exists: !!p, title: p?.title };
    }
    case "MERCHANT":
    case "SHOP": {
      const s = await prisma.shop.findUnique({ where: { id }, select: { name: true } });
      return { exists: !!s, title: s?.name };
    }
    case "ARTICLE": {
      let a = await prisma.article.findUnique({ where: { id }, select: { title: true } });
      if (!a) {
        a = await prisma.article.findFirst({ where: { oldId: id }, select: { title: true } });
      }
      if (!a && (id === "user-agreement" || id === "privacy-policy")) {
        return { exists: true, title: id === "user-agreement" ? "杨林生活网用户服务协议" : "杨林生活网隐私保护指引与个人信息处理规则" };
      }
      return { exists: !!a, title: a?.title };
    }
    case "PRODUCT":
    case "LISTING": {
      const l = await prisma.listing.findUnique({ where: { id }, select: { title: true } });
      return { exists: !!l, title: l?.title };
    }
    case "DATING": {
      const d = await prisma.datingProfile.findUnique({ where: { id }, select: { nickname: true } });
      return { exists: !!d, title: d?.nickname };
    }
    case "EVENT": {
      const ev = await prisma.event.findUnique({ where: { id }, select: { title: true } });
      return { exists: !!ev, title: ev?.title };
    }
    default:
      return { exists: false };
  }
}

/**
 * GET /api/favorites?resourceType=JOB&resourceId=xxx
 * 或 GET /api/favorites 查询当前用户的收藏列表（支持 type 筛选）
 */
export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const resourceType = searchParams.get("resourceType") || searchParams.get("type");
  const resourceId = searchParams.get("resourceId") || searchParams.get("id");

  // 场景 A: 查询特定资源的收藏状态
  if (resourceType && resourceId) {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_resourceType_resourceId: {
          userId: session.id,
          resourceType: resourceType.toUpperCase(),
          resourceId: String(resourceId).trim(),
        },
      },
    });
    return NextResponse.json({
      isFavorited: !!existing,
      favoriteId: existing?.id || null,
    });
  }

  // 场景 B: 查询当前登录用户的全部或分类收藏
  try {
    const whereClause: any = { userId: session.id };
    if (resourceType && resourceType !== "ALL") {
      whereClause.resourceType = resourceType.toUpperCase();
    }

    const favorites = await prisma.favorite.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ favorites, count: favorites.length });
  } catch (err: any) {
    console.error("[Favorites GET] Error:", err);
    return NextResponse.json({ error: err.message || "获取收藏失败" }, { status: 500 });
  }
}

/**
 * POST /api/favorites
 * 收藏指定资源
 */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "请先登录后再进行收藏" }, { status: 401 });
  }

  try {
    const body = await request.json();
    let { resourceType, resourceId, title, link } = body;

    if (!resourceType || !resourceId) {
      return NextResponse.json({ error: "缺少必要参数 resourceType 或 resourceId" }, { status: 400 });
    }

    const normType = String(resourceType).toUpperCase();
    const id = String(resourceId).trim();

    // 校验资源真实性
    const verify = await verifyResourceExists(normType, id);
    if (!verify.exists) {
      return NextResponse.json({ error: "目标资源不存在或已被删除" }, { status: 404 });
    }

    const finalTitle = String(title || verify.title || "收藏内容").trim();
    const finalLink = String(link || "").trim();

    // 防重查询
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_resourceType_resourceId: {
          userId: session.id,
          resourceType: normType,
          resourceId: id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "已收藏过该内容",
        isFavorited: true,
        favorite: existing,
      });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.id,
        resourceType: normType,
        resourceId: id,
        title: finalTitle,
        link: finalLink,
      },
    });

    return NextResponse.json({
      success: true,
      isFavorited: true,
      message: "收藏成功",
      favorite,
    });
  } catch (err: any) {
    console.error("[Favorites POST] Error:", err);
    return NextResponse.json({ error: err.message || "收藏失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/favorites?id=xxx 或者传 body: { resourceType, resourceId } / { id }
 * 取消收藏
 */
export async function DELETE(request: Request) {
  const session = await getSession(request);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let favId = searchParams.get("id");
    let resourceType = searchParams.get("resourceType") || searchParams.get("type");
    let resourceId = searchParams.get("resourceId");

    // 支持从 request body 传递
    if (!favId && !resourceId) {
      try {
        const body = await request.json();
        favId = body.id;
        resourceType = body.resourceType || body.type;
        resourceId = body.resourceId;
      } catch {}
    }

    if (favId) {
      const fav = await prisma.favorite.findUnique({ where: { id: favId } });
      if (!fav || fav.userId !== session.id) {
        return NextResponse.json({ error: "收藏不存在或无权删除" }, { status: 403 });
      }
      await prisma.favorite.delete({ where: { id: favId } });
      return NextResponse.json({ success: true, isFavorited: false, message: "取消收藏成功" });
    }

    if (resourceType && resourceId) {
      const normType = resourceType.toUpperCase();
      const existing = await prisma.favorite.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId: session.id,
            resourceType: normType,
            resourceId: String(resourceId).trim(),
          },
        },
      });

      if (existing) {
        await prisma.favorite.delete({ where: { id: existing.id } });
      }

      return NextResponse.json({ success: true, isFavorited: false, message: "取消收藏成功" });
    }

    return NextResponse.json({ error: "缺少收藏 ID 或资源标识" }, { status: 400 });
  } catch (err: any) {
    console.error("[Favorites DELETE] Error:", err);
    return NextResponse.json({ error: err.message || "取消收藏失败" }, { status: 500 });
  }
}
