import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createShop, listShops, updateShop, deleteShop } from "@/lib/shop-store";

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

  const items = await listShops({ category, status, authorId, search });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录后再申请商家入驻" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || !body.name || !body.phone || !body.intro) {
    return NextResponse.json({ error: "请填写店铺名称、联系电话和店铺简介" }, { status: 400 });
  }

  const statusInput = typeof body.status === "string" ? body.status.toLowerCase() : "pending";
  const status = session.role === "ADMIN" ? statusInput : "pending";
  const authorId = session.id;

  const item = await createShop({
    name: String(body.name).trim(),
    category: typeof body.category === "string" ? body.category.trim() : "food",
    address: typeof body.address === "string" ? body.address.trim() : "杨林地区",
    phone: String(body.phone).trim(),
    hours: typeof body.hours === "string" ? body.hours.trim() : "09:00 - 21:00",
    intro: String(body.intro).trim(),
    logo: typeof body.logo === "string" ? body.logo.trim() : undefined,
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

  const item = await updateShop(body.id, body.status, {
    name: typeof body.name === "string" ? body.name.trim() : undefined,
    category: typeof body.category === "string" ? body.category.trim() : undefined,
    address: typeof body.address === "string" ? body.address.trim() : undefined,
    phone: typeof body.phone === "string" ? body.phone.trim() : undefined,
    hours: typeof body.hours === "string" ? body.hours.trim() : undefined,
    intro: typeof body.intro === "string" ? body.intro.trim() : undefined,
    logo: typeof body.logo === "string" ? body.logo.trim() : undefined,
    images: Array.isArray(body.images) ? body.images : undefined,
    isFeatured: typeof body.isFeatured === "boolean" ? body.isFeatured : undefined,
  });

  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  const session = await getSession(request);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "无管理员权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "缺少商户 id" }, { status: 400 });
  }

  try {
    await deleteShop(id);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "删除商户失败" }, { status: 500 });
  }
}
