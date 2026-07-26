const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- START FORCE FIX ---");

  const companyId = 3;

  // 1. Ensure Roles exist and are System Roles with Arabic names
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
    console.log(`Ensuring role: ${r.name}`);
    await prisma.role.upsert({
      where: { name: r.name },
      update: {
        displayName: r.display,
        isSystem: true,
        companyId: null, // Global roles
      },
      create: {
        name: r.name,
        displayName: r.display,
        isSystem: true,
      },
    });
  }

  // 2. Fix Company 3 Users
  const users = await prisma.user.findMany({
    where: { companyId: companyId },
  });

  console.log(
    `Found ${users.length} users for Company 3. Checking memberships...`,
  );

  const adminRole = await prisma.role.findUnique({
    where: { name: "COMPANY_ADMIN" },
  });

  for (const u of users) {
    const membership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId: u.id, companyId: companyId } },
    });

    if (!membership) {
      console.log(`Creating missing membership for ${u.email}`);
      await prisma.membership.create({
        data: {
          userId: u.id,
          companyId: companyId,
          roleId: adminRole.id,
          status: "ACTIVE",
        },
      });
    } else if (membership.deletedAt) {
      console.log(`Restoring deleted membership for ${u.email}`);
      await prisma.membership.update({
        where: { id: membership.id },
        data: { deletedAt: null, status: "ACTIVE" },
      });
    }
  }

  console.log("--- FORCE FIX COMPLETED ---");
}

main().finally(() => prisma.$disconnect());
