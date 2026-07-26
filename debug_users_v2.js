const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const companyId = 3;
    console.log("Checking users for company:", companyId);

    // 1. Check Memberships
    const memberships = await prisma.membership.findMany({
      where: { companyId: companyId },
      include: { user: true, role: true },
    });
    console.log("Memberships found:", memberships.length);

    // 2. Check Users with companyId directly
    const users = await prisma.user.findMany({
      where: { companyId: companyId },
    });
    console.log("Direct Users (via companyId) found:", users.length);

    if (users.length > 0 && memberships.length === 0) {
      console.log(
        "MISMATCH DETECTED: Users exist but no memberships. Attempting fix...",
      );
      const adminRole = await prisma.role.findFirst({
        where: { name: "COMPANY_ADMIN" },
      });
      const operatorRole = await prisma.role.findFirst({
        where: { name: "OPERATOR" },
      });
      const roleToUse = adminRole || operatorRole;

      if (!roleToUse) {
        console.log("Reference Role not found, cannot fix.");
        return;
      }

      for (const u of users) {
        console.log("Creating membership for:", u.email);
        await prisma.membership.create({
          data: {
            userId: u.id,
            companyId: companyId,
            roleId: roleToUse.id,
            status: "ACTIVE",
          },
        });
      }
      console.log("Fix applied.");
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
