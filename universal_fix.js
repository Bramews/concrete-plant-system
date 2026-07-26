const { PrismaClient } = require("@prisma/client");
const path = require("path");

const DB_FILES = [
  "d:/concrete-plant-system/prisma/dev.db",
  "d:/concrete-plant-system/prisma/prisma/dev.db",
  "d:/concrete-plant-system/prisma/prisma/dev_v2.db",
];

const TARGET_ROLES = {
  "Company Admin": "الإدارة",
  COMPANY_ADMIN: "الإدارة",
  Manager: "مدير",
  MANAGER: "مدير",
  "Department Manager": "مدير قسم",
  DEPARTMENT_MANAGER: "مدير قسم",
  Operator: "مشغل",
  OPERATOR: "مشغل",
  "Sales Representative": "مندوب مبيعات",
  SALES_REP: "مندوب مبيعات",
  "Lab Technician": "فني مختبر",
  LAB_TECH: "فني مختبر",
  Driver: "سائق",
  DRIVER: "سائق",
  Accountant: "محاسب",
  ACCOUNTANT: "محاسب",
  Dispatcher: "مسؤول الحركة",
  DISPATCHER: "مسؤول الحركة",
  Auditor: "مدقق",
  AUDITOR: "مدقق",
  Worker: "عامل",
  WORKER: "عامل",
  Technician: "فني",
  TECHNICIAN: "فني",
  Engineer: "مهندس",
  ENGINEER: "مهندس",
  Sales: "المبيعات",
  SALES: "المبيعات",
  Operations: "التشغيل",
  OPERATIONS: "التشغيل",
  Accounting: "الحسابات",
  ACCOUNTING: "الحسابات",
  Laboratory: "المختبر",
  LABORATORY: "المختبر",
  Administration: "الإدارة (قسم)",
  ADMINISTRATION: "الإدارة (قسم)",
};

// Map mapping internal codes to names
const STANDARD_ROLES = [
  { code: "COMPANY_ADMIN", display: "الإدارة" },
  { code: "MANAGER", display: "مدير" },
  { code: "DEPARTMENT_MANAGER", display: "مدير قسم" },
  { code: "ADMINISTRATION", display: "الإدارة (قسم)" },
  { code: "LABORATORY", display: "المختبر" },
  { code: "ACCOUNTING", display: "الحسابات" },
  { code: "OPERATIONS", display: "التشغيل" },
  { code: "SALES", display: "المبيعات" },
  { code: "DISPATCH", display: "الحركة" },
  { code: "ENGINEER", display: "مهندس" },
  { code: "TECHNICIAN", display: "فني" },
  { code: "WORKER", display: "عامل" },
  { code: "AUDITOR", display: "مدقق" },
  { code: "ACCOUNTANT", display: "محاسب" },
  { code: "OPERATOR", display: "مشغل" },
  { code: "DRIVER", display: "سائق" },
  { code: "SALES_REP", display: "مندوب مبيعات" },
  { code: "LAB_TECH", display: "فني مختبر" },
  { code: "DISPATCHER", display: "مسؤول الحركة" },
];

async function fixDatabase(dbPath) {
  console.log(`\n=== FIXING DB: ${dbPath} ===`);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`,
      },
    },
  });

  try {
    // 1. Update existing roles to correct Arabic DisplayName
    for (const [key, val] of Object.entries(TARGET_ROLES)) {
      // Try strict update
      await prisma.role.updateMany({
        where: { name: key },
        data: { displayName: val, isSystem: true, companyId: null },
      });
    }

    // 2. Ensure all STANDARD_ROLES exist
    for (const std of STANDARD_ROLES) {
      const existing = await prisma.role.findFirst({
        where: { name: std.code },
      });
      if (!existing) {
        console.log(`Creating missing role ${std.code} in ${dbPath}`);
        await prisma.role.create({
          data: {
            name: std.code,
            displayName: std.display,
            isSystem: true,
          },
        });
      }
    }

    // 3. Delete junk (english names that are NOT standard codes)
    // We already updated them to have arabic display names, but their internal Name might still be "Company Admin".
    // We ideally want to MIGRATE them to "COMPANY_ADMIN".

    // Let's do a migration pass.
    for (const std of STANDARD_ROLES) {
      // Names that serve as alias to this standard role
      // e.g. "Company Admin" -> "COMPANY_ADMIN"
      // We can iterate names that map to std.display in TARGET_ROLES?
      // Simplification: Just find specific known bad names.
    }

    // For now, let's just count.
    const count = await prisma.role.count();
    console.log(`Roles count in ${dbPath}: ${count}`);
  } catch (e) {
    console.error(`FAILED to fix ${dbPath}:`, e.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  for (const db of DB_FILES) {
    await fixDatabase(db);
  }
}

main();
