@echo off
REM Script para iniciar Backend e Frontend em modo desenvolvimento
REM Data: 2026-01-29

echo ========================================
echo  TrocaPreco - Iniciando Ambiente Dev
echo ========================================
echo.

REM Verifica se o Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale o Node.js em https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js encontrado:
node --version
echo.

REM Iniciar Backend em uma nova janela
echo [1/2] Iniciando Backend...
start "TrocaPreco Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 >nul

REM Iniciar Frontend em uma nova janela
echo [2/2] Iniciando Frontend...
start "TrocaPreco Frontend" cmd /k "npm start"
timeout /t 3 >nul

echo.
echo ========================================
echo  Ambiente Dev Iniciado!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:4200
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
