@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Script CLI pour envoyer des commandes actionneurs vers l API Laravel.
rem Configuration possible avant execution :
rem   set AGRO_API_BASE_URL=http://127.0.0.1:8000/api
rem   set AGRO_API_TOKEN=votre_token_api

if "%AGRO_API_BASE_URL%"=="" set "AGRO_API_BASE_URL=http://127.0.0.1:8000/api"
set "AUTH_HEADER="
if not "%AGRO_API_TOKEN%"=="" set "AUTH_HEADER=Authorization: Bearer %AGRO_API_TOKEN%"

if /I "%~1"=="--help" goto HELP
if /I "%~1"=="help" goto HELP
if not "%~1"=="" goto DIRECT_MODE

goto MENU

:MENU
cls
echo ============================================
echo        Agro IoT - CLI Actionneurs
echo ============================================
echo API Laravel : %AGRO_API_BASE_URL%
echo.
echo 1. Demarrer irrigation
echo 2. Activer ventilation
echo 3. Allumer eclairage
echo 4. Tout demarrer
echo 5. Arreter irrigation
echo 6. Arreter ventilation
echo 7. Eteindre eclairage
echo 8. Tout arreter
echo 0. Quitter
echo.
set /p choice="Votre choix : "

if "%choice%"=="1" call :SEND irrigation start manual & pause & goto MENU
if "%choice%"=="2" call :SEND ventilation start manual & pause & goto MENU
if "%choice%"=="3" call :SEND light start manual & pause & goto MENU
if "%choice%"=="4" call :SEND irrigation start batch & call :SEND ventilation start batch & call :SEND light start batch & pause & goto MENU
if "%choice%"=="5" call :SEND irrigation stop manual & pause & goto MENU
if "%choice%"=="6" call :SEND ventilation stop manual & pause & goto MENU
if "%choice%"=="7" call :SEND light stop manual & pause & goto MENU
if "%choice%"=="8" call :SEND irrigation stop batch & call :SEND ventilation stop batch & call :SEND light stop batch & pause & goto MENU
if "%choice%"=="0" exit /b 0

echo Choix invalide.
pause
goto MENU

:DIRECT_MODE
set "ACTUATOR=%~1"
set "COMMAND=%~2"
set "SOURCE=%~3"
if "%COMMAND%"=="" set "COMMAND=start"
if "%SOURCE%"=="" set "SOURCE=cli"

if /I "%ACTUATOR%"=="all" (
  call :SEND irrigation %COMMAND% %SOURCE%
  call :SEND ventilation %COMMAND% %SOURCE%
  call :SEND light %COMMAND% %SOURCE%
  exit /b !ERRORLEVEL!
)

call :SEND %ACTUATOR% %COMMAND% %SOURCE%
exit /b %ERRORLEVEL%

:SEND
set "TARGET=%~1"
set "ACTION=%~2"
set "SOURCE=%~3"
set "ENDPOINT="

if /I "%TARGET%"=="irrigation" set "ENDPOINT=actuators/irrigation"
if /I "%TARGET%"=="ventilation" set "ENDPOINT=actuators/ventilation"
if /I "%TARGET%"=="light" set "ENDPOINT=actuators/light"
if "%ENDPOINT%"=="" (
  echo Actionneur inconnu : %TARGET%
  echo Utilisez : irrigation, ventilation, light ou all.
  exit /b 1
)

set "BODY={\"command\":\"%ACTION%\",\"source\":\"%SOURCE%\"}"

echo.
echo Envoi : %TARGET% - %ACTION% [%SOURCE%]
echo Route : %AGRO_API_BASE_URL%/%ENDPOINT%

if "%AUTH_HEADER%"=="" (
  curl -s -X POST "%AGRO_API_BASE_URL%/%ENDPOINT%" -H "Content-Type: application/json" -d "%BODY%"
) else (
  curl -s -X POST "%AGRO_API_BASE_URL%/%ENDPOINT%" -H "Content-Type: application/json" -H "%AUTH_HEADER%" -d "%BODY%"
)
echo.
exit /b %ERRORLEVEL%

:HELP
echo Agro IoT - CLI Actionneurs
echo.
echo Mode menu :
echo   scripts\actionneurs-cli.bat
echo.
echo Mode direct :
echo   scripts\actionneurs-cli.bat irrigation start
echo   scripts\actionneurs-cli.bat ventilation stop
echo   scripts\actionneurs-cli.bat light start
echo   scripts\actionneurs-cli.bat all start batch
echo.
echo Variables de configuration :
echo   AGRO_API_BASE_URL  URL de base Laravel, defaut http://127.0.0.1:8000/api
echo   AGRO_API_TOKEN     Token Bearer optionnel
echo.
exit /b 0
