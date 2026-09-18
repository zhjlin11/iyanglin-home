import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/user/dating/unlocked?profileId=xxx&orderNo=yyy
 *
 * 检查当前登录用户是否已成功购买/核销该相亲嘉宾写真权益
 * 严格安全鉴权：未登录用户绝对不可解锁！只能查询属于当前登录用户的已支付订单！
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");

  const session = await getSession();

  // 1. 未登录访客一律拒绝解锁
  if (!session?.id) {
    return NextResponse.json({ unlocked: false, reason: "NOT_LOGGED_IN" });
  }

  if (!profileId) {
    return NextResponse.json({ unlocked: false });
  }

  try {
    // 3. 如果当前用户就是嘉宾本人，直接解锁
    const profile = await prisma.datingProfile.findUnique({
      where: { id: profileId },
      select: { authorId: true },
    });
    if (profile && profile.authorId === session.id) {
      return NextResponse.json({ unlocked: true, reason: "OWNER" });
    }

    // 4. 检查当前用户是否开通有效相亲 VIP
    const activeVip = await prisma.userMembership.findFirst({
      where: {
        userId: session.id,
        status: "ACTIVE",
      },
    });
    if (activeVip) {
      return NextResponse.json({ unlocked: true, reason: "VIP" });
    }

    // 5. 检查当前用户是否已支付购买该嘉宾写真 (targetTitle 绑定用户 UID)
    const order = await prisma.billingOrder.findFirst({
      where: {
        targetId: profileId,
        targetKind: "dating_photo",
        status: "PAID",
        targetTitle: { contains: session.id },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (order) {
      return NextResponse.json({ unlocked: true, orderNo: order.orderNo });
    }

    return NextResponse.json({ unlocked: false });
  } catch (err) {
    return NextResponse.json({ unlocked: false });
  }
}

