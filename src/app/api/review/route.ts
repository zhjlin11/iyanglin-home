import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points-engine";

export const dynamic = "force-dynamic";

const moduleConfigs = [
  { kind: "job", model: "job", label: "求职招聘", titleField: "title" },
  { kind: "house", model: "house", label: "房产楼市", titleField: "title" },
  { kind: "listing", model: "listing", label: "便民生活", titleField: "title" },
  { kind: "shop", model: "shop", label: "口碑好店", titleField: "name" },
  { kind: "event", model: "event", label: "同城活动", titleField: "title" },
  { kind: "love", model: "datingProfile", label: "相亲交友", titleField: "nickname" },
  { kind: "post", model: "post", label: "社区帖子", titleField: "title" },
  { kind: "article", model: "article", label: "本地资讯", titleField: "title" },
  { kind: "verification", model: "verificationRecord", label: "身份认证", titleField: "companyName" },
] as const;

type ReviewItem = {
  id: string;
  kind: string;
  label: string;
  title: string;
  status: string;
  createdAt: string;
  authorName?: string;
  contact?: string;
};

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || !["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const url = new URL(request.url);
  const filterKind = url.searchParams.get("kind") || "all";
  const filterStatus = url.searchParams.get("status") || "pending"; // 默认优先展示待审核

  const items: ReviewItem[] = [];

  for (const cfg of moduleConfigs) {
    if (filterKind !== "all" && filterKind !== cfg.kind) continue;

    const where: Record<string, any> = {};
    if (filterStatus !== "all") {
      where.status = filterStatus.toUpperCase();
    }

    if (cfg.kind === "verification") {
      try {
        const rows = await prisma.verificationRecord.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { user: { select: { username: true, nickname: true, phone: true } } },
        });
        for (const row of rows) {
          items.push({
            id: row.id,
            kind: "verification",
            label: `认证审核 (${row.verifyType})`,
            title: row.companyName || row.idCardName || `${row.verifyType} 认证申请`,
            status: (row.status || "PENDING").toLowerCase(),
            createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
            authorName: row.user?.nickname || row.user?.username || "用户",
            contact: row.user?.phone || "",
          });
        }
      } catch (err) {
        console.error("Fetch verification error:", err);
      }
      continue;
    }

    try {
      const rows = await (prisma as any)[cfg.model].findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { author: { select: { username: true, nickname: true, phone: true } } },
      });

      for (const row of rows) {
        items.push({
          id: row.id,
          kind: cfg.kind,
          label: cfg.label,
          title: row[cfg.titleField] || "(无标题)",
          status: (row.status || "PENDING").toLowerCase(),
          createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
          authorName: row.author?.nickname || row.author?.username || "匿名用户",
          contact: row.contact || row.phone || row.author?.phone || "",
        });
      }
    } catch (e) {
      // 容错处理部分无 author 关联的模型
      try {
        const rows = await (prisma as any)[cfg.model].findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
        });
        for (const row of rows) {
          items.push({
            id: row.id,
            kind: cfg.kind,
            label: cfg.label,
            title: row[cfg.titleField] || "(无标题)",
            status: (row.status || "PENDING").toLowerCase(),
            createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
            authorName: "平台发布",
            contact: row.contact || row.phone || "",
          });
        }
      } catch {}
    }
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 统计各个模块真实的 PENDING 待审核数量
  const counts: Record<string, number> = {};
  for (const cfg of moduleConfigs) {
    try {
      counts[cfg.kind] = await (prisma as any)[cfg.model].count({ where: { status: "PENDING" } });
    } catch {
      counts[cfg.kind] = 0;
    }
  }

  return NextResponse.json({
    success: true,
    total: items.length,
    items,
    pendingCounts: counts,
    totalPending: Object.values(counts).reduce((a, b) => a + b, 0),
  });
}

export async function PATCH(request: Request) {
  const session = await getSession(request);
  if (!session || !["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.kind || !body?.status) {
    return NextResponse.json({ error: "缺少 id/kind/status" }, { status: 400 });
  }

  const validStatuses = ["draft", "pending", "approved", "offline"];
  if (!validStatuses.includes(body.status.toLowerCase())) {
    return NextResponse.json({ error: "无效状态" }, { status: 400 });
  }

  if (body.kind === "verification") {
    try {
      const isApproved = body.status.toLowerCase() === "approved";
      const record = await prisma.verificationRecord.update({
        where: { id: body.id },
        data: {
          status: isApproved ? "APPROVED" : "REJECTED",
          reviewerId: session.id,
          reviewedAt: new Date(),
        },
      });

      if (isApproved && record.verifyType === "REAL_NAME") {
        await awardPoints(record.userId, "REALNAME_VERIFY");
      }

      await prisma.notification.create({
        data: {
          userId: record.userId,
          category: "SYSTEM",
          type: isApproved ? "CONTENT_APPROVED" : "CONTENT_REJECTED",
          title: isApproved ? "🎉 身份认证审核通过" : "⚠️ 认证申请未通过",
          content: isApproved
            ? `您的「${record.verifyType}」认证已通过核验，专属认证标识与权益已生效！`
            : "您的认证申请未能通过审核，请检查提交材料后重新提交。",
          link: "/profile?tab=verification",
        },
      });

      await prisma.operationLog.create({
        data: {
          userId: session.id,
          action: `review_verification_${body.status.toLowerCase()}`,
          metadata: { id: body.id, kind: "verification", status: body.status },
        },
      });

      return NextResponse.json({ success: true, item: record });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "更新认证状态失败" }, { status: 500 });
    }
  }

  const modelMap: Record<string, string> = {
    job: "job",
    house: "house",
    listing: "listing",
    shop: "shop",
    event: "event",
    love: "datingProfile",
    post: "post",
    article: "article",
  };

  const model = modelMap[body.kind];
  if (!model) return NextResponse.json({ error: "未知模块" }, { status: 400 });

  try {
    const item = await (prisma as any)[model].update({
      where: { id: body.id },
      data: { status: body.status.toUpperCase() },
    });

    await prisma.operationLog.create({
      data: {
        userId: session.id,
        action: `review_${body.kind}_${body.status.toLowerCase()}`,
        metadata: { id: body.id, kind: body.kind, status: body.status },
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "更新状态失败" }, { status: 500 });
  }
}
