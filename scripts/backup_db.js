const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🔒 Starting Secure Database Backup (JS Mode)...");

  // Adjust path: scripts/backup_db.js -> implies CWD matches
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const backupDir = path.join(process.cwd(), "backups");

  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Database not found at: ${dbPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log("📂 Created backups directory.");
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `backup_${timestamp}.db`;
  const destination = path.join(backupDir, backupName);

  try {
    fs.copyFileSync(dbPath, destination);
    console.log(`✅ Database snapshot created: ${backupName}`);

    const systemOwner = await prisma.user.findFirst({
      where: { role: "SYSTEM_OWNER" },
    });

    if (systemOwner) {
      await prisma.auditLog.create({
        data: {
          action: "SYSTEM_BACKUP",
          entityType: "DATABASE",
          entityId: "SYSTEM",
          details: `Manual backup created: ${backupName}`,
          userId: systemOwner.id,
        },
      });
      console.log("📝 Action logged to Audit Trail.");
    }
  } catch (e) {
    console.error("❌ Backup Failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
