// Backup System Active: Autonomous Protection Mode
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const WATCH_DIRS = ["app", "components", "lib", "prisma", "scripts"];
const BACKUP_SCRIPT = path.join(__dirname, "security-backup.mjs");

let isBackingUp = false;
let timeout = null;

console.log("👀 Starting Proactive Backup Watcher...");
console.log(`📂 Watching: ${WATCH_DIRS.join(", ")}`);

function triggerBackup() {
  if (isBackingUp) return;

  isBackingUp = true;
  console.log("\n⚡ Change detected! Initializing automated safety backup...");

  try {
    // Run the backup script using node
    const child = spawn("node", [BACKUP_SCRIPT], {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      isBackingUp = false;
      if (code === 0) {
        console.log("✅ Automated backup completed. System is protected.");
      } else {
        console.error(
          `❌ Backup watcher encountered an error (Exit code: ${code})`,
        );
      }
      console.log("\n👀 Resuming watcher...");
    });
  } catch (err) {
    console.error("❌ Failed to trigger backup:", err.message);
    isBackingUp = false;
  }
}

// Debounce logic: wait for 2 seconds of silence before backing up to avoid multiple hits during a save session
function debouncedBackup() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(triggerBackup, 2000);
}

WATCH_DIRS.forEach((dir) => {
  const fullPath = path.join(PROJECT_ROOT, dir);
  if (fs.existsSync(fullPath)) {
    fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
      if (
        filename &&
        !filename.includes(".next") &&
        !filename.includes("node_modules")
      ) {
        debouncedBackup();
      }
    });
  }
});

console.log(
  "🚀 Watcher is active. Any modification will trigger an automatic snapshot.",
);
