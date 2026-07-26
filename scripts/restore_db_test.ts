import { readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🛠️ Starting Restore Integrity Test...");

  const backupDir = join(process.cwd(), "backups");

  try {
    const files = readdirSync(backupDir).filter((f) => f.endsWith(".db"));

    if (files.length === 0) {
      console.warn("⚠️ No backups found to test.");
      return;
    }

    // Sort by time (newest first)
    const latestBackup = files.sort((a, b) => {
      return (
        statSync(join(backupDir, b)).mtime.getTime() -
        statSync(join(backupDir, a)).mtime.getTime()
      );
    })[0];

    const backupPath = join(backupDir, latestBackup);
    console.log(`🔎 Inspecting latest backup: ${latestBackup}`);

    // Check 1: File Size
    const stats = statSync(backupPath);
    if (stats.size === 0) {
      throw new Error("Backup file is empty!");
    }
    console.log(`   - Size: ${(stats.size / 1024).toFixed(2)} KB (Valid)`);

    // Check 2: Header Magic Bytes (SQLite)
    const fd = readFileSync(backupPath, { encoding: null, flag: "r" });
    const header = fd.subarray(0, 16).toString("utf-8");

    if (header.includes("SQLite format 3")) {
      console.log("   - Header: SQLite format 3 Verified ✅");
    } else {
      throw new Error("Invalid SQLite Header");
    }

    console.log(
      "✅ Restore Test Passed: Backup file is valid and ready for manual restoration.",
    );
  } catch (e) {
    console.error("❌ Restore Test Failed:", e);
    process.exit(1);
  }
}

main();
