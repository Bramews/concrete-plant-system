const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const FORCE_VISIBLE_ROLES = [
  "COMPANY_ADMIN",
  "MANAGER",
  "DEPARTMENT_MANAGER",
  "ADMINISTRATION",
  "LABORATORY",
  "ACCOUNTING",
  "OPERATIONS",
  "SALES",
  "DISPATCH",
  "ENGINEER",
  "TECHNICIAN",
  "WORKER",
  "AUDITOR",
  "ACCOUNTANT",
  "OPERATOR",
  "DRIVER",
  "SALES_REP",
  "LAB_TECH",
  "DISPATCHER",
  "STOREKEEPER", // Adding back per user request if it was there? No, user said "Strict mirroring".
  // User said "ما اتفقنة على امين مخزن" (We didn't agree on Storekeeper).
  // User mentioned: "ما اتفقنة على امين مخزن او مشغل مضخة او مسؤل امن او مراد بشرية"
  // So I MUST NOT include STOREKEEPER, PUMP_OPERATOR, SECURITY, HR.
  // I will strictly stick to the list in role-translations.ts
];

// Re-verified list from role-translations.ts content view:
const STRICT_ROLES = [
  "SYSTEM_OWNER",
  "COMPANY_ADMIN",
  "MANAGER",
  "DEPARTMENT_MANAGER",
  "ADMINISTRATION",
  "LABORATORY",
  "ACCOUNTING",
  "OPERATIONS",
  "SALES",
  "DISPATCH",
  "ENGINEER",
  "TECHNICIAN",
  "WORKER",
  "AUDITOR",
  "ACCOUNTANT",
  "OPERATOR",
  "DRIVER",
  "SALES_REP",
  "LAB_TECH",
  "DISPATCHER",
];

async function main() {
  console.log("=== FINAL ROLE FIX STARTED ===");

  // 1. Force isSystem=true for all STRICT_ROLES except SYSTEM_OWNER (which is also system but handled separately usually)
  // Actually SYSTEM_OWNER is irrelevant for company lists.

  for (const roleName of STRICT_ROLES) {
    if (roleName === "SYSTEM_OWNER") continue;

    console.log(`Fixing visibility for: ${roleName}...`);

    // Check if exists
    const exists = await prisma.role.findFirst({ where: { name: roleName } });

    if (exists) {
      await prisma.role.updateMany({
        where: { name: roleName },
        data: { isSystem: true, companyId: null },
      });
      console.log(`   -> Updated ${roleName} to isSystem: true`);
    } else {
      console.log(`   -> Role ${roleName} missing! Creating...`);
      await prisma.role.create({
        data: {
          name: roleName,
          displayName: roleName, // Translation handles display
          isSystem: true,
        },
      });
      console.log(`   -> Created ${roleName}`);
    }
  }

  console.log("\n=== VERIFICATION: ROLES VISIBLE TO COMPANIES ===");
  // Simulate the query used in page.tsx
  // OR: [{ isSystem: true }, { companyId: 1 }]
  const visibleRoles = await prisma.role.findMany({
    where: {
      OR: [{ isSystem: true }],
      NOT: { name: "SYSTEM_OWNER" },
    },
    select: { name: true, isSystem: true },
  });

  console.table(visibleRoles);
  console.log(`Total Visible Roles: ${visibleRoles.length}`);
  console.log("=== FIX COMPLETE ===");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
