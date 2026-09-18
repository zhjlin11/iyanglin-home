#!/usr/bin/env bash
# ==============================================================================
# 杨林生活网 (iyanglin.com) - Ubuntu 22.04 全新服务器初始化安装向导
# 适用操作系统: Ubuntu 22.04 LTS (x86_64)
# ==============================================================================

set -euo pipefail

echo "======================================================================"
echo "🚀 欢迎使用杨林生活网 (iyanglin.com) 生产初始化安装向导"
echo "======================================================================"

# 1. 检查基础命令
for cmd in git curl node npm pm2 docker; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "⚠️ 缺少必需组件: ${cmd}，请先安装！"
    echo "提示: Node.js 推荐 22.x LTS, PM2 可通过 npm install -g pm2 安装"
  else
    echo "✅ 检测到 ${cmd}: $(${cmd} --version 2>/dev/null || true)"
  fi
done

# 2. 检查 .env 文件
if [ ! -f ".env" ]; then
  echo ""
  echo "⚠️ 未找到生产配置文件 .env！"
  if [ -f ".env.example" ]; then
    echo "--> 正在从 .env.example 生成 .env 基础模板..."
    cp .env.example .env
    echo "--> 请立即编辑 .env 文件配置真实的数据库与微信支付密钥:"
    echo "    nano .env"
  fi
  echo "❌ 缺少环境配置，安装暂停。请配置 .env 后重新运行此脚本。"
  exit 1
fi

# 3. 安装依赖与构建
echo ""
echo "--> [1/4] 安装项目锁定依赖 (npm ci)..."
npm ci

echo "--> [2/4] 生成 Prisma ORM 客户端..."
npx prisma generate

echo "--> [3/4] 执行 Next.js 生产编译打包..."
npm run build

echo "--> [4/4] 启动 PM2 进程守护..."
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "======================================================================"
echo "🎉 初始化安装完成！"
echo "服务已在端口 3006 启动。请配置 Nginx 反代并测试访问:"
echo "  curl http://127.0.0.1:3006/api/healthz"
echo "======================================================================"
