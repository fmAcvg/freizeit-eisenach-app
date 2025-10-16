@echo off
REM Stoppt alle Prozesse der Eisenach App (Backend und Frontend)

color 0C

REM Backend stoppen
taskkill /F /IM python.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend-Prozesse gestoppt
) else (
    echo Keine Backend-Prozesse gefunden
)

REM Frontend stoppen
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo Frontend-Prozesse gestoppt
) else (
    echo Keine Frontend-Prozesse gefunden
)

REM Expo stoppen
taskkill /F /IM expo.exe >nul 2>&1
taskkill /F /IM expo-cli.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo Expo-Prozesse gestoppt
) else (
    echo Keine Expo-Prozesse gefunden
)

REM Browser stoppen (falls Expo Web läuft)
taskkill /F /IM chrome.exe >nul 2>&1
taskkill /F /IM msedge.exe >nul 2>&1

echo.
echo Alle Prozesse gestoppt
pause
