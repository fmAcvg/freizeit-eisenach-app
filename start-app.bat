@echo off

color 0A
set ORIGINAL_DIR=%CD%


taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM expo.exe >nul 2>&1
taskkill /F /IM expo-cli.exe >nul 2>&1


timeout /t 3 /nobreak >nul


netstat -an | find "8000" >nul
if %errorlevel% equ 0 (
    timeout /t 5 /nobreak >nul
)

netstat -an | find "8081" >nul
if %errorlevel% equ 0 (
    timeout /t 5 /nobreak >nul
)

REM Lokale IPv4 automatisch ermitteln (Node Script)
setlocal ENABLEDELAYEDEXPANSION
for /f "delims=" %%i in ('node "%ORIGINAL_DIR%\frontend\EisenachApp_0.0.1\get-local-ip.js"') do set LOCAL_IP=%%i
if "%LOCAL_IP%"=="localhost" (
    set LOCAL_IP=127.0.0.1
)

REM Backend starten
cd /d "%ORIGINAL_DIR%\backend"
if not exist "venv" (
    echo Virtual Environment nicht gefunden
    pause
    exit /b 1
)

call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo Virtual Environment konnte nicht aktiviert werden
    pause
    exit /b 1
)

start "Eisenach Backend" /min cmd /c "python manage.py runserver 0.0.0.0:8000"
timeout /t 8 /nobreak >nul


curl -s http://%LOCAL_IP%:8000/api/health/ >nul 2>&1
if %errorlevel% equ 0 (
echo Backend gestartet (Health-Check OK)
) else (
echo Backend-Start dauert noch
)


python create_dummy_data.py
if %errorlevel% equ 0 (
    echo Test-Daten erstellt
) else (
    echo Fehler bei Test-Daten (App funktioniert trotzdem)
)


cd /d "%ORIGINAL_DIR%\frontend\EisenachApp_0.0.1"

if not exist "node_modules" (
    npm install
    if %errorlevel% neq 0 (
        echo npm install fehlgeschlagen
        pause
        exit /b 1
    )
)

start "Eisenach Frontend" cmd /c "npm start"


pause >nul

cd /d "%ORIGINAL_DIR%"
