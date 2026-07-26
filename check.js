const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const comps = await prisma.mixComponent.findMany({
    where: { mixDesignId: 6, materialName: { contains: "admix" } },
  });
  console.log(comps);
}

main().finally(() => prisma.$disconnect());
