# 杨林生活网 (iyanglin.com) 项目体积与资产分布基准报告 (SIZE_REPORT.md)

> **统计基准版本**：1.0.0 (Official Production Baseline)  
> **审计时间**：2026-09-18  
> **治理目标**：区分源码与运行时资产、杜绝历史部署包残留、建立长期体积预警红线  

---

## 一、全项目资产体积分布基准

经过**冗余文件清理与源码瘦身治理**后，各目录与资产类型已彻底物理解耦，基准分布如下：

| 资产大类 | 目录路径 | 治理前占用 | 治理后基准占用 | 是否进Git/源码包 | 备注说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **纯净核心源码** | src/, prisma/, scripts/, docs/, deploy/ | 13.6 MB | **13.62 MB** | ✅ 严格纳入 | 业务全量源码，轻量高内聚 |
| **静态公共素材** | public/ (排除 uploads 与 UploadFile) | 7.5 MB | **7.51 MB** | ✅ 严格纳入 | Logo、Favicon、站长认证文件 |
| **外部运行依赖** | 
ode_modules/ | 950 MB (本地) / 1.1 GB (生产) | **~950 MB** | ❌ 彻底排除 | 由 package-lock.json 自动安装 |
| **Next.js 编译产物** | .next/ (排除 Webpack cache) | 715 MB (本地) / 1.5 GB (生产) | **~1.5 MB (本地) / ~850 MB (生产)** | ❌ 彻底排除 | 可随时由 
pm run build 重建 |
| **构建编译缓存** | .next/cache/ (Webpack pack) | 715 MB (本地) / 633 MB (生产) | **0 MB (已清理)** | ❌ 彻底排除 | 历史编译残留，已全部清空 |
| **生产废弃旧构建** | .next-* (历史 4 个版本副本) | 1.27 GB (生产) | **0 MB (已清理)** | ❌ 彻底排除 | 历史遗留镜像，已全部销毁 |
| **根目录历史部署包** | 60+ 个 deploy_*.tar.gz 等 | 1.24 GB (本地) / 800 MB (生产) | **0 MB (已外部归档)** | ❌ 彻底排除 | 已迁移至 rchive_historical_deploys/ |
| **用户与商户上传文件** | public/UploadFile/, public/uploads/ | 641 MB (生产) | **641 MB** | ❌ 独立存储/备份 | 核心业务资产，由独立备份管理 |
| **生产数据库备份** | /var/backups/yanglin_db/*.sql.gz | 2.5 MB | **2.5 MB** | ❌ 独立存储/备份 | 严禁堆放在 Web 项目目录中 |
| **开发与看门狗日志** | logs/, dev*.log | 32.5 MB | **0 MB (已清空/轮转)** | ❌ 彻底排除 | 已纳入日志轮转机制 |
| **Git 版本历史** | .git/ | 9.0 MB (本地) / 19.3 MB (生产) | **9.01 MB** | ✅ 版本控制 | 仓库健康度极佳，无大 Blob 污染 |

---

## 二、体积治理前后总账对比

### 1. 本地开发环境 (E:\Code\远程服务器\newsite)
- **治理前总大小**：**2,975.10 MB (2.91 GB)**
- **治理后总大小**：**1,017.70 MB (0.99 GB)**（含全部 
ode_modules）
- **排除 node_modules 后的工作区大小**：**~67.6 MB**
- **纯净源码交付包大小**：**9.58 MB** (压缩前约 15 MB)
- **净释放磁盘空间**：**1,957.40 MB (~1.91 GB，降幅达 65.8%)**

### 2. 生产服务器环境 (/var/www/iyanglin.com)
- **治理前总大小**：**5,324 MB (5.20 GB)**
- **治理后总大小**：**2,662 MB (2.60 GB)**
- **净释放磁盘空间**：**2,662 MB (~2.60 GB，降幅达 50.0%)**
- **当前构成**：
  - 核心业务上传文件：641 MB (public/UploadFile 553M + public/uploads 88M)
  - 运行时依赖：1.1 GB (
ode_modules)
  - 正在对外服务的 Next.js Standalone 产物：~850 MB
  - 源码与配置：~20 MB

---

## 三、长期资产管理与防膨胀规范

为防止后续日常开发中项目体积再次失控膨胀，制定并执行以下长效治理规范：

### 1. 部署文件严禁落入项目根目录
- 严禁在项目根目录执行 	ar -czf deploy_xxx.tar.gz 并不清理。
- 自动化发布与回滚脚本必须统一将临时包输出到系统临时目录（如 /tmp 或外部 rchive/），部署成功后自动触发清理。

### 2. 生产日志与 PM2 自动轮转
- 使用 pm2-logrotate 插件对 PM2 日志进行管理：
  `ash
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 20M
  pm2 set pm2-logrotate:retain 7
  pm2 set pm2-logrotate:compress true
  `

### 3. 构建缓存定期清理
- 每次大型生产版本发布时，优先清理 .next/cache，防止数十个版本的 Webpack Pack 文件无限累积。

### 4. 数据库与用户文件存储隔离
- 数据库 Dump 必须强制输出到 /var/backups/yanglin_db/，严禁存放在 Web 根目录。
- 用户上传目录（public/UploadFile、public/uploads）在下阶段演进中推荐挂载到独立云存储（如腾讯云 COS / 阿里云 OSS），彻底解耦应用与文件存储。
