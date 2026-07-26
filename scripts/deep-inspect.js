const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

async function main() {
  console.log("--- ENVIRONMENT CHECK ---");
  console.log("DATABASE_URL:", process.env.DATABASE_URL);

  const prisma = new PrismaClient();

  try {
    const cubes = await prisma.user.findMany({
      where: { username: "cube" },
      select: { id: true, username: true, status: true },
    });

    console.log("\n--- 'cube' USER STATUS ---");
    if (cubes.length === 0) {
      console.log("No user with username 'cube' found.");
    } else {
      cubes.forEach((user) => {
        console.log(
          `ID: ${user.id}, Username: ${user.username}, Status: ${user.status}`,
        );
      });
    }
  } catch (error) {
    console.error("\n--- ERROR DURING QUERY ---");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
