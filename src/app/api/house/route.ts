import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createHouse, listHouses, updateHouse } from "@/lib/house-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const houseType = searchParams.get("houseType") || undefined;
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
  
  const items = await listHouses({ houseType, status, authorId, search });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录后再挂牌房源" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || !body.title || !body.contact || !body.body) {
    return NextResponse.json({ error: "请填写标题、联系方式和房源详情" }, { status: 400 });
  }

  const statusInput = typeof body.status === "string" ? body.status.toLowerCase() : "pending";
  const status = session.role === "ADMIN" ? statusInput : "pending";
  const authorId = session.id;

  const item = await createHouse({
    title: String(body.title).trim(),
    houseType: typeof body.houseType === "string" ? body.houseType.trim() : "rent",
    price: typeof body.price === "string" ? body.price.trim() : "面议",
    layout: typeof body.layout === "string" ? body.layout.trim() : "不限",
    areaSize: typeof body.areaSize === "string" ? body.areaSize.trim() : "不限",
    location: typeof body.location === "string" ? body.location.trim() : "杨林地区",
    contact: String(body.contact).trim(),
    body: String(body.body).trim(),
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

  const item = await updateHouse(body.id, body.status, {
    title: typeof body.title === "string" ? body.title.trim() : undefined,
    houseType: typeof body.houseType === "string" ? body.houseType.trim() : undefined,
    price: typeof body.price === "string" ? body.price.trim() : undefined,
    layout: typeof body.layout === "string" ? body.layout.trim() : undefined,
    areaSize: typeof body.areaSize === "string" ? body.areaSize.trim() : undefined,
    location: typeof body.location === "string" ? body.location.trim() : undefined,
    contact: typeof body.contact === "string" ? body.contact.trim() : undefined,
    body: typeof body.body === "string" ? body.body.trim() : undefined,
    images: Array.isArray(body.images) ? body.images : undefined,
  });

  return NextResponse.json({ item });
}
