const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Map of Role Name -> Arabic Display Name
// This mirrors role-translations.ts strictly.
const ROLES_MAP = {
  // System
  SYSTEM_OWNER: "مالك النظام",

  // Management
  COMPANY_ADMIN: "الإدارة",
  MANAGER: "مدير",
  DEPARTMENT_MANAGER: "مدير قسم",

  // Departments
  ADMINISTRATION: "الإدارة (قسم)",
  LABORATORY: "المختبر",
  ACCOUNTING: "الحسابات",
  OPERATIONS: "التشغيل",
  SALES: "المبيعات",
  DISPATCH: "الحركة",

  // Positions
  ENGINEER: "مهندس",
  TECHNICIAN: "فني",
  WORKER: "عامل",
  AUDITOR: "مدقق",
  ACCOUNTANT: "محاسب",
  OPERATOR: "مشغل",
  DRIVER: "سائق",
  SALES_REP: "مندوب مبيعات",
  LAB_TECH: "فني مختبر",
  DISPATCHER: "مسؤول الحركة",
};

async function main() {
  console.log("=== FORCING ARABIC NAMES IN DB ===");

  // 1. Update/Create Roles with correct Arabic DisplayName
  for (const [name, displayName] of Object.entries(ROLES_MAP)) {
    console.log(`Processing ${name} -> ${displayName}`);

    const role = await prisma.role.findFirst({ where: { name: name } });

    if (role) {
      await prisma.role.updateMany({
        where: { name: name },
        data: {
          displayName: displayName,
          isSystem: true,
          companyId: null,
        },
      });
      console.log(`Updated.`);
    } else {
      await prisma.role.create({
        data: {
          name: name,
          displayName: displayName,
          isSystem: true,
        },
      });
      console.log(`Created.`);
    }
  }

  // 2. Delete any role NOT in our map (Strict Cleanup)
  const allowedNames = Object.keys(ROLES_MAP);
  const allRoles = await prisma.role.findMany();

  for (const role of allRoles) {
    if (!allowedNames.includes(role.name)) {
      console.log(`DELETING Unknown Role: ${role.name} (${role.displayName})`);
      await prisma.role.delete({ where: { id: role.id } });
    }
  }

  console.log("=== FORCE FIXED COMPLETED ===");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
