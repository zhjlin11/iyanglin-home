const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BACKUP_FILE = path.join(__dirname, "../scratch/backup_round2_20260922.json");

const EVENT_IDS = [
  "cmsb88ydt000mvk54u5kdt5cw", // 俊发空港城看房 (北京燕郊模板)
];

const SIGNUP_IDS = [
  "cmsb899dh00advk54u2j88u5e",
  "cmsb899fp00afvk54syjk1amn",
  "cmsb899hy00ahvk54lqtt23ge",
  "cmsb899k600ajvk54fj4mh4mh",
  "cmsb899md00alvk54crrlduxx",
  "cmsb899ol00anvk54wls80cd3",
  "cmsb899qs00apvk54yid5a0es",
];

const POST_IDS = [
  "cmtd02hev0001xwfssk7w57rk", // 1212
];

const ARTICLE_IDS = [
  "cms6c5jy60001vkn0k0gs6tpc", // 多功能计算器
  "cms6c5jy7000evkn0mh38kgc7", // 整数分区计算器
  "cms6c5jy7000fvkn0gmlewb6j", // 个人住房公积金贷款计算器
  "cms6c5jy7000gvkn0my62i648", // 个人所得税计算器
  "cms6c5jy7000hvkn09th5i253", // 购房银行按揭利率计算器
  "cms6c5jy7000ivkn05kdkref5", // 住房贷款利率计算器
  "cms6c5jy7000jvkn072lo0fsh", // 提前还贷计算器
  "cms6c5jy7000kvkn0iq12hig4", // 商品房购房计算器
  "cms6c5jy7000lvkn0yd6hn4c9", // 按揭贷款计算器
  "cms6c5jy7000mvkn09mc9dhsy", // 公积金贷款计算器
  "cms6c5jy7000nvkn0oo394w8k", // 二手房买卖评估计算
  "cms6c5jy7000ovkn0br5rm0dr", // 个人住房商业贷款计算器
];

const LISTING_IDS = [
  "cms6c3k6e04f8vkc0sn5zkxz4", // 疏通管道 1828718976 (10位残缺)
];

const DATING_IDS = [
  "cmsb89an200bbvk54gqm1032g", // 我是好人 15912345682
];

const SHOP_IDS = [
  "cmsb8vdzi002svkb4qg3o7ynj", // 蜀香老妈砂锅串串(杨林店) (重复且号码残缺10位)
];

const USER_IDS_TO_DELETE = [
  "cmtclg6wa000wxwgwunfsl6f1", // agan 13111111111
  "cmtclg6xl001cxwgw787pgu4v", // x4demo1
  "cmtclg6xo001dxwgwppcqqdsj", // x4demo2
  "cmtclg6xq001exwgwq8jy3h04", // x4demo3
  "cmtclgmds001fxwle8fn6d9ox", // x4demo4
  "cmtclgmdu001gxwleem5u09ap", // x4demo5
  "cmtclgmdw001hxwlepizonqnb", // x4demo6
  "cmtclg6y6001ixwgwymoakg7b", // x4demo7
  "cmtclgmdz001jxwledvk9vit9", // x4demo8
  "cmtclgme1001kxwlemis37vdm", // x4demo9
  "cmtclg6yi001lxwgwh2jf63md", // x4demo10
  "cms6blf640018vktkvdk3kzne", // user_60_legacy_60
  "cms6blf640019vktk8ez11r9n", // user_61_legacy_61
  "cms6blf64001dvktkfl11e6hd", // user_65_legacy_65
  "cms6blf64001evktkj6sdr6jq", // user_66_legacy_66
  "cms6blfdm0080vktk1j6fc1p1", // user_11092_legacy_11092 (Aimee Yang)
  "cms6blfdm008gvktkh2sq695l", // user_11108_legacy_11108 (爱神)
];

const USERS_TO_SANITIZE = [
  "cms6blf64001avktk4zgprhc5", // user_62_legacy_62
  "cms6blf64001bvktkhlxns23r", // user_63_legacy_63
  "cms6blf64001cvktkuloykagd", // user_64_legacy_64
  "cms6blf64001fvktk4lot9eqw", // user_67_legacy_67
  "cms6blf64001gvktkqqjkvh26", // user_68_legacy_68
  "cms6blf64001hvktkoeopxqbg", // user_69_legacy_69
];

async function main() {
  console.log("=== STEP 1: FETCHING RECORDS FOR ROUND 2 BACKUP ===");
  const backupData = {
    timestamp: new Date().toISOString(),
    signups: await prisma.eventSignup.findMany({ where: { id: { in: SIGNUP_IDS } } }),
    events: await prisma.event.findMany({ where: { id: { in: EVENT_IDS } } }),
    posts: await prisma.post.findMany({ where: { id: { in: POST_IDS } } }),
    articles: await prisma.article.findMany({ where: { id: { in: ARTICLE_IDS } } }),
    listings: await prisma.listing.findMany({ where: { id: { in: LISTING_IDS } } }),
    datings: await prisma.datingProfile.findMany({ where: { id: { in: DATING_IDS } } }),
    shops: await prisma.shop.findMany({ where: { id: { in: SHOP_IDS } } }),
    users: await prisma.user.findMany({ where: { id: { in: USER_IDS_TO_DELETE } } }),
    usersSanitizedBefore: await prisma.user.findMany({ where: { id: { in: USERS_TO_SANITIZE } } })
  };

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupData, null, 2), "utf-8");
  console.log(`[BACKUP OK] Saved round 2 backup to: ${BACKUP_FILE}`);
  console.log(`  Signups: ${backupData.signups.length}`);
  console.log(`  Events: ${backupData.events.length}`);
  console.log(`  Posts: ${backupData.posts.length}`);
  console.log(`  Articles: ${backupData.articles.length}`);
  console.log(`  Listings: ${backupData.listings.length}`);
  console.log(`  Datings: ${backupData.datings.length}`);
  console.log(`  Shops: ${backupData.shops.length}`);
  console.log(`  Users to delete: ${backupData.users.length}`);
  console.log(`  Users to sanitize: ${backupData.usersSanitizedBefore.length}`);

  console.log("\n=== STEP 2: EXECUTING TRANSACTIONAL CLEANUP ===");
  const result = await prisma.$transaction(async (tx) => {
    // 1. Delete EventSignups
    const delSignups = await tx.eventSignup.deleteMany({
      where: { id: { in: SIGNUP_IDS } }
    });

    // 2. Delete Event
    const delEvents = await tx.event.deleteMany({
      where: { id: { in: EVENT_IDS } }
    });

    // 3. Delete Post
    const delPosts = await tx.post.deleteMany({
      where: { id: { in: POST_IDS } }
    });

    // 4. Delete Articles
    const delArticles = await tx.article.deleteMany({
      where: { id: { in: ARTICLE_IDS } }
    });

    // 5. Delete Listing
    const delListings = await tx.listing.deleteMany({
      where: { id: { in: LISTING_IDS } }
    });

    // 6. Delete Dating
    const delDatings = await tx.datingProfile.deleteMany({
      where: { id: { in: DATING_IDS } }
    });

    // 7. Delete Shop
    const delShops = await tx.shop.deleteMany({
      where: { id: { in: SHOP_IDS } }
    });

    // 8. Delete Users
    const delUsers = await tx.user.deleteMany({
      where: { id: { in: USER_IDS_TO_DELETE } }
    });

    // 9. Sanitize 6 Users nickname -> "杨林老友"
    const sanitizedUsers = await tx.user.updateMany({
      where: { id: { in: USERS_TO_SANITIZE } },
      data: { nickname: "杨林老友" }
    });

    return {
      delSignups: delSignups.count,
      delEvents: delEvents.count,
      delPosts: delPosts.count,
      delArticles: delArticles.count,
      delListings: delListings.count,
      delDatings: delDatings.count,
      delShops: delShops.count,
      delUsers: delUsers.count,
      sanitizedUsers: sanitizedUsers.count
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
