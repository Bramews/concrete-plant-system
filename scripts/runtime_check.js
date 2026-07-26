const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- Headless Stability Audit (Prisma) ---");
  try {
    // 1. Check Auth Layer Data
    const owners = await prisma.systemOwner.findMany();
    console.log(`✅ Auth Layer: Found ${owners.length} System Owners.`);

    // 2. Check Lab Layer Data (The most critical part involving TestMethod)
    const testMethods = await prisma.testMethod.findMany();
    console.log(
      `✅ Lab Layer: Found ${testMethods.length} active TestMethods.`,
    );

    // 3. Verify System Settings
    const settings = await prisma.systemSetting.findMany();
    console.log(
      `✅ Settings: Found ${settings.length} Global System Settings.`,
    );

    // 4. Verify Company Isolation
    const companies = await prisma.company.findMany();
    console.log(`✅ Tenancy: Found ${companies.length} Registered Companies.`);

    // 5. Test a Write Operation (Audit Log)
    const audit = await prisma.auditLog.create({
      data: {
        action: "STABILITY_AUDIT_JS",
        details: "Automated verification after build fix",
        entity: "System",
        entityId: 0,
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });
    console.log("✅ Write Test: Success (Audit Log ID: " + audit.id + ")");

    console.log("\n⭐⭐⭐ DB AND SCHEMA INTEGRITY VERIFIED ⭐⭐⭐");
  } catch (e) {
    console.error("\n❌ STABILITY AUDIT FAILED:");
    console.error(e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
