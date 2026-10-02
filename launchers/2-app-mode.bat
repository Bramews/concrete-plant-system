@echo off
title Concrete Plant - Desktop App Mode (Ultra-Fast Production Mode)
color 0B
echo ================================================================
echo    [CONCRETE PLANT SYSTEM - DESKTOP APP MODE]
echo    Distraction-Free Dedicated Application Window
echo    Instant Server + Automated Live GitHub Sync + DB Protection
echo ================================================================
echo.
cd /d "d:\concrete-plant-system"
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; if (Test-Path 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') { Start-Process 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' -ArgumentList '--app=http://localhost:3000/login' } elseif (Test-Path 'C:\Program Files\Microsoft\Edge\Application\msedge.exe') { Start-Process 'C:\Program Files\Microsoft\Edge\Application\msedge.exe' -ArgumentList '--app=http://localhost:3000/login' } elseif (Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe') { Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList '--app=http://localhost:3000/login' } else { Start-Process 'http://localhost:3000/login' }"
node scripts/start-app.mjs
echo.
echo [INFO] Server stopped.
pause
