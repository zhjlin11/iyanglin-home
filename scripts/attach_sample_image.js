const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const listing = await prisma.listing.update({
    where: { id: 'cmrztc78m0001vkj0kgs8awdf' },
    data: {
      images: [
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=60'
      ]
    }
  });
  console.log('Updated listing with sample image:', listing.id, listing.images);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
