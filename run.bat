@echo off
setlocal
cd /d "%~dp0"

echo === Lenom.AI - ambiente local ===

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado no PATH. Instale em https://nodejs.org
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERRO] npm nao encontrado no PATH.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node --version') do echo Node: %%v
echo Requisito Angular CLI 22: Node v22.22.3+ / v24.15.0+ / v26+

if not exist "node_modules" (
  echo Instalando dependencias ^(primeira execucao^)...
  call npm install
  if errorlevel 1 (
    echo [ERRO] npm install falhou.
    pause
    exit /b 1
  )
)

echo.
echo API      http://localhost:3333/api
echo Site     http://localhost:4200/
echo Painel   http://localhost:4200/admin
echo.

start "" http://localhost:4200/

echo Iniciando API + site ^(Ctrl+C para parar^)...
call npm run dev

endlocal
