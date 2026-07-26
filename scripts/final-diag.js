const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

async function diagnose() {
  console.log("--- ABSOLUTE PATH DIAGNOSIS ---");
  const prisma = new PrismaClient();

  try {
    // Check 'cube' by username
    const cubes = await prisma.user.findMany({
      where: { username: "cube" },
      select: { id: true, username: true, status: true },
    });

    console.log("\n--- 'cube' USER RECORDS ---");
    if (cubes.length === 0) {
      console.log("No user with username 'cube' found.");
    } else {
      cubes.forEach((user) => {
        console.log(
          `ID: ${user.id}, Username: ${user.username}, Status: ${user.status}`,
        );
      });
    }

    // Check last session
    const lastSession = await prisma.session.findFirst({
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    console.log("\n--- LATEST SESSION ---");
    if (lastSession) {
      console.log(
        `SessionID: ${lastSession.id}, UserID: ${lastSession.userId}, Username: ${lastSession.user.username}, UserStatus: ${lastSession.user.status}`,
      );
    } else {
      console.log("No sessions found.");
    }
  } catch (error) {
    console.error("DIAGNOSIS ERROR:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
