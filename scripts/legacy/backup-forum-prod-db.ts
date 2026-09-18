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

export async function backupForumProdDb() {
  console.log("🛡️ 正在执行 第一阶段：Forum 生产迁移前全量数据库备份...\n");

  const backupDir = "/var/backups/iyanglin/forum-migration";
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = Date.now();
  const backupFile = path.join(backupDir, `yanglin_db_before_forum_prod_001_${timestamp}.json`);

  const [users, jobs, houses, listings, shops, events, datingProfiles, posts, comments] = await Promise.all([
    prisma.user.findMany(),
    prisma.job.findMany(),
    prisma.house.findMany(),
    prisma.listing.findMany(),
    prisma.shop.findMany(),
    prisma.event.findMany(),
    prisma.datingProfile.findMany(),
    prisma.post.findMany(),
    prisma.postComment.findMany(),
  ]);

  const payload = {
    metadata: {
      timestamp: new Date().toISOString(),
      target: "yanglin_db",
      phase: "Phase 38 Forum Production Migration",
      counts: {
        users: users.length,
        jobs: jobs.length,
        houses: houses.length,
        listings: listings.length,
        shops: shops.length,
        events: events.length,
        datingProfiles: datingProfiles.length,
        posts: posts.length,
        comments: comments.length,
      },
    },
    users,
    jobs,
    houses,
    listings,
    shops,
    events,
    datingProfiles,
    posts,
    comments,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  fs.writeFileSync(backupFile, jsonStr, "utf-8");

  const stat = fs.statSync(backupFile);
  const hash = crypto.createHash("sha256").update(jsonStr).digest("hex");

  console.log("=== 生产数据库快照备份完毕 ===");
  console.log(`- 备份文件路径: ${backupFile}`);
  console.log(`- 文件大小: ${(stat.size / 1024).toFixed(2)} KB`);
  console.log(`- SHA-256 校验和: ${hash}`);
  console.log(`- 备份前 Post 记录数: ${posts.length}`);
  console.log(`- 备份前 PostComment 记录数: ${comments.length}`);
  console.log("--------------------------------------------------\n");

  await prisma.$disconnect();
  return { backupFile, stat, hash, initialPostCount: posts.length, initialCommentCount: comments.length };
}

if (require.main === module) {
  backupForumProdDb().catch(console.error);
}
