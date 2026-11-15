#!/bin/bash
# Checks why INOS login fails. Writes everything to diagnose.log in this folder.
cd "$(dirname "$0")"
LOG="$PWD/diagnose.log"
{
echo "=== $(date)"
echo "--- node: $(node -v 2>&1)  brew: $(brew --version 2>&1 | head -1)"
echo "--- services"; brew services list 2>&1 | grep -Ei "mariadb|mysql|redis"
echo "--- port 5050 / 5173 listeners"; lsof -nP -iTCP:5050 -sTCP:LISTEN 2>&1 | head -3; lsof -nP -iTCP:5173 -sTCP:LISTEN 2>&1 | head -3
echo "--- DB as app user"; mysql -h127.0.0.1 -uinos -pinos_local_pw spsyn8lm_rippotai_erp -e "select count(*) users from users; select email, is_active from users where email='ajay@rocklime.com';" 2>&1
echo "--- login API (if backend already running)"
curl -s -m 8 -X POST http://localhost:5050/api/v1/auth/login -H 'content-type: application/json' -d '{"email":"ajay@rocklime.com","password":"Inos@2026"}' 2>&1 | head -c 300; echo
if ! lsof -nP -iTCP:5050 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "--- backend not running: starting it for 40s to capture errors"
  mkdir -p /tmp/inos-cdn
  (cd backend && node dist/src/main.js > ../backend-start.log 2>&1 &) ; sleep 40
  tail -60 backend-start.log
  echo "--- login API after start"
  curl -s -m 8 -X POST http://localhost:5050/api/v1/auth/login -H 'content-type: application/json' -d '{"email":"ajay@rocklime.com","password":"Inos@2026"}' 2>&1 | head -c 300; echo
fi
} > "$LOG" 2>&1
echo "Done — tell Claude to read diagnose.log"
