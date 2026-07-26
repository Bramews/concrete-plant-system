const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkRoles() {
  console.log("=== الأدوار الموجودة في قاعدة البيانات ===\n");

  const roles = await prisma.role.findMany({
    where: { companyId: null },
    orderBy: { id: "asc" },
  });

  console.log(`العدد: ${roles.length}\n`);

  roles.forEach((r) => {
    console.log(`${r.id}. ${r.name} → ${r.displayName}`);
  });

  await prisma.$disconnect();
}

checkRoles().catch(console.error);
