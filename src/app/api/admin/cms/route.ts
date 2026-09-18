import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AdminModule = "ARTICLE" | "JOB" | "HOUSE" | "LISTING" | "SHOP" | "EVENT" | "DATING" | "POST";

const MANAGE_ROLES = ["ADMIN", "EDITOR", "REVIEWER"];

async function requireAdminSession(request: Request) {
  const session = await getSession(request);
  if (!session || !MANAGE_ROLES.includes(session.role.toUpperCase())) return null;
  return session;
}

function normalizeModule(value: unknown): AdminModule | null {
  const raw = String(value || "").toUpperCase();
  if (raw === "LOVE") return "DATING";
  if (["ARTICLE", "JOB", "HOUSE", "LISTING", "SHOP", "EVENT", "DATING", "POST"].includes(raw)) return raw as AdminModule;
  return null;
}

function normalizeStatus(value: unknown) {
  const raw = String(value || "").toUpperCase();
  if (["DRAFT", "PENDING", "APPROVED", "OFFLINE"].includes(raw)) return raw;
  return null;
}

async function writeOperation(userId: string | undefined, action: string, targetId: string, metadata: Record<string, unknown>) {
  await prisma.operationLog.create({
    data: {
      userId,
      action,
      targetId,
      metadata: metadata as any,
    },
  });
}

async function updateByModule(module: AdminModule, id: string, data: Record<string, unknown>) {
  if (module === "ARTICLE") return prisma.article.update({ where: { id }, data: { status: data.status as any } });
  if (module === "JOB") return prisma.job.update({ where: { id }, data: data as any });
  if (module === "HOUSE") return prisma.house.update({ where: { id }, data: data as any });
  if (module === "LISTING") return prisma.listing.update({ where: { id }, data: data as any });
  if (module === "SHOP") return prisma.shop.update({ where: { id }, data: data as any });
  if (module === "EVENT") return prisma.event.update({ where: { id }, data: data as any });
  if (module === "DATING") return prisma.datingProfile.update({ where: { id }, data: { status: data.status as any } });
  return prisma.post.update({ where: { id }, data: data as any });
}

async function deleteByModule(module: AdminModule, id: string) {
  if (module === "ARTICLE") return prisma.article.delete({ where: { id } });
  if (module === "JOB") return prisma.job.delete({ where: { id } });
  if (module === "HOUSE") return prisma.house.delete({ where: { id } });
  if (module === "LISTING") return prisma.listing.delete({ where: { id } });
  if (module === "SHOP") return prisma.shop.delete({ where: { id } });
  if (module === "EVENT") return prisma.event.delete({ where: { id } });
  if (module === "DATING") return prisma.datingProfile.delete({ where: { id } });
  return prisma.post.delete({ where: { id } });
}

export async function GET(request: Request) {
  const session = await requireAdminSession(request);
  if (!session) return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const moduleFilter = searchParams.get("module") || "ALL";
  const statusFilter = searchParams.get("status") || "ALL";
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  try {
    const [articles, jobs, houses, listings, shops, events, datings, posts] = await Promise.all([
      prisma.article.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.job.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.house.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.listing.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.shop.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.event.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.datingProfile.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.post.findMany({ include: { author: { select: { username: true } } }, orderBy: { createdAt: "desc" } }),
    ]);

    let items = [
      ...articles.map((x) => ({ id: x.id, module: "ARTICLE", title: x.title, author: x.author?.username || "未知", status: x.status, isTop: false, createdAt: x.createdAt })),
      ...jobs.map((x) => ({ id: x.id, module: "JOB", title: x.title, author: x.author?.username || "未知", status: x.status, isTop: x.isTop, createdAt: x.createdAt })),
      ...houses.map((x) => ({ id: x.id, module: "HOUSE", title: x.title, author: x.author?.username || "未知", status: x.status, isTop: x.isTop, createdAt: x.createdAt })),
      ...listings.map((x) => ({ id: x.id, module: "LISTING", title: x.title, author: x.author?.username || "未知", status: x.status, isTop: x.isTop, createdAt: x.createdAt })),
      ...shops.map((x) => ({ id: x.id, module: "SHOP", title: x.name, author: x.author?.username || "未知", status: x.status, isTop: x.isTop, createdAt: x.createdAt })),
      ...events.map((x) => ({ id: x.id, module: "EVENT", title: x.title, author: x.author?.username || "未知", status: x.status, isTop: x.isTop, createdAt: x.createdAt })),
      ...datings.map((x) => ({ id: x.id, module: "DATING", title: `${x.nickname} (${x.gender === "female" ? "女嘉宾" : "男嘉宾"})`, author: x.author?.username || "未知", status: x.status, isTop: false, createdAt: x.createdAt })),
      ...posts.map((x) => ({ id: x.id, module: "POST", title: x.title, author: x.author?.username || "未知", status: x.status, isTop: x.isTop, createdAt: x.createdAt })),
    ];

    if (moduleFilter !== "ALL") items = items.filter((x) => x.module === moduleFilter);
    if (statusFilter !== "ALL") items = items.filter((x) => x.status.toUpperCase() === statusFilter);
    if (q) items = items.filter((x) => x.title.toLowerCase().includes(q) || x.author.toLowerCase().includes(q));

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ total: items.length, items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "获取失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await requireAdminSession(request);
  if (!session) return NextResponse.json({ error: "无权访问" }, { status: 403 });

  try {
    const body = await request.json();
    const module = normalizeModule(body.module);
    const id = String(body.id || "");
    if (!module || !id) return NextResponse.json({ error: "缺少模块类型或 ID" }, { status: 400 });

    const data: Record<string, unknown> = {};
    const status = normalizeStatus(body.status);
    if (status) data.status = status;
    if (body.isTop !== undefined && !["ARTICLE", "DATING"].includes(module)) data.isTop = Boolean(body.isTop);
    if (Object.keys(data).length === 0) return NextResponse.json({ error: "缺少可更新字段" }, { status: 400 });

    await updateByModule(module, id, data);
    await writeOperation(session.id, `ADMIN_UPDATE_CONTENT_${module}_${status || "IS_TOP"}`, id, { module, status, isTop: body.isTop });

    return NextResponse.json({ success: true, message: "内容状态更新成功" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "更新失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession(request);
  if (!session || session.role.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "只有管理员可以删除内容" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const targets = Array.isArray(body.items) ? body.items : [{ id: body.id, module: body.module }];

    let count = 0;
    for (const target of targets) {
      const module = normalizeModule(target?.module);
      const id = String(target?.id || "");
      if (!module || !id) continue;
      await deleteByModule(module, id);
      await writeOperation(session.id, `ADMIN_DELETE_CONTENT_${module}`, id, { module });
      count += 1;
    }

    if (count === 0) return NextResponse.json({ error: "没有可删除的内容" }, { status: 400 });
    return NextResponse.json({ success: true, count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "删除失败" }, { status: 500 });
  }
}


