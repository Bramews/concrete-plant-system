import fs from "fs";
import path from "path";

const projectRoot = "d:\\concrete-plant-system";
const launchersDir = path.join(projectRoot, "launchers");

if (!fs.existsSync(launchersDir)) {
  fs.mkdirSync(launchersDir, { recursive: true });
}

// 1. السكربت الأول: التشغيل السريع المباشر
const script1 = [
  "@echo off",
  "chcp 65001 >nul",
  "title مصنع الخرسانة - التشغيل السريع المباشر",
  "color 0A",
  "echo ================================================================",
  "echo    🚀 جاري تشغيل مصنع الخرسانة الجاهزة (وضع سريع مباشر)",
  "echo    🔄 السيرفر المحلي + النسخ الاحتياطي + المزامنة اللحظية مع GitHub",
  "echo ================================================================",
  "echo.",
  'cd /d "d:\\concrete-plant-system"',
  'start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process \'http://localhost:3000/login\'"',
  "node scripts/start-app.mjs",
  "echo.",
  "echo ⚠️ تم إيقاف السيرفر.",
  "pause",
].join("\r\n") + "\r\n";

// 2. السكربت الثاني: وضع التطبيق المستقل
const script2 = [
  "@echo off",
  "chcp 65001 >nul",
  "title مصنع الخرسانة - تشغيل كتطبيق مستقل",
  "color 0B",
  "echo ================================================================",
  "echo    💻 جاري تشغيل مصنع الخرسانة الجاهزة (كتطبيق مكتبي مستقل)",
  "echo    ✨ نافذة أنيقة ومستقلة بدون أشرطة المتصفح المشتتة",
  "echo    🔄 السيرفر المحلي + النسخ الاحتياطي + المزامنة اللحظية",
  "echo ================================================================",
  "echo.",
  'cd /d "d:\\concrete-plant-system"',
  'start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; if (Test-Path \'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe\') { Start-Process \'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe\' -ArgumentList \'--app=http://localhost:3000/login\' } elseif (Test-Path \'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe\') { Start-Process \'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe\' -ArgumentList \'--app=http://localhost:3000/login\' } elseif (Test-Path \'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\') { Start-Process \'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\' -ArgumentList \'--app=http://localhost:3000/login\' } else { Start-Process \'http://localhost:3000/login\' }"',
  "node scripts/start-app.mjs",
  "echo.",
  "echo ⚠️ تم إيقاف السيرفر.",
  "pause",
].join("\r\n") + "\r\n";

// 3. السكربت الثالث: لوحة التحكم الشاملة
const script3 = [
  "@echo off",
  "chcp 65001 >nul",
  "title لوحة تحكم وتشغيل مصنع الخرسانة الجاهزة",
  "color 0F",
  'cd /d "d:\\concrete-plant-system"',
  "",
  ":MENU",
  "cls",
  "echo ================================================================",
  "echo           🏗️ لوحة تشغيل وتحكم نظام مصنع الخرسانة الجاهزة",
  "echo ================================================================",
  "echo.",
  "echo    [1] 🚀 تشغيل السيرفر المحلي المباشر (فتح المتصفح العادي)",
  "echo    [2] 💻 تشغيل المصنع (كتطبيق مكتبي مستقل - بدون أشرطة)",
  "echo    [3] ☁️  فتح النسخة السحابية المباشرة أونلاين (Vercel)",
  "echo    [4] 🔄 مزامنة فورية وحفظ المشروع الآن على GitHub",
  "echo    [5] 🛡️  أخذ نسخة احتياطية محلية فورية للبيانات",
  "echo    [6] 📁 فتح مجلد المشروع الرئيسي في جهازك",
  "echo    [0] ❌ خروج",
  "echo.",
  "echo ================================================================",
  "set /p choice=👉 أدخل رقم الخيار ثم اضغط Enter: ",
  "",
  'if "%choice%"=="1" goto QUICK_START',
  'if "%choice%"=="2" goto APP_START',
  'if "%choice%"=="3" goto OPEN_CLOUD',
  'if "%choice%"=="4" goto SYNC_GIT',
  'if "%choice%"=="5" goto RUN_BACKUP',
  'if "%choice%"=="6" goto OPEN_FOLDER',
  'if "%choice%"=="0" exit',
  "goto MENU",
  "",
  ":QUICK_START",
  "cls",
  "echo 🚀 جاري التشغيل في الوضع السريع...",
  'start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process \'http://localhost:3000/login\'"',
  "node scripts/start-app.mjs",
  "pause",
  "goto MENU",
  "",
  ":APP_START",
  "cls",
  "echo 💻 جاري التشغيل في وضع التطبيق المستقل...",
  'start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; if (Test-Path \'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe\') { Start-Process \'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe\' -ArgumentList \'--app=http://localhost:3000/login\' } elseif (Test-Path \'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe\') { Start-Process \'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe\' -ArgumentList \'--app=http://localhost:3000/login\' } elseif (Test-Path \'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\') { Start-Process \'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\' -ArgumentList \'--app=http://localhost:3000/login\' } else { Start-Process \'http://localhost:3000/login\' }"',
  "node scripts/start-app.mjs",
  "pause",
  "goto MENU",
  "",
  ":OPEN_CLOUD",
  "cls",
  "echo ☁️ جاري فتح النسخة السحابية على المتصفح...",
  "start https://concrete-plant-v2.vercel.app/login",
  "echo.",
  "echo تم فتح الرابط السحابي بنجاح.",
  "pause",
  "goto MENU",
  "",
  ":SYNC_GIT",
  "cls",
  "echo ================================================================",
  "echo    ☁️ جاري المزامنة والحفظ الفوري مع GitHub...",
  "echo ================================================================",
  "echo.",
  "git status --short",
  "git add -A",
  'git commit -m "حفظ يدوي من لوحة التحكم - %date% %time%" 2>nul',
  "git push origin main",
  "echo.",
  "echo ✅ تم فحص وإتمام المزامنة مع GitHub بنجاح!",
  "pause",
  "goto MENU",
  "",
  ":RUN_BACKUP",
  "cls",
  "echo 🛡️ جاري أخذ نسخة احتياطية محلية متكاملة وصورة للمشروع...",
  "set FULL_IMAGE=true",
  "node scripts/security-backup.mjs",
  "set FULL_IMAGE=false",
  "echo.",
  "echo ✅ اكتملت النسخة الاحتياطية بنجاح!",
  "pause",
  "goto MENU",
  "",
  ":OPEN_FOLDER",
  'explorer "d:\\concrete-plant-system"',
  "goto MENU",
].join("\r\n") + "\r\n";

fs.writeFileSync(path.join(launchersDir, "1-quick-start.bat"), script1, "utf8");
fs.writeFileSync(path.join(launchersDir, "2-app-mode.bat"), script2, "utf8");
fs.writeFileSync(path.join(launchersDir, "3-control-panel.bat"), script3, "utf8");

console.log("✅ تم بناء ملفات .bat بنهايات أسطر CRLF ويندوز الصحيحة بنجاح!");

// نشرها لسطح المكتب
const targetDesktops = [
  "C:\\Users\\Ahmed Aziz\\OneDrive\\Desktop",
  "C:\\Users\\Ahmed Aziz\\Desktop",
];

const filesToDeploy = [
  { src: "1-quick-start.bat", destName: "1- تشغيل المصنع (سريع ومباشر).bat" },
  { src: "2-app-mode.bat", destName: "2- تشغيل المصنع (كتطبيق مستقل).bat" },
  { src: "3-control-panel.bat", destName: "3- لوحة تحكم وتشغيل المصنع.bat" },
];

for (const desktop of targetDesktops) {
  if (fs.existsSync(desktop)) {
    console.log(`\n📁 جاري النشر إلى: ${desktop}`);
    for (const item of filesToDeploy) {
      const srcPath = path.join(launchersDir, item.src);
      const destPath = path.join(desktop, item.destName);
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✅ تم تحديث: ${item.destName}`);
    }
  }
}
