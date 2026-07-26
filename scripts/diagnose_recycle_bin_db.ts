import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const deletedCompanies =
      await prisma.$queryRaw`SELECT * FROM "Company" WHERE "deletedAt" IS NOT NULL`;
    console.log("Deleted companies:", deletedCompanies);

    // Try hard delete
    await prisma.$executeRaw`DELETE FROM "Company" WHERE "deletedAt" IS NOT NULL`;
    console.log("Successfully deleted");
  } catch (error) {
    console.error("Error during deletion:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
