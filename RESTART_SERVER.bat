@echo off
echo ========================================
echo  إعادة تشغيل نظيفة للخادم
echo ========================================
echo.

echo [1/3] إيقاف عمليات Node.js...
taskkill /F /IM node.exe /T 2>nul
if %errorlevel% == 0 (
    echo ✓ تم إيقاف العمليات
) else (
    echo ⚠ لا توجد عمليات Node تعمل
)
timeout /t 2 /nobreak >nul

echo.
echo [2/3] حذف مجلد .next...
if exist .next (
    rd /s /q .next
    echo ✓ تم حذف .next
) else (
    echo ⚠ .next غير موجود
)

echo.
echo [3/3] تشغيل الخادم...
echo ========================================
set NODE_OPTIONS=--max-old-space-size=90000000000
npm run dev
