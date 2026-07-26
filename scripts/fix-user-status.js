require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixUser() {
  const username = "cube";
  console.log(`🔧 Fixing User: ${username}`);

  try {
    const user = await prisma.user.update({
      where: { username },
      data: { status: "ACTIVE" },
    });
    console.log(`✅ User ${username} is now ACTIVE.`);
  } catch (err) {
    console.error(`❌ Failed to update user:`, err.message);
  }
}

fixUser()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
