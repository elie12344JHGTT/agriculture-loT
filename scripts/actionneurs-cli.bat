@echo off
setlocal EnableExtensions

rem Wrapper batch pour le CLI Agro IoT.
rem Le vrai script est scripts\actionneurs-cli.ps1.
rem Variables possibles :
rem   set AGRO_API_BASE_URL=https://agro-iot-backend.onrender.com/api
rem   set AGRO_API_TOKEN=votre_token_api

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0actionneurs-cli.ps1" %*
exit /b %ERRORLEVEL%
