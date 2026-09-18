import { PrismaClient } from "@prisma/client";
import { parseJobsFromScript } from "./inspect-jobs";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function fixProdJobsContact() {
  console.log("🔧 正在修复生产数据库 55 条历史岗位的真实联系电话字段...");

  const { jobs: rawJobs } = parseJobsFromScript();

  let updatedCount = 0;
  let skippedCount = 0;

  for (let idx = 0; idx < rawJobs.length; idx++) {
    const raw = rawJobs[idx];
    const oldId = `LEGACY_JOB_0723_${String(idx + 1).padStart(3, "0")}`;
    const rawPhone = raw.phone ? raw.phone.trim() : "";

    const existing = await prisma.job.findUnique({
      where: { oldId },
    });

    if (!existing) {
      skippedCount++;
      continue;
    }

    let cleanDesc = raw.description || "";
    cleanDesc = cleanDesc
      .replace(/【联系电话】[：:]\s*(暂无电话|无|未提供)?/g, "")
      .replace(/1[3-9]\d{9}/g, "")
      .trim();

    let newBody = `【岗位】${raw.jobTitle}\n【公司】${raw.companyName}`;
    if (rawPhone && rawPhone.length >= 11) {
      newBody += `\n【联系方式】${rawPhone}`;
    }
    newBody += `\n\n【描述】\n${cleanDesc}`;

    await prisma.job.update({
      where: { oldId },
      data: {
        body: newBody,
      },
    });

    updatedCount++;
  }

  console.log("--------------------------------------------------");
  console.log(`✅ 生产数据库历史岗位电话修复完成！`);
  console.log(`- 成功更新岗位记录数: ${updatedCount}`);
  console.log(`- 跳过/未找到记录数: ${skippedCount}`);
  console.log("--------------------------------------------------");

  await prisma.$disconnect();
  return { updatedCount, skippedCount };
}

if (require.main === module) {
  fixProdJobsContact().catch((err) => {
    console.error("修复失败:", err);
    prisma.$disconnect();
    process.exit(1);
  });
}
