@echo off
setlocal

REM Scanvoro uses separate frontend and backend services.
REM We launch them in parallel because both dev servers need to stay running together.
REM Separate terminal windows make it easier to see logs and debug each side independently.

set "ROOT_DIR=%~dp0"

start "Scanvoro Backend" cmd /k "cd /d ""%ROOT_DIR%backend"" && call .venv\Scripts\activate && uvicorn email_fastapi.main:app --reload --port 8000"
start "Scanvoro Frontend" cmd /k "cd /d ""%ROOT_DIR%frontend"" && npm run dev"

echo Scanvoro startup launched.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173

endlocal
