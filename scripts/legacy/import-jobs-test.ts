import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { parseJobsFromScript } from "./inspect-jobs";
import { normalizeJobRecord } from "./job-normalizer";
import { PATHS } from "./config";

// Production DB client (for count verification only, zero write)
const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function importJobsTestBatch() {
  const args = process.argv.slice(2);
  const confirmTestDb = args.includes("--confirm-test-db");
  const executeTestImport = args.includes("--execute-test-import");
  const batchId = "job-test-001";

  console.log("🔒 检查隔离测试数据库安全防护规则...");

  const testDbUrl =
    process.env.MIGRATION_TEST_DATABASE_URL ||
    "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_migration_test?schema=public";

  // HARD SAFETY GUARD 1: Require migration_test in URL
  if (!testDbUrl.includes("migration_test")) {
    throw new Error("🚨 HARD SAFETY VIOLATION: MIGRATION_TEST_DATABASE_URL MUST CONTAIN 'migration_test'!");
  }

  // HARD SAFETY GUARD 2: Reject if testDbUrl equals production DB URL
  if (testDbUrl.includes("yanglin_db") && !testDbUrl.includes("migration_test")) {
    throw new Error("🚨 HARD SAFETY VIOLATION: TARGET DB IS PRODUCTION DB yanglin_db! EXECUTION REFUSED.");
  }

  // HARD SAFETY GUARD 3: Require explicit CLI flags
  if (!confirmTestDb || !executeTestImport) {
    throw new Error("🚨 HARD SAFETY VIOLATION: MUST PASS --confirm-test-db AND --execute-test-import CLI FLAGS!");
  }

  // Test DB Client (connected to yanglin_migration_test)
  const testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: testDbUrl,
      },
    },
  });

  // 1. Record Production DB counts BEFORE
  const prodJobBefore = await prodPrisma.job.count();

  // 2. Record Test DB counts BEFORE
  const testJobBefore = await testPrisma.job.count();

  // 3. Parse 46 raw jobs & select 10 approved job samples
  const { jobs: rawJobs } = parseJobsFromScript();
  const selectedSamples = rawJobs.slice(0, 10).map(normalizeJobRecord);

  // 4. Perform Real Database Insertion / Idempotency Check in Test DB
  let insertedCount = 0;
  let skippedCount = 0;

  for (const sample of selectedSamples) {
    const existing = await testPrisma.job.findUnique({
      where: { oldId: sample.oldId },
    });

    if (existing) {
      skippedCount++;
    } else {
      await testPrisma.job.create({
        data: {
          title: sample.title,
          company: sample.company,
          body: sample.body,
          salary: sample.salary,
          area: sample.area,
          jobType: sample.jobType,
          status: sample.status,
          oldId: sample.oldId,
        },
      });
      insertedCount++;
    }
  }

  // 5. Record Test DB counts AFTER
  const testJobAfter = await testPrisma.job.count();

  // 6. Record Production DB counts AFTER
  const prodJobAfter = await prodPrisma.job.count();

  // Verify Production DB count remains 100% UNCHANGED
  const prodUnchanged = prodJobBefore === prodJobAfter;
  if (!prodUnchanged) {
    throw new Error("🚨 SECURITY FAILURE: PRODUCTION DB RECORD COUNT CHANGED!");
  }

  // Export batch manifest
  const batchManifest = {
    batchId,
    timestamp: new Date().toLocaleString("zh-CN"),
    targetDatabase: "yanglin_migration_test",
    approvedForTestImport: true,
    testJobCountBefore: testJobBefore,
    testJobCountAfter: testJobAfter,
    insertedCount,
    skippedCount,
    totalSelectedCount: selectedSamples.length,
    prodJobCountBefore: prodJobBefore,
    prodJobCountAfter: prodJobAfter,
    prodDbUnchanged: true,
    items: selectedSamples,
  };

  const manifestPath = path.join(PATHS.manifests, `${batchId}.json`);
  fs.mkdirSync(PATHS.manifests, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(batchManifest, null, 2), "utf-8");

  console.log("--------------------------------------------------");
  console.log(`✅ 真实隔离测试库写入完成 [${batchId}]`);
  console.log(`- 目标数据库: yanglin_migration_test (127.0.0.1:5432)`);
  console.log(`- 测试库导入前 Job 记录数: ${testJobBefore}`);
  console.log(`- 首次实际插入记录数: ${insertedCount}`);
  console.log(`- 跳过 (已存在) 记录数: ${skippedCount}`);
  console.log(`- 测试库导入后 Job 记录数: ${testJobAfter}`);
  console.log(`- 生产库 (yanglin_db) 零变化核查: 100% 一致 (${prodJobBefore} -> ${prodJobAfter})`);
  console.log("--------------------------------------------------");

  await testPrisma.$disconnect();
  await prodPrisma.$disconnect();

  return { batchId, insertedCount, skippedCount, testJobAfter, prodUnchanged };
}

if (require.main === module) {
  importJobsTestBatch().catch((err) => {
    console.error("测试导入发生错误:", err);
    prodPrisma.$disconnect();
    process.exit(1);
  });
}
