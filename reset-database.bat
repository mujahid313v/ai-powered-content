@echo off
echo Stopping any running processes...
taskkill /F /IM node.exe 2>nul

echo Waiting for processes to close...
timeout /t 2 /nobreak >nul

echo Deleting old database...
if exist "data\moderation.db" del /F /Q "data\moderation.db"

echo Running fresh migration...
call npm run migrate

echo Creating admin account...
call npm run create-admin admin@test.com admin123 "Test Admin"

echo.
echo ========================================
echo Database reset complete!
echo ========================================
echo.
echo Admin Login:
echo Email: admin@test.com
echo Password: admin123
echo.
echo Now run: npm run dev
echo.
pause
