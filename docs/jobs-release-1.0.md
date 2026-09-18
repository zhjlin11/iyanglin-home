# 杨林生活网 - 招聘模块 Release 1.0 运维与封版手册

## 1. 模块版本信息
- **Release Version**: `Jobs v1.0`
- **Git Tag**: `jobs-v1.0`
- **上线时间**: 2026-07-27
- **生产服务器**: `134.175.230.107` (Tencent Cloud Ubuntu 22.04 LTS)
- **生产数据库**: PostgreSQL 5432 (`yanglin_db`)
- **PM2 进程**: ID `11` (`yanglinol-newsite`)

---

## 2. 核心架构与联系方式安全机制
1. **脱敏保护规则**：
   - 包含联系电话的招聘岗位在中段进行星号脱敏（如 `137****3924`）；
   - 网页初始 HTML 源码及服务端渲染 JSON 中**绝对不包含明文手机号**。
2. **联系方式显露 API (`GET /api/jobs/:id/contact`)**：
   - 未登录访问返回 `HTTP 401` `{ "code": "LOGIN_REQUIRED", "maskedPhone": "137****3924" }`；
   - 已登录用户发起请求后，接口校验 Session 并向 `OperationLog` 写入审计日志，然后返回完整手机号；
   - 限制频率（Rate Limit）：每个 IP / User **每分钟最多 20 次**，超出返回 `HTTP 429` `{ "code": "TOO_MANY_REQUESTS" }`。

---

## 3. 运维常用脚本与命令

### 3.1 生产数据库备份与恢复
- **数据库镜像备份**：
  ```bash
  npm run legacy:backup-prod-db
  ```
  备份存放在 `/var/backups/iyanglin/job-migration/` 目录。

- **招聘岗位数据校验**：
  ```bash
  npm run legacy:verify-jobs-production
  ```

- **批次安全回滚**：
  ```bash
  npm run legacy:rollback-jobs-production -- --batch-id=job-prod-001-main --confirm-production --approved-by-owner --execute
  ```

### 3.2 服务健康监测
- **HTTP 健康检查点**：
  - `GET https://iyanglin.com/api/healthz`
  - `GET https://iyanglin.com/api/health`

---

## 4. 常见问题排查 (Troubleshooting)

| 现象 | 可能原因 | 排查与处理办法 |
|---|---|---|
| 点击“查看联系方式”弹出登录 | 用户未登录或 Session 过期 | 提示用户点击登录，登录成功后重新进入岗位详情页点击查看 |
| 提示“查看频率过于频繁” | 触发 20 次/分钟 Rate Limit 限制 | 告知用户等待 1 分钟后重试；排查是否有恶意爬虫抓取 |
| 联系方式显示“暂未公开” | 招聘方原始数据无电话记录 | 正常现象。该岗位无公开电话，不可强制抓取 |
