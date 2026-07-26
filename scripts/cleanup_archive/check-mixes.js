const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const components = await prisma.mixComponent.findMany({
    take: 5,
    select: {
      id: true,
      mixDesignId: true,
      materialId: true,
      materialName: true,
      quantity: true,
      companyId: true,
    },
  });
  console.log(JSON.stringify(components, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
