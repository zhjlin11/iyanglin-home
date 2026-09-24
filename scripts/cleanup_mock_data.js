const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BACKUP_FILE = path.join(__dirname, "../scratch/backup_deleted_mock_data_20260922.json");

// IDs to delete
const JOB_IDS = [
  "cmu6l2pj40002xw5ph6d65dsj", // 销售 (杰腾科技) 13123456789
  "cmu6l3dww0005xw5pymb8thjf", // 人事 (杰腾科技) 13123456789
  "cmu6q06bj000sxwha00xruyiz", // 首发测试-数控车床师傅 13888881111
  "cmu6q0fg8000vxwhafglwjxxl", // 第2条自费职位-高级机械质检员 13888882222
  "cmu6qbr9q0006xwzibkw9nbel", // 首发测试-数控车床师傅 13888881111
  "cmu6qgrd5000rxwzi5qhnnguu", // 第2条自费职位-高级机械质检员 13888882222
];

const HOUSE_IDS = [
  "cmsb8o1jw003svkncns4yg35u", // 出租商铺78㎡ 13412345678
  "cmsb8oao900bjvknckrhwilbs", // 山水花园 010-12345678
];

const LISTING_IDS = [
  "cmtcjq1gb0000xweh0mfzt3sz", // 二手笔记本 13123456789
  "cmtcksenk0001xwebmkri4a0y", // 二手手机 13123456789
  "cmtcksepj000mxwebc8ql2w0x", // 二手显卡 13123456789
  "cmtckseqn000vxwebmaizxxh1", // 机械键盘 13123456789
  "cmtcksepr000nxweb6xu69skt", // 二手显卡 13123456789
  "cmtcksf3m0050xwebxjxj2kx8", // 邀月网咖 010-81234567
  "cmu9jkqqw000axwv50jq0fbze", // 监控安装 13123456789
  "cms6c3kbo04iovkc0arwsgl6x", // 二手手机 13123456789
  "cms6c3k6d04d9vkc0uen3db4o", // 邀月网咖 010-81234567
  "cms6c3kbn04i2vkc0dtyyz5sc", // 二手显卡 13123456789
  "cms6c3kbn04i3vkc0do690oy9", // 二手显卡 13123456789
  "cms6c3kbn04huvkc0w3jwa6ja", // 机械键盘 13123456789
];

const DATING_IDS = [
  "cmsb899zg00avvk54w8x3lhll", // 危险人物 13800000000
  "cmsb89a2m00axvk54g9f0gxk4", // Anne 13800000000
  "cmsb89a4r00azvk54m86pm1a0", // Kuer 13100000000
  "cmsb89a6v00b1vk5439h9ootd", // Aimee Yang
  "cmsb89a9200b3vk54w5nzbvgv", // 爱神 8426479121
  "cmsb89ab700b5vk54d2hfcq7g", // Amiy 56421347986
  "cmsb89aiq00b9vk54gfol2s0k", // 马先森 13123456789
  "cmsb89akw00bavk540q31y8nj", // 舒 13123456789
  "cmsb89b8b00buvk54vwzv0m52", // 刘悦 13123456789
];

const RESUME_IDS = [
  "test_resume_b_001", // 张候选人 13800001111
];

const ORDER_IDS = [
  "cmu6qgraf000oxwzikqu1az06", // SIM1789722329127962
];

const ENTITLEMENT_IDS = [
  "cmu6qbrb90009xwziqqrtumvg",
  "cmu6qgraq000pxwziupbgnmp4",
  "cmu97xnow0004xw7sriovw7cw",
  "cmu9jkqra000dxwv5phftd257",
];

const NOTIFICATION_IDS = [
  "cmtzwxnrc000dvk3gar6x8pf5", // P4自动化测试减15元券
];

const USER_IDS_TO_DELETE = [
  "cmtclg6ss0002xwgwrakw0aq7", // ceshi_02
  "cmtclg6sx0003xwgwe62qn59i", // ceshi_04
  "cmtclg6t30004xwgw0ldquxol", // ceshi_05
  "cmtclg6t60005xwgwp3wyl492", // ceshi_06
  "cmtclg6tc0006xwgwgcksb5hg", // ceshi_07
  "cmtclg6th0007xwgw3z0c579t", // ceshi_08
  "cmtclg6tk0008xwgwhx7asus1", // ceshi_09
  "cmtclg6tq0009xwgwhfnj8rjc", // ceshi_10
  "cmtclg6tu000axwgwh770feji", // ceshi_11
  "cmtclg6tx000bxwgwx8j6g1sv", // ceshi_12
  "cmtclg6u0000cxwgwfarw1v0q", // ceshi_13
  "cmtclg6u3000dxwgwbu94qphf", // ceshi_14
  "cmtclg6u7000exwgwgabiudcy", // ceshi_15
  "cmtclg6ua000fxwgwsmn4b656", // ceshi_16
  "cmtclg6ud000gxwgwcx899rra", // ceshi_18
  "cmtclg6ui000hxwgwkj3wnszb", // ceshi_19
  "cmtclg6uk000ixwgwnzjkiv0n", // ceshi_20
  "cmtclg6un000jxwgw702iw7jk", // ceshi_21
  "cmtclg6ur000kxwgwyy9ppclm", // 1ceshi_22
  "cmtclg6uw000lxwgwa3t2yx8o", // ceshi_23
  "cmtclg6uz000mxwgwgx5vy3g8", // ceshi_24
  "cmtclg6v4000nxwgwqc1gmzbx", // ceshi_25
  "cmtclg6v7000oxwgw4cqfez3l", // ceshi168
  "cmtclg6va000pxwgwxn5k02y6", // ceshi888
  "cmtclgmcq000vxwle8uicwd33", // 系统测试
  "cmtclg6so0001xwgwrmej5i4s", // Qandu 13800000000
  "cmtclg7it0087xwgwgqb2vd9d", // Kuer 13100000000
  "cms6blf63000ovktkxagyg0lu", // user_32_legacy_32 12345678
];

async function main() {
  console.log("=== STEP 1: FETCHING RECORDS FOR BACKUP ===");
  const backupData = {
    timestamp: new Date().toISOString(),
    jobs: await prisma.job.findMany({ where: { id: { in: JOB_IDS } } }),
    houses: await prisma.house.findMany({ where: { id: { in: HOUSE_IDS } } }),
    listings: await prisma.listing.findMany({ where: { id: { in: LISTING_IDS } } }),
    datings: await prisma.datingProfile.findMany({ where: { id: { in: DATING_IDS } } }),
    resumes: await prisma.resume.findMany({ where: { id: { in: RESUME_IDS } } }),
    orders: await prisma.billingOrder.findMany({ where: { id: { in: ORDER_IDS } } }),
    entitlements: await prisma.billingEntitlement.findMany({ where: { id: { in: ENTITLEMENT_IDS } } }),
    notifications: await prisma.notification.findMany({ where: { id: { in: NOTIFICATION_IDS } } }),
    users: await prisma.user.findMany({ where: { id: { in: USER_IDS_TO_DELETE } } }),
    sanitizedUsersBefore: await prisma.user.findMany({
      where: { id: { in: ["cms6blf64000vvktkn7cffl9z", "cms6blf630002vktkwwfyi64l"] } }
    })
  };

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupData, null, 2), "utf-8");
  console.log(`[BACKUP OK] Saved full snapshot to: ${BACKUP_FILE}`);
  console.log(`  Jobs backed up: ${backupData.jobs.length}`);
  console.log(`  Houses backed up: ${backupData.houses.length}`);
  console.log(`  Listings backed up: ${backupData.listings.length}`);
  console.log(`  Datings backed up: ${backupData.datings.length}`);
  console.log(`  Resumes backed up: ${backupData.resumes.length}`);
  console.log(`  Orders backed up: ${backupData.orders.length}`);
  console.log(`  Entitlements backed up: ${backupData.entitlements.length}`);
  console.log(`  Notifications backed up: ${backupData.notifications.length}`);
  console.log(`  Users backed up: ${backupData.users.length}`);

  console.log("\n=== STEP 2: EXECUTING TRANSACTIONAL CLEANUP ===");
  const result = await prisma.$transaction(async (tx) => {
    // 1. Entitlements
    const delEntitlements = await tx.billingEntitlement.deleteMany({
      where: { id: { in: ENTITLEMENT_IDS } }
    });

    // 2. Billing Orders
    const delOrders = await tx.billingOrder.deleteMany({
      where: { id: { in: ORDER_IDS } }
    });

    // 3. Jobs
    const delJobs = await tx.job.deleteMany({
      where: { id: { in: JOB_IDS } }
    });

    // 4. Houses
    const delHouses = await tx.house.deleteMany({
      where: { id: { in: HOUSE_IDS } }
    });

    // 5. Listings
    const delListings = await tx.listing.deleteMany({
      where: { id: { in: LISTING_IDS } }
    });

    // 6. Dating Profiles
    const delDatings = await tx.datingProfile.deleteMany({
      where: { id: { in: DATING_IDS } }
    });

    // 7. Resumes
    const delResumes = await tx.resume.deleteMany({
      where: { id: { in: RESUME_IDS } }
    });

    // 8. Notifications
    const delNotifs = await tx.notification.deleteMany({
      where: { id: { in: NOTIFICATION_IDS } }
    });

    // 9. Pure Test Users
    const delUsers = await tx.user.deleteMany({
      where: { id: { in: USER_IDS_TO_DELETE } }
    });

    // 10. Sanitize User cms6blf64000vvktkn7cffl9z (nickname '系统测试' -> '老街坊')
    const sanitizedUser1 = await tx.user.update({
      where: { id: "cms6blf64000vvktkn7cffl9z" },
      data: { nickname: "老街坊" }
    });

    // 11. Sanitize User cms6blf630002vktkwwfyi64l (fake phone '010-81234567' -> null)
    const sanitizedUser2 = await tx.user.update({
      where: { id: "cms6blf630002vktkwwfyi64l" },
      data: { phone: null }
    });

    return {
      delEntitlements: delEntitlements.count,
      delOrders: delOrders.count,
      delJobs: delJobs.count,
      delHouses: delHouses.count,
      delListings: delListings.count,
      delDatings: delDatings.count,
      delResumes: delResumes.count,
      delNotifs: delNotifs.count,
      delUsers: delUsers.count,
      sanitizedUser1: sanitizedUser1.nickname,
      sanitizedUser2: sanitizedUser2.phone,
    };
  });

  console.log("\n=== STEP 3: TRANSACTION SUCCESSFUL! ===");
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((err) => {
    console.error("TRANSACTION FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
