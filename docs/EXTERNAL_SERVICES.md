# 杨林生活网 (iyanglin.com) - 外部第三方服务与依赖清单

本文档汇总杨林生活网正式运营依赖的全部第三方云服务、开放平台及对应配置要求，便于多环境迁移与新部署时准备账号权限。

---

## 1. 微信公众平台 (服务号)
- **服务角色**：移动端微信网页授权登录、微信关注引导、模板消息提醒、分享卡片自定义 (JSSDK)；
- **平台地址**：[https://mp.weixin.qq.com](https://mp.weixin.qq.com)
- **账号要求**：已认证的微信服务号（企业主体认证）；
- **所需权限**：
  - 网页服务 -> 网页授权获取用户基本信息；
  - JS 接口安全域名 (配置 `iyanglin.com`)；
  - 业务域名与网页授权域名 (配置 `iyanglin.com`)；
  - IP 白名单 (配置生产服务器公网 IP `134.175.230.107`)；
- **配置项**：`WECHAT_MP_APP_ID`, `WECHAT_MP_APP_SECRET`。

---

## 2. 微信开放平台 (开发者中心)
- **服务角色**：桌面 PC 端网页微信二维码扫码登录 (OAuth 2.0 Web)；
- **平台地址**：[https://open.weixin.qq.com](https://open.weixin.qq.com)
- **账号要求**：已通过企业认证的微信开放平台开发者账号；
- **所需配置**：
  - 创建【网站应用】；
  - 授权回调域：`iyanglin.com`；
- **配置项**：`WECHAT_OPEN_APP_ID`, `WECHAT_OPEN_APP_SECRET`。

---

## 3. 微信支付商户平台 (直连商户)
- **服务角色**：自营便利店下单支付、商业发帖置顶收费、订单售后退款原路到账；
- **平台地址**：[https://pay.weixin.qq.com](https://pay.weixin.qq.com)
- **账号要求**：微信支付商户号，已绑定上述微信公众号为同主体 AppID；
- **所需配置**：
  - 开启【JSAPI 支付】与【Native 扫码支付】；
  - 支付授权目录：`https://iyanglin.com/mall/` 与 `https://iyanglin.com/checkout/`；
  - 设置 API v2/v3 密钥；
  - 下载 API 客户端操作证书 (`apiclient_cert.pem`, `apiclient_key.pem`)；
- **配置项**：`WECHAT_PAY_MCH_ID`, `WECHAT_PAY_API_KEY`, `WECHAT_PAY_NOTIFY_URL`。

---

## 4. 腾讯云短信服务 (Tencent Cloud SMS)
- **服务角色**：手机号快速注册、短信验证码登录、敏感操作安全认证；
- **平台地址**：[https://console.cloud.tencent.com/smsv2](https://console.cloud.tencent.com/smsv2)
- **账号要求**：已实名认证的腾讯云账号；
- **所需配置**：
  - 创建国内短信应用；
  - 申请短信签名（必须与备案主体一致，如 `杨林生活网`）；
  - 申请短信模板（验证码类正文模板）；
- **配置项**：`TENCENT_SMS_APP_ID`, `TENCENT_SMS_APP_KEY`, `TENCENT_SMS_TEMPLATE_ID`, `TENCENT_SMS_SIGN`。

---

## 5. 本地大模型与 AI 助手网关 (NewAPI / OpenAI 兼容接口)
- **服务角色**：问问杨林 AI 生活服务助手对话生成、意图识别兜底；
- **服务架构**：生产服务器本地部署的 NewAPI 网关（Docker 端口 3000），转发至上游大语言模型 API；
- **配置项**：`OPENAI_BASE_URL` (默认 `http://127.0.0.1:3000/v1`), `OPENAI_API_KEY`。

---

## 6. 高德地图开放平台 (AMap)
- **服务角色**：房产楼盘坐标定位、自营商城配送范围判定、好店商家导航；
- **平台地址**：[https://lbs.amap.com](https://lbs.amap.com)
- **配置项**：Web 端 JS API Key 与安全密钥。
