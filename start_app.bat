@echo off
setlocal EnableExtensions
title Next Personal - Development Server

cd /d "%~dp0"
set "APP_URL=http://localhost:3000"

echo ========================================
echo   Next Personal - One-click startup
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Install Node.js 20+ first.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found. Check your Node.js installation.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo [ERROR] package.json was not found in:
  echo         %CD%
  pause
  exit /b 1
)

if not exist "node_modules\.bin\next.cmd" (
  echo [INFO] Installing dependencies. This may take a few minutes...
  call npm install
  if errorlevel 1 (
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
  )
)

for /f %%P in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue ^| Select-Object -First 1 -ExpandProperty OwningProcess)"') do set "PORT_PID=%%P"
if defined PORT_PID (
  echo [INFO] Port 3000 is already in use by PID %PORT_PID%.
  choice /M "Open the existing server instead"
  if errorlevel 2 (
    echo [INFO] Startup cancelled. Close the process using port 3000 and try again.
    pause
    exit /b 1
  )
  start "" "%APP_URL%"
  exit /b 0
)

echo [INFO] Starting Next.js development server...
start "Next Personal Server" /min cmd /k "cd /d ""%~dp0"" && npm run dev"

echo [INFO] Waiting for %APP_URL% ...
for /l %%N in (1,1,30) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$client = New-Object Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1',3000); exit 0 } catch { exit 1 } finally { $client.Dispose() }" >nul 2>&1
  if not errorlevel 1 goto READY
  timeout /t 2 /nobreak >nul
)

echo [ERROR] The server did not become ready within 60 seconds.
echo [INFO] Check the "Next Personal Server" window for the error output.
pause
exit /b 1

:READY
echo [OK] Server is ready: %APP_URL%
start "" "%APP_URL%"
echo [INFO] Runtime output is available in the "Next Personal Server" window.
echo.
echo This window can be closed. The server window remains running.
pause
