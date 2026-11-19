@echo off
setlocal enabledelayedexpansion
title WhatsApp Desktop - Build Portable EXE
echo ===================================================
echo     Build WhatsApp Desktop Portable Windows x64
echo ===================================================
echo.

:: Bersihkan env var yang berpotensi mengganggu Electron
set ELECTRON_RUN_AS_NODE=

cd /d "%~dp0"

:: 1. Periksa Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js tidak ditemukan di sistem ini.
    echo Silakan unduh dan pasang Node.js dari https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Periksa dependensi
echo [1/3] Memeriksa dependensi...
if not exist "node_modules\" (
    echo Mengunduh dependensi root...
    call npm install
)
if not exist "app\node_modules\" (
    echo Mengunduh dependensi app...
    cd app && call npm install && cd ..
)

:: 3. Packaging aplikasi ke Portable EXE
echo.
echo [2/3] Mem-package WhatsApp Desktop ke Windows x64...
taskkill /F /IM WhatsApp.exe >nul 2>&1
ping 127.0.0.1 -n 2 >nul
call npx electron-packager ./app WhatsApp --platform=win32 --arch=x64 --out=build/dist --overwrite --icon=build/assets/win/whatsapp.ico --prune=true

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Proses packaging gagal!
    pause
    exit /b %ERRORLEVEL%
)

:: 4. Konfigurasi Mode Portable
echo.
echo [3/3] Menyiapkan struktur portable...
set "DIST_DIR=build\dist\WhatsApp-win32-x64"

:: Buat marker portable dan folder data
echo. > "%DIST_DIR%\portable.flag"
if not exist "%DIST_DIR%\data" mkdir "%DIST_DIR%\data"

:: Buat launcher bat di dalam folder portable
(
echo @echo off
echo set ELECTRON_RUN_AS_NODE=
echo cd /d "%%~dp0"
echo start "" "WhatsApp.exe" --portable
) > "%DIST_DIR%\Buka-WhatsApp.bat"

echo.
echo ===================================================
echo [BERHASIL] Build Portable EXE selesai!
echo Folder:     %DIST_DIR%
echo File Utama: %DIST_DIR%\WhatsApp.exe
echo Launcher:   %DIST_DIR%\Buka-WhatsApp.bat
echo ===================================================
echo.
echo Folder tersebut dapat dipindahkan ke flashdisk atau folder lain
echo dan data akun akan otomatis tersimpan di dalam folder 'data'.
echo.
pause
