import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CHECKIN_POINTS = 5;

export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session || session.id === "env-admin") {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // Upsert point account
  let account = await prisma.pointAccount.findUnique({
    where: { userId: session.id },
  });

  if (!account) {
    account = await prisma.pointAccount.create({
      data: { userId: session.id },
    });
  }

  // Check if already checked in today
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (account.lastCheckin && new Date(account.lastCheckin) >= todayStart) {
    return NextResponse.json({ error: "今日已签到，明天再来哦！" }, { status: 400 });
  }

  // Calculate consecutive days bonus
  let bonus = 0;
  let bonusRemark = "";
  if (account.lastCheckin) {
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    if (new Date(account.lastCheckin) >= yesterdayStart) {
      // Consecutive day — count streak
      const recentCheckins = await prisma.pointTransaction.count({
        where: {
          accountId: account.id,
          type: "CHECKIN",
          createdAt: { gte: new Date(todayStart.getTime() - 7 * 86400000) },
        },
      });
      if (recentCheckins >= 6) {
        bonus = 10;
        bonusRemark = "（连续签到7天额外奖励+10）";
      } else if (recentCheckins >= 2) {
        bonus = 2;
        bonusRemark = `（连续签到${recentCheckins + 1}天额外奖励+2）`;
      }
    }
  }

  const totalAmount = CHECKIN_POINTS + bonus;

  // Update account and create transaction in one go
  const [updatedAccount] = await prisma.$transaction([
    prisma.pointAccount.update({
      where: { id: account.id },
      data: {
        balance: { increment: totalAmount },
        totalEarned: { increment: totalAmount },
        lastCheckin: now,
      },
    }),
    prisma.pointTransaction.create({
      data: {
        accountId: account.id,
        amount: totalAmount,
        type: "CHECKIN",
        remark: `每日签到 +${CHECKIN_POINTS}${bonusRemark}`,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    earned: totalAmount,
    balance: updatedAccount.balance,
    message: `签到成功！获得 ${totalAmount} 积分${bonusRemark}`,
  });
}
