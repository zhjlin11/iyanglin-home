import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || !session.id) {
    return NextResponse.json({ loggedIn: false, coins: 0, points: 0 });
  }

  const [wallet, pointAcc] = await Promise.all([
    prisma.coinWallet.findUnique({
      where: { userId: session.id },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: "desc" }
        }
      }
    }),
    prisma.pointAccount.findUnique({
      where: { userId: session.id },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: "desc" }
        }
      }
    })
  ]);

  return NextResponse.json({
    loggedIn: true,
    userId: session.id,
    coins: wallet?.balance || 0,
    totalRechargedCoins: wallet?.totalRecharged || 0,
    points: pointAcc?.balance || 0,
    totalEarnedPoints: pointAcc?.totalEarned || 0,
    coinTransactions: wallet?.transactions || [],
    pointTransactions: pointAcc?.transactions || []
  });
}
