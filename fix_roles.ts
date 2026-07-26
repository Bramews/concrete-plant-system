import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function fixRoles() {
  console.log("Starting role fix...");

  // 1. Delete unwanted roles
  const rolesToDelete = [
    "MANAGER",
    "DEPARTMENT_MANAGER",
    "ENGINEER",
    "TECHNICIAN",
    "DRIVER",
    "DISPATCHER",
    "SALES", // Just in case
  ];

  console.log("Deleting roles:", rolesToDelete);
  const deleteResult = await prisma.role.deleteMany({
    where: {
      name: { in: rolesToDelete },
      companyId: null, // Only delete system/default roles
    },
  });
  console.log(`Deleted ${deleteResult.count} roles.`);

  // 2. Update display names for existing roles
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
    const role = await prisma.role.findFirst({
      where: { name: update.name, companyId: null },
    });

    if (role) {
      await prisma.role.update({
        where: { id: role.id },
        data: { displayName: update.displayName },
      });
      console.log(`Updated ${update.name} to ${update.displayName}`);
    } else {
      console.log(`Role ${update.name} not found for update.`);
    }
  }

  // 3. Verify final list
  console.log("\n=== Final Role List ===");
  const finalRoles = await prisma.role.findMany({
    where: {
      isSovereign: false,
      AND: [
        { isSystem: true }, // Assuming we mostly want system defaults or generic roles
        { companyId: null },
      ],
    },
    orderBy: { id: "asc" },
  });

  // Actually, let's just list ALL non-sovereign roles with no companyId to be sure what appears
  const visibleRoles = await prisma.role.findMany({
    where: {
      isSovereign: false,
      companyId: null,
    },
    orderBy: { id: "asc" },
  });

  visibleRoles.forEach((r) => {
    console.log(`${r.name}: ${r.displayName}`);
  });

  await prisma.$disconnect();
}

fixRoles().catch((e) => {
  console.error(e);
  process.exit(1);
});
