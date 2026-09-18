# 杨林生活网 (iyanglin.com) 统一 API 接口规范与清单手册

## 1. API 接口体系总览

| 指标 | 统计值 | 说明 |
| :--- | :--- | :--- |
| **API 接口总数** | 191 个端点 | 覆盖前台交互、移动端、管理后台、企业工作台与 OpenAPI |
| **请求格式** | JSON (`Content-Type: application/json`) | 除文件上传接口采用 `multipart/form-data` 外 |
| **响应统一格式** | 标准 JSON 封包 | `{ "success": true, "data": ..., "code": 200 }` |
| **链路追踪** | `x-request-id` 全局注入 | 由 `src/middleware.ts` 统一分配 UUIDv4，贯穿请求/响应两端 |
| **安全通信协议** | HTTPS (TLS 1.3) | 全站强制 HSTS，拒绝非安全明文 HTTP 请求 |

---

## 2. API 鉴权分级机制

杨林生活网全量 191 个 API 划分为五级严格的安全控制层级：

| 权限等级代码 | 数量 | 认证机制 | 典型适用场景 |
| :--- | :--- | :--- | :--- |
| **`PUBLIC`** | 51 | 无需身份凭据，配备 IP 限流 (Rate-Limit) | 首页聚合数据展示、信息列表查询、详情页、验证码获取、微信服务器异步 Webhook |
| **`AUTH_USER`** | 44 | NextAuth Cookie / JWT Token 会话校验 | 发布分类信息、收藏、点赞、创建订单、个人中心资产查询、评价提交 |
| **`ORG_MEMBER`** | 33 | 校验登录态 + 强制校验企业组织关联 (`orgId`) | 企业工作台、ATS招聘流程、线索跟进、商家商品上下架、核销券码 |
| **`ADMIN`** | 52 | 校验管理员 Session + 强密码角色验证 | 运营大盘、全局内容审核、用户封禁、全局财务结算打款、系统参数调整 |
| **`OPEN_API_TOKEN`** | 11 | HTTP Header `X-API-Key` + HMAC 签名校验 | 开发者平台接口、第三方系统数据同步、外接智能硬件核销 |

---

## 3. 统一请求响应规范

### 成功响应结构 (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "cm8...abc",
    "status": "APPROVED",
    "createdAt": "2026-09-14T23:59:00.000Z"
  },
  "code": 200,
  "requestId": "d8e3b1fa-7102-4d2a-89a1-5678abcdef01"
}
```

### 错误响应结构 (4xx / 5xx)
```json
{
  "success": false,
  "error": "抱歉，您暂无权访问该组织的数据资产 (跨租户访问已拦截)",
  "code": 403,
  "requestId": "d8e3b1fa-7102-4d2a-89a1-5678abcdef01"
}
```

### 标准业务错误码表 (Error Codes)
| HTTP 状态码 | 业务 Code | 含义与处置方案 |
| :--- | :--- | :--- |
| 400 | `BAD_REQUEST` | 入参格式错误、字段校验失败或数据不合法 |
| 401 | `UNAUTHORIZED` | 未登录、Token 已过期或无效 |
| 403 | `FORBIDDEN` | 越权访问：普通用户试图访问管理接口、或跨企业组织访问数据 |
| 404 | `NOT_FOUND` | 目标资源不存在或已被下线 |
| 429 | `RATE_LIMITED` | 触发防刷安全限流（如短信接口 1次/60秒） |
| 500 | `INTERNAL_ERROR` | 服务器内部故障，已记录追踪日志并触发报警 |

---

## 4. 重点业务 API 接口清单摘要

### (1) 账号、认证与安全
- `POST /api/auth/register`: 用户注册 (手机号/验证码)
- `POST /api/auth/login`: 统一登录 (手机号密码/短信/微信)
- `POST /api/auth/logout`: 安全退出并销毁会话
- `POST /api/auth/send-code`: 发送短信验证码 (带 60s 频控)
- `GET  /api/user/profile`: 获取当前登录用户画像与资产

### (2) 本地信息与前台业务
- `GET  /api/jobs`: 招聘岗位列表查询 (支持多维组合筛选)
- `POST /api/jobs`: 发布招聘岗位 (`AUTH_USER`)
- `GET  /api/house`: 房源租售列表
- `POST /api/house`: 挂牌房源 (`AUTH_USER`)
- `GET  /api/haodian`: 好店黄页商家检索
- `GET  /api/info`: 便民二手分类信息列表
- `POST /api/info`: 发布便民信息 (`AUTH_USER`)
- `POST /api/favorites`: 收藏/取消收藏
- `POST /api/reports`: 举报违规内容

### (3) 商业化、收银台与支付
- `POST /api/billing/create`: 创建收银台订单 (服务端校验金额，严禁客户端篡改)
- `GET  /api/billing/order/:id`: 查询收银订单支付状态
- `POST /api/billing/webhook`: 微信支付异步回调通知 (验签 + 幂等去重)
- `POST /api/billing/verify`: 订单状态主动对账核验

### (4) 本地生活服务与履约
- `POST /api/services/request`: 发布找师傅/服务需求
- `POST /api/services/order/create`: 购买服务商品/团购券
- `POST /api/services/verify`: 商家核销服务券码 (`ORG_MEMBER`)
- `POST /api/services/order/refund`: 申请退款

### (5) 组织工作台与多租户 (SaaS)
- `GET  /api/workspace/dashboard`: 企业看板核心指标
- `GET  /api/workspace/ats/candidates`: ATS 候选人库 (`ORG_MEMBER`)
- `POST /api/workspace/ats/interviews`: 安排面试日程
- `GET  /api/workspace/leads`: 商业获客线索跟进

### (6) 运营后台管理
- `GET  /api/admin/dashboard/stats`: 运营大盘 KPI 核心数据
- `POST /api/admin/content/moderate`: 内容人工审核 (通过/驳回/置顶/下架)
- `POST /api/admin/users/:id/ban`: 封禁恶意用户
- `GET  /api/admin/system/health`: 服务器负载与数据库存活探针

### (7) 开放平台 (OpenAPI)
- `GET  /api/v1/openapi/jobs`: 外部招聘岗位同步 (`OPEN_API_TOKEN`)
- `POST /api/v1/openapi/verify-coupon`: 外部 POS 机核销券码
- `POST /api/v1/webhook/register`: 注册第三方回调 Webhook
