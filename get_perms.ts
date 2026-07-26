import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const perms = await prisma.permission.findMany();
  console.log(perms);
}
main().finally(() => prisma.$disconnect());
