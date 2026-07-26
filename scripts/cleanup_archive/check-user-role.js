const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const memberships = await prisma.membership.findMany({
    include: {
      user: true,
      role: true,
      company: true,
    },
  });
  console.log(JSON.stringify(memberships, null, 2));
}

main().finally(async () => {
  await prisma.$disconnect();
});
