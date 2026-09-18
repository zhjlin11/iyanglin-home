# 杨林生活网 (iyanglin.com) - 多环境部署与运维手册

> **支持平台**：  
> - 生产部署推荐：Ubuntu 22.04 LTS (x86_64)  
> - 本地开发推荐：Windows 11 (Node.js 22.x LTS) / Linux / macOS  
> - 容器化运行：Docker Engine 24.x+ & Docker Compose v2.x+  

---

## 模式一：Ubuntu 22.04 原生服务部署 (生产标准模式)

### 1. 宿主基础环境准备
```bash
# 更新系统软件源
sudo apt update && sudo apt upgrade -y

# 安装基础运维工具
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# 安装 Node.js 22.x LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 全局安装 PM2 进程管理器
sudo npm install -g pm2
```

### 2. 代码检出与配置
```bash
# 创建生产服务目录
sudo mkdir -p /var/www/iyanglin.com
sudo chown -R $USER:$USER /var/www/iyanglin.com

# 从官方 GitHub 仓库克隆基线代码
git clone -b v1.0.0-production-baseline https://github.com/zhjlin11/iyanglin-home.git /var/www/iyanglin.com
cd /var/www/iyanglin.com

# 拷贝并填写环境变量
cp .env.example .env
nano .env  # 填写真实 DATABASE_URL, WECHAT_*, AUTH_SECRET 等
```

### 3. 依赖构建与启动
```bash
# 锁定安装依赖
npm ci --prefer-offline

# 生成 Prisma 客户端
npx prisma generate

# 初始化/迁移数据库
npx prisma migrate deploy

# 执行生产打包 (产出 Standalone 目录)
npm run build

# 使用 PM2 启动守护进程
pm2 start ecosystem.config.cjs
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

### 4. Nginx 反代与 SSL 证书
```bash
# 拷贝 Nginx 配置模板
sudo cp deploy/nginx/iyanglin.com.conf.example /etc/nginx/sites-available/iyanglin.com.conf
sudo ln -sf /etc/nginx/sites-available/iyanglin.com.conf /etc/nginx/sites-enabled/

# 测试配置并重载
sudo nginx -t
sudo systemctl reload nginx

# 申请 Let's Encrypt SSL 免费证书
sudo certbot --nginx -d iyanglin.com -d www.iyanglin.com
```

---

## 模式二：Docker Compose 一键容器化部署

适用于轻量服务器、多云迁移或隔离演练环境。

```bash
# 1. 检出代码
git clone https://github.com/zhjlin11/iyanglin-home.git
cd iyanglin-home

# 2. 配置环境
cp .env.example .env

# 3. 启动应用与 PostgreSQL 容器
docker compose up -d

# 4. 检查服务健康状态
docker compose ps
curl http://localhost:3006/api/healthz
```

---

## 模式三：Windows 11 本地开发环境

```powershell
# 1. 打开 PowerShell 切换至工作目录
cd newsite

# 2. 运行一键初始化脚本
.\setup-dev.ps1

# 3. 启动开发服务器
npm run dev
```

---

## 生产自动化发布与回滚

- **日常发布**：
  ```bash
  ./scripts/deploy.sh [TAG_NAME]
  ```
- **紧急故障回滚**：
  ```bash
  ./scripts/rollback.sh [PREVIOUS_STABLE_TAG]
  ```
- **版本一致性检查**：
  ```bash
  ./scripts/check-deployment-version.sh
  ```
