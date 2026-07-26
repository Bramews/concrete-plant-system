import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 STARTING ROLE AUDIT...");

  try {
    const count = await prisma.role.count();
    console.log(`📊 TOTAL ROLES COUNT: ${count}`);

    const roles = await prisma.role.findMany({
      orderBy: { id: "asc" },
    });

    console.log("\n📋 ROLE DETAILS:");
    console.table(
      roles.map((r) => ({
        id: r.id,
        name: r.name,
        displayName: r.displayName,
        isSystem: r.isSystem,
        companyId: r.companyId,
      })),
    );

    console.log("\n✅ AUDIT COMPLETE.");
  } catch (error) {
    console.error("❌ ERROR AUDITING ROLES:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
