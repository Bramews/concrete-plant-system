import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// 1. تشغيل سيرفر Next.js المباشر
console.log("🚀 بدء تشغيل المشروع (Next.js Server)...");
const nextProcess = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  shell: true,
  cwd: PROJECT_ROOT,
  env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=4096" },
});

// 2. تشغيل عملية أخذ النسخة الاحتياطية وصورة المشروع بالتوازي أثناء عمل السيرفر في نفس الشاشة
console.log("🛡️ بدء أخذ النسخة الاحتياطية وصورة المشروع بالتوازي مع تشغيل السيرفر...");
const backupProcess = spawn("node", ["scripts/security-backup.mjs"], {
  stdio: "inherit",
  shell: true,
  cwd: PROJECT_ROOT,
});

// 3. تشغيل بوت التيليغرام التفاعلي المباشر
console.log("🤖 بدء تشغيل بوت التيليغرام التفاعلي (@Mobdeaa_bot)...");
const telegramProcess = spawn("node", ["scripts/telegram-bot-service.mjs"], {
  stdio: "inherit",
  shell: true,
  cwd: PROJECT_ROOT,
});

// التعامل مع إيقاف العملية (Ctrl + C)
process.on("SIGINT", () => {
  nextProcess.kill("SIGINT");
  backupProcess.kill("SIGINT");
  telegramProcess.kill("SIGINT");
  process.exit();
});
process.on("SIGTERM", () => {
  nextProcess.kill("SIGTERM");
  backupProcess.kill("SIGTERM");
  telegramProcess.kill("SIGTERM");
  process.exit();
});



