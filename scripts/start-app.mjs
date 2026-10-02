import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

console.log("================================================================");
console.log("   [CONCRETE PLANT SYSTEM] Starting Ultra-Fast Production Mode...");
console.log("   Production Server + Automated Live GitHub Sync");
console.log("================================================================");
console.log("");

// 1. Verify build bundle exists
const nextBuildDir = path.join(PROJECT_ROOT, ".next");
if (!fs.existsSync(nextBuildDir)) {
  console.log("[BUILD] Initializing build bundle for maximum performance...");
  const { execSync } = await import("child_process");
  execSync("npm run build", { stdio: "inherit", cwd: PROJECT_ROOT });
}

// 2. Start Next.js production server
console.log("[START] Launching production server...");
const serverProcess = spawn("npx", ["next", "start"], {
  stdio: "inherit",
  shell: true,
  cwd: PROJECT_ROOT,
  env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=4096" },
});

// 3. Start Live GitHub Sync Watcher
console.log("[SYNC] Starting GitHub live sync watcher...");
const syncProcess = spawn("node", ["scripts/git-sync-watcher.mjs"], {
  stdio: "inherit",
  shell: true,
  cwd: PROJECT_ROOT,
});

// 4. Initial database backup (delayed by 10s so server starts without I/O contention)
let backupProcess = null;
const backupTimer = setTimeout(() => {
  backupProcess = spawn("node", ["scripts/security-backup.mjs"], {
    stdio: "inherit",
    shell: true,
    cwd: PROJECT_ROOT,
  });
}, 10000);

process.on("SIGINT", () => {
  clearTimeout(backupTimer);
  serverProcess.kill("SIGINT");
  syncProcess.kill("SIGINT");
  if (backupProcess) backupProcess.kill("SIGINT");
  process.exit();
});
process.on("SIGTERM", () => {
  clearTimeout(backupTimer);
  serverProcess.kill("SIGTERM");
  syncProcess.kill("SIGTERM");
  if (backupProcess) backupProcess.kill("SIGTERM");
  process.exit();
});
