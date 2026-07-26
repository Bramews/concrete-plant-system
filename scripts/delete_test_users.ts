import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const deletedManager = await prisma.user.deleteMany({
      where: {
        username: {
          startsWith: "managerA-",
        },
      },
    });

    const deletedAudit = await prisma.user.deleteMany({
      where: {
        username: "audit_tester",
      },
    });

    console.log(`Deleted ${deletedManager.count} manager test users.`);
    console.log(`Deleted ${deletedAudit.count} audit test users.`);
  } catch (e) {
    console.error("Error deleting users:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
