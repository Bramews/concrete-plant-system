const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    const result = await prisma.user.updateMany({
      where: { status: "PENDING" },
      data: { status: "ACTIVE" },
    });
    console.log(
      `SUCCESS: Updated ${result.count} users from PENDING to ACTIVE`,
    );

    const check = await prisma.user.findMany({
      where: { status: "PENDING" },
      select: { username: true },
    });
    console.log(`Remaining PENDING users: ${check.length}`);
  } catch (e) {
    console.error("ERROR:", e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
