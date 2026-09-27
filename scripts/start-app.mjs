import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

console.log("================================================================");
console.log("   🚀 بدء تشغيل نظام مصنع الخرسانة الجاهزة (الوضع فائق السرعة)");
console.log("   ⚡ المحرك التنفيذي المباشر + المزامنة اللحظية مع GitHub");
console.log("================================================================");
console.log("");

// 1. التحقق من وجود الحزمة الجاهزة
const nextBuildDir = path.join(PROJECT_ROOT, ".next");
if (!fs.existsSync(nextBuildDir)) {
  console.log("📦 جاري بناء النظام لأول مرة لضمان أقصى سرعة...");
  const { execSync } = await import("child_process");
  execSync("npm run build", { stdio: "inherit", cwd: PROJECT_ROOT });
}

// 2. تشغيل سيرفر Next.js الفوري الجاهز
console.log("🚀 تشغيل سيرفر النظام الجاهز فائق السرعة...");
const serverProcess = spawn("npx", ["next", "start"], {
  stdio: "inherit",
  shell: true,
  cwd: PROJECT_ROOT,
  env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=4096" },
});

// 3. تشغيل مراقب المزامنة اللحظية مع GitHub
console.log("☁️ تشغيل مراقب المزامنة اللحظية مع GitHub...");
const syncProcess = spawn("node", ["scripts/git-sync-watcher.mjs"], {
  stdio: "inherit",
  shell: true,
  cwd: PROJECT_ROOT,
});

// 4. أخذ نسخة احتياطية سريعة للبيانات
const backupProcess = spawn("node", ["scripts/security-backup.mjs"], {
  stdio: "inherit",
  shell: true,
  cwd: PROJECT_ROOT,
});

process.on("SIGINT", () => {
  serverProcess.kill("SIGINT");
  syncProcess.kill("SIGINT");
  backupProcess.kill("SIGINT");
  process.exit();
});
process.on("SIGTERM", () => {
  serverProcess.kill("SIGTERM");
  syncProcess.kill("SIGTERM");
  backupProcess.kill("SIGTERM");
  process.exit();
});
