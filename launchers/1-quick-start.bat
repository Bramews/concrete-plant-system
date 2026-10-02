@echo off
title Concrete Plant - Quick Start (Ultra-Fast Production Mode)
color 0A
echo ================================================================
echo    [CONCRETE PLANT SYSTEM - QUICK START PRODUCTION MODE]
echo    Instant Server + Automated Live GitHub Sync + DB Protection
echo ================================================================
echo.
cd /d "d:\concrete-plant-system"
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000/login'"
node scripts/start-app.mjs
echo.
echo [INFO] Server stopped.
pause
