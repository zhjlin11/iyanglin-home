import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { parseJobsFromScript } from "./inspect-jobs";
import { normalizeJobRecord } from "./job-normalizer";
import { PATHS } from "./config";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function importJobsProduction() {
  const args = process.argv.slice(2);
  const confirmProd = args.includes("--confirm-production");
  const executeFlag = args.includes("--execute");
  const approvedByOwner = args.includes("--approved-by-owner");
  const batchIdArg = args.find((a) => a.startsWith("--batch-id="))?.split("=")[1] || "job-prod-001";
  const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const limit = limitArg ? parseInt(limitArg, 10) : undefined;

  console.log("🔒 [生产环境] 正在检查硬防护规则...");

  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl.includes("yanglin_db")) {
    throw new Error("🚨 HARD SAFETY VIOLATION: DATABASE_URL MUST TARGET yanglin_db!");
  }

  if (!confirmProd || !executeFlag || !approvedByOwner) {
    throw new Error("🚨 HARD SAFETY VIOLATION: MUST PASS --confirm-production, --execute, AND --approved-by-owner!");
  }

  // Record DB counts BEFORE
  const dbBefore = await prisma.job.count();

  // Parse raw 46 jobs
  const { jobs: rawJobs } = parseJobsFromScript();

  // Standardize 46 items with padded oldId
  const allJobs = rawJobs.map((raw, idx) => {
    const paddedIndex = String(idx + 1).padStart(3, "0");
    const norm = normalizeJobRecord(raw);
    return {
      ...norm,
      oldId: `LEGACY_JOB_0723_${paddedIndex}`,
      rawIndex: idx + 1,
    };
  });

  // Determine subset based on limit or batch type
  let targetJobs = allJobs;
  if (limit) {
    targetJobs = allJobs.slice(0, limit);
  } else if (batchIdArg.includes("canary")) {
    targetJobs = allJobs.slice(0, 5);
  } else if (batchIdArg.includes("main")) {
    targetJobs = allJobs.slice(5);
  }

  console.log(`🚀 开始处理生产环境批次 [${batchIdArg}]，目标条数: ${targetJobs.length} 条...`);

  let insertedCount = 0;
  let skippedCount = 0;
  const insertedOldIds: string[] = [];

  // Execute in transaction safety
  await prisma.$transaction(async (tx) => {
    for (const jobData of targetJobs) {
      const existing = await tx.job.findUnique({
        where: { oldId: jobData.oldId },
      });

      if (existing) {
        skippedCount++;
      } else {
        const created = await tx.job.create({
          data: {
            title: jobData.title,
            company: jobData.company,
            body: jobData.body,
            salary: jobData.salary,
            area: jobData.area,
            jobType: jobData.jobType,
            status: jobData.status,
            oldId: jobData.oldId,
          },
        });
        insertedCount++;
        insertedOldIds.push(created.oldId || "");
      }
    }

    // Write audit log to OperationLog
    if (insertedCount > 0) {
      await tx.operationLog.create({
        data: {
          action: "MIGRATION_JOB_PROD_IMPORT",
          targetId: batchIdArg,
          metadata: {
            batchId: batchIdArg,
            insertedCount,
            skippedCount,
            insertedOldIds,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }
  });

  // Record DB counts AFTER
  const dbAfter = await prisma.job.count();

  // Export execution report
  const reportPath = path.join(PATHS.reports, `${batchIdArg}-execution.json`);
  fs.mkdirSync(PATHS.reports, { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        batchId: batchIdArg,
        timestamp: new Date().toLocaleString("zh-CN"),
        dbBefore,
        dbAfter,
        insertedCount,
        skippedCount,
        insertedOldIds,
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log("--------------------------------------------------");
  console.log(`✅ 生产环境批次 [${batchIdArg}] 迁移成功！`);
  console.log(`- 迁移前 Job 记录数: ${dbBefore}`);
  console.log(`- 本次实际插入记录数: ${insertedCount}`);
  console.log(`- 本次跳过 (已存在) 记录数: ${skippedCount}`);
  console.log(`- 迁移后 Job 记录数: ${dbAfter}`);
  console.log(`- 执行报告已存至: ${reportPath}`);
  console.log("--------------------------------------------------");

  await prisma.$disconnect();
  return { batchId: batchIdArg, insertedCount, skippedCount, dbBefore, dbAfter };
}

if (require.main === module) {
  importJobsProduction().catch((err) => {
    console.error("生产环境迁移发生错误:", err);
    prisma.$disconnect();
    process.exit(1);
  });
}
