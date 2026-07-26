import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const tableInfo = await (prisma as any).$queryRawUnsafe(
      `PRAGMA table_info(BillingEvent)`,
    );
    console.log("📊 Table Info for BillingEvent:");
    console.table(tableInfo);

    const hasCompanyId = (tableInfo as any[]).some(
      (col) => col.name === "companyId",
    );
    if (hasCompanyId) {
      console.log(
        "✅ SUCCESS: 'companyId' column exists in BillingEvent table.",
      );
    } else {
      console.error(
        "❌ FAILURE: 'companyId' column is STILL MISSING from BillingEvent table.",
      );
    }
  } catch (e) {
    console.error("❌ Error checking table info:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
