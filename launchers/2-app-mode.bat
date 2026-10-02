@echo off
title Concrete Plant - Desktop App Mode (Turbopack Hot-Reload)
color 0B
echo ================================================================
echo    [CONCRETE PLANT SYSTEM - DESKTOP APP MODE]
echo    Distraction-Free Dedicated Application Window
echo    Turbopack Hot-Reload + Live GitHub Sync + DB Protection
echo ================================================================
echo.
cd /d "d:\concrete-plant-system"
set APP_MODE=true
node scripts/start-dev.mjs
echo.
echo [INFO] Server stopped.
pause
