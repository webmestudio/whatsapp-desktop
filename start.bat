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
    echo.
    pause
    exit /b 1
)

:: 2. Periksa dependensi proyek
if not exist "node_modules\" (
    echo [INFO] Mengunduh dependensi root (ini hanya berjalan sekali)...
    call npm install
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Gagal menginstall dependensi root!
        pause
        exit /b 1
    )
)
if not exist "app\node_modules\" (
    echo [INFO] Mengunduh dependensi app (ini hanya berjalan sekali)...
    cd app && call npm install && cd ..
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Gagal menginstall dependensi app!
        pause
        exit /b 1
    )
)

:: 3. Tampilkan Menu Pilihan
echo.
echo Status File Portable EXE:
if exist "build\dist\WhatsApp-win32-x64\WhatsApp.exe" (
    echo  [OK] Build Portable siap: build\dist\WhatsApp-win32-x64\WhatsApp.exe
) else (
    echo  [-] Build Portable belum dibuat (akan otomatis jalan via Electron).
)
echo.
echo Pilih mode yang ingin dijalankan:
echo  [1] Jalankan WhatsApp (Mode Normal)
echo  [2] Jalankan WhatsApp (Mode Hemat Resource Laptop / Disable GPU)
echo  [3] Build / Rebuild Portable Windows EXE (build-portable.bat)
echo  [4] Keluar
echo.
set /p choice="Masukkan nomor pilihan [1/2/3/4] (tekan Enter untuk 1): "
if "!choice!"=="" set choice=1

if "!choice!"=="1" (
    echo.
    if exist "build\dist\WhatsApp-win32-x64\WhatsApp.exe" (
        echo Membuka WhatsApp Portable (Mode Normal)...
        start "" "build\dist\WhatsApp-win32-x64\WhatsApp.exe" --portable
    ) else (
        echo Menjalankan WhatsApp Desktop via Electron (Mode Normal)...
        call npx electron ./app
    )
    goto finish
)

if "!choice!"=="2" (
    echo.
    if exist "build\dist\WhatsApp-win32-x64\WhatsApp.exe" (
        echo Membuka WhatsApp Portable (Mode Hemat Resource / Disable GPU)...
        start "" "build\dist\WhatsApp-win32-x64\WhatsApp.exe" --portable --disable-gpu
    ) else (
        echo Menjalankan WhatsApp Desktop via Electron (Mode Hemat Resource / Disable GPU)...
        call npx electron ./app --disable-gpu
    )
    goto finish
)

if "!choice!"=="3" (
    echo.
    echo Menjalankan build portable...
    call build-portable.bat
    goto finish
)

if "!choice!"=="4" (
    exit /b 0
)

echo [Peringatan] Pilihan tidak valid.
pause
exit /b 0

:finish
if %ERRORLEVEL% neq 0 (
    echo.
    echo [INFO] Proses selesai dengan kode: %ERRORLEVEL%
    pause
)
