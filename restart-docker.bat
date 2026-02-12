@echo off
REM Smart ERP Docker Restart Script for Windows
REM This script will rebuild and restart all containers with the latest changes

echo =================================
echo Smart ERP Docker Restart
echo =================================
echo.

echo 1. Stopping existing containers...
docker-compose down

echo.
echo 2. Starting containers...
docker-compose up -d --build

echo.
echo 3. Waiting for services to start...
timeout /t 5 /nobreak >nul

echo.
echo 4. Checking container status...
docker-compose ps

echo.
echo =================================
echo Services should be starting up!
echo =================================
echo.
echo Access your application at:
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:8000
echo.
echo To view logs, run:
echo   docker-compose logs -f
echo.
echo To stop, run:
echo   docker-compose down
echo.
pause
