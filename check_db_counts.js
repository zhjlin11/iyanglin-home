const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const counts = {
    users: await prisma.user.count(),
    listings: await prisma.listing.count(),
    jobs: await prisma.job.count(),
    houses: await prisma.house.count(),
    shops: await prisma.shop.count(),
    events: await prisma.event.count(),
    eventSignups: await prisma.eventSignup.count(),
    articles: await prisma.article.count(),
    datingProfiles: await prisma.datingProfile.count(),
    posts: await prisma.post.count(),
    postComments: await prisma.postComment.count(),
    billingOrders: await prisma.billingOrder.count(),
  };
  console.log("EXACT_DB_COUNTS:", JSON.stringify(counts, null, 2));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
});
