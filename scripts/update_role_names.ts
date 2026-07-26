import { prisma } from "./lib/prisma";

async function main() {
  console.log("Updating Roles to Arabic...");

  const updates = {
    COMPANY_ADMIN: "مدير الشركة",
    DEPARTMENT_MANAGER: "مدير قسم",
    OPERATOR: "مشغل",
    SALES_REPRESENTATIVE: "مندوب مبيعات",
    LAB_TECHNICIAN: "فني مختبر",
    ACCOUNTANT: "محاسب",
    DISPATCHER: "مسؤول الحركة",
    DRIVER: "سائق",
    SYSTEM_OWNER: "مالك النظام",
  };

  for (const [key, value] of Object.entries(updates)) {
    console.log(`Updating ${key} to ${value}`);
    try {
      await prisma.role.updateMany({
        where: { name: key },
        data: { displayName: value },
      });
    } catch (e) {
      console.error(`Failed to update ${key}`, e);
    }
  }

  // Delete "Ahmed" role if exists
  console.log("Cleaning up garbage roles...");
  await prisma.role.deleteMany({
    where: { name: "Ahmed" },
  });

  console.log("Done.");
}

main().finally(() => prisma.$disconnect());
