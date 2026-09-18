import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function rollbackDatingProduction(batchOldIds: string[]) {
  console.log("⏪ 正在执行 生产环境 Dating 批次数据事务回滚...\n");

  const initialCount = await prisma.datingProfile.count();
  console.log(`- 回滚前生产 DatingProfile 记录总数: ${initialCount}`);

  const deleteResult = await prisma.datingProfile.deleteMany({
    where: {
      oldId: {
        in: batchOldIds,
      },
    },
  });

  const finalCount = await prisma.datingProfile.count();
  console.log(`- 成功清理的回滚记录数: ${deleteResult.count}`);
  console.log(`- 回滚后生产 DatingProfile 记录总数: ${finalCount}`);
  console.log("--------------------------------------------------\n");

  await prisma.$disconnect();
  return { deletedCount: deleteResult.count, finalCount };
}

if (require.main === module) {
  const sampleBatch = [
    "LEGACY_DATING_0723_001",
    "LEGACY_DATING_0723_002",
    "LEGACY_DATING_0723_003",
    "LEGACY_DATING_0723_004",
  ];
  rollbackDatingProduction(sampleBatch).catch(console.error);
}
