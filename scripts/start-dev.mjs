import { spawn, exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const nextBin = path.join(PROJECT_ROOT, "node_modules", "next", "dist", "bin", "next");

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

// 2. Launch Live GitHub Sync Watcher
console.log("[SYNC] Starting GitHub Live Sync Watcher...");
const syncScript = path.join(PROJECT_ROOT, "scripts", "git-sync-watcher.mjs");
const syncProcess = spawn(process.execPath, [syncScript], {
  stdio: "inherit",
  cwd: PROJECT_ROOT,
});

// 3. Automated Pre-warming and Browser Opening
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
      console.log("[DEV] Server ready! Pre-compiling login interface for instant display...");
      const start = Date.now();
      try {
        await fetch(`${baseUrl}/login`);
        console.log(`[DEV] Login interface compiled successfully in ${Date.now() - start} ms.`);
      } catch (_) {}
      console.log(`[DEV] Launching ${isAppMode ? "Desktop App window" : "browser"}...`);
      openBrowser("http://localhost:3000/login", isAppMode);
    }
  })();
}

// 4. Background Database Backup (delayed to 20s to ensure clean startup)
let backupProcess = null;
const backupTimer = setTimeout(() => {
  const backupScript = path.join(PROJECT_ROOT, "scripts", "security-backup.mjs");
  backupProcess = spawn(process.execPath, [backupScript], {
    stdio: "inherit",
    cwd: PROJECT_ROOT,
  });
}, 20000);

// Process Exit Handlers
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
