import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function rollbackForumProduction(batchOldIds: string[]) {
  console.log("⏪ 正在执行 生产环境 Forum 批次数据事务回滚...\n");

  const initialCount = await prisma.post.count();
  console.log(`- 回滚前生产 Post 记录总数: ${initialCount}`);

  // 1. Delete associated comments first
  const postsToDelete = await prisma.post.findMany({
    where: { oldId: { in: batchOldIds } },
    select: { id: true },
  });

  const postIds = postsToDelete.map((p) => p.id);
  if (postIds.length > 0) {
    await prisma.postComment.deleteMany({
      where: { postId: { in: postIds } },
    });
  }

  // 2. Delete posts
  const deleteResult = await prisma.post.deleteMany({
    where: {
      oldId: {
        in: batchOldIds,
      },
    },
  });

  const finalCount = await prisma.post.count();
  console.log(`- 成功清理的回滚帖子记录数: ${deleteResult.count}`);
  console.log(`- 回滚后生产 Post 记录总数: ${finalCount}`);
  console.log("--------------------------------------------------\n");

  await prisma.$disconnect();
  return { deletedCount: deleteResult.count, finalCount };
}

if (require.main === module) {
  const sampleBatch = [
    "LEGACY_FORUM_0723_001",
    "LEGACY_FORUM_0723_002",
    "LEGACY_FORUM_0723_003",
    "LEGACY_FORUM_0723_004",
  ];
  rollbackForumProduction(sampleBatch).catch(console.error);
}
