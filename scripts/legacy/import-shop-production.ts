import { PrismaClient } from "@prisma/client";
import { runShopDryRun } from "./dry-run-shop";
import { backupShopProdDb } from "./backup-shop-prod-db";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function importShopProduction() {
  console.log("🚀 正在执行 第二阶段：Shop 商家黄页正式生产数据库 (yanglin_db) 迁移...\n");

  const startTime = Date.now();

  // 1. Perform pre-migration snapshot backup
  const backupResult = await backupShopProdDb();
  const preMigrationCount = await prisma.shop.count();

  // 2. Perform Dry Run to get normalized records
  const { normalizedList } = await runShopDryRun();

  let insertedCount = 0;
  let skippedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  const batchManifest: Array<{ id: string; oldId: string; name: string }> = [];

  for (const item of normalizedList) {
    try {
      const existing = await prisma.shop.findUnique({
        where: { oldId: item.oldId },
      });

      if (existing) {
        skippedCount++;
        duplicateCount++;
        continue;
      }

      const created = await prisma.shop.create({
        data: {
          name: item.name,
          category: item.category,
          address: item.address,
          phone: item.phone,
          hours: item.hours,
          intro: item.intro,
          logo: item.logo,
          images: item.images,
          status: "APPROVED",
          isFeatured: item.isFeatured,
          oldId: item.oldId,
        },
      });

      insertedCount++;
      batchManifest.push({
        id: created.id,
        oldId: created.oldId!,
        name: created.name,
      });
    } catch (err) {
      errorCount++;
      console.error(`❌ 商家 ${item.oldId} 迁移失败:`, err);
    }
  }

  const durationMs = Date.now() - startTime;
  const postMigrationCount = await prisma.shop.count();

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
  importShopProduction().catch(console.error);
}
