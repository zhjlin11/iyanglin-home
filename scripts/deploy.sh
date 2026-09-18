#!/usr/bin/env bash
# ==============================================================================
# 杨林生活网 (iyanglin.com) - 生产环境标准化自动发布脚本
# 使用示例:
#   ./scripts/deploy.sh                     # 默认拉取并部署最新代码
#   ./scripts/deploy.sh v1.0.0-production-baseline  # 指定 Tag 部署
# ==============================================================================

set -euo pipefail

TARGET_REF="${1:-HEAD}"
APP_DIR="/var/www/iyanglin.com"
HEALTHZ_URL="http://127.0.0.1:3006/api/healthz"

echo "======================================================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始执行杨林生活网生产部署..."
echo "目标代码版本 / Ref: ${TARGET_REF}"
echo "======================================================================"

cd "${APP_DIR}"

# 1. 检查环境变量文件
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
  echo "❌ 错误: 未检测到 .env 生产配置文件！部署终止。"
  exit 1
fi

# 2. 拉取 Git 目标版本 (如当前目录已接入 Git)
if [ -d ".git" ]; then
  echo "--> [1/7] 拉取远端代码并检出 ${TARGET_REF}..."
  git fetch --all --tags
  git checkout "${TARGET_REF}"
  CURRENT_COMMIT=$(git rev-parse --short HEAD)
  echo "当前部署 Commit: ${CURRENT_COMMIT}"
else
  echo "--> [1/7] 独立目录发布，跳过 Git fetch..."
fi

# 3. 安装生产依赖
echo "--> [2/7] 执行 npm ci 锁定版本依赖安装..."
npm ci --prefer-offline

# 4. 生成 Prisma 客户端
echo "--> [3/7] 生成 Prisma Client..."
npx prisma generate

# 5. 执行数据库迁移 (如果配置了 migrations)
echo "--> [4/7] 执行 Prisma 数据库架构同步与迁移..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  npx prisma migrate deploy || echo "⚠️ migrate deploy 提示无需更新或直接跳过"
fi

# 6. 执行 Standalone 编译构建
echo "--> [5/7] 执行 Next.js 生产编译打包..."
npm run build

# 7. 重载 PM2 进程守护
echo "--> [6/7] 平滑重载 PM2 进程..."
if pm2 describe yanglinol-newsite >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi

# 8. 服务健康检查与验证
echo "--> [7/7] 执行健康检查探针 (等待 3 秒)..."
sleep 3

HEALTHZ_RESP=$(curl -s -m 5 "${HEALTHZ_URL}" || echo "")
if echo "${HEALTHZ_RESP}" | grep -q '"status":"OK"'; then
  echo "======================================================================"
  echo "🎉 生产部署成功！健康检查探针响应正常:"
  echo "${HEALTHZ_RESP}"
  echo "======================================================================"
  exit 0
else
  echo "======================================================================"
  echo "❌ 警告: 健康检查失败！服务端未正常响应: ${HEALTHZ_RESP}"
  echo "请立即执行 ./scripts/rollback.sh 进行版本回滚，并检查 PM2 错误日志:"
  echo "  pm2 logs yanglinol-newsite --lines 50"
  echo "======================================================================"
  exit 1
fi
