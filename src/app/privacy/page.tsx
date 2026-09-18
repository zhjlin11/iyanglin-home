import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策 - 杨林生活网",
  description: "杨林生活网隐私政策，说明我们如何收集、使用和保护您的个人信息",
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px", lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>隐私政策</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>更新日期：2026年9月9日 | 生效日期：2026年9月9日</p>

      <p>杨林生活网（以下简称"我们"或"平台"，网址 iyanglin.com）非常重视您的隐私保护。本隐私政策说明我们如何收集、使用、存储和保护您的个人信息。</p>

      <h2 style={{ marginTop: 32 }}>一、我们收集的信息</h2>
      <ul>
        <li><strong>账号信息</strong>：用户名、手机号码、密码（加密存储）</li>
        <li><strong>第三方登录信息</strong>：微信授权登录时获取的昵称、头像、OpenID</li>
        <li><strong>发布内容</strong>：您在平台发布的招聘、房产、商家、二手等信息</li>
        <li><strong>交易信息</strong>：支付订单、金币交易记录、会员订阅信息</li>
        <li><strong>设备信息</strong>：IP地址、浏览器类型、访问时间（用于安全防护）</li>
      </ul>

      <h2 style={{ marginTop: 32 }}>二、信息使用目的</h2>
      <ul>
        <li>提供、维护和改进平台服务</li>
        <li>处理您的支付和订单</li>
        <li>防止欺诈和保护账号安全</li>
        <li>发送服务通知和运营信息</li>
        <li>履行法律义务</li>
      </ul>

      <h2 style={{ marginTop: 32 }}>三、信息存储与保护</h2>
      <p>您的个人信息存储在中国境内的服务器上。我们采取以下安全措施：</p>
      <ul>
        <li>密码采用 scrypt 算法加密存储</li>
        <li>会话使用 HMAC-SHA256 签名</li>
        <li>数据库每日自动备份</li>
        <li>全站 HTTPS 加密传输</li>
      </ul>

      <h2 style={{ marginTop: 32 }}>四、信息共享</h2>
      <p>我们不会出售您的个人信息。仅在以下情况下可能共享：</p>
      <ul>
        <li>支付处理：与微信支付共享必要的交易信息</li>
        <li>法律要求：应法律法规、政府机关要求</li>
      </ul>

      <h2 style={{ marginTop: 32 }}>五、您的权利</h2>
      <p>您有权：</p>
      <ul>
        <li>访问和更正您的个人信息</li>
        <li>删除您的账号和相关数据</li>
        <li>撤回微信授权</li>
        <li>取消订阅营销信息</li>
      </ul>

      <h2 style={{ marginTop: 32 }}>六、联系我们</h2>
      <p>如您对本隐私政策有任何疑问，请通过以下方式联系：</p>
      <ul>
        <li>网站：<a href="/contact">联系我们</a></li>
        <li>平台运营：嵩明杰腾科技有限公司</li>
      </ul>
    </div>
  );
}
