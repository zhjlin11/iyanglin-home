import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function backupProdDatabase() {
  const backupDir = path.resolve("/var/backups/iyanglin/job-migration");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filename = `yanglin_db_before_job_prod_001_${Date.now()}.json`;
  const backupPath = path.join(backupDir, filename);

  console.log(`📦 正在向 ${backupPath} 备份生产数据库...`);

  const snapshot = {
    timestamp: new Date().toISOString(),
    database: "yanglin_db",
    tables: {
      users: await prisma.user.findMany(),
      jobs: await prisma.job.findMany(),
      listings: await prisma.listing.findMany(),
      houses: await prisma.house.findMany(),
      shops: await prisma.shop.findMany(),
      events: await prisma.event.findMany(),
      billingOrders: await prisma.billingOrder.findMany(),
    },
  };

  const jsonStr = JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(backupPath, jsonStr, "utf-8");

  const stat = fs.statSync(backupPath);
  const sha256 = crypto.createHash("sha256").update(fs.readFileSync(backupPath)).digest("hex");

  console.log("--------------------------------------------------");
  console.log("✅ 生产数据库备份成功！");
  console.log(`- 备份文件路径: ${backupPath}`);
  console.log(`- 备份文件大小: ${(stat.size / 1024).toFixed(2)} KB`);
  console.log(`- 备份 SHA-256: ${sha256}`);
  console.log("--------------------------------------------------");

  await prisma.$disconnect();
  return { backupPath, sizeBytes: stat.size, sha256 };
}

if (require.main === module) {
  backupProdDatabase().catch((err) => {
    console.error("备份数据库失败:", err);
    prisma.$disconnect();
    process.exit(1);
  });
}
