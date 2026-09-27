@echo off
chcp 65001 >nul
title لوحة تحكم وتشغيل مصنع الخرسانة الجاهزة
color 0F

cd /d "d:\concrete-plant-system"

:MENU
cls
echo ================================================================
echo           🏗️ لوحة تشغيل وتحكم نظام مصنع الخرسانة الجاهزة
echo ================================================================
echo.
echo    [1] 🚀 تشغيل السيرفر المحلي المباشر (فتح المتصفح العادي)
echo    [2] 💻 تشغيل المصنع (كتطبيق مكتبي مستقل - بدون أشرطة)
echo    [3] ☁️  فتح النسخة السحابية المباشرة أونلاين (Vercel)
echo    [4] 🔄 مزامنة فورية وحفظ المشروع الآن على GitHub
echo    [5] 🛡️  أخذ نسخة احتياطية محلية فورية للبيانات
echo    [6] 📁 فتح مجلد المشروع الرئيسي في جهازك
echo    [0] ❌ خروج
echo.
echo ================================================================
set /p choice=👉 أدخل رقم الخيار ثم اضغط Enter: 

if "%choice%"=="1" goto QUICK_START
if "%choice%"=="2" goto APP_START
if "%choice%"=="3" goto OPEN_CLOUD
if "%choice%"=="4" goto SYNC_GIT
if "%choice%"=="5" goto RUN_BACKUP
if "%choice%"=="6" goto OPEN_FOLDER
if "%choice%"=="0" exit
goto MENU

:QUICK_START
cls
echo 🚀 جاري التشغيل في الوضع السريع...
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000/login'"
node scripts/start-dev.mjs
pause
goto MENU

:APP_START
cls
echo 💻 جاري التشغيل في وضع التطبيق المستقل...
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; if (Test-Path 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') { Start-Process 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' -ArgumentList '--app=http://localhost:3000/login' } elseif (Test-Path 'C:\Program Files\Microsoft\Edge\Application\msedge.exe') { Start-Process 'C:\Program Files\Microsoft\Edge\Application\msedge.exe' -ArgumentList '--app=http://localhost:3000/login' } elseif (Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe') { Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList '--app=http://localhost:3000/login' } else { Start-Process 'http://localhost:3000/login' }"
node scripts/start-dev.mjs
pause
goto MENU

:OPEN_CLOUD
cls
echo ☁️ جاري فتح النسخة السحابية على المتصفح...
start https://concrete-plant-v2.vercel.app/login
echo.
echo تم فتح الرابط السحابي بنجاح.
pause
goto MENU

:SYNC_GIT
cls
echo ================================================================
echo    ☁️ جاري المزامنة والحفظ الفوري مع GitHub...
echo ================================================================
echo.
git status --short
git add -A
git commit -m "حفظ يدوي من لوحة التحكم - %date% %time%" 2>nul
git push origin main
echo.
echo ✅ تم فحص وإتمام المزامنة مع GitHub بنجاح!
pause
goto MENU

:RUN_BACKUP
cls
echo 🛡️ جاري أخذ نسخة احتياطية محلية متكاملة...
node scripts/security-backup.mjs
echo.
echo ✅ اكتملت النسخة الاحتياطية بنجاح!
pause
goto MENU

:OPEN_FOLDER
explorer "d:\concrete-plant-system"
goto MENU
