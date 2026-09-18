import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createEvent, listEvents, updateEvent } from "@/lib/event-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const status = searchParams.get("status") || undefined;
  const mine = searchParams.get("mine") === "true";
  const search = searchParams.get("q") || undefined;

  let authorId: string | undefined;
  if (mine) {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ items: [] });
    }
    authorId = session.id;
  }

  const items = await listEvents({ category, status, authorId, search });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录后再发起同城活动" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || !body.title || !body.eventTime || !body.location || !body.contact || !body.intro) {
    return NextResponse.json({ error: "活动标题、时间、地点、联系方式及行程说明不能为空" }, { status: 400 });
  }

  const statusInput = typeof body.status === "string" ? body.status.toLowerCase() : "pending";
  const status = session.role === "ADMIN" ? statusInput : "pending";
  const authorId = session.id;

  const item = await createEvent({
    title: String(body.title).trim(),
    category: typeof body.category === "string" ? body.category.trim() : "party",
    eventTime: String(body.eventTime).trim(),
    location: String(body.location).trim(),
    fee: typeof body.fee === "string" && body.fee.trim() ? body.fee.trim() : "免费",
    quota: typeof body.quota === "string" && body.quota.trim() ? body.quota.trim() : "不限",
    contact: String(body.contact).trim(),
    intro: String(body.intro).trim(),
    status,
    authorId,
    images: Array.isArray(body.images) ? body.images : [],
  });

  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "无管理员权限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.status) {
    return NextResponse.json({ error: "缺少必要字段 id 或 status" }, { status: 400 });
  }

  const item = await updateEvent(body.id, body.status, {
    title: typeof body.title === "string" ? body.title.trim() : undefined,
    category: typeof body.category === "string" ? body.category.trim() : undefined,
    eventTime: typeof body.eventTime === "string" ? body.eventTime.trim() : undefined,
    location: typeof body.location === "string" ? body.location.trim() : undefined,
    fee: typeof body.fee === "string" ? body.fee.trim() : undefined,
    quota: typeof body.quota === "string" ? body.quota.trim() : undefined,
    contact: typeof body.contact === "string" ? body.contact.trim() : undefined,
    intro: typeof body.intro === "string" ? body.intro.trim() : undefined,
    images: Array.isArray(body.images) ? body.images : undefined,
  });

  return NextResponse.json({ item });
}
