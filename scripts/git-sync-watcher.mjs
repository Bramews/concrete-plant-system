// 🔄 منظومة المزامنة اللحظية المستمرة مع GitHub (Instant Live GitHub Sync Watcher)
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

console.log("☁️ بدء تشغيل مراقب المزامنة اللحظية مع GitHub...");
console.log(`📂 المجلدات المراقبة للمزامنة: ${WATCH_DIRS.join(", ")}`);

async function performSync() {
  if (isSyncing) return;
  isSyncing = true;

  const now = new Date().toISOString().replace("T", " ").substring(0, 19);
  console.log(`\n⚡ [${now}] تم رصد تغيير في الملفات... جاري المزامنة اللحظية مع GitHub...`);

  try {
    // 1. فحص وجود تعديلات غير محفوظة
    const statusOutput = execSync("git status --porcelain", {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
    }).trim();

    if (!statusOutput) {
      console.log("ℹ️ لا توجد تغييرات جديدة للمزامنة.");
      isSyncing = false;
      return;
    }

    // 2. إضافة التغييرات المطلوبة مع استبعاد الملفات المؤقتة
    execSync("git add .agent/ .agents/ app/ components/ lib/ docs/ scripts/ CONSTITUTION.md RULES.md", {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
    });

    // فحص ما إذا كان هناك شيء staged
    const stagedCheck = execSync("git diff --staged --name-only", {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
    }).trim();

    if (stagedCheck) {
      // 3. إنشاء Commit بالبصمة الزمنية
      const commitMsg = `chore(sync): automated instant live sync at ${now} [skip ci]`;
      execSync(`git commit -m "${commitMsg}"`, {
        cwd: PROJECT_ROOT,
        stdio: "pipe",
      });
      console.log(`💾 تم حفظ التعديلات محلياً بنجاح.`);

      // 4. الرفع الفوري إلى السحابة
      console.log(`🚀 جاري الرفع الفوري إلى GitHub (origin/main)...`);
      execSync("git push origin main", {
        cwd: PROJECT_ROOT,
        stdio: "pipe",
        timeout: 30000,
      });
      console.log(`✅ [${now}] تمت المزامنة والرفع إلى GitHub بنجاح تام 100%!`);
    } else {
      console.log("ℹ️ التغييرات المرصودة تخص ملفات مؤقتة تم تجاهلها.");
    }
  } catch (err) {
    console.error("⚠️ تنبيه أثناء المزامنة اللحظية:", err.message);
  } finally {
    isSyncing = false;
    console.log("👀 مراقب المزامنة اللحظية في حالة ترقب وتأهب دائم...\n");
  }
}

function debouncedSync() {
  if (timeout) clearTimeout(timeout);
  // الانتظار 3 ثوانٍ بعد آخر تعديل لتجميع التغييرات
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

console.log("🛡️ مراقب المزامنة يعمل الآن: أي تعديل ستقوم به سيتم حفظه ورفعه لـ GitHub تلقائياً ولحظياً.");
