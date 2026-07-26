const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const ahmed = await prisma.user.findFirst({
      where: { username: "Ahmed" },
    });
    console.log("Ahmed User:", JSON.stringify(ahmed, null, 2));

    const allUsers = await prisma.user.findMany();
    console.log("\nAll Users:", JSON.stringify(allUsers, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
