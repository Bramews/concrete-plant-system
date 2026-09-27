import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// 1. تشغيل سيرفر Next.js المباشر باستخدام محرك Webpack المستقر
console.log("🚀 بدء تشغيل سيرفر المشروع المستقر (Next.js Server)...");
const nextProcess = spawn("npx", ["next", "dev", "--webpack"], {
  stdio: "inherit",
  shell: true,
  cwd: PROJECT_ROOT,
  env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=4096" },
});

// 2. تشغيل مراقب المزامنة اللحظية مع GitHub في الخلفية
console.log("☁️ بدء تشغيل مراقب المزامنة اللحظية التلقائية مع GitHub...");
const syncProcess = spawn("node", ["scripts/git-sync-watcher.mjs"], {
  stdio: "inherit",
  shell: true,
  cwd: PROJECT_ROOT,
});

// 3. تشغيل النسخ الاحتياطي بعد ثوانٍ قليلة لضمان إقلاع السيرفر بأقصى سرعة
let backupProcess = null;
const backupTimer = setTimeout(() => {
  console.log("🛡️ بدء النسخة الاحتياطية للبيانات وصورة المشروع...");
  backupProcess = spawn("node", ["scripts/security-backup.mjs"], {
    stdio: "inherit",
    shell: true,
    cwd: PROJECT_ROOT,
  });
}, 8000);

// التعامل مع إيقاف العملية (Ctrl + C)
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



