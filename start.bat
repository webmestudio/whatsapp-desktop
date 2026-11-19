@echo off
setlocal enabledelayedexpansion
title WhatsApp Desktop Launcher
echo ===================================================
echo           WhatsApp Desktop Launcher
echo ===================================================
echo.

:: Bersihkan env var yang berpotensi mengganggu Electron
set ELECTRON_RUN_AS_NODE=

cd /d "%~dp0"

:: 1. Periksa Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js tidak ditemukan di sistem ini.
    echo Silakan install Node.js terlebih dahulu dari https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Jika build portable sudah ada, tawarkan pilihan cepat
if exist "build\dist\WhatsApp-win32-x64\WhatsApp.exe" (
    echo Ditemukan file build portable:
    echo  build\dist\WhatsApp-win32-x64\WhatsApp.exe
    echo.
    echo Pilih aksi yang ingin dijalankan:
    echo  [1] Jalankan Portable EXE (WhatsApp.exe)
    echo  [2] Jalankan Development Mode (npm start)
    echo  [3] Rebuild Portable EXE
    echo.
    set /p choice="Masukkan nomor pilihan [1/2/3] (tekan Enter untuk 1): "
    if "!choice!"=="" set choice=1

    if "!choice!"=="1" (
        echo.
        echo Membuka WhatsApp Portable...
        start "" "build\dist\WhatsApp-win32-x64\WhatsApp.exe" --portable
        exit /b 0
    )
    if "!choice!"=="3" (
        call build-portable.bat
        exit /b 0
    )
)

:: 3. Jalankan mode development jika pilihan 2 atau jika belum ada build
echo.
echo Memeriksa dependensi project...
if not exist "node_modules\" (
    echo Menginstall dependensi root...
    call npm install
)
if not exist "app\node_modules\" (
    echo Menginstall dependensi app...
    cd app && call npm install && cd ..
)

echo.
echo Memulai WhatsApp Desktop (Development Mode)...
call npm start
