import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCategoryByKey, getCategoryByName } from "@/lib/info-categories";
import { cleanText } from "@/lib/strip-html";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "ID不能为空" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            phone: true,
            phoneVerifiedAt: true,
            role: true,
            communityBadge: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ success: false, error: "信息不存在或已被删除" }, { status: 404 });
    }

    // 检查是否已过期
    const isExpired = listing.status === "EXPIRED" || (listing.expiresAt && new Date(listing.expiresAt) < new Date());
    const now = new Date();
    const isTopActive = listing.isTop && !!listing.topUntil && listing.topUntil > now;
    const isFeaturedActive = listing.isFeatured && !!listing.featuredUntil && listing.featuredUntil > now;
    const isHomeFeaturedActive = listing.isHomeFeatured && !!listing.homeFeaturedUntil && listing.homeFeaturedUntil > now;

    // 浏览量自增
    prisma.listing
      .update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch((err) => console.error("Auto increment viewsCount failed:", err));

    // 获取发布者真实可信度事实
    const { getProviderTrustFacts } = await import("@/lib/info-promotions");
    const trustFacts = await getProviderTrustFacts(listing.authorId);

    // 获取关联的服务者主页（若已认证）
    let provider = null;
    if (listing.authorId) {
      provider = await prisma.serviceProvider.findUnique({
        where: { userId: listing.authorId },
        select: {
          id: true,
          name: true,
          avatar: true,
          serviceCategory: true,
          serviceAreas: true,
          phone: true,
          wechat: true,
          yearsOfService: true,
          address: true,
          intro: true,
          verificationType: true,
          verificationStatus: true,
          isMember: true,
        },
      });
    }

    // 获取同类别或同区域推荐 (最多6条)
    const related = await prisma.listing.findMany({
      where: {
        id: { not: id },
        status: "APPROVED",
        OR: [
          { category: listing.category },
          { area: listing.area },
        ],
      },
      orderBy: [{ isTop: "desc" }, { isFeatured: "desc" }, { refreshedAt: "desc" }],
      take: 6,
    });

    return NextResponse.json({
      success: true,
      item: {
        ...listing,
        viewsCount: listing.viewsCount + 1,
        isExpired,
        isTopActive,
        isFeaturedActive,
        isHomeFeaturedActive,
        authorVerified: !!listing.author?.phoneVerifiedAt,
      },
      trustFacts,
      provider: provider && provider.verificationStatus === "APPROVED" ? provider : null,
      related,
    });
  } catch (error: any) {
    console.error("[API /api/info/[id] GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "获取信息详情失败" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request);

    if (!session?.id) {
      return NextResponse.json({ success: false, error: "请先登录后操作" }, { status: 401 });
    }

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "信息不存在" }, { status: 404 });
    }

    const isAuthor = existing.authorId === session.id;
    const roleUpper = String(session.role || "").toUpperCase();
    const isAdmin = roleUpper === "ADMIN" || roleUpper === "EDITOR";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ success: false, error: "无权修改该信息" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      category,
      subCategory,
      itemType,
      price,
      priceNum,
      priceUnit,
      condition,
      area,
      address,
      contact,
      contactName,
      wechat,
      body: contentBody,
      images,
      departureTime,
      fromPlace,
      toPlace,
      status: targetStatus,
      rejectReason,
      extraData,
      action,
    } = body;

    const updateData: any = {};

    // 快捷动作流转 (用户或管理员触发)
    if (action === "OFFLINE" || targetStatus === "OFFLINE") {
      updateData.status = "OFFLINE";
    } else if (action === "SOLD" || targetStatus === "SOLD") {
      updateData.status = "SOLD";
    } else if (action === "RESOLVED" || targetStatus === "RESOLVED") {
      updateData.status = "RESOLVED";
    } else if (action === "RESUBMIT" || (isAuthor && existing.status === "REJECTED")) {
      // 驳回后修改：重新提交审核
      updateData.status = "PENDING";
      updateData.rejectReason = null;
    } else if (isAdmin && targetStatus) {
      updateData.status = targetStatus;
      if (rejectReason !== undefined) {
        updateData.rejectReason = rejectReason ? cleanText(rejectReason).trim() : null;
      }
    }

    // 字段更新
    if (title !== undefined) updateData.title = cleanText(title).trim();
    if (category !== undefined) {
      const catObj = getCategoryByKey(category) || getCategoryByName(category);
      updateData.category = catObj ? catObj.name : category;
    }
    if (subCategory !== undefined) updateData.subCategory = subCategory ? cleanText(subCategory).trim() : null;
    if (itemType !== undefined) updateData.itemType = (itemType || "OFFER").toUpperCase();
    if (price !== undefined) updateData.price = price ? cleanText(price).trim() : "面议";
    if (priceNum !== undefined) updateData.priceNum = priceNum !== null ? Number(priceNum) : null;
    if (priceUnit !== undefined) updateData.priceUnit = priceUnit;
    if (condition !== undefined) updateData.condition = condition ? cleanText(condition).trim() : null;
    if (area !== undefined) updateData.area = area ? cleanText(area).trim() : "杨林经开区";
    if (address !== undefined) updateData.address = address ? cleanText(address).trim() : null;
    if (contact !== undefined) updateData.contact = cleanText(contact).trim();
    if (contactName !== undefined) updateData.contactName = contactName ? cleanText(contactName).trim() : null;
    if (wechat !== undefined) updateData.wechat = wechat ? cleanText(wechat).trim() : null;
    if (contentBody !== undefined) updateData.body = cleanText(contentBody).trim();
    if (images !== undefined) updateData.images = Array.isArray(images) ? images.slice(0, 9) : [];
    if (departureTime !== undefined) updateData.departureTime = departureTime ? cleanText(departureTime).trim() : null;
    if (fromPlace !== undefined) updateData.fromPlace = fromPlace ? cleanText(fromPlace).trim() : null;
    if (toPlace !== undefined) updateData.toPlace = toPlace ? cleanText(toPlace).trim() : null;
    if (extraData !== undefined) updateData.extraData = extraData;

    if (isAdmin) {
      if (body.isTop !== undefined) updateData.isTop = !!body.isTop;
      if (body.isFeatured !== undefined) updateData.isFeatured = !!body.isFeatured;
      if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: updateData,
    });

    await prisma.operationLog.create({
      data: {
        action: "update_listing",
        targetId: id,
        userId: session.id,
        metadata: {
          title: updated.title,
          category: updated.category,
          status: updated.status,
          action: action || "edit",
        },
      },
    });

    return NextResponse.json({
      success: true,
      item: updated,
      message: "操作成功",
    });
  } catch (error: any) {
    console.error("[API /api/info/[id] PUT Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "更新信息失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request);

    if (!session?.id) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "信息不存在" }, { status: 404 });
    }

    const isAuthor = existing.authorId === session.id;
    const roleUpper = String(session.role || "").toUpperCase();
    const isAdmin = roleUpper === "ADMIN" || roleUpper === "EDITOR";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ success: false, error: "无权删除该信息" }, { status: 403 });
    }

    await prisma.listing.delete({ where: { id } });

    await prisma.operationLog.create({
      data: {
        action: "delete_listing",
        targetId: id,
        userId: session.id,
        metadata: { title: existing.title },
      },
    });

    return NextResponse.json({
      success: true,
      message: "信息已成功删除",
    });
  } catch (error: any) {
    console.error("[API /api/info/[id] DELETE Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "删除信息失败" },
      { status: 500 }
    );
  }
}
