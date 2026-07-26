const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixRoles() {
  console.log("Starting role fix...");

  // 1. Delete unwanted roles explicitly
  const rolesToDelete = [
    "MANAGER",
    "DEPARTMENT_MANAGER",
    "ENGINEER",
    "TECHNICIAN",
    "DRIVER",
    "DISPATCHER",
    "SALES", // Sales role name was SALES_REP, maybe just SALES role existed?
  ];

  console.log("Deleting roles:", rolesToDelete);
  const deleteResult = await prisma.role.deleteMany({
    where: {
      name: { in: rolesToDelete },
      // companyId: null // Let's try to delete them even if they have companyId if they are the generic ones
      // But let's be safe: usually these are companyId: null
      OR: [
        { companyId: null },
        { isSystem: true, isSovereign: false }, // Also delete system defaults that are not sovereign
      ],
    },
  });
  console.log(`Deleted ${deleteResult.count} roles.`);

  // 2. Update display names for existing roles to be sure
  const updates = [
    { name: "WORKER", displayName: "عامل معمل" },
    { name: "OPERATOR", displayName: "مشغل" },
    { name: "AUDITOR", displayName: "مدقق الحسابات" },
    { name: "ACCOUNTANT", displayName: "مدير الحسابات" },
    { name: "SECURITY", displayName: "حارس أمن" },
    { name: "SALES_REP", displayName: "مندوب المبيعات" },
    { name: "LAB_TECH", displayName: "فني مختبر" },
  ];

  console.log("Updating display names...");
  for (const update of updates) {
    // Find first to get ID
    const roles = await prisma.role.findMany({
      where: { name: update.name },
    });

    for (const role of roles) {
      await prisma.role.update({
        where: { id: role.id },
        data: { displayName: update.displayName },
      });
      console.log(
        `Updated ${update.name} (id: ${role.id}) to ${update.displayName}`,
      );
    }
  }

  // 3. Verify final list for System Owner (isSovereign: false)
  console.log("\n=== Final Available Roles ===");
  const visibleRoles = await prisma.role.findMany({
    where: {
      isSovereign: false,
    },
    orderBy: { id: "asc" },
  });

  visibleRoles.forEach((r) => {
    console.log(`${r.name}: ${r.displayName}`);
  });

  await prisma.$disconnect();
}

fixRoles().catch(console.error);
