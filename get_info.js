const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL || "NOT SET IN ENVS");
  try {
    const session = await prisma.session.findFirst({
      where: { isRevoked: false },
      orderBy: { createdAt: "desc" },
    });

    if (session) {
      console.log("Session User ID:", session.userId);
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, username: true, status: true },
      });
      console.log("Runtime User:", JSON.stringify(user, null, 2));
    } else {
      console.log("No active session found.");
    }
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
