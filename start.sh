#!/bin/bash
# Start INOS locally: backend on :5050, frontend on :5173. Ctrl+C stops both.
cd "$(dirname "$0")"
brew services start mariadb >/dev/null 2>&1; brew services start redis >/dev/null 2>&1
mkdir -p /tmp/inos-cdn
(cd backend && node dist/src/main.js 2>&1 | tee ../backend.log) &
BE=$!
# Export worker: builds BOQ/planner/DPR/crucial-work PDF & Excel files. Uses installed Google Chrome if puppeteer has none.
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] && export PUPPETEER_EXECUTABLE_PATH="$CHROME"
(cd backend && node scripts/start-export-worker.cjs > ../export-worker.log 2>&1) &
EW=$!
(cd frontend && NODE_ENV=development VITE_BACKEND_URL=/ npx vite --port 5173) &
FE=$!
trap "kill $BE $EW $FE 2>/dev/null" EXIT INT TERM
for i in $(seq 1 60); do curl -s -o /dev/null localhost:5050/api/v1 && break; sleep 2; done
curl -s -o /dev/null localhost:5050/api/v1 || echo "!! Backend did not start - see backend.log"
open http://localhost:5173
echo "INOS running at http://localhost:5173  — login ajay@rocklime.com / Inos@2026"
wait
