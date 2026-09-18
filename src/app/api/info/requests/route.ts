import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { matchAndNotifyProviders, maskPhoneNumber, maskWechat } from "@/lib/service-matching";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const area = searchParams.get("area");
    const urgency = searchParams.get("urgency");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const q = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "15")));

    const where: any = {};

    if (category && category !== "全部") {
      where.category = category;
    }
    if (area && area !== "全城" && area !== "杨林全区") {
      where.area = { contains: area };
    }
    if (urgency) {
      where.urgency = urgency;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (userId) {
      where.userId = userId;
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.serviceRequest.count({ where }),
      prisma.serviceRequest.findMany({
        where,
        include: {
          user: { select: { id: true, nickname: true, username: true, avatar: true } },
          leads: {
            select: { id: true, status: true, providerId: true },
          },
          selectedProvider: {
            select: { id: true, name: true, avatar: true, phone: true, ratingAvg: true, ratingCount: true },
          },
          _count: {
            select: { leads: true, contactEvents: true },
          },
        },
        orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const isPrivilegedUser = session?.role === "ADMIN";

    // 格式化输出，对非本人和非管理员执行手机号脱敏
    const formatted = items.map((item) => {
      const isOwner = session?.id === item.userId;
      const canSeeFull = isOwner || isPrivilegedUser;

      return {
        ...item,
        contactPhone: canSeeFull ? item.contactPhone : maskPhoneNumber(item.contactPhone),
        contactWechat: canSeeFull ? item.contactWechat : maskWechat(item.contactWechat),
        addressDetail: canSeeFull ? item.addressDetail : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        items: formatted,
      },
    });
  } catch (error: any) {
    console.error("[SERVICE_REQUESTS_GET_ERROR]", error);
    return NextResponse.json({ success: false, message: error.message || "获取需求列表失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.id) {
      return NextResponse.json({ success: false, message: "请先登录后再发布需求" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      category,
      area,
      addressDetail,
      budgetMin,
      budgetMax,
      preferredTime,
      urgency = "NORMAL",
      description,
      images = [],
      contactName,
      contactPhone,
      contactWechat,
    } = body;

    if (!title || !category || !area || !description || !contactName || !contactPhone) {
      return NextResponse.json(
        { success: false, message: "请完整填写需求标题、类别、区域、故障描述、联系人与联系电话" },
        { status: 400 }
      );
    }

    // 生成唯一需求号: REQ-20260913-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const requestNo = `REQ-${dateStr}-${randomSuffix}`;

    // 默认15天有效期
    const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const newRequest = await prisma.serviceRequest.create({
      data: {
        requestNo,
        userId: session.id,
        title: title.trim(),
        category: category.trim(),
        area: area.trim(),
        addressDetail: addressDetail?.trim() || null,
        budgetMin: budgetMin ? parseInt(budgetMin) : null,
        budgetMax: budgetMax ? parseInt(budgetMax) : null,
        preferredTime: preferredTime || "尽快上门",
        urgency: ["URGENT", "NORMAL", "FLEXIBLE"].includes(urgency) ? urgency : "NORMAL",
        description: description.trim(),
        images: Array.isArray(images) ? images : [],
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactWechat: contactWechat?.trim() || null,
        status: "PENDING_MATCH",
        expiresAt,
      },
    });

    // 触发规则智能匹配与线索分发 (异步触发)
    matchAndNotifyProviders(newRequest.id).catch((err) => {
      console.error("[AUTO_MATCH_ERROR]", err);
    });

    return NextResponse.json({
      success: true,
      message: "需求发布成功，已为您启动本地师傅智能匹配！",
      data: newRequest,
    });
  } catch (error: any) {
    console.error("[SERVICE_REQUESTS_POST_ERROR]", error);
    return NextResponse.json({ success: false, message: error.message || "需求发布失败" }, { status: 500 });
  }
}
