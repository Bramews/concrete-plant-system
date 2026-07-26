const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanAndReseed() {
  console.log("=== حذف الأدوار القديمة ===\n");

  const oldRoles = [
    "MANAGER",
    "DEPARTMENT_MANAGER",
    "ENGINEER",
    "TECHNICIAN",
    "DRIVER",
    "DISPATCHER",
  ];

  for (const roleName of oldRoles) {
    try {
      const deleted = await prisma.role.deleteMany({
        where: {
          name: roleName,
          companyId: null,
        },
      });
      console.log(`حذف ${roleName}: ${deleted.count} سجل`);
    } catch (error) {
      console.log(`خطأ في حذف ${roleName}:`, error.message);
    }
  }

  console.log("\n=== الأدوار المتبقية ===\n");
  const remaining = await prisma.role.findMany({
    where: { companyId: null },
    orderBy: { name: "asc" },
  });

  remaining.forEach((r) => {
    console.log(`- ${r.name} (${r.displayName})`);
  });

  console.log(`\nالمجموع: ${remaining.length} دور`);

  await prisma.$disconnect();
}

cleanAndReseed().catch(console.error);
