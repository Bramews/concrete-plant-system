import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * الأدوار الصحيحة للنظام - القائمة الذهبية
 * Correct System Roles - Golden List (13 roles only)
 */
const SYSTEM_ROLES = [
  // System Level
  {
    name: "SYSTEM_OWNER",
    displayName: "مالك النظام",
    description: "المالك الأعلى للنظام",
    isSovereign: true,
  },

  // Company Management
  {
    name: "COMPANY_ADMIN",
    displayName: "الإدارة",
    description: "مدير عام الشركة",
  },

  // Laboratory Department
  {
    name: "LAB_MANAGER",
    displayName: "مدير مختبر",
    description: "مدير قسم المختبر",
  },
  {
    name: "LAB_ENGINEER",
    displayName: "مهندس مختبر",
    description: "مهندس في المختبر",
  },
  { name: "LAB_TECH", displayName: "فني مختبر", description: "فني مختبر" },
  {
    name: "LAB_WORKER",
    displayName: "عامل مختبر",
    description: "عامل في المختبر",
  },

  // Operations
  { name: "OPERATOR", displayName: "مشغل", description: "مشغل خلاطة" },
  { name: "WORKER", displayName: "عامل معمل", description: "عامل في المعمل" },

  // Accounting
  {
    name: "ACCOUNTANT",
    displayName: "مدير الحسابات",
    description: "مدير قسم الحسابات",
  },
  {
    name: "AUDITOR",
    displayName: "مدقق الحسابات",
    description: "مدقق مالي",
  },

  // Sales
  {
    name: "SALES_MANAGER",
    displayName: "مدير المبيعات",
    description: "مدير قسم المبيعات",
  },
  {
    name: "SALES_REP",
    displayName: "مندوب المبيعات",
    description: "مندوب مبيعات",
  },

  // Security
  { name: "SECURITY", displayName: "حارس أمن", description: "حارس أمن" },
];

async function seedRoles() {
  console.log("🚀 بدء تحديث الأدوار...");

  for (const role of SYSTEM_ROLES) {
    try {
      await prisma.role.upsert({
        where: {
          companyId_name: {
            companyId: null as any,
            name: role.name,
          },
        },
        update: {
          displayName: role.displayName,
          description: role.description,
          isSystem: true,
          isSovereign: "isSovereign" in role ? role.isSovereign : false,
          companyId: null,
        },
        create: {
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          isSystem: true,
          isSovereign: "isSovereign" in role ? role.isSovereign : false,
          companyId: null,
        },
      });
      console.log(`✅ ${role.name} -> ${role.displayName}`);
    } catch (error) {
      console.error(`❌ فشل تحديث ${role.name}:`, error);
    }
  }

  // Delete old/invalid roles that are not in our list
  const validNames = SYSTEM_ROLES.map((r) => r.name);
  try {
    const deleted = await prisma.role.deleteMany({
      where: {
        isSystem: true,
        name: { notIn: validNames },
      },
    });
    console.log(`🗑️ تم حذف ${deleted.count} أدوار قديمة/غير صالحة`);
  } catch (error) {
    console.error("❌ فشل حذف الأدوار القديمة:", error);
  }

  console.log("✅ اكتمل تحديث الأدوار بنجاح!");
}

seedRoles()
  .catch((e) => {
    console.error("❌ خطأ فادح:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
