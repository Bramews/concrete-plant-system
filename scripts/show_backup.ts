import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  try {
    const b = await prisma.backupRecord.findFirst({
      orderBy: { timestamp: "desc" },
    });
    console.log("---RESULT_START---");
    console.log("BACKUP_FILENAME:", b?.filename || "NONE");
    console.log("---RESULT_END---");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
