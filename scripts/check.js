const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.permission.count();
    console.log(`COUNT: ${count}`);
    const first = await prisma.permission.findFirst();
    console.log("FIRST:", first);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
