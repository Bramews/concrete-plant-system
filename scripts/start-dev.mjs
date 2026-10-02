import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// 1. Start Next.js Development Server with Turbopack Engine
console.log("================================================================");
console.log("   [CONCRETE PLANT SYSTEM] Starting Development Server...");
console.log("   Engine: Next.js 16 (Turbopack Ultra-Fast Mode)");
console.log("================================================================");

const nextProcess = spawn("npx", ["next", "dev", "--turbo"], {
  stdio: "inherit",
  shell: true,
  cwd: PROJECT_ROOT,
  env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=4096" },
});

// 2. Start Live GitHub Sync Watcher in background
console.log("[SYNC] Initializing automated GitHub live sync watcher...");
const syncProcess = spawn("node", ["scripts/git-sync-watcher.mjs"], {
  stdio: "inherit",
  shell: true,
  cwd: PROJECT_ROOT,
});

// 3. Database backup timer (delayed to 15s so server starts without I/O competition)
let backupProcess = null;
const backupTimer = setTimeout(() => {
  backupProcess = spawn("node", ["scripts/security-backup.mjs"], {
    stdio: "inherit",
    shell: true,
    cwd: PROJECT_ROOT,
  });
}, 15000);

// Exit handlers
process.on("SIGINT", () => {
  clearTimeout(backupTimer);
  nextProcess.kill("SIGINT");
  if (backupProcess) backupProcess.kill("SIGINT");
  syncProcess.kill("SIGINT");
  process.exit();
});
process.on("SIGTERM", () => {
  clearTimeout(backupTimer);
  nextProcess.kill("SIGTERM");
  if (backupProcess) backupProcess.kill("SIGTERM");
  syncProcess.kill("SIGTERM");
  process.exit();
});



