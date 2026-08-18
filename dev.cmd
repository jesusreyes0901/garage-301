@echo off
cd /d "%~dp0"
node node_modules\concurrently\dist\bin\concurrently.js -n api,web -c red,cyan "node server/index.mjs" "node node_modules/vite/bin/vite.js"
