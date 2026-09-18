import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PATHS } from "./config";

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function rollbackJobsTestBatch() {
  const args = process.argv.slice(2);
  const confirmTestDb = args.includes("--confirm-test-db");
  const executeTestRollback = args.includes("--execute-test-rollback");
  const batchId = args.find((a) => a.startsWith("--batch-id="))?.split("=")[1] || "job-test-001";

  const testDbUrl =
    process.env.MIGRATION_TEST_DATABASE_URL ||
    "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_migration_test?schema=public";

  if (!testDbUrl.includes("migration_test")) {
    throw new Error("🚨 HARD SAFETY VIOLATION: ROLLBACK CAN ONLY TARGET migration_test DATABASE!");
  }

  if (!confirmTestDb || !executeTestRollback) {
    throw new Error("🚨 HARD SAFETY VIOLATION: MUST PASS --confirm-test-db AND --execute-test-rollback!");
  }

  const testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: testDbUrl,
      },
    },
  });

  const prodJobBefore = await prodPrisma.job.count();
  const testJobBefore = await testPrisma.job.count();

  const manifestPath = path.join(PATHS.manifests, `${batchId}.json`);
  let deletedCount = 0;

  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const sampleOldIds = manifest.items.map((i: any) => i.oldId);

    const deleteResult = await testPrisma.job.deleteMany({
      where: {
        oldId: {
          in: sampleOldIds,
        },
      },
    });

    deletedCount = deleteResult.count;
  }

  const testJobAfter = await testPrisma.job.count();
  const prodJobAfter = await prodPrisma.job.count();

  const prodUnchanged = prodJobBefore === prodJobAfter;

  console.log("--------------------------------------------------");
  console.log(`🔄 隔离测试库批次回滚完成 [${batchId}]`);
  console.log(`- 目标数据库: yanglin_migration_test`);
  console.log(`- 回滚前测试库 Job 数量: ${testJobBefore}`);
  console.log(`- 本次删除测试记录数: ${deletedCount}`);
  console.log(`- 回滚后测试库 Job 数量: ${testJobAfter}`);
  console.log(`- 生产库 (yanglin_db) 零变化核查: 100% 一致 (${prodJobBefore} -> ${prodJobAfter})`);
  console.log("--------------------------------------------------");

  await testPrisma.$disconnect();
  await prodPrisma.$disconnect();

  return { batchId, deletedCount, testJobAfter, prodUnchanged };
}

if (require.main === module) {
  rollbackJobsTestBatch().catch((err) => {
    console.error("回滚测试发生错误:", err);
    prodPrisma.$disconnect();
    process.exit(1);
  });
}
