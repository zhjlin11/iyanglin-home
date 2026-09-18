import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function backupHouseProdDb() {
  console.log("🛡️ 正在执行 第一部分：House 生产迁移前全量数据库备份...\n");

  const backupDir = "/var/backups/iyanglin/house-migration";
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = Date.now();
  const backupFile = path.join(backupDir, `yanglin_db_before_house_prod_001_${timestamp}.json`);

  const [users, jobs, houses, listings, shops, events] = await Promise.all([
    prisma.user.findMany(),
    prisma.job.findMany(),
    prisma.house.findMany(),
    prisma.listing.findMany(),
    prisma.shop.findMany(),
    prisma.event.findMany(),
  ]);

  const payload = {
    metadata: {
      timestamp: new Date().toISOString(),
      target: "yanglin_db",
      phase: "Phase 28 House Production Migration",
      counts: {
        users: users.length,
        jobs: jobs.length,
        houses: houses.length,
        listings: listings.length,
        shops: shops.length,
        events: events.length,
      },
    },
    users,
    jobs,
    houses,
    listings,
    shops,
    events,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  fs.writeFileSync(backupFile, jsonStr, "utf-8");

  const stat = fs.statSync(backupFile);
  const hash = crypto.createHash("sha256").update(jsonStr).digest("hex");

  console.log("=== 生产数据库快照备份完毕 ===");
  console.log(`- 备份文件路径: ${backupFile}`);
  console.log(`- 文件大小: ${(stat.size / 1024).toFixed(2)} KB`);
  console.log(`- SHA-256 校验和: ${hash}`);
  console.log(`- 备份前 House 记录数: ${houses.length}`);
  console.log("--------------------------------------------------\n");

  await prisma.$disconnect();
  return { backupFile, stat, hash, initialHouseCount: houses.length };
}

if (require.main === module) {
  backupHouseProdDb().catch(console.error);
}
