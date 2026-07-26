import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.labStandard.count();
    console.log(`✅ Found ${count} Lab Standards.`);

    if (count > 0) {
      const standards = await prisma.labStandard.findMany({
        include: { testMethods: true },
      });
      console.log(
        "Standards:",
        standards.map((s) => `${s.code} (${s.testMethods.length} methods)`),
      );
    }
  } catch (error) {
    console.error("❌ Error checking standards:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
