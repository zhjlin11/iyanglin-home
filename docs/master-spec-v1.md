# 杨林生活网 V1 重建总开发规范（Master Spec）

本规范作为 **杨林生活网（iyanglin.com）** 全模块迁移、开发、安全与运维的通用基准规范。所有后续开发阶段（包括 Listing 分类信息、Shop 商家好店、Event 同城活动等）均直接引用本规范，仅需编写该阶段的增量业务需求。

---

## 1. 核心技术栈与架构规范
- **前端/后端全栈**：Next.js (App Router) + TypeScript + Vanilla CSS Design System
- **数据库**：PostgreSQL 14 (`yanglin_db` 生产库，`yanglin_migration_test` 测试隔离库)
- **ORM**：Prisma ORM
- **进程管理**：PM2 (`yanglinol-newsite` 进程 ID 11，单实例/多进程共享配置)

---

## 2. 生产安全与数据隔离五大铁律
1. **绝对生产保护**：扫描、Dry Run 及测试阶段**绝对禁止写入/修改生产数据库 `yanglin_db`**。写测试必须在 `yanglin_migration_test` 隔离库完成；
2. **零数据伪造**：电话号码缺失时允许留空，**绝不伪造 `13800000000` 或 `暂无电话`**；无图片时允许留空 `[]`，由前端组件安全解包解耦呈现占位封面；
3. **敏感信息零源码泄露**：电话号码、个人隐秘数据初始 HTML 源码及未登录 API 响应中**绝对不包含明文**；
4. **按需安全显露**：敏感联系方式统一通过 `GET /api/:module/:id/contact` 进行鉴权按需显露，并配置 **20次/分钟 Rate Limit** 及 `Cache-Control: no-store`；
5. **双重演练原则**：任何正式生产写入前，必须 100% 通过 **二次导入幂等校验** 与 **批次事务回滚演练**。

---

## 3. 模块迁移标准化标准流程 (Migration Protocol)
每个模块（Job 招聘, House 房产, Listing 分类信息, Shop 商家好店）的迁移划分为四个标准化里程碑：
- **阶段 A（离线资产扫描与 Dry Run）**：只读扫描、字段映射、编写 Normalizer、 Dry Run 零写入分析；
- **阶段 B（隔离测试库演练）**：在 `yanglin_migration_test` 进行写入、二次幂等验证与回滚校验；
- **阶段 C（生产备份与批次导入）**：快照备份 `yanglin_db` ➔ 执行事务批量写入 ➔ 登记 JSON 批次清单；
- **阶段 D（端到端线上回归与 SEO 验收）**：完成列表、详情、筛选、SEO Meta、JSON-LD 结构化数据及 E2E 浏览器录像验收。

---

## 4. SEO & 页面渲染基准
- **规范动态 Meta**：Title 格式 `${标题} - ${分类} - 杨林生活网`；
- **结构化数据**：详情页统一植入 Schema.org JSON-LD 标签；
- **响应式设计**：无缝适配 320px 移动端、375px 手机端及 1440px PC 桌面端。
