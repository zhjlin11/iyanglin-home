import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { awardPoints } from "@/lib/points-engine";

export const dynamic = "force-dynamic";

function checkAdminAuth(session: any): session is { id: string; role: string; [key: string]: any } {
  if (!session?.id) return false;
  const role = String(session.role || "").toUpperCase();
  return ["ADMIN", "EDITOR", "REVIEWER"].includes(role);
}

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!checkAdminAuth(session)) {
      return NextResponse.json({ error: "无权访问审核中心" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filterType = (searchParams.get("type") || "ALL").toUpperCase();

    const pendingQueue: any[] = [];

    // 1. 待审岗位
    if (filterType === "ALL" || filterType === "JOB") {
      const jobs = await prisma.job.findMany({
        where: { status: "PENDING" },
        include: { author: { select: { id: true, username: true, phone: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      jobs.forEach((j) => {
        pendingQueue.push({
          id: j.id,
          resourceType: "JOB",
          typeLabel: "招聘求职",
          title: j.title,
          subTitle: j.company,
          authorName: j.author?.username || "匿名",
          authorPhone: j.author?.phone,
          createdAt: j.createdAt.toISOString(),
          details: { salary: j.salary, area: j.area, body: j.body.slice(0, 120) },
        });
      });
    }

    // 2. 待审房源
    if (filterType === "ALL" || filterType === "HOUSE") {
      const houses = await prisma.house.findMany({
        where: { status: "PENDING" },
        include: { author: { select: { id: true, username: true, phone: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      houses.forEach((h) => {
        pendingQueue.push({
          id: h.id,
          resourceType: "HOUSE",
          typeLabel: "房产挂牌",
          title: h.title,
          subTitle: h.layout,
          authorName: h.author?.username || "房东/业主",
          authorPhone: h.author?.phone || h.contact || "",
          createdAt: h.createdAt.toISOString(),
          details: { price: h.price, location: h.location, body: h.body.slice(0, 120) },
        });
      });
    }

    // 3. 待审便民
    if (filterType === "ALL" || filterType === "LISTING") {
      const listings = await prisma.listing.findMany({
        where: { status: "PENDING" },
        include: { author: { select: { id: true, username: true, phone: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      listings.forEach((l) => {
        pendingQueue.push({
          id: l.id,
          resourceType: "LISTING",
          typeLabel: "便民信息",
          title: l.title,
          subTitle: l.category,
          authorName: l.author?.username || "匿名",
          authorPhone: l.author?.phone,
          createdAt: l.createdAt.toISOString(),
          details: { category: l.category, body: l.body.slice(0, 120) },
        });
      });
    }

    // 4. 待审社区贴
    if (filterType === "ALL" || filterType === "POST") {
      const posts = await prisma.post.findMany({
        where: { status: "PENDING" },
        include: { author: { select: { id: true, username: true, phone: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      posts.forEach((p) => {
        pendingQueue.push({
          id: p.id,
          resourceType: "POST",
          typeLabel: "社区贴子",
          title: p.title,
          subTitle: p.board,
          authorName: p.author?.username || "匿名",
          authorPhone: p.author?.phone,
          createdAt: p.createdAt.toISOString(),
          details: { body: p.body.slice(0, 120) },
        });
      });
    }

    // 5. 待审身份/实名/企业认证
    if (filterType === "ALL" || filterType === "VERIFICATION") {
      const verifications = await prisma.verificationRecord.findMany({
        where: { status: "PENDING" },
        include: { user: { select: { id: true, username: true, phone: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      verifications.forEach((v) => {
        pendingQueue.push({
          id: v.id,
          resourceType: "VERIFICATION",
          typeLabel: `认证审核 (${v.verifyType})`,
          title: v.companyName || v.idCardName || "实名/企业认证",
          subTitle: v.licenseNo || v.idCardNoMasked || "",
          authorName: v.user.username,
          authorPhone: v.user.phone,
          createdAt: v.createdAt.toISOString(),
          details: {
            verifyType: v.verifyType,
            idCardPhotos: v.idCardPhotos,
            licensePhotos: v.licensePhotos,
          },
        });
      });
    }

    pendingQueue.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      total: pendingQueue.length,
      items: pendingQueue,
    });
  } catch (err: any) {
    console.error("[Admin Review GET] error:", err);
    return NextResponse.json(
      { error: err.message || "拉取待审核流异常" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!checkAdminAuth(session)) {
      return NextResponse.json({ error: "无权执行审核操作" }, { status: 403 });
    }

    const body = await request.json();
    const { resourceType, id, action, note } = body;

    if (!resourceType || !id || !action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "参数不合规" }, { status: 400 });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    if (resourceType === "JOB") {
      const j = await prisma.job.update({
        where: { id },
        data: { status: newStatus as any },
      });
      if (j.authorId) {
        await prisma.notification.create({
          data: {
            userId: j.authorId,
            category: "SYSTEM",
            type: action === "APPROVE" ? "CONTENT_APPROVED" : "CONTENT_REJECTED",
            title: action === "APPROVE" ? "✅ 招聘岗位审核通过" : "❌ 招聘岗位被驳回",
            content: action === "APPROVE" ? `您的招聘「${j.title}」已审核通过并公开上线。` : `您的招聘「${j.title}」未通过审核：${note || "内容不符合规范"}`,
            link: `/jobs/${j.id}`,
          },
        });
      }
    } else if (resourceType === "HOUSE") {
      const h = await prisma.house.update({
        where: { id },
        data: { status: newStatus as any },
      });
      if (h.authorId) {
        await prisma.notification.create({
          data: {
            userId: h.authorId,
            category: "SYSTEM",
            type: action === "APPROVE" ? "CONTENT_APPROVED" : "CONTENT_REJECTED",
            title: action === "APPROVE" ? "✅ 房源挂牌审核通过" : "❌ 房源挂牌被驳回",
            content: action === "APPROVE" ? `您的房源「${h.title}」已通过审核发布。` : `您的房源「${h.title}」未通过审核：${note || "请核对产权真实性"}`,
            link: `/house/${h.id}`,
          },
        });
      }
    } else if (resourceType === "LISTING") {
      const l = await prisma.listing.update({
        where: { id },
        data: { status: newStatus as any },
      });
      if (l.authorId) {
        await prisma.notification.create({
          data: {
            userId: l.authorId,
            category: "SYSTEM",
            type: action === "APPROVE" ? "CONTENT_APPROVED" : "CONTENT_REJECTED",
            title: action === "APPROVE" ? "✅ 便民信息审核通过" : "❌ 便民信息被驳回",
            content: action === "APPROVE" ? `您的信息「${l.title}」已正常上线展示。` : `您的信息「${l.title}」未通过审核：${note || "请遵守社区守则"}`,
            link: `/info/${l.id}`,
          },
        });
      }
    } else if (resourceType === "POST") {
      const p = await prisma.post.update({
        where: { id },
        data: { status: newStatus as any },
      });
      if (p.authorId) {
        await prisma.notification.create({
          data: {
            userId: p.authorId,
            category: "SYSTEM",
            type: action === "APPROVE" ? "CONTENT_APPROVED" : "CONTENT_REJECTED",
            title: action === "APPROVE" ? "✅ 社区贴子审核通过" : "❌ 贴子被驳回",
            content: action === "APPROVE" ? `您发布的话题「${p.title}」已审核通过。` : `您的贴子「${p.title}」被驳回：${note || "包含违规内容"}`,
            link: `/community/${p.id}`,
          },
        });
      }
    } else if (resourceType === "VERIFICATION") {
      const v = await prisma.verificationRecord.update({
        where: { id },
        data: {
          status: newStatus,
          reviewerId: session.id,
          reviewerNote: note || null,
          reviewedAt: new Date(),
        },
      });

      // 实名认证通过赠送 15 积分运营激励
      if (action === "APPROVE" && v.verifyType === "REAL_NAME") {
        await awardPoints(v.userId, "REALNAME_VERIFY");
      }

      await prisma.notification.create({
        data: {
          userId: v.userId,
          category: "SYSTEM",
          type: action === "APPROVE" ? "CONTENT_APPROVED" : "CONTENT_REJECTED",
          title: action === "APPROVE" ? "🎉 身份认证审核通过" : "⚠️ 认证申请未通过",
          content: action === "APPROVE" ? `您的「${v.verifyType}」认证已通过核验，专属认证标识与权益已生效！` : `您的认证申请未能通过审核：${note || "请上传清晰合规证明材料后重试"}`,
          link: "/profile?tab=verification",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `已成功${action === "APPROVE" ? "审核通过" : "驳回"}该项目`,
    });
  } catch (err: any) {
    console.error("[Admin Review POST] error:", err);
    return NextResponse.json(
      { error: err.message || "审核处理失败" },
      { status: 500 }
    );
  }
}
