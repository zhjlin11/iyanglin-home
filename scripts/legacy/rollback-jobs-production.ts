import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PATHS } from "./config";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function rollbackJobsProduction() {
  const args = process.argv.slice(2);
  const confirmProd = args.includes("--confirm-production");
  const approvedByOwner = args.includes("--approved-by-owner");
  const executeFlag = args.includes("--execute");
  const isPreview = args.includes("--preview");
  const batchId = args.find((a) => a.startsWith("--batch-id="))?.split("=")[1] || "job-prod-001-canary";

  if (!confirmProd) {
    throw new Error("🚨 HARD SAFETY VIOLATION: MUST PASS --confirm-production!");
  }

  const dbBefore = await prisma.job.count();

  let targetOldIds: string[] = [];
  if (batchId === "job-prod-001-canary") {
    targetOldIds = Array.from({ length: 5 }, (_, i) => `LEGACY_JOB_0723_${String(i + 1).padStart(3, "0")}`);
  } else if (batchId === "job-prod-001-main") {
    targetOldIds = Array.from({ length: 41 }, (_, i) => `LEGACY_JOB_0723_${String(i + 6).padStart(3, "0")}`);
  } else {
    targetOldIds = Array.from({ length: 46 }, (_, i) => `LEGACY_JOB_0723_${String(i + 1).padStart(3, "0")}`);
  }

  const matchingCount = await prisma.job.count({
    where: {
      oldId: {
        in: targetOldIds,
      },
    },
  });

  if (isPreview) {
    console.log("--------------------------------------------------");
    console.log(`🔍 [生产环境回滚预演] 批次 [${batchId}]`);
    console.log(`- 批次目标 oldId 集合总数: ${targetOldIds.length}`);
    console.log(`- 数据库中当前匹配可删除记录数: ${matchingCount}`);
    console.log(`- 回滚后预计生产 Job 记录数: ${dbBefore - matchingCount}`);
    console.log("--------------------------------------------------");
    await prisma.$disconnect();
    return { isPreview: true, matchingCount, expectedDbAfter: dbBefore - matchingCount };
  }

  if (!executeFlag || !approvedByOwner) {
    throw new Error("🚨 HARD SAFETY VIOLATION: REAL ROLLBACK REQUIRES --execute AND --approved-by-owner!");
  }

  console.log(`🔄 正在执行生产环境批次 [${batchId}] 回滚操作...`);

  const deleteResult = await prisma.job.deleteMany({
    where: {
      oldId: {
        in: targetOldIds,
      },
    },
  });

  const dbAfter = await prisma.job.count();

  // Log rollback in OperationLog
  await prisma.operationLog.create({
    data: {
      action: "MIGRATION_JOB_PROD_ROLLBACK",
      targetId: batchId,
      metadata: {
        batchId,
        deletedCount: deleteResult.count,
        dbBefore,
        dbAfter,
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log("--------------------------------------------------");
  console.log(`✅ 生产环境批次 [${batchId}] 回滚完成！`);
  console.log(`- 回滚前 Job 记录数: ${dbBefore}`);
  console.log(`- 本次安全删除记录数: ${deleteResult.count}`);
  console.log(`- 回滚后 Job 记录数: ${dbAfter}`);
  console.log("--------------------------------------------------");

  await prisma.$disconnect();
  return { isPreview: false, deletedCount: deleteResult.count, dbBefore, dbAfter };
}

if (require.main === module) {
  rollbackJobsProduction().catch((err) => {
    console.error("生产环境回滚出错:", err);
    prisma.$disconnect();
    process.exit(1);
  });
}
