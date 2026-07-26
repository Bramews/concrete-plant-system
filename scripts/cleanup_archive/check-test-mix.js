const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const mixes = await prisma.mixDesign.findMany({
    where: {
      name: {
        contains: "Test Final Mix",
      },
    },
  });
  console.log(JSON.stringify(mixes, null, 2));
}

main().finally(async () => {
  await prisma.$disconnect();
});
