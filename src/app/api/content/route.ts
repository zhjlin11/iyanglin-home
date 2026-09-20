import { NextResponse } from "next/server";
import {
  createContent,
  deleteBrowserTestContent,
  deleteContent,
  getContent,
  listContent,
  listContentPaginated,
  updateContent,
  type ContentItem,
  type ContentStatus,
} from "@/lib/content-store";
import { getSession, hasRole, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateBillingQuote,
  consumeFreeQuota,
  consumeEntitlement,
  executePublishWithBillingGuard,
} from "@/lib/billing-guard";

const statuses = ["draft", "pending", "approved", "offline"] as const;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (id) {
      const item = await getContent(id);
      if (!item) return NextResponse.json({ error: "内容不存在" }, { status: 404 });
      return NextResponse.json({ item });
    }

    const kind = url.searchParams.get("kind") as ContentItem["kind"] | null;
    const mine = url.searchParams.get("mine") === "true";
    const pageParam = url.searchParams.get("page");
    const pageSizeParam = url.searchParams.get("pageSize");
    const status = url.searchParams.get("status") || undefined;
    const query = url.searchParams.get("q") || undefined;

    // If page param exists, use server-side pagination (admin content management)
    if (pageParam) {
      if (!hasRole(request, ["admin"])) {
        return NextResponse.json({ error: "只有管理员可以分页检索全量内容" }, { status: 403 });
      }
      const page = Math.max(1, parseInt(pageParam) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeParam || "20") || 20));
      const result = await listContentPaginated({ kind: kind || undefined, status, query, page, pageSize });
      return NextResponse.json(result);
    }

    let authorId: string | undefined = undefined;
    const session = await getSession(request);
    const isAdmin = session?.role === "ADMIN";

    if (mine) {
      if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
      authorId = session.id;
    }

    // 只有管理员可以 includeAll 查看待审核或下线内容，普通访客默认只能获取已审核通过的内容
    const includeAll = isAdmin;

    return NextResponse.json({ items: await listContent(kind || undefined, authorId, { includeAll }) });
  } catch {
    return NextResponse.json({ error: "内容服务暂时不可用，请检查数据库" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  
  const authorId = session.id;
  const role = session.role || "USER";
  
  // Only users with admin/editor role can post articles, but anyone can post jobs/listings (or as configured)
  const isArticle = (await request.clone().json().catch(() => null))?.kind === "article";
  if (isArticle && !["ADMIN", "EDITOR"].includes(role)) {
    return NextResponse.json({ error: "没有发布资讯的权限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !["article", "job", "listing"].includes(body.kind) || !String(body.title || "").trim() || !String(body.body || "").trim()) {
    return NextResponse.json({ error: "标题和正文不能为空" }, { status: 400 });
  }

  if (body.kind === "job" && !String(body.company || "").trim()) {
    return NextResponse.json({ error: "公司名称不能为空" }, { status: 400 });
  }

  if (body.kind === "listing" && (!String(body.category || "").trim() || !String(body.contact || "").trim())) {
    return NextResponse.json({ error: "分类和联系方式不能为空" }, { status: 400 });
  }

  try {
    let finalCompanyId = typeof body.companyId === "string" && body.companyId.trim() ? body.companyId.trim() : undefined;
    if (!finalCompanyId && body.kind === "job" && body.company) {
      const matched = await prisma.company.findFirst({
        where: { name: String(body.company).trim() },
        select: { id: true },
      });
      if (matched) finalCompanyId = matched.id;
    }

    // =======================================================
    // 强制商业化计费门禁 (Transactional BillingGuard)
    // =======================================================
    const isAdmin = role === "ADMIN";
    const isDraft = body.status === "draft";
    const isBypassed = isDraft || (isAdmin && body.adminBypassBilling === true);

    const publishResult = await executePublishWithBillingGuard({
      module: body.kind,
      action: "PUBLISH",
      userId: authorId,
      userRole: role,
      companyId: finalCompanyId,
      entitlementId: body.entitlementId,
      adminBypass: isBypassed,
      createResource: async (tx) => {
        return createContent(
          {
            kind: body.kind,
            title: body.title.trim(),
            company: typeof body.company === "string" ? body.company.trim() : undefined,
            companyId: finalCompanyId,
            category: typeof body.category === "string" ? body.category.trim() : undefined,
            contact: typeof body.contact === "string" ? body.contact.trim() : undefined,
            contactName: typeof body.contactName === "string" ? body.contactName.trim() : undefined,
            address: typeof body.address === "string" ? body.address.trim() : undefined,
            body: body.body.trim(),
            status: body.status === "draft" ? "draft" : "pending",
            jobType: typeof body.jobType === "string" ? body.jobType.trim() : undefined,
            area: typeof body.area === "string" ? body.area.trim() : undefined,
            salary: typeof body.salary === "string" ? body.salary.trim() : undefined,
            authorId: authorId || undefined,
            images: Array.isArray(body.images) ? body.images : [],
          },
          tx
        );
      },
    });

    if (!publishResult.success && publishResult.needPayment) {
      return NextResponse.json(
        {
          code: "NEED_PAYMENT",
          error: publishResult.error,
          quote: publishResult.quote,
        },
        { status: 402 }
      );
    }

    const item = (publishResult as any).item;

    let order = null;
    if (body.billingPlanId) {
      const plan = await prisma.billingPlan.findFirst({
        where: { id: String(body.billingPlanId), enabled: true, targetKind: body.kind },
      });
      if (plan) {
        order = await prisma.billingOrder.create({
          data: {
            orderNo: `YL${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
            planId: plan.id,
            planName: plan.name,
            targetKind: item.kind,
            targetId: item.id,
            targetTitle: item.title,
            amountCents: plan.priceCents,
            userId: authorId || undefined,
          },
        });
        await prisma.operationLog.create({
          data: { action: "create_order", targetId: order.id, metadata: { orderNo: order.orderNo, planName: order.planName, targetTitle: item.title } },
        });
      }
    }

    return NextResponse.json({ item, order }, { status: 201 });
  } catch (error) {
    console.error("content POST failed", error);
    return NextResponse.json({ error: "内容保存失败，请检查数据库连接" }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireAuth(request, ["ADMIN", "EDITOR", "REVIEWER"]);
  if (!session) return NextResponse.json({ error: "没有内容管理权限" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : [];
  const singleId = typeof body?.id === "string" ? body.id : "";
  const targetIds = ids.length ? ids : singleId ? [singleId] : [];

  if (!targetIds.length || !statuses.includes(body.status)) {
    return NextResponse.json({ error: "无效的状态参数" }, { status: 400 });
  }

  const fields =
    targetIds.length === 1
      ? {
          title: typeof body.title === "string" ? body.title.trim() : undefined,
          body: typeof body.body === "string" ? body.body.trim() : undefined,
          company: typeof body.company === "string" ? body.company.trim() : undefined,
          category: typeof body.category === "string" ? body.category.trim() : undefined,
          contact: typeof body.contact === "string" ? body.contact.trim() : undefined,
          jobType: typeof body.jobType === "string" ? body.jobType.trim() : undefined,
          area: typeof body.area === "string" ? body.area.trim() : undefined,
          salary: typeof body.salary === "string" ? body.salary.trim() : undefined,
          images: Array.isArray(body.images) ? body.images : undefined,
          isTop: typeof body.isTop === "boolean" ? body.isTop : undefined,
          isFeatured: typeof body.isFeatured === "boolean" ? body.isFeatured : undefined,
          houseType: typeof body.houseType === "string" ? body.houseType.trim() : undefined,
          price: typeof body.price === "string" ? body.price.trim() : undefined,
          layout: typeof body.layout === "string" ? body.layout.trim() : undefined,
          areaSize: typeof body.areaSize === "string" ? body.areaSize.trim() : undefined,
          location: typeof body.location === "string" ? body.location.trim() : undefined,
          phone: typeof body.phone === "string" ? body.phone.trim() : undefined,
          address: typeof body.address === "string" ? body.address.trim() : undefined,
          hours: typeof body.hours === "string" ? body.hours.trim() : undefined,
          intro: typeof body.intro === "string" ? body.intro.trim() : undefined,
          eventTime: typeof body.eventTime === "string" ? body.eventTime.trim() : undefined,
          fee: typeof body.fee === "string" ? body.fee.trim() : undefined,
          quota: typeof body.quota === "string" ? body.quota.trim() : undefined,
          board: typeof body.board === "string" ? body.board.trim() : undefined,
          nickname: typeof body.nickname === "string" ? body.nickname.trim() : undefined,
          gender: typeof body.gender === "string" ? body.gender.trim() : undefined,
          birthYear: typeof body.birthYear === "number" ? body.birthYear : undefined,
          heightCm: typeof body.heightCm === "number" ? body.heightCm : undefined,
          education: typeof body.education === "string" ? body.education.trim() : undefined,
          occupation: typeof body.occupation === "string" ? body.occupation.trim() : undefined,
          income: typeof body.income === "string" ? body.income.trim() : undefined,
          maritalStatus: typeof body.maritalStatus === "string" ? body.maritalStatus.trim() : undefined,
          requirement: typeof body.requirement === "string" ? body.requirement.trim() : undefined,
        }
      : undefined;

  try {
    const results = [];
    for (const id of targetIds) {
      const item = await updateContent(id, body.status as ContentStatus, fields);
      if (item) results.push(item);
    }
    return targetIds.length === 1
      ? results[0]
        ? NextResponse.json({ item: results[0] })
        : NextResponse.json({ error: "内容不存在" }, { status: 404 })
      : NextResponse.json({ items: results, updated: results.length });
  } catch {
    return NextResponse.json({ error: "状态更新失败，请检查数据库连接" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAuth(request, ["ADMIN"]);
  if (!session) return NextResponse.json({ error: "只有管理员可以删除内容" }, { status: 403 });

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");
  if (mode === "browser-tests") {
    try {
      const deleted = await deleteBrowserTestContent();
      return NextResponse.json({ deleted });
    } catch (error) {
      console.error("content DELETE browser-tests failed", error);
      return NextResponse.json({ error: "测试数据清理失败" }, { status: 503 });
    }
  }

  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : [];
  const singleId = typeof body?.id === "string" ? body.id : "";
  const targetIds = ids.length ? ids : singleId ? [singleId] : [];

  if (!targetIds.length) return NextResponse.json({ error: "缺少要删除的内容" }, { status: 400 });

  try {
    const relatedOrders = await prisma.billingOrder.count({ where: { targetId: { in: targetIds } } });
    const deleted = [];
    for (const id of targetIds) {
      const item = await deleteContent(id);
      if (item) deleted.push(item);
    }
    return NextResponse.json({ deleted, count: deleted.length, relatedOrders });
  } catch (error) {
    console.error("content DELETE failed", error);
    return NextResponse.json({ error: "内容删除失败" }, { status: 503 });
  }
}
