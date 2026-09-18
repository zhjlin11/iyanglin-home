import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function rollbackListingProduction(batchOldIds: string[]) {
  console.log("⏪ 正在执行 生产环境 Listing 批次数据事务回滚...\n");

  const initialCount = await prisma.listing.count();
  console.log(`- 回滚前生产 Listing 记录总数: ${initialCount}`);

  const deleteResult = await prisma.listing.deleteMany({
    where: {
      oldId: {
        in: batchOldIds,
      },
    },
  });

  const finalCount = await prisma.listing.count();
  console.log(`- 成功清理的回滚记录数: ${deleteResult.count}`);
  console.log(`- 回滚后生产 Listing 记录总数: ${finalCount}`);
  console.log("--------------------------------------------------\n");

  await prisma.$disconnect();
  return { deletedCount: deleteResult.count, finalCount };
}

if (require.main === module) {
  const sampleBatch = [
    "LEGACY_LISTING_0723_001",
    "LEGACY_LISTING_0723_002",
    "LEGACY_LISTING_0723_003",
    "LEGACY_LISTING_0723_004",
  ];
  rollbackListingProduction(sampleBatch).catch(console.error);
}
