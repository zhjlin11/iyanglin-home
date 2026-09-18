import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDatingContact } from "@/lib/dating-contact-utils";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/love/[id]/contact
 * 严格安全的相亲嘉宾联系方式鉴权与解锁调取接口
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, message: "缺少嘉宾 ID" }, { status: 400 });
  }

  // 1. 严格检查登录态
  const session = await getSession(request);
  if (!session || !session.id) {
    return NextResponse.json(
      {
        success: false,
        code: "UNAUTHORIZED",
        message: "为保护嘉宾隐私与防骚扰，请先登录后申请牵线联系方式",
        loginRequired: true,
      },
      { status: 401 }
    );
  }

  // 2. 查询相亲档案
  const profile = await prisma.datingProfile.findUnique({
    where: { id },
  });

  if (!profile) {
    return NextResponse.json({ success: false, message: "嘉宾档案不存在或已下架" }, { status: 404 });
  }

  const parsedInfo = parseDatingContact(profile.contact);

  // 3. 检查是否有查看权限 (管理员 / 本人 / 已购买相亲写真或牵线订单 / 会员)
  const isAdmin = session.role === "ADMIN";
  const isOwner = profile.authorId === session.id;

  let hasPaidUnlock = false;
  if (!isAdmin && !isOwner) {
    const paidOrder = await prisma.billingOrder.findFirst({
      where: {
        targetId: id,
        status: "PAID",
      },
    });
    if (paidOrder) {
      hasPaidUnlock = true;
    }
  }

  const isUnlocked = isAdmin || isOwner || hasPaidUnlock;

  if (!isUnlocked) {
    return NextResponse.json({
      success: false,
      code: "UNLOCK_REQUIRED",
      unlocked: false,
      isLoggedIn: true,
      contactInfo: parsedInfo,
      message: "该嘉宾联系方式已加密，请申请牵线或完成解锁后查看",
    });
  }

  // 4. 已解锁，安全返回真实信息
  return NextResponse.json({
    success: true,
    unlocked: true,
    isLoggedIn: true,
    contactInfo: {
      ...parsedInfo,
      realContact: profile.contact,
    },
    matchmakerWechat: "yanglinol_helper",
    matchmakerPhone: "18314398896",
  });
}
