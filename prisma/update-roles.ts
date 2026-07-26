import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Updating Roles to Arabic and Adding Missing Roles...");

  const rolesToUpdate = [
    { name: "COMPANY_ADMIN", displayName: "مدير الشركة" },
    { name: "DEPARTMENT_MANAGER", displayName: "مدير قسم" },
    { name: "OPERATOR", displayName: "مشغل لوحة" },
    { name: "SALES", displayName: "مندوب مبيعات" },
    { name: "LAB_TECH", displayName: "فني مختبر" },
    { name: "SYSTEM_OWNER", displayName: "مالك النظام" }, // Keep distinct
  ];

  const newRoles = [
    { name: "ENGINEER", displayName: "مهندس مدني" },
    { name: "WORKER", displayName: "عامل" },
    { name: "GUARD", displayName: "حارس أمن" },
    { name: "AUDITOR", displayName: "مدقق حسابات" },
    { name: "ACCOUNTANT", displayName: "محاسب" },
    { name: "DRIVER", displayName: "سائق" },
    { name: "DISPATCHER", displayName: "مسؤول حركة" },
  ];

  // 1. Update existing roles
  for (const role of rolesToUpdate) {
    const existing = await prisma.role.findUnique({
      where: { name: role.name },
    });
    if (existing) {
      await prisma.role.update({
        where: { name: role.name },
        data: { displayName: role.displayName },
      });
      console.log(`✅ Updated ${role.name} to ${role.displayName}`);
    }
  }

  // 2. Create new roles
  for (const role of newRoles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { displayName: role.displayName },
      create: {
        name: role.name,
        displayName: role.displayName,
        isSystem: true,
      },
    });
    console.log(`✨ Upserted ${role.name} as ${role.displayName}`);
  }

  console.log("🎉 Roles updated successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
