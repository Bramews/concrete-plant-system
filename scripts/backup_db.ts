import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔒 Starting Secure Database Backup...");

  const dbPath = join(process.cwd(), "prisma", "dev.db");
  const backupDir = join(process.cwd(), "backups");

  // 1. Validate Source
  if (!existsSync(dbPath)) {
    console.error(`❌ Database not found at: ${dbPath}`);
    process.exit(1);
  }

  // 2. Ensure Backup Directory
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
    console.log("📂 Created backups directory.");
  }

  // 3. Create Timestamped Snapshot
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `backup_${timestamp}.db`;
  const destination = join(backupDir, backupName);

  try {
    copyFileSync(dbPath, destination);
    console.log(`✅ Database snapshot created: ${backupName}`);

    // 4. Log to AuditLog (System Owner Action)
    // We'll attribute this to a System Action (userId NULL or specific system user if available)
    // For now, we'll assume a system-level log or find the System Owner.

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
          userId: systemOwner.id, // Attributed to owner for visibility
        },
      });
      console.log("📝 Action logged to Audit Trail.");
    } else {
      console.warn(
        "⚠️ System Owner not found. Backup allowed but not attributed.",
      );
    }
  } catch (e) {
    console.error("❌ Backup Failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
