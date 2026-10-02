import { spawn, exec } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const nextBin = path.join(PROJECT_ROOT, "node_modules", "next", "dist", "bin", "next");

// Auto-clean stale production build in .next to prevent Turbopack Rust task graph panic
const buildIdPath = path.join(PROJECT_ROOT, ".next", "BUILD_ID");
if (fs.existsSync(buildIdPath)) {
  console.log("[DEV] Cleaning stale production build to ensure clean Turbopack startup...");
  try {
    fs.rmSync(path.join(PROJECT_ROOT, ".next"), { recursive: true, force: true });
  } catch (_) {}
}

const isAppMode = process.env.APP_MODE === "true" || process.argv.includes("--app");
const shouldOpenBrowser = process.env.NO_BROWSER !== "true" && !process.argv.includes("--no-browser");

console.log("================================================================");
console.log("   [CONCRETE PLANT SYSTEM] Starting Development Server...");
console.log("   Engine: Next.js 16 (Turbopack Hot-Reload Development Mode)");
console.log("================================================================");

// 1. Launch Next.js with Turbopack (no shell: true to prevent DEP0190)
const nextProcess = spawn(process.execPath, [nextBin, "dev", "--turbo"], {
  stdio: "inherit",
  cwd: PROJECT_ROOT,
  env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=4096" },
});

// 2. Optional: Live GitHub Sync Watcher (Disabled by default to keep Turbopack 100% lightweight)
const enableSync = process.argv.includes("--sync") || process.env.ENABLE_SYNC === "true";
let syncProcess = null;
if (enableSync) {
  console.log("[SYNC] Starting GitHub Live Sync Watcher...");
  const syncScript = path.join(PROJECT_ROOT, "scripts", "git-sync-watcher.mjs");
  syncProcess = spawn(process.execPath, [syncScript], {
    stdio: "inherit",
    cwd: PROJECT_ROOT,
  });
}

// 3. Automated Browser Opening
function openBrowser(url, appMode = false) {
  if (appMode) {
    const cmd = `powershell -NoProfile -WindowStyle Hidden -Command "if (Test-Path 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe') { Start-Process 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' -ArgumentList '--app=${url}' } elseif (Test-Path 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe') { Start-Process 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe' -ArgumentList '--app=${url}' } elseif (Test-Path 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe') { Start-Process 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' -ArgumentList '--app=${url}' } else { Start-Process '${url}' }"`;
    exec(cmd);
  } else {
    exec(`start "" "${url}"`);
  }
}

if (shouldOpenBrowser) {
  (async () => {
    const baseUrl = "http://127.0.0.1:3000";
    let isReady = false;

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 600));
      try {
        const ping = await fetch(`${baseUrl}/api/health`);
        if (ping.status === 200 || ping.status === 503) {
          isReady = true;
          break;
        }
      } catch (_) {}
    }

    if (isReady) {
      console.log(`[DEV] Server ready! Launching ${isAppMode ? "Desktop App window" : "browser"}...`);
      openBrowser("http://localhost:3000/login", isAppMode);
    }
  })();
}

// 4. Optional: Background Database Backup (Disabled by default during dev for maximum speed)
const enableBackup = process.argv.includes("--backup") || process.env.ENABLE_BACKUP === "true";
let backupProcess = null;
let backupTimer = null;
if (enableBackup) {
  backupTimer = setTimeout(() => {
    const backupScript = path.join(PROJECT_ROOT, "scripts", "security-backup.mjs");
    backupProcess = spawn(process.execPath, [backupScript], {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
    });
  }, 25000);
}

// Process Exit Handlers
process.on("SIGINT", () => {
  if (backupTimer) clearTimeout(backupTimer);
  nextProcess.kill("SIGINT");
  if (backupProcess) backupProcess.kill("SIGINT");
  if (syncProcess) syncProcess.kill("SIGINT");
  process.exit();
});

process.on("SIGTERM", () => {
  if (backupTimer) clearTimeout(backupTimer);
  nextProcess.kill("SIGTERM");
  if (backupProcess) backupProcess.kill("SIGTERM");
  if (syncProcess) syncProcess.kill("SIGTERM");
  process.exit();
});
