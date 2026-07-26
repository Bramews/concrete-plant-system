const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting User Data Cleanup...");

  // Find all users who have a companyId set
  const usersWithCompany = await prisma.user.findMany({
    where: { NOT: { companyId: null } },
    include: { memberships: true },
  });

  console.log(
    `🔍 Found ${usersWithCompany.length} users with company association.`,
  );

  let fixCount = 0;

  for (const user of usersWithCompany) {
    // Check if there is an active membership for this companyId
    const activeMembership = user.memberships.find(
      (m) => m.companyId === user.companyId && !m.deletedAt,
    );

    if (!activeMembership) {
      console.log(
        `⚠️  User [${user.username}] has companyId ${user.companyId} but NO active membership. Nullifying...`,
      );
      await prisma.user.update({
        where: { id: user.id },
        data: { companyId: null },
      });
      fixCount++;
    }
  }

  console.log(`✅ Cleanup Complete. Fixed ${fixCount} orphaned associations.`);
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
