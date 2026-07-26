const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- STARTING SQLITE PERFORMANCE TUNING ---");

  // 1. Set WAL journal mode
  console.log("Configuring journal_mode = WAL...");
  const journalModeResult = await prisma.$queryRawUnsafe(
    "PRAGMA journal_mode=WAL;",
  );
  console.log("✓ current journal_mode:", JSON.stringify(journalModeResult));

  // 2. Set synchronous mode to NORMAL
  console.log("\nConfiguring synchronous = NORMAL...");
  const synchronousResult = await prisma.$queryRawUnsafe(
    "PRAGMA synchronous=NORMAL;",
  );
  console.log("✓ current synchronous:", JSON.stringify(synchronousResult));

  console.log("\nSQLite Database optimization complete! WAL mode is active.");
}

main()
  .catch((err) => {
    console.error("⨯ Database tuning failed:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
