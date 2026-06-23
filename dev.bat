@echo off
title NotiTrade Dev Server
cd /d "D:\Personal\trade_noti"
echo ========================================
echo   NotiTrade - Development Server
echo ========================================
echo.
echo Starting backend + frontend...
echo.
pnpm run dev
pause
