import { PrismaClient } from "@prisma/client";
import { runDatingDryRun } from "./dry-run-dating";
import { backupDatingProdDb } from "./backup-dating-prod-db";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function importDatingProduction() {
  console.log("🚀 正在执行 第二阶段：Dating 相亲交友正式生产数据库 (yanglin_db) 迁移...\n");

  const startTime = Date.now();

  // 1. Perform pre-migration snapshot backup
  const backupResult = await backupDatingProdDb();
  const preMigrationCount = await prisma.datingProfile.count();

  // 2. Perform Dry Run to get normalized records
  const { normalizedList } = await runDatingDryRun();

  let insertedCount = 0;
  let skippedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  const batchManifest: Array<{ id: string; oldId: string; nickname: string }> = [];

  for (const item of normalizedList) {
    try {
      const existing = await prisma.datingProfile.findUnique({
        where: { oldId: item.oldId },
      });

      if (existing) {
        skippedCount++;
        duplicateCount++;
        continue;
      }

      const created = await prisma.datingProfile.create({
        data: {
          nickname: item.nickname,
          gender: item.gender,
          birthYear: item.birthYear,
          heightCm: item.heightCm,
          education: item.education,
          occupation: item.occupation,
          income: item.income,
          maritalStatus: item.maritalStatus,
          location: item.location,
          requirement: item.requirement,
          intro: item.intro,
          photos: item.photos,
          contact: item.contact,
          status: "APPROVED",
          oldId: item.oldId,
        },
      });

      insertedCount++;
      batchManifest.push({
        id: created.id,
        oldId: created.oldId!,
        nickname: created.nickname,
      });
    } catch (err) {
      errorCount++;
      console.error(`❌ 相亲嘉宾档案 ${item.oldId} 迁移失败:`, err);
    }
  }

  const durationMs = Date.now() - startTime;
  const postMigrationCount = await prisma.datingProfile.count();

  console.log("=== 第二阶段：正式生产迁移统计结果 ===");
  console.log(`- 迁移开始时间: ${new Date(startTime).toISOString()}`);
  console.log(`- 迁移结束时间: ${new Date().toISOString()}`);
  console.log(`- 全流程总耗时: ${durationMs} ms`);
  console.log(`- 生产成功新增条数: ${insertedCount}`);
  console.log(`- 生产跳过重复条数: ${skippedCount}`);
  console.log(`- 迁移失败条数: ${errorCount}`);
  console.log(`- 生产数据库迁移前 Count: ${preMigrationCount}`);
  console.log(`- 生产数据库迁移后 Count: ${postMigrationCount}`);
  console.log("--------------------------------------------------\n");

  await prisma.$disconnect();
  return {
    backupResult,
    preMigrationCount,
    postMigrationCount,
    insertedCount,
    skippedCount,
    duplicateCount,
    errorCount,
    durationMs,
    batchManifest,
  };
}

if (require.main === module) {
  importDatingProduction().catch(console.error);
}
