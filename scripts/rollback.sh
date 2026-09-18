#!/usr/bin/env bash
# ==============================================================================
# 杨林生活网 (iyanglin.com) - 紧急版本回滚脚本
# 使用示例:
#   ./scripts/rollback.sh v1.0.0-production-baseline
#   ./scripts/rollback.sh <commit_id>
# ==============================================================================

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "❌ 错误: 必须指定回滚目标版本 (Git Tag 或 Commit ID)！"
  echo "示例: $0 v1.0.0-production-baseline"
  exit 1
fi

ROLLBACK_TARGET="$1"
APP_DIR="/var/www/iyanglin.com"
HEALTHZ_URL="http://127.0.0.1:3006/api/healthz"

echo "======================================================================"
echo "⚠️ [$(date '+%Y-%m-%d %H:%M:%S')] 正在执行杨林生活网紧急版本回滚..."
echo "回滚目标: ${ROLLBACK_TARGET}"
echo "======================================================================"

cd "${APP_DIR}"

if [ ! -d ".git" ]; then
  echo "❌ 错误: 未检测到 .git 仓库，无法自动按版本回滚！"
  exit 1
fi

# 1. 检出目标历史版本
echo "--> [1/5] 检出目标版本: ${ROLLBACK_TARGET}..."
git checkout "${ROLLBACK_TARGET}"

# 2. 依赖重置
echo "--> [2/5] 还原锁定依赖 (npm ci)..."
npm ci --prefer-offline

# 3. 生成 Client
echo "--> [3/5] 重新生成 Prisma Client..."
npx prisma generate

# 4. 重新构建
echo "--> [4/5] 重新编译打包..."
npm run build

# 5. 重启应用
echo "--> [5/5] 重载 PM2 进程..."
pm2 reload ecosystem.config.cjs --update-env

sleep 3
HEALTHZ_RESP=$(curl -s -m 5 "${HEALTHZ_URL}" || echo "")
if echo "${HEALTHZ_RESP}" | grep -q '"status":"OK"'; then
  echo "======================================================================"
  echo "🎉 回滚完成！服务已恢复至 ${ROLLBACK_TARGET}，健康探针正常:"
  echo "${HEALTHZ_RESP}"
  echo "======================================================================"
  exit 0
else
  echo "======================================================================"
  echo "❌ 严重警告: 回滚后健康检查仍异常！请立即人工接管排查。"
  echo "======================================================================"
  exit 1
fi
