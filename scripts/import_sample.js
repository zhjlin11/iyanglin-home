const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, 'sample_data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`Starting import for ${data.articles.length} articles...`);

  for (const item of data.articles) {
    // Convert relative img src to full domain or local fallback if needed
    let body = item.body;
    if (body.includes('src="/UploadFile')) {
      body = body.replace(/src="\/UploadFile/g, 'src="https://www.yanglinol.com/UploadFile');
    }

    const created = await prisma.article.upsert({
      where: { oldId: item.oldId },
      update: {
        title: item.title,
        body: body,
        status: 'APPROVED',
      },
      create: {
        oldId: item.oldId,
        title: item.title,
        body: body,
        category: 'life',
        status: 'APPROVED',
      },
    });

    console.log(`Imported Article: ID [${created.id}], OldId [${created.oldId}], Title: "${created.title}"`);
  }

  console.log('Sample migration finished successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
