import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const DB_PATH = path.join(process.cwd(), "prisma", "dev.db"); // Assuming SQLite default from schema
const BACKUP_DIR = path.join(process.cwd(), "backups");
const RETENTION_DAYS = 7;

async function backup() {
  console.log("📦 Starting Database Backup...");

  // 1. Ensure Backup Directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // 2. Create Backup Filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.db`);

  // 3. Perform Copy (SQLite is a file, simple copy works if WAL is handled, usually safe for dev.db in low traffic or use sqlite3 .backup)
  // Ideally use sqlite3 CLI: sqlite3 prisma/dev.db ".backup 'backups/backup.db'"
  // But copy is simpler for node script without external deps assumption.
  // For production hardness, we try to use copyFile.

  try {
    fs.copyFileSync(DB_PATH, backupFile);
    console.log(`✅ Backup created: ${backupFile}`);
  } catch (error) {
    console.error("❌ Backup failed:", error);
    process.exit(1);
  }

  // 4. Retention Policy (Cleanup old backups)
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();

    files.forEach((file) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const daysOld = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

      if (daysOld > RETENTION_DAYS) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted old backup: ${file}`);
      }
    });
  } catch (e) {
    console.warn("⚠️ Cleanup warning:", e);
  }
}

backup();
