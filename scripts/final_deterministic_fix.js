const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const rolesToEnsure = [
    { name: "COMPANY_ADMIN", display: "مدير الشركة" },
    { name: "DEPARTMENT_MANAGER", display: "مدير قسم" },
    { name: "OPERATOR", display: "مشغل" },
    { name: "SALES_REPRESENTATIVE", display: "مندوب مبيعات" },
    { name: "LAB_TECHNICIAN", display: "فني مختبر" },
    { name: "ACCOUNTANT", display: "محاسب" },
    { name: "DISPATCHER", display: "مسؤول الحركة" },
    { name: "DRIVER", display: "سائق" },
    { name: "MANAGER", display: "مدير" },
  ];

  for (const r of rolesToEnsure) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { displayName: r.display, isSystem: true, companyId: null },
      create: {
        name: r.name,
        displayName: r.display,
        isSystem: true,
        companyId: null,
      },
    });
  }

  const companyId = 3;
  const users = await prisma.user.findMany({ where: { companyId } });
  const adminRole = await prisma.role.findUnique({
    where: { name: "COMPANY_ADMIN" },
  });

  for (const u of users) {
    await prisma.membership.upsert({
      where: { userId_companyId: { userId: u.id, companyId } },
      update: { deletedAt: null, status: "ACTIVE" },
      create: {
        userId: u.id,
        companyId,
        roleId: adminRole.id,
        status: "ACTIVE",
      },
    });
  }
}

main().finally(() => prisma.$disconnect());
