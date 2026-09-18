@echo off
echo ===================================================
echo   Starting Binary Vidya (Backend + Frontend)
echo ===================================================

start "Binary Vidya Backend (5000)" cmd /k "cd /d %~dp0backend && npm run dev"
start "Binary Vidya Frontend (3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting up:
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://localhost:5000
echo ===================================================
