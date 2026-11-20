@echo off
rem Bone motion checker: every troop type's clips, three views, one frame at a time (bone-motion\sim\clips.html).
rem The page reads bone-motion\sim\data.js, which is built from bone-motion\engine and is not in Git.
rem It is rebuilt here when it is missing or older than any file of the engine.   bone_checker.cmd rebuild   forces it.
setlocal
cd /d "%~dp0"
set "PY=python"
where py >nul 2>&1
if not errorlevel 1 set "PY=py -3"
set "STALE=0"
if /i "%~1"=="rebuild" set "STALE=1"
if not exist "bone-motion\sim\data.js" set "STALE=1"
if "%STALE%"=="0" (
    %PY% -X utf8 -c "import os,glob,sys; d=os.path.getmtime('bone-motion/sim/data.js'); src=glob.glob('bone-motion/engine/*.py')+glob.glob('bone-motion/engine/clips/*.py')+glob.glob('bone-motion/engine/snappy.json'); sys.exit(1 if any(os.path.getmtime(f)>d for f in src) else 0)"
    if errorlevel 1 set "STALE=1"
)
if "%STALE%"=="1" (
    echo Building the bone data. This takes a minute or two...
    %PY% -X utf8 -B bone-motion\engine\export.py sim
)
if not exist "bone-motion\sim\data.js" (
    echo Build failed. Python 3 and Pillow are required: pip install pillow
    pause
    exit /b 1
)
start "" "bone-motion\sim\clips.html"
