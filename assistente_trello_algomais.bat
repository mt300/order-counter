@echo off
cd /d "%~dp0"

REM Inicia ngrok em uma nova janela
start "Ngrok" cmd /k "pnpm ngrok"

REM Inicia o servidor em outra janela
start "Servidor" cmd /k "pnpm dev"
