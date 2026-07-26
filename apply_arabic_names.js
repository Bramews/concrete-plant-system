const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ARABIC_ROLES = [
  { name: "COMPANY_ADMIN", displayName: "الإدارة" },
  { name: "MANAGER", displayName: "مدير" },
  { name: "DEPARTMENT_MANAGER", displayName: "مدير قسم" },
  { name: "ADMINISTRATION", displayName: "الإدارة (قسم)" },
  { name: "LABORATORY", displayName: "المختبر" },
  { name: "ACCOUNTING", displayName: "الحسابات" },
  { name: "OPERATIONS", displayName: "التشغيل" },
  { name: "SALES", displayName: "المبيعات" },
  { name: "DISPATCH", displayName: "الحركة" },
  { name: "ENGINEER", displayName: "مهندس" },
  { name: "TECHNICIAN", displayName: "فني" },
  { name: "WORKER", displayName: "عامل" },
  { name: "AUDITOR", displayName: "مدقق" },
  { name: "ACCOUNTANT", displayName: "محاسب" },
  { name: "OPERATOR", displayName: "مشغل" },
  { name: "DRIVER", displayName: "سائق" },
  { name: "SALES_REP", displayName: "مندوب مبيعات" },
  { name: "LAB_TECH", displayName: "فني مختبر" },
  { name: "DISPATCHER", displayName: "مسؤول الحركة" },
];

async function main() {
  console.log("=== APPLYING ARABIC NAMES FORCEFULLY ===");

  // First, let's delete any "System Owner" from roles table if present (it shouldn't be assignable)
  // Or handle it carefully.

  for (const role of ARABIC_ROLES) {
    console.log(`Setting ${role.name} to ${role.displayName}...`);

    // We try to update by name if exists
    const exists = await prisma.role.findFirst({ where: { name: role.name } });

    if (exists) {
      await prisma.role.updateMany({
        where: { name: role.name },
        data: {
          displayName: role.displayName,
          isSystem: true,
          companyId: null,
        },
      });
    } else {
      await prisma.role.create({
        data: {
          name: role.name,
          displayName: role.displayName,
          isSystem: true,
        },
      });
    }
  }

  // Delete roles not in list (Cleanup junk english duplicates if any)
  const allowedNames = ARABIC_ROLES.map((r) => r.name);
  allowedNames.push("SYSTEM_OWNER"); // Keep system owner

  const allRoles = await prisma.role.findMany();
  for (const r of allRoles) {
    if (!allowedNames.includes(r.name)) {
      console.log(`Deleting invalid role: ${r.name}`);
      // Check if it's "Company Admin" (the english version)
      if (r.name === "Company Admin") {
        // Maybe migrate users? For now, just delete.
        // Actually, if we delete, users might lose role.
        const correctName = "COMPANY_ADMIN";
        const correctRole = await prisma.role.findFirst({
          where: { name: correctName },
        });
        if (correctRole) {
          await prisma.membership.updateMany({
            where: { roleId: r.id },
            data: { roleId: correctRole.id },
          });
        }
      }
      await prisma.role.delete({ where: { id: r.id } });
    }
  }

  console.log("=== COMPLETED ===");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
