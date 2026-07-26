const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Running Enterprise Architecture Check...");

  try {
    // 1. Check Departments
    const deptCount = await prisma.department.count();
    console.log(`✅ Departments: ${deptCount} (Expected: 6)`);
    if (deptCount > 0) {
      const depts = await prisma.department.findMany({
        select: { name: true, displayName: true },
      });
      console.log(
        "   - " + depts.map((d) => `${d.name} (${d.displayName})`).join(", "),
      );
    }

    // 2. Check Roles
    const roleCount = await prisma.role.count();
    console.log(`✅ Roles: ${roleCount} (Expected: 14+)`);

    // 3. Check System Owner
    const owner = await prisma.systemOwner.findUnique({
      where: { email: "ahmed@concrete.com" },
    });
    console.log(
      `✅ System Owner: ${owner ? "FOUND" : "MISSING"} (${owner?.name})`,
    );

    // 4. Check Enterprise Company
    const company = await prisma.company.findUnique({
      where: { slug: "demo-plant" },
    });
    console.log(`✅ Demo Company: ${company ? "ACTIVE" : "MISSING"}`);

    if (deptCount >= 6 && roleCount >= 10 && owner && company) {
      console.log("\n🚀 SYSTEM IS READY AND VERIFIED.");
      console.log("You can now restart the TS server to clear IDE errors.");
    } else {
      console.log("\n⚠️ VERIFICATION FAILED. Database might be incomplete.");
    }
  } catch (e) {
    console.error("❌ ERROR: Connection failed or Schema Mismatch.");
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
