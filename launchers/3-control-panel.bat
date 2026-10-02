@echo off
title Concrete Plant - Control Panel
color 0F
cd /d "d:\concrete-plant-system"

:MENU
cls
echo ================================================================
echo           CONCRETE PLANT SYSTEM - CONTROL PANEL
echo ================================================================
echo.
echo    [1] Quick Start Local Server (Turbopack + Browser)
echo    [2] Desktop App Mode (Turbopack + Independent Window)
echo    [3] Open Cloud Production Version (Vercel)
echo    [4] Instant Save and Push to GitHub (Manual Sync)
echo    [5] Run Full Local Backup Snapshot (Database + Image)
echo    [6] Open Project Root Directory
echo    [0] Exit
echo.
echo ================================================================
set /p choice=Enter choice number and press Enter: 

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
echo Starting Quick Start Mode (Turbopack)...
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 7; Start-Process 'http://localhost:3000/login'"
node scripts/start-dev.mjs
pause
goto MENU

:APP_START
cls
echo Starting Desktop App Mode (Turbopack)...
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 7; if (Test-Path 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') { Start-Process 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' -ArgumentList '--app=http://localhost:3000/login' } elseif (Test-Path 'C:\Program Files\Microsoft\Edge\Application\msedge.exe') { Start-Process 'C:\Program Files\Microsoft\Edge\Application\msedge.exe' -ArgumentList '--app=http://localhost:3000/login' } elseif (Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe') { Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList '--app=http://localhost:3000/login' } else { Start-Process 'http://localhost:3000/login' }"
node scripts/start-dev.mjs
pause
goto MENU

:OPEN_CLOUD
cls
echo Opening cloud deployment in default browser...
start https://concrete-plant-v2.vercel.app/login
echo.
echo Cloud link opened successfully.
pause
goto MENU

:SYNC_GIT
cls
echo ================================================================
echo    Synchronizing with GitHub...
echo ================================================================
echo.
git status --short
git add -A
git commit -m "chore(sync): manual sync from control panel - %date% %time%" 2>nul
git push origin main
echo.
echo [INFO] Sync with GitHub completed.
pause
goto MENU

:RUN_BACKUP
cls
echo [BACKUP] Running comprehensive local database and system backup...
set FULL_IMAGE=true
node scripts/security-backup.mjs
set FULL_IMAGE=false
echo.
echo [INFO] Backup completed successfully.
pause
goto MENU

:OPEN_FOLDER
explorer "d:\concrete-plant-system"
goto MENU
