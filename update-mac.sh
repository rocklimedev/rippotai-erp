#!/bin/bash
# INOS v7 update for the Mac. Backs up the DB, then applies migrations (v6 removes quotations, vendor quotations and vendor shortlists).
# Usage: unzip INOS-v7.zip into ~/Claude/BHAV, then:  cd ~/Claude/BHAV/INOS-v7 && bash update-mac.sh
set -e
cd "$(dirname "$0")"
HERE=$(pwd); OLD="$HERE/../INOS-v6"; DB=spsyn8lm_rippotai_erp
echo "1/5 Starting MariaDB + Redis"; brew services start mariadb >/dev/null 2>&1 || true; brew services start redis >/dev/null 2>&1 || true
for i in $(seq 1 30); do mysql -e "select 1" >/dev/null 2>&1 && break; sleep 2; done
mysql -e "select 1" >/dev/null 2>&1 || { brew services restart mariadb >/dev/null 2>&1; sleep 10; }
SQL="mysql"; $SQL -e "select 1" $DB >/dev/null 2>&1 || SQL="sudo mysql"
echo "2/5 Stopping old backend on :5050"; lsof -ti tcp:5050 | xargs kill 2>/dev/null || true
echo "3/5 Backing up database"; mkdir -p db/backups
mysqldump $DB > db/backups/before-v7-$(date +%Y%m%d-%H%M).sql 2>/dev/null || sudo mysqldump $DB > db/backups/before-v7-$(date +%Y%m%d-%H%M).sql
echo "4/5 Applying new migrations (safe to re-run)"
for m in backend/migrations/20261030_*.sql backend/migrations/20261105_*.sql backend/migrations/20261110_*.sql backend/migrations/20261114_*.sql backend/migrations/20261115_*.sql; do echo "   - $m"; $SQL --default-character-set=utf8mb4 $DB < "$m"; done
echo "5/5 Installing packages + building (reuses INOS-v6 packages to save disk)"
for p in backend frontend; do
  [ -d "$OLD/$p/node_modules" ] && [ ! -d "$p/node_modules" ] && mv "$OLD/$p/node_modules" "$p/"
  [ -f "$OLD/$p/.env" ] && cp "$OLD/$p/.env" "$p/.env"
  (cd $p && npm install --no-audit --no-fund)
done
(cd backend && npm run build)
echo "Done. Now start INOS with:  bash start.sh   (login ajay@rocklime.com / Inos@2026)"
