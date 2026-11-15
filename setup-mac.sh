#!/bin/bash
# One-time setup of INOS on a Mac (Apple silicon or Intel). Run from this folder:  bash setup-mac.sh
set -e
cd "$(dirname "$0")"
command -v brew >/dev/null || { echo "Install Homebrew first: https://brew.sh"; exit 1; }
brew list mariadb >/dev/null 2>&1 || brew install mariadb
brew list redis   >/dev/null 2>&1 || brew install redis
command -v node   >/dev/null 2>&1 || brew install node@22
brew services start mariadb
brew services start redis
sleep 5
echo "Creating database and loading the clean INOS setup (takes ~1 min)..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS spsyn8lm_rippotai_erp CHARACTER SET utf8mb4;
  CREATE USER IF NOT EXISTS 'inos'@'localhost' IDENTIFIED BY 'inos_local_pw';
  CREATE USER IF NOT EXISTS 'inos'@'127.0.0.1' IDENTIFIED BY 'inos_local_pw';
  GRANT ALL ON spsyn8lm_rippotai_erp.* TO 'inos'@'localhost';
  GRANT ALL ON spsyn8lm_rippotai_erp.* TO 'inos'@'127.0.0.1'; FLUSH PRIVILEGES;"
sudo mysql --default-character-set=utf8mb4 spsyn8lm_rippotai_erp < db/inos_clean.sql
echo "Installing backend..."
(cd backend && PUPPETEER_SKIP_DOWNLOAD=1 npm install && npx nest build && node create-missing-tables.cjs)
echo "Installing frontend..."
(cd frontend && npm install)
mkdir -p /tmp/inos-cdn
echo "Done. Now run:  bash start.sh"
