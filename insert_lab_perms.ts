import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const permissions = [
    {
      id: "LAB_APPROVE",
      resource: "lab",
      action: "approve",
      description: "اعتماد وموافقة مختبرية للطلبيات",
    },
    {
      id: "LAB_EDIT_MOISTURE",
      resource: "lab",
      action: "edit_moisture",
      description: "تعديل نسب الرطوبة والمياه",
    },
    {
      id: "LAB_EDIT_MIX",
      resource: "lab",
      action: "edit_mix",
      description: "تعديل تصميم الخلطات وإضافة مواد",
    },
    {
      id: "LAB_DELETE",
      resource: "lab",
      action: "delete",
      description: "حذف الفحوصات والبيانات",
    },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: p.resource, action: p.action } },
      update: { description: p.description },
      create: { ...p },
    });
  }
  console.log("Permissions added successfully");
}
main().finally(() => prisma.$disconnect());
