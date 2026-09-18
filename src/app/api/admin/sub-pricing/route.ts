import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  listSubCategoryPricing,
  upsertSubCategoryPricing,
} from "@/lib/sub-pricing-store";

/** GET /api/admin/sub-pricing — 获取分类信息细分类目独立定价 */
export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const moduleKey = searchParams.get("moduleKey") || "listing";

  const list = await listSubCategoryPricing(moduleKey);

  return NextResponse.json({
    subPricings: list.map((item) => ({
      ...item,
      unitPriceYuan: (item.unitPrice / 100).toFixed(2),
      pinnedPriceDailyYuan: (item.pinnedPriceDaily / 100).toFixed(2),
      refreshPriceOnceYuan: (item.refreshPriceOnce / 100).toFixed(2),
    })),
  });
}

/** POST /api/admin/sub-pricing — 更新或创建细分类目定价 */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "仅管理员可修改细分定价" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.moduleKey || !body.subKey || !body.subName) {
    return NextResponse.json({ error: "缺少必填参数" }, { status: 400 });
  }

  const updated = await upsertSubCategoryPricing({
    moduleKey: String(body.moduleKey),
    subKey: String(body.subKey),
    subName: String(body.subName),
    unitPrice: body.unitPrice !== undefined ? Math.round(Number(body.unitPrice)) : undefined,
    freePostCount: body.freePostCount !== undefined ? Math.round(Number(body.freePostCount)) : undefined,
    pinnedPriceDaily: body.pinnedPriceDaily !== undefined ? Math.round(Number(body.pinnedPriceDaily)) : undefined,
    refreshPriceOnce: body.refreshPriceOnce !== undefined ? Math.round(Number(body.refreshPriceOnce)) : undefined,
    isFree: body.isFree !== undefined ? Boolean(body.isFree) : undefined,
    isEnabled: body.isEnabled !== undefined ? Boolean(body.isEnabled) : undefined,
    sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
  });

  return NextResponse.json({ ok: true, subPricing: updated });
}
