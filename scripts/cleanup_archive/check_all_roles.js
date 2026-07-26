const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkRoles() {
  console.log("=== الأدوار في قاعدة البيانات ===\n");

  const allRoles = await prisma.role.findMany({
    orderBy: { id: "asc" },
  });

  console.log(`إجمالي الأدوار: ${allRoles.length}\n`);

  console.log("--- الأدوار النظامية (isSystem: true) ---");
  const systemRoles = allRoles.filter((r) => r.isSystem);
  systemRoles.forEach((r) => {
    console.log(`✓ ${r.name} (displayName: ${r.displayName || "لا يوجد"})`);
  });

  console.log("\n--- الأدوار السيادية (isSovereign: true) ---");
  const sovereignRoles = allRoles.filter((r) => r.isSovereign);
  sovereignRoles.forEach((r) => {
    console.log(`★ ${r.name} (displayName: ${r.displayName || "لا يوجد"})`);
  });

  console.log("\n--- الأدوار غير السيادية (سيتم عرضها في القائمة) ---");
  const nonSovereignRoles = allRoles.filter((r) => !r.isSovereign);
  nonSovereignRoles.forEach((r) => {
    console.log(
      `• ${r.name} (displayName: ${r.displayName || "لا يوجد"}, isSystem: ${r.isSystem})`,
    );
  });

  await prisma.$disconnect();
}

checkRoles().catch(console.error);
