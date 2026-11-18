@echo off
setlocal
cd /d "%~dp0"
python -X utf8 tools/asset_packs.py restore
if errorlevel 1 exit /b 1
if not exist "bone-motion\sim\data.js" (
    echo Building simulator data. This takes a moment...
    where py >nul 2>&1
    if errorlevel 1 (
        python -X utf8 -B bone-motion\engine\export.py sim
    ) else (
        py -3 -X utf8 -B bone-motion\engine\export.py sim
    )
)
if not exist "bone-motion\sim\data.js" (
    echo Build failed. Python 3 and Pillow are required: pip install pillow
    pause
    exit /b 1
)
start "" "bone-motion\sim\battle.html"
