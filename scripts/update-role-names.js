const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateRoleDisplayNames() {
  console.log("Updating role display names...");

  try {
    // Update COMPANY_ADMIN to "الإدارة"
    const role = await prisma.role.findFirst({
      where: { name: "COMPANY_ADMIN" },
    });

    if (role) {
      await prisma.role.update({
        where: { id: role.id },
        data: { displayName: "الإدارة" },
      });
      console.log('✅ Updated COMPANY_ADMIN display name to "الإدارة"');
    } else {
      console.log("⚠️ Role COMPANY_ADMIN not found.");
      // Create it if missing? Better not, just update if exists.
    }

    // Verify User 55 Role
    const user55 = await prisma.user.findUnique({
      where: { id: 55 },
      include: { memberships: { include: { role: true } } },
    });

    if (user55) {
      console.log(
        `User 55 Role: ${user55.memberships[0]?.role.displayName} (${user55.memberships[0]?.role.name})`,
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRoleDisplayNames();
