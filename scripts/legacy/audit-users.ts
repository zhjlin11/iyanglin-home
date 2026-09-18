import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

async function main() {
  const users = await prisma.user.findMany();
  console.log("=== PRODUCTION USERS AUDIT ===");
  console.log(`- 总用户数: ${users.length}`);
  users.forEach((u, i) => {
    console.log(`  [${i + 1}] ID=${u.id} | username=${u.username} | role=${u.role} | createdAt=${u.createdAt}`);
  });
  console.log("--------------------------------------------------");
  await prisma.$disconnect();
}

main().catch(console.error);
