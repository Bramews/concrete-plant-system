// Instant Live GitHub Sync Watcher
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const WATCH_DIRS = [
  "app",
  "components",
  "lib",
  "prisma",
  "scripts",
  "docs",
  ".agent",
  ".agents",
];

const IGNORE_PATTERNS = [
  ".next",
  "node_modules",
  ".git",
  "test-results",
  ".last-run",
  ".tmp",
  "backups",
];

let isSyncing = false;
let timeout = null;

console.log("[SYNC] Starting GitHub Live Sync Watcher...");
console.log(`[SYNC] Watched directories: ${WATCH_DIRS.join(", ")}`);

async function performSync() {
  if (isSyncing) return;
  isSyncing = true;

  const now = new Date().toISOString().replace("T", " ").substring(0, 19);
  console.log(`\n[SYNC] [${now}] File change detected. Syncing with GitHub...`);

  try {
    // 1. Check uncommitted changes
    const statusOutput = execSync("git status --porcelain", {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
    }).trim();

    if (!statusOutput) {
      console.log("[SYNC] No new changes to sync.");
      isSyncing = false;
      return;
    }

    // 2. Add changes excluding temporary files
    execSync("git add .agent/ .agents/ app/ components/ lib/ docs/ scripts/ CONSTITUTION.md RULES.md", {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
    });

    // Check staged diff
    const stagedCheck = execSync("git diff --staged --name-only", {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
    }).trim();

    if (stagedCheck) {
      // 3. Commit with timestamp
      const commitMsg = `chore(sync): automated instant live sync at ${now} [skip ci]`;
      execSync(`git commit -m "${commitMsg}"`, {
        cwd: PROJECT_ROOT,
        stdio: "pipe",
      });
      console.log(`[SYNC] Local changes committed successfully.`);

      // 4. Push to remote
      console.log(`[SYNC] Pushing to GitHub (origin/main)...`);
      execSync("git push origin main", {
        cwd: PROJECT_ROOT,
        stdio: "pipe",
        timeout: 30000,
      });
      console.log(`[SYNC] [${now}] Sync and push to GitHub completed successfully!`);
    } else {
      console.log("[SYNC] Changes were in ignored temporary files.");
    }
  } catch (err) {
    console.error("[SYNC] Warning during sync:", err.message);
  } finally {
    isSyncing = false;
    console.log("[SYNC] Watcher active and listening for changes...\n");
  }
}

function debouncedSync() {
  if (timeout) clearTimeout(timeout);
  // Wait 3s after last modification
  timeout = setTimeout(performSync, 3000);
}

WATCH_DIRS.forEach((dir) => {
  const fullPath = path.join(PROJECT_ROOT, dir);
  if (fs.existsSync(fullPath)) {
    fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
      if (filename) {
        const isIgnored = IGNORE_PATTERNS.some((p) => filename.includes(p));
        if (!isIgnored) {
          debouncedSync();
        }
      }
    });
  }
});

console.log("[SYNC] Live sync watcher initialized: changes will be committed and pushed automatically.");
