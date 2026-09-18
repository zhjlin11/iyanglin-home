# 杨林生活网 (iyanglin.com) - 环境变量参考手册

本文档详细记录杨林生活网服务端所需的全部环境变量配置项、用途、适用环境及配置建议。**严禁将包含真实密钥值的配置文件提交至任何公开版本库。**

---

## 环境变量分类清单

### 1. 基础服务与数据库

| 变量名 | 必填 | 适用环境 | 说明与示例 |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | 是 | 生产 / 开发 | 运行模式：`production` 或 `development` |
| `PORT` | 否 | 生产 / 开发 | HTTP 监听端口，生产默认 `3006`，本地开发默认 `3000` |
| `DATABASE_URL` | 是 | 生产 / 开发 | PostgreSQL 数据库连接串，格式：`postgresql://user:password@host:port/dbname?schema=public` |
| `AUTH_SECRET` | 是 | 生产 / 开发 | 用户会话令牌签名密钥，需为至少 32 位的强随机字符串 (用于 HMAC-SHA256 签名) |

### 2. 微信公众号体系 (WeChat MP)

| 变量名 | 必填 | 适用环境 | 说明与示例 |
| :--- | :--- | :--- | :--- |
| `WECHAT_MP_APP_ID` | 是 | 生产 | 微信公众号唯一 AppID (例如 `wx7884de8a5a30bcc0`) |
| `WECHAT_MP_APP_SECRET` | 是 | 生产 | 微信公众号开发者密码 AppSecret |

### 3. 微信开放平台 (WeChat Open - PC 扫码登录)

| 变量名 | 否 | 生产 | 说明与示例 |
| :--- | :--- | :--- | :--- |
| `WECHAT_OPEN_APP_ID` | 否 | 生产 | 微信开放平台网站应用 AppID (用于桌面端展示微信扫码登录二维码) |
| `WECHAT_OPEN_APP_SECRET` | 否 | 生产 | 微信开放平台网站应用 AppSecret |

### 4. 腾讯云短信服务 (Tencent Cloud SMS)

| 变量名 | 必填 | 适用环境 | 说明与示例 |
| :--- | :--- | :--- | :--- |
| `TENCENT_SMS_APP_ID` | 是 | 生产 | 腾讯云短信应用 SDK AppID |
| `TENCENT_SMS_APP_KEY` | 是 | 生产 | 腾讯云短信应用 AppKey |
| `TENCENT_SMS_TEMPLATE_ID`| 是 | 生产 | 验证码国内短信正文模板 ID |
| `TENCENT_SMS_SIGN` | 是 | 生产 | 经腾讯云审核通过的短信签名内容 (例如 `杨林生活网`) |

### 5. 微信支付商户中心 (WeChat Pay)

| 变量名 | 必填 | 适用环境 | 说明与示例 |
| :--- | :--- | :--- | :--- |
| `WECHAT_PAY_MCH_ID` | 是 | 生产 | 微信支付直连商户号 (例如 `1529097401`) |
| `WECHAT_PAY_API_KEY` | 是 | 生产 | 微信支付商户 API 密钥 (用于 MD5/HMAC 签名及回调报文解密) |
| `WECHAT_PAY_NOTIFY_URL`| 是 | 生产 | 微信支付异步结果回调地址 (例如 `https://iyanglin.com/api/payment/wechat/notify`) |
| `WECHAT_PAY_CERT_PATH` | 否 | 生产 | 商户 API 证书本地路径 (用于自动化退款等敏感资金接口) |
| `WECHAT_PAY_KEY_PATH` | 否 | 生产 | 商户 API 私钥本地路径 (同上) |

### 6. 系统构建与元数据注入

| 变量名 | 必填 | 适用环境 | 说明与示例 |
| :--- | :--- | :--- | :--- |
| `APP_VERSION` | 否 | 生产 / 开发 | 当前系统版本，例如 `1.0.0` |
| `GIT_COMMIT` | 否 | 生产 / 开发 | 当前发布构建 Git Commit Hash |
| `BUILD_TIME` | 否 | 生产 / 开发 | 打包完成时间 (ISO 8601 格式) |

---

## 配置文件加载顺序

Next.js 按照以下优先级自上而下读取环境变量（后加载不覆盖先加载）：
1. `process.env` (操作系统环境或 PM2 显式注入)
2. `.env.local` (本地最高优先级，用于重载密码)
3. `.env.production` (仅生产环境加载) / `.env.development` (仅开发环境加载)
4. `.env` (通用默认配置)
