# 杨林生活网 (iyanglin.com) - 机密资产与密钥管理清单 (Secrets Inventory)

> **安全级别**：机密 (Confidential)  
> **更新时间**：2026年9月18日  
> **审计结论**：所有真实密钥值已由系统安全拦截，未进入 Git 源码仓库或公开交付包。

---

## 生产环境敏感凭据清单

| 凭据标识 / 变量名 | 资产类型 | 核心业务用途 | 生产存在状态 | 安全托管位置 | 轮换建议周期 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | 数据库凭据 | 连接 PostgreSQL 15 生产数据库 (`yanglin_db`) | ✅ 生产已就绪 | 服务器 `/var/www/iyanglin.com/.env` | 每 180 天或有人员流动时 |
| `AUTH_SECRET` | 密码学密钥 | 用户登录 HMAC-SHA256 Token 签名与验签 | ✅ 生产已就绪 | 服务器 `.env` & `.env.local` | 每年定期或紧急提权事故时 |
| `WECHAT_MP_APP_SECRET` | 开放平台密钥 | 微信公众号网页授权获取 OpenID 与关注状态 | ✅ 生产已就绪 | 服务器 `.env` | 微信公众平台定期更换 |
| `WECHAT_OPEN_APP_SECRET` | 开放平台密钥 | 微信开放平台 PC 网页微信二维码扫码登录 | ✅ 生产已就绪 | 服务器 `.env` | 微信开放平台统一管理 |
| `TENCENT_SMS_APP_KEY` | 云服务凭据 | 腾讯云短信验证码发送与余额扣减 | ✅ 生产已就绪 | 服务器 `.env` | 腾讯云 CAM 子账号控制台 |
| `WECHAT_PAY_API_KEY` | 支付商户秘钥 | 微信支付商户中心 API 报文验签与解密 | ✅ 生产已就绪 | 服务器 `.env` | 微信商户平台管理 |
| `apiclient_cert.pem` | 双向认证证书 | 微信支付退款/红包等资金级接口证书 | ✅ 生产已就绪 | 服务器 `/var/www/iyanglin.com/cert/` | 证书到期前 30 天 |
| `apiclient_key.pem` | 商户私钥 | 微信支付商户私钥 (RSA / SM2) | ✅ 生产已就绪 | 服务器 `/var/www/iyanglin.com/cert/` | 证书到期前 30 天 |
| `apiclient_cert.p12` | 证书打包文件 | 微信支付 Windows/Java 兼容证书文件 | ✅ 生产已就绪 | 服务器 `/var/www/iyanglin.com/cert/` | 证书到期前 30 天 |
| `SSL privkey.pem` | HTTPS 私钥 | Let's Encrypt Nginx 443 传输加密私钥 | ✅ 生产已就绪 | 服务器 `/etc/letsencrypt/live/iyanglin.com/` | Certbot 每 90 天自动轮换 |

---

## 安全防护准则

1. **绝对禁止提交**：`.gitignore` 必须将 `.env*`（排除 `.env.example`）、`cert/*.pem`、`cert/*.key`、`cert/*.p12` 全部列入黑名单；
2. **防泄露检测**：在执行 `git push` 前，运行代码扫描确认无任何硬编码的真实 Secret；
3. **泄露应急响应**：若发现任何密钥在代码库中不慎暴露，禁止仅删除文件，必须立即登录对应的云平台（微信商户平台、腾讯云、数据库）执行**密钥废弃与强制轮换**。
