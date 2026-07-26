const { PrismaClient } = require("@prisma/client");

async function checkDb(dbPath) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`,
      },
    },
  });

  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
    });
    console.log(`\n--- Users in ${dbPath} ---`);
    console.log(users);

    const companies = await prisma.company.findMany({
      select: { id: true, name: true },
    });
    console.log(`\n--- Companies in ${dbPath} ---`);
    console.log(companies);
  } catch (err) {
    console.error(`Error querying ${dbPath}:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await checkDb("./prisma/dev.db");
  await checkDb("./backups/backup-2026-02-16T11-55-03-694Z.db");
}

main();
