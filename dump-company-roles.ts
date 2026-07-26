import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({
    where: {
      OR: [{ companyId: null }, { companyId: 847371 }],
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      isSystem: true,
      companyId: true,
    },
  });
  console.log(JSON.stringify(roles, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
