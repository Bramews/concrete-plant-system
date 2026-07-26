const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function deactivateUser() {
  try {
    const updated = await prisma.user.update({
      where: { username: "cube" },
      data: { status: "PENDING" },
    });

    console.log("✅ User cube deactivated (status set to PENDING)");
    console.log("   Username:", updated.username);
    console.log("   Status:", updated.status);
    console.log("\n📝 Now activate the user from System Owner panel");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deactivateUser();
