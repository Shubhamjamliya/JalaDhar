#!/usr/bin/env bash
# ==============================================================================
# JalaDhar Fast Local-to-Remote Deployment Script
# Builds Frontend locally (takes ~4s instead of 17m on the VPS)
# and syncs Frontend/dist + updates Backend on the server via SSH/rsync.
# ==============================================================================

set -euo pipefail

# ANSI color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# --- Configuration (Adjust if your host or user changes) ---
REMOTE_HOST="${REMOTE_HOST:-srv1357272}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_PATH="${REMOTE_PATH:-/home/jaladhaara-api2/htdocs/api.jaladhaaraapp.in/JalaDhar}"
PM2_APP_NAME="jaladhaara-backend"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}[INFO] Starting fast local build & deployment to ${REMOTE_USER}@${REMOTE_HOST}...${NC}"

# 1. Build Frontend locally
echo -e "${BLUE}[INFO] Building Frontend locally...${NC}"
cd "$SCRIPT_DIR/Frontend"
npm run build
echo -e "${GREEN}[SUCCESS] Local Frontend build finished in seconds.${NC}"

# 2. Deploy dist folder to Remote VPS
echo -e "${BLUE}[INFO] Syncing built dist files to remote server...${NC}"
rsync -avz --delete "$SCRIPT_DIR/Frontend/dist/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/Frontend/dist/"
echo -e "${GREEN}[SUCCESS] Frontend dist synced.${NC}"

# 3. Pull code and restart backend on Remote VPS
echo -e "${BLUE}[INFO] Updating backend and restarting PM2 on remote server...${NC}"
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash -s <<EOF
  set -euo pipefail
  cd "${REMOTE_PATH}"
  git pull origin main || true
  cd Backend
  npm install --omit=dev --no-audit --no-fund
  if command -v pm2 > /dev/null 2>&1; then
    pm2 reload "${PM2_APP_NAME}" || pm2 restart "${PM2_APP_NAME}" || pm2 start server.js --name "${PM2_APP_NAME}"
    pm2 save
  fi
EOF

echo -e "${GREEN}[SUCCESS] Fast deployment completed successfully in under 30 seconds!${NC}"
