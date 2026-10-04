@echo off
title AuraPulse - Doubly Linked List Audio Engine
cd /d "%~dp0"
echo ========================================================
echo   Launching AuraPulse Audio Engine
echo ========================================================
echo.
set "PATH=C:\Program Files\nodejs;%PATH%"
echo Starting development server...
call npm.cmd run dev
pause
