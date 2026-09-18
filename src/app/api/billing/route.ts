import { NextResponse } from "next/server";
import { hasRole, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const defaultSettings = {
  paidPublishingEnabled: "false",
  topPriceCents: "1000",
  refreshPriceCents: "300",
  currency: "CNY",
};

function normalizePlan(body: Record<string, unknown>) {
  const name = String(body.name || "").trim();
  const targetKind = String(body.targetKind || "").trim();
  const priceYuan = Number(body.priceYuan);
  const durationDays = Number(body.durationDays);
  const description = String(body.description || "").trim();

  if (!name || !["article", "job", "listing"].includes(targetKind) || !Number.isFinite(priceYuan) || priceYuan < 0) {
    return null;
  }

  if (!Number.isInteger(durationDays) || durationDays <= 0) {
    return null;
  }

  return {
    name,
    targetKind,
    priceCents: Math.round(priceYuan * 100),
    durationDays,
    description: description || null,
    enabled: body.enabled !== false,
  };
}

async function readSettings() {
  const records = await prisma.billingSetting.findMany();
  return {
    ...defaultSettings,
    ...Object.fromEntries(records.map((item) => [item.key, item.value])),
  };
}

export async function GET(request: Request) {
  if (!requireAuth(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!hasRole(request, ["admin"])) return NextResponse.json({ error: "只有管理员可以查看收费配置" }, { status: 403 });

  const [plans, settings, orders] = await Promise.all([
    prisma.billingPlan.findMany({ orderBy: { createdAt: "desc" } }),
    readSettings(),
    prisma.billingOrder.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return NextResponse.json({ plans, settings, orders });
}

export async function POST(request: Request) {
  if (!requireAuth(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!hasRole(request, ["admin"])) return NextResponse.json({ error: "只有管理员可以修改收费配置" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "参数无效" }, { status: 400 });

  if (body.action === "save-settings") {
    const paidPublishingEnabled = body.paidPublishingEnabled ? "true" : "false";
    const topPriceCents = Math.max(0, Math.round(Number(body.topPriceYuan || 0) * 100));
    const refreshPriceCents = Math.max(0, Math.round(Number(body.refreshPriceYuan || 0) * 100));

    await prisma.$transaction([
      prisma.billingSetting.upsert({
        where: { key: "paidPublishingEnabled" },
        update: { value: paidPublishingEnabled },
        create: { key: "paidPublishingEnabled", value: paidPublishingEnabled },
      }),
      prisma.billingSetting.upsert({
        where: { key: "topPriceCents" },
        update: { value: String(topPriceCents) },
        create: { key: "topPriceCents", value: String(topPriceCents) },
      }),
      prisma.billingSetting.upsert({
        where: { key: "refreshPriceCents" },
        update: { value: String(refreshPriceCents) },
        create: { key: "refreshPriceCents", value: String(refreshPriceCents) },
      }),
      prisma.billingSetting.upsert({
        where: { key: "currency" },
        update: { value: "CNY" },
        create: { key: "currency", value: "CNY" },
      }),
      prisma.operationLog.create({
        data: {
          action: "update_billing_settings",
          metadata: { paidPublishingEnabled, topPriceCents, refreshPriceCents },
        },
      }),
    ]);

    return NextResponse.json({ settings: await readSettings() });
  }

  if (body.action === "create-plan") {
    const data = normalizePlan(body);
    if (!data) return NextResponse.json({ error: "套餐名称、类型、价格和天数不能为空" }, { status: 400 });

    const plan = await prisma.billingPlan.create({ data });
    await prisma.operationLog.create({
      data: { action: "create_billing_plan", targetId: plan.id, metadata: { name: plan.name, targetKind: plan.targetKind } },
    });
    return NextResponse.json({ plan }, { status: 201 });
  }

  return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
}

export async function PATCH(request: Request) {
  if (!requireAuth(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!hasRole(request, ["admin"])) return NextResponse.json({ error: "只有管理员可以修改收费配置" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "缺少套餐 ID" }, { status: 400 });

  const data = normalizePlan(body);
  if (!data) return NextResponse.json({ error: "套餐参数无效" }, { status: 400 });

  const plan = await prisma.billingPlan.update({ where: { id: body.id }, data });
  await prisma.operationLog.create({
    data: { action: "update_billing_plan", targetId: plan.id, metadata: { name: plan.name, enabled: plan.enabled } },
  });
  return NextResponse.json({ plan });
}
