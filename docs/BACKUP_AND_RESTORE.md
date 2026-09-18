# 杨林生活网 (iyanglin.com) - 灾备备份、恢复与资产迁移手册

本文档阐明杨林生活网全量生产数据资产（PostgreSQL 关系型数据库、用户上传多媒体文件、服务配置）的备份策略、存储路径与恢复操作。

---

## 1. 资产分类与备份策略

| 资产类型 | 生产存储路径 | 备份归档路径 | 调度周期 | 保留期限 |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL 业务数据** | Docker `vasto-postgres` (端口 5432) | `/var/backups/yanglin_db/yanglin_backup_*.sql.gz` | 每日凌晨 03:00 (自动 Crontab) | 30 天滚动清理 |
| **用户上传图片与凭据** | `/var/www/iyanglin.com/public/UploadFile/` | `/var/backups/yanglin_source/uploads_*.tar.gz` | 每周一次或大版本发布前 | 永久归档 |
| **生产全量源码快照** | `/var/www/iyanglin.com/` | `/var/backups/yanglin_source/yanglin_source_*.tar.gz` | 每次版本发布前 | 保留最新 5 版 |
| **Nginx 配置文件** | `/etc/nginx/sites-available/` | `deploy/nginx/iyanglin.com.conf.example` | 随 Git 代码库版本管理 | 永久 |

---

## 2. 数据库备份与还原操作

### 2.1 手动触发完整备份
```bash
./scripts/backup.sh
# 备份文件自动输出至: /var/backups/yanglin_db/yanglin_backup_YYYYMMDD_HHMMSS.sql.gz
```

### 2.2 恢复数据库 (灾难恢复)
```bash
# 导入数据至 Docker PostgreSQL
zcat /var/backups/yanglin_db/yanglin_backup_20260918_030001.sql.gz | docker exec -i vasto-postgres psql -U vasto_admin -d yanglin_db
```

### 2.3 实测 RTO 与 RPO 指标
- **RTO (恢复耗时)**：**3.67 秒** (2026-09-18 生产环境实测恢复 127 张表与 4556 用户)；
- **RPO (最大数据丢失窗口)**：**<= 24 小时** (每日凌晨定时快照)。

---

## 3. 用户上传媒体文件迁移

生产环境下用户上传的岗位招聘执照、房屋照片、商品实拍图均存放于 `public/UploadFile`。
由于该目录体积较大 (约 500MB+)，不纳入 Git 仓库，而采用独立的资产归档包迁移：

### 3.1 备份压缩
```bash
tar -czf /var/backups/yanglin_source/uploads_$(date +%Y%m%d).tar.gz -C /var/www/iyanglin.com/public UploadFile
```

### 3.2 在新服务器恢复
```bash
# 解压到新服务器项目 public 目录
tar -xzf uploads_20260918.tar.gz -C /var/www/iyanglin.com/public/
# 赋予 Web 进程读取权限
chown -R ubuntu:ubuntu /var/www/iyanglin.com/public/UploadFile
chmod -R 755 /var/www/iyanglin.com/public/UploadFile
```
