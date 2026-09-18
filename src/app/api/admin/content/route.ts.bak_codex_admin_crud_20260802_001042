import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || !["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const moduleFilter = searchParams.get("module") || "ALL";
  const statusFilter = searchParams.get("status") || "ALL";
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  try {
    const [jobs, houses, listings, shops, events, datings, posts] = await Promise.all([
      prisma.job.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.house.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.listing.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.shop.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.event.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.datingProfile.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.post.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
    ]);

    let items = [
      ...jobs.map((x) => ({ id: x.id, module: "JOB", title: x.title, author: x.author?.username || "未知", status: x.status, isTop: x.isTop, createdAt: x.createdAt })),
      ...houses.map((x) => ({ id: x.id, module: "HOUSE", title: x.title, author: x.author?.username || "未知", status: x.status, isTop: x.isTop, createdAt: x.createdAt })),
      ...listings.map((x) => ({ id: x.id, module: "LISTING", title: x.title, author: x.author?.username || "未知", status: x.status, isTop: x.isTop, createdAt: x.createdAt })),
      ...shops.map((x) => ({ id: x.id, module: "SHOP", title: x.name, author: x.author?.username || "未知", status: x.status, isTop: x.isTop, createdAt: x.createdAt })),
      ...events.map((x) => ({ id: x.id, module: "EVENT", title: x.title, author: x.author?.username || "未知", status: x.status, isTop: x.isTop, createdAt: x.createdAt })),
      ...datings.map((x) => ({ id: x.id, module: "DATING", title: `${x.nickname} (${x.gender === "female" ? "女嘉宾" : "男嘉宾"})`, author: x.author?.username || "未知", status: x.status, isTop: false, createdAt: x.createdAt })),
      ...posts.map((x) => ({ id: x.id, module: "POST", title: x.title, author: x.author?.username || "未知", status: x.status, isTop: x.isTop, createdAt: x.createdAt })),
    ];

    if (moduleFilter !== "ALL") {
      items = items.filter((x) => x.module === moduleFilter);
    }

    if (statusFilter !== "ALL") {
      items = items.filter((x) => x.status.toUpperCase() === statusFilter);
    }

    if (q) {
      items = items.filter((x) => x.title.toLowerCase().includes(q) || x.author.toLowerCase().includes(q));
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ total: items.length, items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "获取失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession(request);
  if (!session || !["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  try {
    const { module, id, status, isTop } = await request.json();
    if (!module || !id) {
      return NextResponse.json({ error: "缺少模块类型或 ID" }, { status: 400 });
    }

    const data: any = {};
    if (status) data.status = status.toUpperCase();
    if (isTop !== undefined) data.isTop = Boolean(isTop);

    if (module === "JOB") await prisma.job.update({ where: { id }, data });
    else if (module === "HOUSE") await prisma.house.update({ where: { id }, data });
    else if (module === "LISTING") await prisma.listing.update({ where: { id }, data });
    else if (module === "SHOP") await prisma.shop.update({ where: { id }, data });
    else if (module === "EVENT") await prisma.event.update({ where: { id }, data });
    else if (module === "DATING") await prisma.datingProfile.update({ where: { id }, data: { status: data.status } });
    else if (module === "POST") await prisma.post.update({ where: { id }, data });

    // Log Operation
    await prisma.operationLog.create({
      data: {
        userId: session.id,
        action: `ADMIN_UPDATE_CONTENT_${module}_${status || "IS_TOP"}`,
        targetId: id,
        metadata: { module, status, isTop },
      },
    });

    return NextResponse.json({ success: true, message: "内容状态与权限控制更新成功！" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "更新失败" }, { status: 500 });
  }
}
