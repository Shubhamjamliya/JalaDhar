#!/usr/bin/env bash
# ==============================================================================
# JalaDhar Production Deployment Script
# Target: root@srv1357272 / /home/jaladhaara-api2/htdocs/api.jaladhaaraapp.in/JalaDhar
# ==============================================================================

set -euo pipefail

# ANSI color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
  echo -e "${BLUE}[INFO] $(date +'%Y-%m-%d %H:%M:%S') - $1${NC}"
}

log_success() {
  echo -e "${GREEN}[SUCCESS] $(date +'%Y-%m-%d %H:%M:%S') - $1${NC}"
}

log_warn() {
  echo -e "${YELLOW}[WARN] $(date +'%Y-%m-%d %H:%M:%S') - $1${NC}"
}

log_error() {
  echo -e "${RED}[ERROR] $(date +'%Y-%m-%d %H:%M:%S') - $1${NC}"
}

# Resolve project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log_info "Starting deployment in: $SCRIPT_DIR"

# ------------------------------------------------------------------------------
# 1. Pull Latest Code from Git
# ------------------------------------------------------------------------------
log_info "Fetching latest code from Git..."
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  log_info "Current branch: $CURRENT_BRANCH"
  git fetch origin "$CURRENT_BRANCH"
  git pull origin "$CURRENT_BRANCH"
  log_success "Git repository updated."
else
  log_warn "Not a git repository or git not found, skipping git pull."
fi

# ------------------------------------------------------------------------------
# 2. Deploy Backend
# ------------------------------------------------------------------------------
if [ -d "$SCRIPT_DIR/Backend" ]; then
  log_info "--- Deploying Backend ---"
  cd "$SCRIPT_DIR/Backend"

  log_info "Installing backend production dependencies..."
  npm install --omit=dev --no-audit --no-fund

  # Restart process manager (PM2)
  if command -v pm2 > /dev/null 2>&1; then
    PM2_APP_NAME="jaladhaara-backend"
    if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
      log_info "Reloading PM2 application '$PM2_APP_NAME'..."
      pm2 reload "$PM2_APP_NAME" --update-env
    else
      log_info "Starting PM2 application '$PM2_APP_NAME' with server.js..."
      pm2 start server.js --name "$PM2_APP_NAME" --time
    fi
    pm2 save
    log_success "Backend restarted with PM2."
  else
    log_warn "PM2 not found. If using systemd, remember to restart your service (e.g., systemctl restart jaladhaara-api)."
  fi
fi

# ------------------------------------------------------------------------------
# 3. Deploy Frontend
# ------------------------------------------------------------------------------
if [ -d "$SCRIPT_DIR/Frontend" ]; then
  log_info "--- Deploying Frontend ---"
  cd "$SCRIPT_DIR/Frontend"

  # Increase Node memory limit and suppress AbortSignal/EventTarget warnings during build
  export NODE_OPTIONS="--max-old-space-size=2048 --no-warnings"

  log_info "Installing frontend dependencies..."
  npm install --legacy-peer-deps --no-audit --no-fund

  log_info "Building frontend for production (Vite)..."
  npm run build

  log_success "Frontend build completed successfully."
fi

# ------------------------------------------------------------------------------
# 4. Optional: Reload Web Server (Nginx / OpenLiteSpeed / Apache)
# ------------------------------------------------------------------------------
cd "$SCRIPT_DIR"

if command -v systemctl > /dev/null 2>&1; then
  if systemctl is-active --quiet nginx 2>/dev/null; then
    log_info "Reloading Nginx web server..."
    systemctl reload nginx || true
    log_success "Nginx reloaded."
  fi
fi

log_success "Deployment finished successfully!"
