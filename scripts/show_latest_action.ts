import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  try {
    const log = await prisma.auditLog.findFirst({
      where: {
        OR: [
          { action: { contains: "BACKUP" } },
          { action: { contains: "SNAPSHOT" } },
        ],
      },
      orderBy: { timestamp: "desc" },
    });
    console.log("---LOG_RESULT_START---");
    console.log("LATEST_ACTION:", log?.action);
    console.log("DETAILS:", log?.details);
    console.log("TIMESTAMP:", log?.timestamp);
    console.log("---LOG_RESULT_END---");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
