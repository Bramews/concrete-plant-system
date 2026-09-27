@echo off
chcp 65001 >nul
title مصنع الخرسانة - تشغيل كتطبيق مستقل
color 0B
echo ================================================================
echo    💻 جاري تشغيل مصنع الخرسانة الجاهزة (كتطبيق مكتبي مستقل)
echo    ✨ نافذة أنيقة ومستقلة بدون أشرطة المتصفح المشتتة
echo    🔄 السيرفر المحلي + النسخ الاحتياطي + المزامنة اللحظية
echo ================================================================
echo.
cd /d "d:\concrete-plant-system"
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; if (Test-Path 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') { Start-Process 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' -ArgumentList '--app=http://localhost:3000/login' } elseif (Test-Path 'C:\Program Files\Microsoft\Edge\Application\msedge.exe') { Start-Process 'C:\Program Files\Microsoft\Edge\Application\msedge.exe' -ArgumentList '--app=http://localhost:3000/login' } elseif (Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe') { Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList '--app=http://localhost:3000/login' } else { Start-Process 'http://localhost:3000/login' }"
node scripts/start-dev.mjs
echo.
echo ⚠️ تم إيقاف السيرفر.
pause
