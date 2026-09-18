import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const types = await prisma.dictionaryType.findMany({
    include: { items: { orderBy: { sort: "asc" } } },
    orderBy: { key: "asc" },
  });

  return NextResponse.json({ types });
}

export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();

  if (body.action === "create_type") {
    const { key, name, description } = body;
    if (!key || !name) {
      return NextResponse.json({ error: "key 和 name 为必填" }, { status: 400 });
    }
    const existing = await prisma.dictionaryType.findUnique({ where: { key } });
    if (existing) {
      return NextResponse.json({ error: "该 key 已存在" }, { status: 409 });
    }
    const dt = await prisma.dictionaryType.create({ data: { key, name, description } });
    await prisma.operationLog.create({
      data: { userId: session.id, action: "create_dictionary_type", targetId: dt.id, metadata: { key, name } },
    });
    return NextResponse.json({ type: dt });
  }

  if (body.action === "update_type") {
    const { id, name, description, enabled } = body;
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    const dt = await prisma.dictionaryType.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(enabled !== undefined ? { enabled } : {}),
      },
    });
    await prisma.operationLog.create({
      data: { userId: session.id, action: "update_dictionary_type", targetId: dt.id, metadata: { name: dt.name } },
    });
    return NextResponse.json({ type: dt });
  }

  if (body.action === "delete_type") {
    const { id } = body;
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    await prisma.dictionaryType.delete({ where: { id } });
    await prisma.operationLog.create({
      data: { userId: session.id, action: "delete_dictionary_type", targetId: id, metadata: {} },
    });
    return NextResponse.json({ success: true });
  }

  if (body.action === "update_item") {
    const { id, label, value, sort, enabled, extra } = body;
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    const item = await prisma.dictionaryItem.update({
      where: { id },
      data: {
        ...(label !== undefined ? { label } : {}),
        ...(value !== undefined ? { value } : {}),
        ...(sort !== undefined ? { sort: Number(sort) } : {}),
        ...(enabled !== undefined ? { enabled } : {}),
        ...(extra !== undefined ? { extra } : {}),
      },
    });
    await prisma.operationLog.create({
      data: { userId: session.id, action: "update_dictionary_item", targetId: item.id, metadata: { label: item.label } },
    });
    return NextResponse.json({ item });
  }

  if (body.action === "delete_item") {
    const { id } = body;
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    await prisma.dictionaryItem.delete({ where: { id } });
    await prisma.operationLog.create({
      data: { userId: session.id, action: "delete_dictionary_item", targetId: id, metadata: {} },
    });
    return NextResponse.json({ success: true });
  }

  const { typeId, label, value, sort, extra } = body;
  if (!typeId || !label || !value) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const item = await prisma.dictionaryItem.create({
    data: { typeId, label, value, sort: sort || 0, extra: extra || null },
  });

  await prisma.operationLog.create({
    data: { userId: session.id, action: "create_dictionary_item", targetId: item.id, metadata: { label, value } },
  });

  return NextResponse.json({ item });
}
