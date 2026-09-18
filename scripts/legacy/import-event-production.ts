import { PrismaClient } from "@prisma/client";
import { runEventDryRun } from "./dry-run-event";
import { backupEventProdDb } from "./backup-event-prod-db";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function importEventProduction() {
  console.log("🚀 正在执行 第二阶段：Event 同城活动正式生产数据库 (yanglin_db) 迁移...\n");

  const startTime = Date.now();

  // 1. Perform pre-migration snapshot backup
  const backupResult = await backupEventProdDb();
  const preMigrationCount = await prisma.event.count();

  // 2. Perform Dry Run to get normalized records
  const { normalizedList } = await runEventDryRun();

  let insertedCount = 0;
  let skippedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  const batchManifest: Array<{ id: string; oldId: string; title: string }> = [];

  for (const item of normalizedList) {
    try {
      const existing = await prisma.event.findUnique({
        where: { oldId: item.oldId },
      });

      if (existing) {
        skippedCount++;
        duplicateCount++;
        continue;
      }

      const created = await prisma.event.create({
        data: {
          title: item.title,
          category: item.category,
          eventTime: item.eventTime,
          location: item.location,
          fee: item.fee,
          quota: item.quota,
          contact: item.contact,
          intro: item.intro,
          images: item.images,
          status: "APPROVED",
          oldId: item.oldId,
        },
      });

      insertedCount++;
      batchManifest.push({
        id: created.id,
        oldId: created.oldId!,
        title: created.title,
      });
    } catch (err) {
      errorCount++;
      console.error(`❌ 同城活动 ${item.oldId} 迁移失败:`, err);
    }
  }

  const durationMs = Date.now() - startTime;
  const postMigrationCount = await prisma.event.count();

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
  importEventProduction().catch(console.error);
}
