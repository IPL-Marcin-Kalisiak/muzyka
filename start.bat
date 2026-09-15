@echo off
setlocal
cd /d "%~dp0"
set "PHP_EXE=%~dp0server\php\php.exe"
if not exist "%PHP_EXE%" (
  echo Brak lokalnego PHP: "%PHP_EXE%"
  echo Zobacz dokumentacja\uruchamianie.md
  exit /b 1
)
echo AI Orchestra: http://127.0.0.1:8000
start "" "http://127.0.0.1:8000/"
"%PHP_EXE%" -n -S 127.0.0.1:8000 -t "%~dp0public_html"
endlocal
