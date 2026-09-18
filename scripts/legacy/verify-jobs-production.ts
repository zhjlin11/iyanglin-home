import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function verifyJobsProduction() {
  console.log("🔍 正在核验生产环境 Job 招聘数据状态...");

  const totalCount = await prisma.job.count();
  const legacyCount = await prisma.job.count({
    where: {
      oldId: {
        startsWith: "LEGACY_JOB_",
      },
    },
  });

  const latestJobs = await prisma.job.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      company: true,
      area: true,
      salary: true,
      oldId: true,
      createdAt: true,
    },
  });

  console.log("--------------------------------------------------");
  console.log(`✅ 生产环境 Job 状态核验报告:`);
  console.log(`- 数据库 Job 总记录数: ${totalCount}`);
  console.log(`- 迁移导入的历史 Job 记录数: ${legacyCount}`);
  console.log(`- 最新 5 条岗位样例:`);
  latestJobs.forEach((j, i) => {
    console.log(`  [${i + 1}] ID=${j.id} | oldId=${j.oldId || "无"} | 岗位: ${j.title} | 公司: ${j.company} | 区域: ${j.area}`);
  });
  console.log("--------------------------------------------------");

  await prisma.$disconnect();
  return { totalCount, legacyCount, latestJobs };
}

if (require.main === module) {
  verifyJobsProduction().catch((err) => {
    console.error("核验发生错误:", err);
    prisma.$disconnect();
    process.exit(1);
  });
}
