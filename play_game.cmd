@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if errorlevel 1 (
    python -B game\server.py --open-browser
) else (
    py -3 -B game\server.py --open-browser
)
if errorlevel 1 pause
