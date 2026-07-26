import { PrismaClient } from "@prisma/client";
import fs from "fs";
const prisma = new PrismaClient();
async function main() {
  const b = await prisma.backupRecord.findFirst({
    orderBy: { timestamp: "desc" },
  });
  const content = b ? b.filename : "NO_BACKUP_FOUND";
  fs.writeFileSync("last_backup_name.txt", content);
  await prisma.$disconnect();
}
main();
