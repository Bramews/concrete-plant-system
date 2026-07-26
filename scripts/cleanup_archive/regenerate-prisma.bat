@echo off
echo ===================================
echo  Prisma Client Full Regeneration
echo ===================================
echo.

echo [1/5] Stopping any running node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo [2/5] Removing old Prisma Client...
if exist "node_modules\.prisma" rmdir /s /q "node_modules\.prisma"
if exist "node_modules\@prisma\client" rmdir /s /q "node_modules\@prisma\client"

echo [3/5] Removing .next build cache...
if exist ".next\" rmdir /s /q ".next"

echo [4/5] Reinstalling Prisma Client...
call npm install @prisma/client

echo [5/5] Generating new Prisma Client from schema...
call npx prisma generate

echo.
echo ===================================
echo  ✅ Prisma Client regenerated!
echo ===================================
echo.
pause
