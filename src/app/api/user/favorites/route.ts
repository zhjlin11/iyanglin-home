import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (session.id === "env-admin") {
    return NextResponse.json({ favorites: [] });
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ favorites });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "获取失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "未登录或不支持此操作" }, { status: 401 });
  }

  try {
    const { resourceType, resourceId, title, link } = await request.json();
    if (!resourceType || !resourceId || !title || !link) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_resourceType_resourceId: {
          userId: session.id,
          resourceType,
          resourceId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: "已收藏过该内容", favorite: existing });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.id,
        resourceType,
        resourceId,
        title: String(title).trim(),
        link: String(link).trim(),
      },
    });

    return NextResponse.json({ success: true, favorite });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "收藏失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession(request);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "缺少收藏 ID" }, { status: 400 });
    }

    const fav = await prisma.favorite.findUnique({ where: { id } });
    if (!fav || fav.userId !== session.id) {
      return NextResponse.json({ error: "收藏不存在或无权删除" }, { status: 403 });
    }

    await prisma.favorite.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "取消收藏成功" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "删除失败" }, { status: 500 });
  }
}
