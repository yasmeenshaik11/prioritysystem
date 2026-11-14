@echo off
title Civic Pulse - AI Complaint Priority System
echo =====================================================================
echo           CIVIC PULSE: AI-BASED COMPLAINT PRIORITY SYSTEM
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Python Flask Backend Server (Port 5000)...
start "Civic Pulse - Flask Backend" cmd /k "cd backend && ..\.venv\Scripts\python.exe run.py"

timeout /t 3 /nobreak >nul

echo [2/2] Launching React Vite Frontend Application (Port 5173)...
start "Civic Pulse - React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo =====================================================================
echo System services successfully dispatched!
echo.
echo - Web Frontend: http://localhost:5173
echo - REST Backend: http://127.0.0.1:5000
echo - API Health:   http://127.0.0.1:5000/api/health
echo.
echo Presets for Quick Demo Testing:
echo - Citizen Portal: citizen@emergencyai.com / Citizen@123
echo - Officer Portal: officer@emergencyai.com / Officer@123
echo - Admin Portal:   admin@emergencyai.com   / Admin@123
echo =====================================================================
echo.
pause
