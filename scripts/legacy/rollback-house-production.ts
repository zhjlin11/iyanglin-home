import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function rollbackHouseProduction(batchOldIds: string[]) {
  console.log("⏪ 正在执行 生产环境 House 批次数据事务回滚...\n");

  const initialCount = await prisma.house.count();
  console.log(`- 回滚前生产 House 记录总数: ${initialCount}`);

  const deleteResult = await prisma.house.deleteMany({
    where: {
      oldId: {
        in: batchOldIds,
      },
    },
  });

  const finalCount = await prisma.house.count();
  console.log(`- 成功清理的回滚记录数: ${deleteResult.count}`);
  console.log(`- 回滚后生产 House 记录总数: ${finalCount}`);
  console.log("--------------------------------------------------\n");

  await prisma.$disconnect();
  return { deletedCount: deleteResult.count, finalCount };
}

if (require.main === module) {
  const sampleBatch = [
    "LEGACY_HOUSE_0723_001",
    "LEGACY_HOUSE_0723_002",
    "LEGACY_HOUSE_0723_003",
    "LEGACY_HOUSE_0723_004",
  ];
  rollbackHouseProduction(sampleBatch).catch(console.error);
}
