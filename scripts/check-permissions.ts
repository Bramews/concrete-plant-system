import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.permission.count();
  console.log(`Total Permissions in DB: ${count}`);

  const perms = await prisma.permission.findMany({ take: 5 });
  console.log("Sample Permissions:", perms);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
