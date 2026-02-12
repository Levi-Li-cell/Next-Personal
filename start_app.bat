@echo off
echo Starting Next.js Application (Frontend + Integrated Backend)...
echo.

cd /d "%~dp0"

:: Check if node_modules exists, install if not
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

:: Start the application
echo Starting development server...
start http://localhost:3000
npm run dev
pause
