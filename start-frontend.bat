@echo off
echo Starting EisenachApp Frontend...
cd frontend\EisenachApp_0.0.1
if errorlevel 1 (
    echo Error: Frontend directory not found!
    pause
    exit /b 1
)

echo Installing dependencies (if needed)...
call npm install

echo Starting Expo...
call npm start
pause

