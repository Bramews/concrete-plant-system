@echo off
title Concrete Plant - Quick Start (Turbopack)
color 0A
echo ================================================================
echo    [CONCRETE PLANT SYSTEM - QUICK START MODE]
echo    Local Turbopack Server + Auto Live Sync + DB Protection
echo ================================================================
echo.
cd /d "d:\concrete-plant-system"
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 7; Start-Process 'http://localhost:3000/login'"
node scripts/start-dev.mjs
echo.
echo [INFO] Server stopped.
pause
