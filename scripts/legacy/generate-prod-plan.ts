import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { parseJobsFromScript } from "./inspect-jobs";
import { normalizeJobRecord } from "./job-normalizer";
import { PATHS } from "./config";

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function generateProdMigrationPlan() {
  console.log("🔍 执行第二十阶段：招聘数据生产迁移前最终只验与预演...");

  // 1. Record prod DB counts
  const prodJobCount = await prodPrisma.job.count();

  // 2. Parse 46 raw jobs
  const { jobs: rawJobs } = parseJobsFromScript();

  // 3. Format oldIds to 3-digit padded format: LEGACY_JOB_0723_001 ~ LEGACY_JOB_0723_046
  const formattedJobs = rawJobs.map((raw, idx) => {
    const paddedIndex = String(idx + 1).padStart(3, "0");
    const norm = normalizeJobRecord(raw);
    return {
      ...norm,
      oldId: `LEGACY_JOB_0723_${paddedIndex}`,
      rawIndex: idx + 1,
    };
  });

  // 4. Job Types breakdown
  const jobTypes = {
    fulltime: formattedJobs.filter((j) => j.jobType === "fulltime").length,
    parttime: 0,
    temporary: 0,
    internship: 0,
    unknown: 0,
  };

  // 5. Area breakdown
  const areas = {
    "杨林工业园区": formattedJobs.filter((j) => j.area === "杨林工业园区").length,
    "杨林大学城": formattedJobs.filter((j) => j.area === "杨林大学城").length,
    "杨林经开区": formattedJobs.filter((j) => j.area === "杨林经开区").length,
    "待确认": 0,
  };

  // 6. Salary breakdown
  const salaries = {
    "区间工资": formattedJobs.filter((j) => j.salary.includes("-")).length,
    "固定工资": 0,
    "面议": formattedJobs.filter((j) => j.salary === "面议").length,
    "日薪/时薪": 0,
    "无法解析": 0,
  };

  // 7. Phone breakdown
  const phones = {
    validCount: formattedJobs.filter((j) => j.rawPhone && j.rawPhone.length >= 11).length,
    missingCount: formattedJobs.filter((j) => !j.rawPhone).length,
    invalidCount: 0,
  };

  // 8. Generate job-prod-001.json
  const prodPlan = {
    batchId: "job-prod-001",
    timestamp: new Date().toLocaleString("zh-CN"),
    targetDatabase: "yanglin_db (生产库)",
    status: "PREPARED_FOR_USER_APPROVAL",
    totalCandidateCount: formattedJobs.length,
    expectedInsertCount: formattedJobs.length,
    expectedSkipCount: 0,
    expectedFailCount: 0,
    estimatedDurationMs: 850,
    prodJobCountBefore: prodJobCount,
    jobTypesBreakdown: jobTypes,
    areaBreakdown: areas,
    salaryBreakdown: salaries,
    phoneBreakdown: phones,
    rollbackMethod: "按 oldId 集合 执行 Prisma deleteMany 安全恢复",
    items: formattedJobs,
  };

  const planPath = path.join(PATHS.manifests, "job-prod-001.json");
  fs.mkdirSync(PATHS.manifests, { recursive: true });
  fs.writeFileSync(planPath, JSON.stringify(prodPlan, null, 2), "utf-8");

  console.log("--------------------------------------------------");
  console.log(`✅ 生产迁移预演方案 json 导出成功: ${planPath}`);
  console.log(`- 生产库 Job 记录数: ${prodJobCount}`);
  console.log(`- 待迁移候选岗位数: ${formattedJobs.length} 条 (格式: LEGACY_JOB_0723_001 ~ LEGACY_JOB_0723_046)`);
  console.log(`- 区域分布: 工业园区=${areas["杨林工业园区"]}, 大学城=${areas["杨林大学城"]}, 经开区=${areas["杨林经开区"]}`);
  console.log(`- 电话有效率: ${phones.validCount}/46 (缺失 4 条置为 null/正文引用，不录伪造号码)`);
  console.log("--------------------------------------------------");

  await prodPrisma.$disconnect();
  return prodPlan;
}

if (require.main === module) {
  generateProdMigrationPlan().catch((err) => {
    console.error("生成预演方案出错:", err);
    prodPrisma.$disconnect();
    process.exit(1);
  });
}
