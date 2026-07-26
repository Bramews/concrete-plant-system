@echo off
echo === تنظيف وتحديث الأدوار ===
echo.

echo [1/3] تشغيل final_fix.js لتنظيف قاعدة البيانات...
node final_fix.js
if %errorlevel% neq 0 (
    echo خطأ في تنفيذ final_fix.js
    exit /b %errorlevel%
)
echo.

echo [2/3] تشغيل seed-permissions.ts للتأكد من الصلاحيات...
npx tsx prisma/seed-permissions.ts
if %errorlevel% neq 0 (
    echo خطأ في تنفيذ seed-permissions.ts
    exit /b %errorlevel%
)
echo.

echo [3/3] فحص النتائج...
node check_rbac_status.js
if %errorlevel% neq 0 (
    echo خطأ في تنفيذ check_rbac_status.js
    exit /b %errorlevel%
)
echo.

echo === اكتملت جميع العمليات بنجاح! ===
pause
