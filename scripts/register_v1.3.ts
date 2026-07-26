import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const filename = "backup_v1.3.db";
  const filePath = path.join(process.cwd(), "backups", filename);

  if (!fs.existsSync(filePath)) {
    console.error("Backup file not found!");
    process.exit(1);
  }

  const stats = fs.statSync(filePath);

  await prisma.backupRecord.create({
    data: {
      filename,
      sizeBytes: stats.size,
      status: "COMPLETED",
      timestamp: new Date(),
      testStatus: "UNTESTED",
    },
  });

  console.log("Registered backup v1.3 in database.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
