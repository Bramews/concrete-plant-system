const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function diagnose() {
  console.log("--- RUNTIME DIAGNOSIS ---");

  try {
    // 1. Check current sessions
    const sessions = await prisma.session.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    console.log("\n--- RECENT SESSIONS ---");
    if (sessions.length === 0) {
      console.log("No active sessions found.");
    } else {
      sessions.forEach((s) => {
        console.log(
          `SessionID: ${s.id}, UserID: ${s.userId}, Username: ${s.user.username}, UserStatus: ${s.user.status}`,
        );
      });
    }

    // 2. Query 'cube' user directly
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
  } catch (error) {
    console.error("DIAGNOSIS ERROR:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
