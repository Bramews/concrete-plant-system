const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// These are the standard roles that should be visible to ALL companies.
// They must be marked as isSystem: true to be picked up by the query: OR: [{ isSystem: true }, { companyId: companyId }]
const GLOBAL_ROLES = [
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
  console.log("--- FIXING ROLES VISIBILITY ---");

  for (const name of GLOBAL_ROLES) {
    const role = await prisma.role.findFirst({ where: { name } });
    if (role) {
      console.log(`Updating ${name} to be isSystem=true (Global Role)`);
      await prisma.role.updateMany({
        where: { name: name },
        data: { isSystem: true, companyId: null }, // Ensure they are global
      });
    } else {
      console.log(`Role ${name} not found. Creating it as Global...`);
      // Re-create if missing (as per strict match)
      await prisma.role.create({
        data: {
          name: name,
          displayName: name, // We rely on translation file for UI, but this is a fallback
          isSystem: true,
        },
      });
    }
  }

  console.log("--- VISIBILITY FIX COMPLETE ---");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
