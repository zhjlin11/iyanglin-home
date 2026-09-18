import { syncAllWechatFollowers } from "../../src/lib/wechat-service";
import { prisma } from "../../src/lib/prisma";

async function main() {
  const result = await syncAllWechatFollowers();
  console.log(JSON.stringify({
    success: true,
    totalFollowers: result.totalFollowers,
    currentFollowers: result.currentFollowers,
    linkedFollowers: result.linkedFollowers,
    unlinkedFollowers: result.unlinkedFollowers,
    notFollowingUsers: result.notFollowingUsers,
    totalRecords: result.totalRecords,
  }));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "微信关注状态同步失败");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
