const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function linkUserToCompany() {
  const targetCompanyId = 2; // From screenshot
  const targetUsername = "cube";

  try {
    // 1. Get User
    const user = await prisma.user.findFirst({
      where: { username: targetUsername },
    });

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("User found:", user.username, "ID:", user.id);

    // 2. Get Role (MANAGER)
    let role = await prisma.role.findFirst({
      where: {
        name: "MANAGER",
        companyId: targetCompanyId,
      },
    });

    if (!role) {
      console.log("Creating MANAGER role for company 2...");
      role = await prisma.role.create({
        data: {
          name: "MANAGER",
          displayName: "مدير مصنع",
          companyId: targetCompanyId,
          isSystem: false,
        },
      });
    }

    // 3. Upsert Membership
    console.log("Upserting membership...");
    const membership = await prisma.membership.upsert({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: targetCompanyId,
        },
      },
      update: {
        status: "ACTIVE",
        deletedAt: null,
        roleId: role.id,
      },
      create: {
        userId: user.id,
        companyId: targetCompanyId,
        roleId: role.id,
        status: "ACTIVE",
      },
    });

    console.log("✅ Membership secured:", membership);

    // 4. Update User companyId
    await prisma.user.update({
      where: { id: user.id },
      data: { companyId: targetCompanyId },
    });
    console.log("✅ User companyId updated to 2");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

linkUserToCompany();
