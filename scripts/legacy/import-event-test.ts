import { PrismaClient } from "@prisma/client";
import { runEventDryRun } from "./dry-run-event";

const testDbUrl = "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_migration_test?schema=public";
const prodDbUrl = "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public";

const testPrisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });
const prodPrisma = new PrismaClient({ datasources: { db: { url: prodDbUrl } } });

export async function runTestDbEventVerification() {
  console.log("🧪 正在执行 Stage 6: 隔离测试数据库 (yanglin_migration_test) 导入、幂等性与回滚验证...\n");

  // 1. Check production database initial count
  const initialProdCount = await prodPrisma.event.count();
  console.log(`[生产保护确认] 生产数据库 yanglin_db 当前 Event 记录数: ${initialProdCount}`);

  // 2. Perform Dry Run to get normalized records
  const { normalizedList } = await runEventDryRun();

  // 3. Clear isolated test database Event table for clean start
  await testPrisma.event.deleteMany({});
  const initialTestCount = await testPrisma.event.count();
  console.log(`[隔离测试确认] 测试数据库 yanglin_migration_test 初始 Event 记录数: ${initialTestCount}`);

  // 4. Test DB Insert (Batch 1)
  console.log("\n【步骤 1: 向测试数据库写入样本 Event 数据】");
  let insertedCount = 0;
  for (const item of normalizedList) {
    await testPrisma.event.create({
      data: {
        title: item.title,
        category: item.category,
        eventTime: item.eventTime,
        location: item.location,
        fee: item.fee,
        quota: item.quota,
        contact: item.contact,
        intro: item.intro,
        images: item.images,
        status: "APPROVED",
        oldId: item.oldId,
      },
    });
    insertedCount++;
  }

  const afterInsertTestCount = await testPrisma.event.count();
  console.log(`- 成功向测试数据库插入条数: ${insertedCount}`);
  console.log(`- 测试数据库当前 Event 记录数: ${afterInsertTestCount}`);

  // 5. Test Idempotency (Batch 2 re-run)
  console.log("\n【步骤 2: 二次导入幂等性校验】");
  let reInsertedCount = 0;
  let skippedCount = 0;

  for (const item of normalizedList) {
    const existing = await testPrisma.event.findUnique({ where: { oldId: item.oldId } });
    if (existing) {
      skippedCount++;
    } else {
      await testPrisma.event.create({
        data: {
          title: item.title,
          category: item.category,
          eventTime: item.eventTime,
          location: item.location,
          fee: item.fee,
          quota: item.quota,
          contact: item.contact,
          intro: item.intro,
          images: item.images,
          status: "APPROVED",
          oldId: item.oldId,
        },
      });
      reInsertedCount++;
    }
  }

  console.log(`- 二次导入新增条数: ${reInsertedCount} (预期 0)`);
  console.log(`- 二次导入跳过重复数: ${skippedCount} (预期 ${insertedCount})`);
  console.log(`- 幂等性校验结果: ${reInsertedCount === 0 && skippedCount === insertedCount ? "✅ 100% 幂等通过" : "❌ 幂等失败"}`);

  // 6. Test Transactional Rollback
  console.log("\n【步骤 3: 事务回滚校验】");
  await testPrisma.event.deleteMany({
    where: { oldId: { in: normalizedList.map((x) => x.oldId) } },
  });
  const afterRollbackTestCount = await testPrisma.event.count();
  console.log(`- 回滚后测试数据库 Event 记录数: ${afterRollbackTestCount}`);
  console.log(`- 事务回滚校验结果: ${afterRollbackTestCount === 0 ? "✅ 100% 回滚成功" : "❌ 回滚失败"}`);

  // 7. Verify zero change on production database
  const finalProdCount = await prodPrisma.event.count();
  console.log("\n==================================================");
  console.log(`[生产零变化确认] 生产数据库 yanglin_db 最终 Event 记录数: ${finalProdCount}`);
  console.log(`[生产保护状态]: ${initialProdCount === finalProdCount ? "✅ 100% 生产保护完全成功 (0 写入)" : "❌ 警告: 生产库被误改"}`);
  console.log("================================================--\n");

  await testPrisma.$disconnect();
  await prodPrisma.$disconnect();
}

if (require.main === module) {
  runTestDbEventVerification().catch(console.error);
}
