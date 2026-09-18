import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/billing/pay-by-coin
 * 使用杨林金币钱包余额直扣开通置顶/解锁/发帖特权
 */
export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session || !session.id) {
      return NextResponse.json({ error: "请先登录后使用金币余额支付" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.orderNo) {
      return NextResponse.json({ error: "缺少订单编号" }, { status: 400 });
    }

    // 1. 查询订单
    const order = await prisma.billingOrder.findUnique({
      where: { orderNo: body.orderNo },
      include: { plan: true }
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    if (order.status === "PAID") {
      return NextResponse.json({ ok: true, message: "该订单已支付完成" });
    }

    // 2. 计算所需金币 (1元 = 10金币, 1分 = 0.1金币)
    const requiredCoins = Math.max(1, Math.round(order.amountCents / 10));

    // 3. 查询用户金币钱包
    const wallet = await prisma.coinWallet.findUnique({
      where: { userId: session.id }
    });

    if (!wallet || wallet.balance < requiredCoins) {
      return NextResponse.json({
        error: `金币余额不足！当前余额: ${wallet?.balance || 0} 金币，所需: ${requiredCoins} 金币。请先充值或使用微信直接扫码支付。`,
        balance: wallet?.balance || 0,
        requiredCoins
      }, { status: 400 });
    }

    // 4. 执行事务：扣减金币、记录流水、更新订单状态、激活置顶/解锁权益
    await prisma.$transaction(async (tx) => {
      // 扣除金币
      await tx.coinWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: requiredCoins },
          totalSpent: { increment: requiredCoins }
        }
      });

      // 写入金币交易流水
      await tx.coinTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -requiredCoins,
          type: "PIN_FEE",
          orderNo: order.orderNo,
          remark: `开通「${order.plan?.name || "置顶推广"}」抵扣 ${requiredCoins} 金币`
        }
      });

      // 更新订单为已支付
      await tx.billingOrder.update({
        where: { id: order.id },
        data: {
          status: "PAID"
        }
      });

      // 激活对应业务板块的置顶状态
      const durationDays = order.plan?.durationDays || 7;
      const topUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      if (order.targetKind === "job" && order.targetId) {
        await tx.job.updateMany({
          where: { id: order.targetId },
          data: { isTop: true, topUntil }
        });
      } else if (order.targetKind === "house" && order.targetId) {
        await tx.house.updateMany({
          where: { id: order.targetId },
          data: { isTop: true, topUntil }
        });
      } else if (order.targetKind === "shop" && order.targetId) {
        await tx.shop.updateMany({
          where: { id: order.targetId },
          data: { isFeatured: true }
        });
      } else if (order.targetKind === "listing" && order.targetId) {
        await tx.listing.updateMany({
          where: { id: order.targetId },
          data: { isTop: true }
        });
      }
    });

    return NextResponse.json({
      ok: true,
      message: "🎉 金币支付成功！已为您即时开通置顶推广特权！",
      deductedCoins: requiredCoins
    });
  } catch (error: any) {
    console.error("Coin payment error:", error);
    return NextResponse.json({ error: error.message || "金币支付处理失败" }, { status: 500 });
  }
}
