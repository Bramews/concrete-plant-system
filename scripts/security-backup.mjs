import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const BACKUP_ROOT = "D:\\Backup_ConcretePlantSystem";
const getFormattedTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  let hours = now.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // Hour '0' should be '12'
  const hh = String(hours).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");

  // Format: YYYY-MM-DD_hh-mm-ss_AM-PM_ms
  return `${year}-${month}-${day}_${hh}-${mm}-${ss}_${ampm}__${ms}`;
};

const TIMESTAMP = getFormattedTimestamp();
const BACKUP_DIR = path.join(BACKUP_ROOT, TIMESTAMP);

async function run() {
  console.log(`🚀 Starting Dual Backup Mechanism [${TIMESTAMP}]...`);

  try {
    // 1. Create Target Directory
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // 2. Content Backup (Database)
    const dbPath = path.join(PROJECT_ROOT, "prisma", "dev.db");
    const dbDest = path.join(BACKUP_DIR, "content_db_backup.db");

    console.log("📦 Backing up Content (Database)...");
    fs.copyFileSync(dbPath, dbDest);
    console.log(`✅ Database backed up to: ${dbDest}`);

    // 3. System Image Backup (Codebase Snapshot)
    console.log("🖼️ Creating System Image Snapshot (Codebase)...");
    const zipPath = path.join(BACKUP_DIR, "system_image_snapshot.zip");

    // Using PowerShell Compress-Archive for native Windows zipping without extra dependencies
    // We exclude node_modules, .next, and large artifacts
    const excludeList = [
      "node_modules",
      ".next",
      ".git",
      "SystemBackups",
      "dist",
      "out",
      "dev.db",
      "dev.db-journal",
      "dev.db-wal",
      "dev.db-shm",
      "fix-user-cube.js",
      "prisma",
      "backups",
      "scratch",
      "tmp",
      "exel",
      "test-results",
      "dev.db.blank_fix",
      "dev.db.pre_restore",
      "tsconfig.tsbuildinfo",
      "artifacts",
    ];
    const excludeString = excludeList.map((item) => `'${item}'`).join(",");

    const psCommand = `
      $exclude = @(${excludeString});
      Get-ChildItem -Path '${PROJECT_ROOT}' | Where-Object { $_.Name -notin $exclude } | Compress-Archive -DestinationPath '${zipPath}' -Force;
    `;

    execSync(`powershell -Command "${psCommand.replace(/\n/g, " ")}"`, {
      stdio: "inherit",
    });
    console.log(`✅ System Image created: ${zipPath}`);

    console.log("\n✨ Dual Backup Completed Successfully!");
    console.log(`📁 Location: ${BACKUP_DIR}`);
  } catch (error) {
    console.error("❌ Backup Failed:", error.message);
    process.exit(1);
  }
}

run();
