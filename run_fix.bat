
@echo off
echo Killing Node processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo Applying Role Fixes (Arabic Names)...
node apply_arabic_names.js > apply_log_final.txt 2>&1

echo Showing Log Output:
type apply_log_final.txt

echo Starting Server...
npm run dev -- --port 3000
