import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const prefs = await prisma.userPreference.findMany();
  console.log(JSON.stringify(prefs, null, 2));
}
main().finally(() => prisma.$disconnect());
