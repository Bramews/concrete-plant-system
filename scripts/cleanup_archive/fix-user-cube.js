const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixUser() {
  try {
    console.log("===== CHECKING USER CUBE =====\n");

    // 1. Find user
    const user = await prisma.user.findFirst({
      where: { username: "cube" },
      include: {
        company: true,
        memberships: {
          include: { role: true, company: true },
        },
      },
    });

    if (!user) {
      console.log("❌ USER NOT FOUND");
      return;
    }

    console.log("✅ User found:");
    console.log("   ID:", user.id);
    console.log("   Username:", user.username);
    console.log("   Status:", user.status);
    console.log("   Company ID:", user.companyId);
    console.log("   Company:", user.company ? user.company.name : "NONE");
    console.log("   Memberships:", user.memberships.length);

    // 2. Check memberships
    if (user.memberships.length === 0) {
      console.log("\n⚠️  NO MEMBERSHIPS FOUND");

      // Get a company (any company or create one)
      let company = await prisma.company.findFirst();

      if (!company) {
        console.log("   Creating test company...");
        company = await prisma.company.create({
          data: {
            name: "Test Company",
            slug: "test",
            status: "ACTIVE",
          },
        });
        console.log("   ✅ Company created:", company.id);
      }

      // Get MANAGER role or create it
      let managerRole = await prisma.role.findFirst({
        where: { name: "MANAGER", companyId: company.id },
      });

      if (!managerRole) {
        // Try system role
        managerRole = await prisma.role.findFirst({
          where: { name: "MANAGER", isSystem: true },
        });
      }

      if (!managerRole) {
        console.log("   Creating MANAGER role...");
        managerRole = await prisma.role.create({
          data: {
            name: "MANAGER",
            companyId: company.id,
            isSystem: false,
          },
        });
        console.log("   ✅ MANAGER role created");
      }

      // Create membership
      console.log("   Creating membership...");
      await prisma.membership.create({
        data: {
          userId: user.id,
          companyId: company.id,
          roleId: managerRole.id,
          status: "ACTIVE",
        },
      });
      console.log("   ✅ Membership created");

      // Update user companyId if missing
      if (!user.companyId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { companyId: company.id },
        });
        console.log("   ✅ User companyId updated");
      }
    } else {
      console.log("\n✅ Memberships exist:");
      user.memberships.forEach((m, i) => {
        console.log(
          `   ${i + 1}. Role: ${m.role.name}, Company: ${m.company.name}, Status: ${m.status}`,
        );
      });
    }

    // 3. Verify final state
    const updatedUser = await prisma.user.findFirst({
      where: { username: "cube" },
      include: {
        company: true,
        memberships: {
          include: { role: true, company: true },
        },
      },
    });

    console.log("\n===== FINAL STATE =====");
    console.log("User ID:", updatedUser.id);
    console.log("Username:", updatedUser.username);
    console.log("Status:", updatedUser.status);
    console.log("Company ID:", updatedUser.companyId);
    console.log("Memberships:", updatedUser.memberships.length);
    console.log("\n✅ USER CUBE IS READY FOR LOGIN");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUser();
