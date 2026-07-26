@echo off
setlocal
echo Cleaning up old roles...
call node fix_roles_simple.js
echo.
echo Process complete. Roles should be clean now.
pause
