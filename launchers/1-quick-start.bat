@echo off
chcp 65001 >nul
title مصنع الخرسانة - التشغيل السريع المباشر
color 0A
echo ================================================================
echo    🚀 جاري تشغيل مصنع الخرسانة الجاهزة (وضع سريع مباشر)
echo    🔄 السيرفر المحلي + النسخ الاحتياطي + المزامنة اللحظية مع GitHub
echo ================================================================
echo.
cd /d "d:\concrete-plant-system"
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000/login'"
node scripts/start-app.mjs
echo.
echo ⚠️ تم إيقاف السيرفر.
pause
