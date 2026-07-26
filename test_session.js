const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./prisma/dev.db",
    },
  },
});
async function main() {
  try {
    const sessionCount = await prisma.session.count();
    console.log("SESSION_COUNT:", sessionCount);
    const firstSession = await prisma.session.findFirst();
    console.log("FIRST_SESSION:", JSON.stringify(firstSession, null, 2));
  } catch (err) {
    console.error("QUERY_ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
