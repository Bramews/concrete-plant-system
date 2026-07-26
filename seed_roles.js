const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ROLES_TO_SEED = [
  // Management
  { name: "COMPANY_ADMIN", displayName: "الإدارة", isSystem: false },
  { name: "MANAGER", displayName: "مدير المحطة", isSystem: false },

  // Operations & Dispatch
  { name: "DISPATCHER", displayName: "مسؤول الحركة (مرحل)", isSystem: false },
  { name: "OPERATOR", displayName: "مشغل محطة", isSystem: false },
  { name: "DRIVER", displayName: "سائق خلاطة", isSystem: false },
  { name: "PUMP_OPERATOR", displayName: "مشغل مضخة", isSystem: false },

  // Laboratory & Quality
  { name: "LAB_MANAGER", displayName: "مدير المختبر", isSystem: false },
  { name: "LAB_TECH", displayName: "فني مختبر", isSystem: false },

  // Finance & Admin
  { name: "ACCOUNTANT", displayName: "محاسب", isSystem: false },
  { name: "STOREKEEPER", displayName: "أمين مخزن", isSystem: false },
  { name: "HR", displayName: "موارد بشرية", isSystem: false },

  // Sales
  { name: "SALES_MANAGER", displayName: "مدير مبيعات", isSystem: false },
  { name: "SALES_REP", displayName: "مندوب مبيعات", isSystem: false },

  // General
  { name: "ENGINEER", displayName: "مهندس موقع", isSystem: false },
  { name: "SECURITY", displayName: "مسؤول أمن", isSystem: false },
];

async function main() {
  console.log("Seeding Roles...");

  for (const role of ROLES_TO_SEED) {
    const existing = await prisma.role.findFirst({
      where: { name: role.name },
    });

    if (!existing) {
      console.log(`Creating role: ${role.name} (${role.displayName})`);
      await prisma.role.create({
        data: role,
      });
    } else {
      console.log(
        `Updating role display name: ${role.name} -> ${role.displayName}`,
      );
      await prisma.role.update({
        where: { id: existing.id },
        data: { displayName: role.displayName },
      });
    }
  }

  console.log("Roles Seeding Completed.");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
