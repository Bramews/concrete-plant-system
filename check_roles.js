const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkRoles() {
  console.log("=== جميع الأدوار في قاعدة البيانات ===\n");

  const roles = await prisma.role.findMany({
    orderBy: { id: "asc" },
  });

  console.log(`العدد الإجمالي: ${roles.length} دور\n`);

  roles.forEach((r) => {
    console.log(`${r.id}. ${r.name}`);
    console.log(`   - isSystem: ${r.isSystem}`);
    console.log(`   - isSovereign: ${r.isSovereign}`);
    console.log(`   - companyId: ${r.companyId || "NULL"}`);
    console.log(`   - displayName: ${r.displayName || "لا يوجد"}`);
    console.log("");
  });

  await prisma.$disconnect();
}

checkRoles().catch(console.error);
