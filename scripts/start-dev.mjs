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

// 3. تشغيل النسخ الاحتياطي لقاعدة البيانات بهدوء وسرعة
let backupProcess = null;
const backupTimer = setTimeout(() => {
  backupProcess = spawn("node", ["scripts/security-backup.mjs"], {
    stdio: "inherit",
    shell: true,
    cwd: PROJECT_ROOT,
  });
}, 5000);

// 4. التجهيز والتسخين المسبق لصفحات الدخول ولوحة التحكم لتفتح فوراً وبدون أي انتظار
setTimeout(async () => {
  try {
    console.log("⚡ جاري التجهيز والتسخين المسبق لصفحات الدخول ولوحة التحكم...");
    await Promise.all([
      fetch("http://localhost:3000/login").catch(() => {}),
      fetch("http://localhost:3000/system/manager/dashboard").catch(() => {}),
    ]);
    console.log("✨ اكتمل التجهيز المسبق: النظام جاهز للاستجابة اللحظية الفورية!");
  } catch (_) {}
}, 7000);

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



