# 杨林生活网 (iyanglin.com) - 数据库初始化、架构迁移与恢复指引

本文档规范杨林生活网 PostgreSQL 数据库的两种关键生命周期场景：**“全新空库初始化”** 与 **“生产业务数据迁移恢复”**。两类场景必须严格区分操作命令。

---

## 场景 A：全新测试 / 开发环境数据库初始化 (从零建库)

适用场景：本地开发、CI/CD 自动化测试、新部署环境无历史数据接入。

```mermaid
flowchart LR
    A[全新空数据库] -->|schema.prisma| B[npx prisma db push / migrate deploy]
    B --> C[131 张空表结构就绪]
    C -->|可选初始化数据| D[系统管理员 / 基础字典就绪]
```

### 操作步骤：
1. **确保空库创建完毕**：
   ```bash
   # 在 PostgreSQL 中创建空库
   createdb -h localhost -U vasto_admin yanglin_db
   ```
2. **执行架构同步与建表**：
   ```bash
   # 方式一：声明式架构快速初始化 (推荐全新环境使用，耗时约 3 秒，建立全部 131 张表)
   npx prisma db push

   # 方式二：如果使用迁移脚本目录
   npx prisma migrate deploy
   ```
3. **生成 ORM 客户端代码**：
   ```bash
   npx prisma generate
   ```
4. **校验表生成结果**：
   ```bash
   psql -U vasto_admin -d yanglin_db -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
   # 正常应返回 131
   ```

---

## 场景 B：生产真实业务数据导入与灾备还原 (全量恢复)

适用场景：正式服务器更换、灾难恢复、生产完整数据克隆至预发布机。**严禁直接在新环境执行覆盖现有生产库！**

```mermaid
flowchart LR
    Dump[yanglin_db_20260918.sql.gz<br>2.5MB 生产完整快照] -->|zcat / gunzip| Psql[psql -U vasto_admin -d yanglin_db]
    Psql --> Restored[131 张业务表 + 4557 用户 + 1975 岗位 + 58 订单 100% 完整复原]
```

### 操作步骤：
1. **解压并恢复数据库物理 Dump**：
   ```bash
   # 从备份目录恢复至指定数据库
   zcat /var/backups/yanglin_db/yanglin_db_baseline_20260918_2135.sql.gz | psql -U vasto_admin -d yanglin_db
   ```
2. **在 Docker 容器内部恢复示例**：
   ```bash
   zcat /var/backups/yanglin_db/yanglin_backup_20260918_030001.sql.gz | docker exec -i vasto-postgres psql -U vasto_admin -d yanglin_db
   ```
3. **核查核心表记录完整度**：
   ```sql
   SELECT 
     (SELECT count(*) FROM "User") AS users,
     (SELECT count(*) FROM "Job") AS jobs,
     (SELECT count(*) FROM "House") AS houses,
     (SELECT count(*) FROM "BillingOrder") AS orders;
   ```
   - 预期结果：User 约 4557，Job 约 1975，House 约 692，BillingOrder 约 58。
