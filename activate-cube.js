const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function activateUser() {
  try {
    const updated = await prisma.user.update({
      where: { username: "cube" },
      data: { status: "ACTIVE" },
    });

    console.log("✅ User cube activated!");
    console.log("   Username:", updated.username);
    console.log("   Status:", updated.status);
    console.log("\n🎉 You can now login!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

activateUser();
