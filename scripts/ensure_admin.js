const { PrismaClient } = require('@prisma/client');
const { scryptSync, randomBytes } = require('node:crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

async function main() {
  const username = 'admin';
  const password = 'test-pass-123';
  const passwordHash = hashPassword(password);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      role: 'ADMIN',
    },
    create: {
      username,
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Admin user ensured successfully:', user.username, 'Role:', user.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
