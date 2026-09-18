import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  listVipPackages,
  createVipPackage,
  updateVipPackage,
  deleteVipPackage,
} from "@/lib/membership-store";

/** GET /api/admin/vip-packages — 获取所有会员套餐 */
export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const targetModule = searchParams.get("targetModule") || undefined;

  const packages = await listVipPackages(targetModule);

  return NextResponse.json({
    packages: packages.map((p) => ({
      ...p,
      priceYuan: (p.priceCents / 100).toFixed(2),
    })),
  });
}

/** POST /api/admin/vip-packages — 创建新会员套餐 */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "仅管理员可新增会员套餐" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.targetModule || !body.name || body.priceCents === undefined) {
    return NextResponse.json({ error: "缺少必填参数" }, { status: 400 });
  }

  const created = await createVipPackage({
    targetModule: String(body.targetModule),
    name: String(body.name),
    level: Number(body.level || 1),
    priceCents: Math.round(Number(body.priceCents)),
    durationDays: Math.round(Number(body.durationDays || 30)),
    privileges: body.privileges || {},
    description: body.description,
    badgeText: body.badgeText,
    isEnabled: body.isEnabled !== undefined ? Boolean(body.isEnabled) : true,
  });

  return NextResponse.json({ ok: true, package: created });
}

/** PATCH /api/admin/vip-packages — 更新会员套餐 */
export async function PATCH(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "仅管理员可修改会员套餐" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.id) {
    return NextResponse.json({ error: "缺少套餐 ID" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = String(body.name);
  if (body.level !== undefined) updateData.level = Number(body.level);
  if (body.priceCents !== undefined) updateData.priceCents = Math.round(Number(body.priceCents));
  if (body.durationDays !== undefined) updateData.durationDays = Math.round(Number(body.durationDays));
  if (body.privileges !== undefined) updateData.privileges = body.privileges;
  if (body.description !== undefined) updateData.description = String(body.description);
  if (body.badgeText !== undefined) updateData.badgeText = String(body.badgeText);
  if (body.isEnabled !== undefined) updateData.isEnabled = Boolean(body.isEnabled);

  const updated = await updateVipPackage(body.id, updateData);
  return NextResponse.json({ ok: true, package: updated });
}

/** DELETE /api/admin/vip-packages — 删除会员套餐 */
export async function DELETE(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "仅管理员可删除会员套餐" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.id) {
    return NextResponse.json({ error: "缺少套餐 ID" }, { status: 400 });
  }

  await deleteVipPackage(body.id);
  return NextResponse.json({ ok: true });
}
