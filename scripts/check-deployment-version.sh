#!/usr/bin/env bash
# ==============================================================================
# 杨林生活网 (iyanglin.com) - 部署版本与一致性校验脚本
# ==============================================================================

set -euo pipefail

APP_DIR="/var/www/iyanglin.com"
cd "${APP_DIR}"

echo "======================================================================"
echo "📊 [杨林生活网部署版本一致性检查]"
echo "======================================================================"

# 1. Package Version
PKG_VER=$(node -p "require('./package.json').version" 2>/dev/null || echo "Unknown")
echo "1. package.json Version:  ${PKG_VER}"

# 2. Git Commit & Tag
if [ -d ".git" ]; then
  GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "N/A")
  GIT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "None")
  GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")
  echo "2. Git Branch:            ${GIT_BRANCH}"
  echo "   Git Commit:            ${GIT_COMMIT}"
  echo "   Git Tag:               ${GIT_TAG}"
else
  echo "2. Git Repository:        Not a git repo"
fi

# 3. Next.js Build ID
if [ -f ".next/BUILD_ID" ]; then
  BUILD_ID=$(cat .next/BUILD_ID)
  BUILD_DATE=$(ls -l --time-style=+"%Y-%m-%d %H:%M:%S" .next/BUILD_ID | awk '{print $6, $7}')
  echo "3. Next.js Build ID:      ${BUILD_ID}"
  echo "   Next.js Build Time:    ${BUILD_DATE}"
else
  echo "3. Next.js Build ID:      Not built"
fi

# 4. PM2 Status
if command -v pm2 >/dev/null 2>&1; then
  PM2_STATUS=$(pm2 jlist 2>/dev/null | node -e "
    const fs = require('fs');
    try {
      const list = JSON.parse(fs.readFileSync(0, 'utf-8'));
      const app = list.find(a => a.name === 'yanglinol-newsite');
      if (app) console.log(app.pm2_env.status + ' (PID: ' + app.pid + ', Memory: ' + Math.round(app.monit.memory / 1024 / 1024) + 'MB)');
      else console.log('Not Found in PM2');
    } catch(e) { console.log('Error reading PM2'); }
  " || echo "Unknown")
  echo "4. PM2 Runtime Status:    ${PM2_STATUS}"
fi

# 5. Healthz API Check
HEALTHZ_INFO=$(curl -s -m 5 "http://127.0.0.1:3006/api/healthz" 2>/dev/null || echo "{}")
echo "5. Healthz Response:      ${HEALTHZ_INFO}"

echo "======================================================================"
