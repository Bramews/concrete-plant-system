@echo off
title Concrete Plant System - Starter
echo ------------------------------------------
echo Rocketing your system... 🚀
echo Starting Voice Service in background...
echo ------------------------------------------
start /min "Voice Service" python scripts\voice_service.py
set NODE_OPTIONS=--max-old-space-size=90000000000
npm run dev
pause
