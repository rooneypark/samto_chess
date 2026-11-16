@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 "%~dp0tools\character-checker\build.py" --open
) else (
  python "%~dp0tools\character-checker\build.py" --open
)
if errorlevel 1 (
  echo.
  echo Checker failed. See the error above.
  echo Python 3.10 or newer is required. No packages need to be installed.
  pause
  exit /b 1
)
endlocal
