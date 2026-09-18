import { PrismaClient } from "@prisma/client";
import { parseJobBody } from "../../src/lib/job-parser";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

async function verifyNoPhoneAndDbStorage() {
  console.log("🔍 正在校验数据库存储格式与无号码岗位表现...");

  // 1. Check a job with phone number (e.g. LEGACY_JOB_0723_002)
  const jobWithPhone = await prisma.job.findFirst({
    where: { oldId: "LEGACY_JOB_0723_002" },
  });

  const parsedWithPhone = parseJobBody(jobWithPhone?.body || "");

  console.log("--------------------------------------------------");
  console.log("【1. 有号码岗位数据库存储检查】");
  console.log(`- 岗位 ID: ${jobWithPhone?.id}`);
  console.log(`- 岗位 title: ${jobWithPhone?.title}`);
  console.log(`- DB body 中导出的原始号码: ${parsedWithPhone.contact}`);
  console.log(`- 数据库存的是否为完整 11 位真实手机号: ${parsedWithPhone.contact === "18006778483" ? "✅ 是 (18006778483)" : "❌ 否"}`);
  console.log(`- DB body 是否包含中段带星号的脱敏假号码: ${jobWithPhone?.body.includes("180****8483") ? "❌ 是" : "✅ 否 (无星号假号码)"}`);
  console.log(`- DB body 是否包含“暂无电话”垃圾伪造数据: ${jobWithPhone?.body.includes("暂无电话") ? "❌ 是" : "✅ 否"}`);

  // 2. Check a job without phone number (e.g. LEGACY_JOB_0723_021)
  const jobNoPhone = await prisma.job.findFirst({
    where: { oldId: "LEGACY_JOB_0723_021" },
  });

  const parsedNoPhone = parseJobBody(jobNoPhone?.body || "");

  console.log("--------------------------------------------------");
  console.log("【2. 无号码岗位数据库存储检查】");
  console.log(`- 无号码岗位 ID: ${jobNoPhone?.id}`);
  console.log(`- 岗位 title: ${jobNoPhone?.title}`);
  console.log(`- DB body 解析联系方式结果: ${parsedNoPhone.contact || "null / undefined"}`);
  console.log(`- DB body 是否包含“【联系电话】：暂无电话”硬编码伪造文本: ${jobNoPhone?.body.includes("暂无电话") ? "❌ 包含" : "✅ 干净 (不包含)"}`);
  console.log("--------------------------------------------------");

  await prisma.$disconnect();
}

verifyNoPhoneAndDbStorage().catch(console.error);
