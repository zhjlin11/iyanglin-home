# 杨林生活网 (iyanglin.com) - 嵩明杨林本地生活数字化综合平台

[![Version](https://img.shields.io/badge/version-1.0.0--PROD-green.svg)](https://iyanglin.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.5_App_Router-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-blue.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16-indigo.svg)](https://www.prisma.io/)
[![Database](https://img.shields.io/badge/PostgreSQL-15_Docker-blue.svg)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x_LTS-green.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Production-ONLINE_GO-brightgreen.svg)](https://iyanglin.com)

> 服务于云南省昆明市嵩明县杨林镇、杨林职教园区（大学城 10 余所高校十万师生）、杨林经开区产业集群及周边同城居民的一站式本地生活综合服务中台。

---

## 📌 项目定位与核心业务矩阵

1. **求职招聘 (ATS)**：1975+ 真实岗位，707+ 认证企业，支持在线投递、HR 工作台与电话直聘；
2. **自营便利店即时零售**：自营商品选购、微信支付、到店 6 位码核销与大学城/园区同城配送；
3. **房产租售与工业招商**：692+ 真实房源、园区标准化厂房租赁、仓储用地对接；
4. **便民服务与同城好店**：437+ 精选商家、开锁/保洁/维修便民黄页一键拨号；
5. **本地资讯与社区论坛**：生活百科、嵩明本地动态、实名发帖与反垃圾内容过滤；
6. **问问杨林 AI 助手**：本地知识库大模型驱动，确定性意图识别与本地生活检索；
7. **综合运营管理后台**：151 个页面路由，230 个 API 接口，全盘监控、审核与对账。

---

## 🛠️ 技术栈与最低环境要求

| 技术栈层次 | 选型与规格 | 最低运行环境 |
| :--- | :--- | :--- |
| **全栈框架** | Next.js 15.5.0 (App Router, Standalone 模式) | Node.js `>= 22.0.0` (推荐 `22.22.1 LTS`) |
| **前端界面** | React 19.1.0, TypeScript 5.8, Tailwind CSS, Lucide Icons | 现代浏览器 / 微信内置浏览器 |
| **持久层 ORM** | Prisma ORM 6.16.0, 131 张公共数据表 | PostgreSQL 15.x |
| **支付与认证** | 微信支付 (JSAPI / Native), 微信公众号授权, 腾讯云短信 | 微信服务号 + 直连商户号 |
| **生产守护** | Ubuntu 22.04 LTS, Nginx 1.18.0 (HTTP/2 + SSL), PM2 6.0.14 | 2核 4G 内存，20GB 可用磁盘 |

---

## 🚀 三种快速启动与部署模式

### 模式 A：Windows 11 本地开发模式

```powershell
# 1. 克隆代码库
git clone https://github.com/zhjlin11/iyanglin-home.git
cd iyanglin-home

# 2. 一键配置并安装依赖
.\setup-dev.ps1

# 3. 启动开发服务器
npm run dev
# 浏览器打开 http://localhost:3000
```

### 模式 B：Docker Compose 一键容器化启动

```bash
# 1. 克隆代码
git clone https://github.com/zhjlin11/iyanglin-home.git
cd iyanglin-home

# 2. 拷贝环境模板
cp .env.example .env

# 3. 启动应用与 PostgreSQL 15 数据库
docker compose up -d

# 4. 验证服务状态
curl http://localhost:3006/api/healthz
```

### 模式 C：Ubuntu 22.04 生产环境自动化部署

```bash
# 1. 检出生产基线代码
git clone -b v1.0.0-production-baseline https://github.com/zhjlin11/iyanglin-home.git /var/www/iyanglin.com
cd /var/www/iyanglin.com

# 2. 配置真实生产环境变量
cp .env.example .env
nano .env  # 填入真实数据库与微信支付凭据

# 3. 运行自动化部署脚本
./scripts/deploy.sh
```

---

## 📚 详细工程与运维文档目录

本工程在 `docs/` 目录下提供完备的系统设计与运营规范：

- ⚙️ [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) - 环境变量清单与参数说明
- 🔐 [docs/SECRETS_INVENTORY.md](docs/SECRETS_INVENTORY.md) - 机密资产与安全防泄露规范
- 🌐 [docs/EXTERNAL_SERVICES.md](docs/EXTERNAL_SERVICES.md) - 微信公众号、微信支付与短信等第三方依赖清单
- 🚀 [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) - Ubuntu / Docker / Windows 详细部署手册
- 🗄️ [docs/DATABASE_MIGRATION_GUIDE.md](docs/DATABASE_MIGRATION_GUIDE.md) - 空库初始化与生产数据恢复指南
- 💾 [docs/BACKUP_AND_RESTORE.md](docs/BACKUP_AND_RESTORE.md) - 自动化备份与灾备恢复实测演练
- 📋 [docs/operations_handbook_v1.md](docs/operations_handbook_v1.md) - 30天功能冻结、每日巡检与退款 SOP

---

## 🛡️ 版本与维护策略

- **正式基线版本**：`v1.0.0-production-baseline`
- **代码唯一真相源**：GitHub [https://github.com/zhjlin11/iyanglin-home](https://github.com/zhjlin11/iyanglin-home) `main` 分支
- **生产发布原则**：生产服务器禁止直接修改正式源码，所有变更必须遵循 `本地开发 -> Git 提交 -> Tag 标记 -> 自动化部署脚本` 流程。

**杨林生活网技术与运营委员会**  
*2026年9月*
