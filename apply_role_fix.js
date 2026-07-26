const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ROLES = [
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
  console.log("=== NUCLEAR ROLE FIX ===");

  // 1. Ensure SYSTEM_OWNER exists
  await prisma.role.upsert({
    where: { name: "SYSTEM_OWNER" },
    update: { displayName: "مالك النظام", isSystem: true },
    create: {
      name: "SYSTEM_OWNER",
      displayName: "مالك النظام",
      isSystem: true,
    },
  });

  // 2. Upsert all other roles
  for (const r of ROLES) {
    console.log(`Fixing ${r.name}...`);
    // Upsert by name
    // Note: We use updateMany first to be safe, but upsert needs a unique field.
    // The schema has @@unique([companyId, name]).
    // Since we want Global roles (companyId: null), we can try findFirst then update or create.

    const existing = await prisma.role.findFirst({
      where: { name: r.name, companyId: null },
    });

    if (existing) {
      await prisma.role.update({
        where: { id: existing.id },
        data: {
          displayName: r.displayName,
          isSystem: true,
        },
      });
    } else {
      // Check if there is a rogue one attached to a company (unlikely for system roles but possible if seeded wrong)
      // We want GLOBAL roles.
      await prisma.role.create({
        data: {
          name: r.name,
          displayName: r.displayName,
          isSystem: true,
          companyId: null,
        },
      });
    }
  }

  console.log("=== ROLE TABLE FIXED ===");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
