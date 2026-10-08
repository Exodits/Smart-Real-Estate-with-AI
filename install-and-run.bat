@echo off
echo ========================================================
echo   TerraFind - Maharashtra Real Estate & Location Intel
echo ========================================================
echo.
echo Checking dependencies...
call npm.cmd install
echo.
echo Starting TerraFind development servers...
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8787
echo.
call npm.cmd run dev
pause
