import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // Upsert point account (auto-create if not exists)
  let account = await prisma.pointAccount.findUnique({
    where: { userId: session.id },
  });

  if (!account) {
    account = await prisma.pointAccount.create({
      data: { userId: session.id },
    });
  }

  // Get recent transactions (last 30)
  const transactions = await prisma.pointTransaction.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Check if already checked in today
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const checkedInToday = account.lastCheckin
    ? new Date(account.lastCheckin) >= todayStart
    : false;

  return NextResponse.json({
    account: {
      balance: account.balance,
      totalEarned: account.totalEarned,
      totalSpent: account.totalSpent,
      lastCheckin: account.lastCheckin,
      checkedInToday,
    },
    transactions,
  });
}
