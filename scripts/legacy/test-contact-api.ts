import { PrismaClient } from "@prisma/client";
import { parseJobBody } from "../../src/lib/job-parser";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

async function main() {
  const jobs = await prisma.job.findMany({
    select: { id: true, title: true, oldId: true, body: true },
  });

  console.log("=== PRODUCTION JOBS PHONE AUDIT ===");
  let withPhone = 0;
  let withoutPhone = 0;

  jobs.forEach((j) => {
    const parsed = parseJobBody(j.body);
    let rawPhone = parsed.contact || "";
    if (!rawPhone) {
      const match = j.body.match(/1[3-9]\d{9}/);
      if (match) rawPhone = match[0];
    }

    if (rawPhone) {
      withPhone++;
      const masked = rawPhone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
      console.log(`[PHONE OK] ID=${j.id} | oldId=${j.oldId} | 标题=${j.title} | 手机=${masked}`);
    } else {
      withoutPhone++;
      console.log(`[NO PHONE] ID=${j.id} | oldId=${j.oldId} | 标题=${j.title}`);
    }
  });

  console.log("--------------------------------------------------");
  console.log(`总岗位数: ${jobs.length}`);
  console.log(`包含有效手机号数: ${withPhone}`);
  console.log(`未包含手机号数: ${withoutPhone}`);
  console.log("--------------------------------------------------");

  await prisma.$disconnect();
}

main().catch(console.error);
