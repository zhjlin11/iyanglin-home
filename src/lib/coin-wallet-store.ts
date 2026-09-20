import { prisma } from "@/lib/prisma";

// 金币官方充值套餐 (1元 = 10金币)
export const COIN_RECHARGE_PACKAGES = [
  { id: "coin_pkg_10",  name: "100 金币",  priceCents: 1000,  coins: 100,  bonusCoins: 0,   desc: "¥10.00 (标准充值)" },
  { id: "coin_pkg_30",  name: "320 金币",  priceCents: 3000,  coins: 300,  bonusCoins: 20,  desc: "¥30.00 (赠送20金币)" },
  { id: "coin_pkg_50",  name: "550 金币",  priceCents: 5000,  coins: 500,  bonusCoins: 50,  desc: "¥50.00 (赠送50金币，立省5元)" },
  { id: "coin_pkg_100", name: "1150 金币", priceCents: 10000, coins: 1000, bonusCoins: 150, desc: "¥100.00 (赠送150金币，超值特惠)" },
];

/** 获取或创建用户的金币钱包 */
export async function getOrCreateCoinWallet(userId: string) {
  let wallet = await prisma.coinWallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    wallet = await prisma.coinWallet.create({
      data: {
        userId,
        balance: 10, // 新用户注册赠送 10 金币体验金
        totalRecharged: 0,
        totalSpent: 0,
      },
    });
  }

  return wallet;
}

/** 充值金币入账（严格幂等，必须原子更新订单为 PAID 后方能入账） */
export async function rechargeCoins(
  userId: string,
  amountCoins: number,
  orderNo?: string,
  remark: string = "微信在线充值金币"
) {
  const wallet = await getOrCreateCoinWallet(userId);

  return prisma.$transaction(async (tx) => {
    if (orderNo) {
      // 1. 条件更新：必须由 PENDING_PAYMENT -> PAID 成功，才证明是首次处理！
      const orderUpdate = await tx.billingOrder.updateMany({
        where: { orderNo, status: "PENDING_PAYMENT" },
        data: { status: "PAID", paidAt: new Date() },
      });

      // 如果更新行数为 0，检查该订单是否已经由回调处理完毕或流水已存在
      if (orderUpdate.count === 0) {
        const existingTx = await tx.coinTransaction.findFirst({
          where: { orderNo, type: "RECHARGE" },
        });
        if (existingTx) {
          console.log(`[充值幂等] 订单 ${orderNo} 已经完成充值入账，跳过重复处理`);
          return tx.coinWallet.findUniqueOrThrow({ where: { id: wallet.id } });
        }
      }

      // 2. 再次防重检查流水表中是否已有相同单号
      const existingTx = await tx.coinTransaction.findFirst({
        where: { orderNo, type: "RECHARGE" },
      });
      if (existingTx) {
        console.log(`[充值幂等] 订单 ${orderNo} 流水已存在，拒绝重复发金币`);
        return tx.coinWallet.findUniqueOrThrow({ where: { id: wallet.id } });
      }
    }

    // 3. 原子增加钱包余额
    const currentWallet = await tx.coinWallet.findUniqueOrThrow({ where: { id: wallet.id } });
    const newBalance = currentWallet.balance + amountCoins;

    const updatedWallet = await tx.coinWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: amountCoins },
        totalRecharged: { increment: amountCoins },
      },
    });

    // 4. 记入流水
    await tx.coinTransaction.create({
      data: {
        walletId: wallet.id,
        amount: amountCoins,
        type: "RECHARGE",
        orderNo,
        remark,
        balanceBefore: currentWallet.balance,
        balanceAfter: newBalance,
        businessType: "RECHARGE",
        businessId: orderNo,
      },
    });

    return updatedWallet;
  });
}

/** 查看联系方式默认金币单价 */
export const CONTACT_VIEW_COIN_COST = 10; // 10金币 = ¥1

/** 消费金币扣减 */
export async function spendCoins(
  userId: string,
  amountCoins: number,
  type: "POST_FEE" | "PIN_FEE" | "REFRESH_FEE" | "VIP_BUY" | "ADMIN_ADJUST" | "CONTACT_VIEW",
  remark: string
): Promise<{ success: boolean; message: string; balance?: number }> {
  const wallet = await getOrCreateCoinWallet(userId);

  if (wallet.balance < amountCoins) {
    return {
      success: false,
      message: `金币余额不足 (当前 ${wallet.balance} 金币，需 ${amountCoins} 金币)，请充值`,
      balance: wallet.balance,
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.coinWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: amountCoins },
        totalSpent: { increment: amountCoins },
      },
    });

    await tx.coinTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -amountCoins,
        type,
        remark,
      },
    });

    return updated;
  });

  return { success: true, message: "支付扣费成功", balance: result.balance };
}

/** 获取用户的金币流水 */
export async function listCoinTransactions(userId: string, limit: number = 20) {
  const wallet = await getOrCreateCoinWallet(userId);
  return prisma.coinTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** 订单退款扣减/回收充值金币 */
export async function refundCoins(
  userId: string,
  amountCoins: number,
  orderNo?: string,
  remark: string = "订单退款扣减金币"
) {
  const wallet = await getOrCreateCoinWallet(userId);
  return prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.coinWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: amountCoins },
        totalRecharged: { decrement: amountCoins },
      },
    });

    await tx.coinTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -amountCoins,
        type: "ADMIN_ADJUST",
        orderNo,
        remark,
      },
    });

    return updatedWallet;
  });
}

