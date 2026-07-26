@echo off
echo ========================================
echo  Fixing Antigravity Browser Config
echo ========================================
echo.
echo Setting HOME environment variable...
setx HOME "%USERPROFILE%"
if %errorlevel% == 0 (
    echo.
    echo [SUCCESS] HOME variable set to: %USERPROFILE%
    echo.
    echo Important: Please RESTART VS Code completely for changes to take effect.
) else (
    echo.
    echo [ERROR] Failed to set HOME variable.
)
echo.
pause
