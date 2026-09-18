import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getOrCreateCoinWallet,
  rechargeCoins,
  spendCoins,
  listCoinTransactions,
  COIN_RECHARGE_PACKAGES,
} from "@/lib/coin-wallet-store";

/** GET /api/wallet/coins — 获取当前用户的金币钱包余额与近期明细 */
export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const wallet = await getOrCreateCoinWallet(session.id);
  const transactions = await listCoinTransactions(session.id, 20);

  const formattedPackages = COIN_RECHARGE_PACKAGES.map((pkg) => ({
    ...pkg,
    price: pkg.priceCents / 100,
    priceYuan: (pkg.priceCents / 100).toFixed(pkg.priceCents % 100 === 0 ? 0 : 2),
  }));

  return NextResponse.json({
    balance: wallet.balance,
    totalRecharged: wallet.totalRecharged,
    totalSpent: wallet.totalSpent,
    packages: formattedPackages,
    transactions,
  });
}

/** POST /api/wallet/coins — 购买/充值金币套餐或金币直接扣费 */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "请求无效" }, { status: 400 });
  }

  // 1. 充值金币 (兼容显式 action="recharge" 或直接传入 packageId)
  if (body.action === "recharge" || (!body.action && body.packageId)) {
    const pkg = COIN_RECHARGE_PACKAGES.find((p) => p.id === body.packageId);
    if (!pkg) {
      return NextResponse.json({ error: "充值套餐不存在" }, { status: 400 });
    }

    const orderNo = `COIN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const totalCoins = pkg.coins + pkg.bonusCoins;

    const updated = await rechargeCoins(session.id, totalCoins, orderNo, `微信充值: ${pkg.name}`);

    return NextResponse.json({
      success: true,
      ok: true,
      message: `成功充值 ${totalCoins} 金币！`,
      balance: updated.balance,
    });
  }

  // 2. 金币支付/扣费
  if (body.action === "spend") {
    const amount = parseInt(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "扣费金额无效" }, { status: 400 });
    }

    const res = await spendCoins(
      session.id,
      amount,
      body.type || "POST_FEE",
      body.remark || "便民服务金币支付"
    );

    if (!res.success) {
      return NextResponse.json({ error: res.message, balance: res.balance }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: res.message, balance: res.balance });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
