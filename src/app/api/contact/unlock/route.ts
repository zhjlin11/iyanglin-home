import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { spendCoins, getOrCreateCoinWallet, CONTACT_VIEW_COIN_COST } from "@/lib/coin-wallet-store";

/**
 * POST /api/contact/unlock
 * 金币解锁联系方式 — 房产 / 招聘 / 分类信息
 *
 * Body: { targetKind: "house"|"job"|"listing", targetId: string }
 * Returns: { success, phone, balance, alreadyUnlocked }
 */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session?.id) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED", message: "请先登录后解锁联系方式" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body?.targetKind || !body?.targetId) {
    return NextResponse.json(
      { success: false, message: "缺少参数 targetKind / targetId" },
      { status: 400 }
    );
  }

  const { targetKind, targetId } = body as { targetKind: string; targetId: string };
  const validKinds = ["house", "job", "listing"];
  if (!validKinds.includes(targetKind)) {
    return NextResponse.json(
      { success: false, message: "不支持的目标类型" },
      { status: 400 }
    );
  }

  try {
    // 1. 检查是否已解锁（避免重复扣费）
    const existing = await prisma.contactPurchase.findUnique({
      where: { userId_targetKind_targetId: { userId: session.id, targetKind, targetId } },
    });

    if (existing) {
      const wallet = await getOrCreateCoinWallet(session.id);
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        phone: existing.phone,
        balance: wallet.balance,
        message: "已解锁，无需重复付费",
      });
    }

    // 2. 查询目标记录获取联系方式
    let phone: string | null = null;

    if (targetKind === "house") {
      const house = await prisma.house.findUnique({ where: { id: targetId }, select: { contact: true } });
      phone = house?.contact || null;
    } else if (targetKind === "job") {
      // Job 模型没有 contact 字段，从 body 解析或 author.phone 获取
      const job = await prisma.job.findUnique({ where: { id: targetId }, select: { body: true, authorId: true } });
      if (job) {
        const phoneMatch = job.body.match(/1[3-9]\d{9}/);
        if (phoneMatch) phone = phoneMatch[0];
        if (!phone && job.authorId) {
          const u = await prisma.user.findUnique({ where: { id: job.authorId }, select: { phone: true } });
          phone = u?.phone || null;
        }
      }
    } else if (targetKind === "listing") {
      const listing = await prisma.listing.findUnique({ where: { id: targetId }, select: { contact: true } });
      phone = listing?.contact || null;
    }

    if (!phone) {
      return NextResponse.json(
        { success: false, message: "该信息暂无联系方式" },
        { status: 404 }
      );
    }

    // 3. 管理员免费查看
    if (session.role === "ADMIN") {
      await prisma.contactPurchase.create({
        data: { userId: session.id, targetKind, targetId, coinsPaid: 0, phone },
      });
      const wallet = await getOrCreateCoinWallet(session.id);
      return NextResponse.json({
        success: true,
        phone,
        balance: wallet.balance,
        coinsPaid: 0,
        message: "管理员免费解锁",
      });
    }

    // 4. 检查是否是信息发布者本人（本人查看自己的帖子免费）
    let authorId: string | null = null;
    if (targetKind === "house") {
      const h = await prisma.house.findUnique({ where: { id: targetId }, select: { authorId: true } });
      authorId = h?.authorId || null;
    } else if (targetKind === "job") {
      // 复用上面已查的 job 数据
      const j = await prisma.job.findUnique({ where: { id: targetId }, select: { authorId: true } });
      authorId = j?.authorId || null;
    } else {
      const l = await prisma.listing.findUnique({ where: { id: targetId }, select: { authorId: true } });
      authorId = l?.authorId || null;
    }

    if (authorId === session.id) {
      await prisma.contactPurchase.create({
        data: { userId: session.id, targetKind, targetId, coinsPaid: 0, phone },
      });
      const wallet = await getOrCreateCoinWallet(session.id);
      return NextResponse.json({
        success: true,
        phone,
        balance: wallet.balance,
        coinsPaid: 0,
        message: "本人发布的信息，免费查看",
      });
    }

    // 5. 检查VIP会员（有效会员免费查看）
    const activeMembership = await prisma.userMembership.findFirst({
      where: { userId: session.id, status: "ACTIVE" },
    });

    if (activeMembership) {
      await prisma.contactPurchase.create({
        data: { userId: session.id, targetKind, targetId, coinsPaid: 0, phone },
      });
      const wallet = await getOrCreateCoinWallet(session.id);
      return NextResponse.json({
        success: true,
        phone,
        balance: wallet.balance,
        coinsPaid: 0,
        message: "VIP会员免费解锁",
      });
    }

    // 6. 普通用户 — 金币扣费
    const coinCost = CONTACT_VIEW_COIN_COST;

    const kindLabels: Record<string, string> = {
      house: "房产",
      job: "招聘",
      listing: "分类信息",
    };
    const label = kindLabels[targetKind] || "信息";

    const spendResult = await spendCoins(
      session.id,
      coinCost,
      "CONTACT_VIEW",
      `查看${label}联系方式 (${targetId.slice(0, 8)}...)`
    );

    if (!spendResult.success) {
      return NextResponse.json(
        {
          success: false,
          code: "INSUFFICIENT_COINS",
          message: spendResult.message,
          balance: spendResult.balance,
          required: coinCost,
        },
        { status: 402 }
      );
    }

    // 7. 记录解锁记录
    await prisma.contactPurchase.create({
      data: { userId: session.id, targetKind, targetId, coinsPaid: coinCost, phone },
    });

    return NextResponse.json({
      success: true,
      phone,
      balance: spendResult.balance,
      coinsPaid: coinCost,
      message: `已扣除 ${coinCost} 金币解锁联系方式`,
    });
  } catch (error: any) {
    console.error("Contact unlock error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "解锁失败" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contact/unlock?targetKind=house&targetId=xxx
 * 检查当前用户是否已解锁指定联系方式
 */
export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session?.id) {
    return NextResponse.json({ unlocked: false, loggedIn: false });
  }

  const { searchParams } = new URL(request.url);
  const targetKind = searchParams.get("targetKind");
  const targetId = searchParams.get("targetId");

  if (!targetKind || !targetId) {
    return NextResponse.json({ unlocked: false, loggedIn: true });
  }

  const purchase = await prisma.contactPurchase.findUnique({
    where: { userId_targetKind_targetId: { userId: session.id, targetKind, targetId } },
  });

  if (purchase) {
    return NextResponse.json({ unlocked: true, loggedIn: true, phone: purchase.phone });
  }

  // VIP 会员也算已解锁（但不记录 — 到付费时再记录）
  const activeMembership = await prisma.userMembership.findFirst({
    where: { userId: session.id, status: "ACTIVE" },
  });

  const wallet = await getOrCreateCoinWallet(session.id);

  return NextResponse.json({
    unlocked: false,
    loggedIn: true,
    isVip: !!activeMembership,
    balance: wallet.balance,
    coinCost: CONTACT_VIEW_COIN_COST,
  });
}
