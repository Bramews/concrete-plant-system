const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findFirst({
      where: { username: "cube" },
      include: {
        company: true,
        memberships: {
          include: {
            role: true,
            company: true,
          },
        },
      },
    });

    console.log("===== USER CUBE DATA =====");
    console.log(JSON.stringify(user, null, 2));

    if (user) {
      console.log("\n===== ANALYSIS =====");
      console.log("User ID:", user.id);
      console.log("Username:", user.username);
      console.log("Status:", user.status);
      console.log("Company ID:", user.companyId);
      console.log("Company:", user.company ? user.company.name : "NONE");
      console.log("Memberships Count:", user.memberships.length);

      user.memberships.forEach((m, i) => {
        console.log(`\nMembership ${i + 1}:`);
        console.log("  - Role:", m.role.name);
        console.log("  - Company:", m.company.name);
        console.log("  - Status:", m.status);
        console.log("  - Deleted:", m.deletedAt);
      });
    } else {
      console.log("USER NOT FOUND!");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
