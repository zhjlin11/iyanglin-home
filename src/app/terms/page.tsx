import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "用户服务协议 - 杨林生活网",
  description: "杨林生活网用户服务协议，请在使用前仔细阅读",
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px", lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>用户服务协议</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>更新日期：2026年9月9日 | 生效日期：2026年9月9日</p>

      <p>欢迎使用杨林生活网（网址 iyanglin.com）。本协议是您与平台运营方嵩明杰腾科技有限公司之间关于使用本平台服务的法律协议。</p>

      <h2 style={{ marginTop: 32 }}>一、服务内容</h2>
      <p>本平台提供以下服务：</p>
      <ul>
        <li>本地招聘信息发布与浏览</li>
        <li>房产交易信息发布与浏览</li>
        <li>商家入驻与推广</li>
        <li>二手物品交易</li>
        <li>生活服务信息</li>
        <li>社区交流</li>
        <li>虚拟币（杨林币）充值与消费</li>
        <li>会员服务</li>
      </ul>

      <h2 style={{ marginTop: 32 }}>二、账号注册与安全</h2>
      <ul>
        <li>您须提供真实、准确的注册信息</li>
        <li>您有责任保管账号密码，因密码泄露造成的损失由您自行承担</li>
        <li>严禁将账号借给他人使用</li>
        <li>平台有权对违规账号进行封禁处理</li>
      </ul>

      <h2 style={{ marginTop: 32 }}>三、内容发布规范</h2>
      <p>您在平台发布的内容须遵守以下规定：</p>
      <ul>
        <li>不得发布违反法律法规的内容</li>
        <li>不得发布虚假、欺诈性信息</li>
        <li>不得侵犯他人知识产权或隐私权</li>
        <li>不得发布垃圾广告或恶意营销内容</li>
        <li>平台保留对违规内容的审核和删除权利</li>
      </ul>

      <h2 style={{ marginTop: 32 }}>四、虚拟币与支付</h2>
      <ul>
        <li>杨林币为平台虚拟货币，仅限在本平台内使用</li>
        <li>杨林币充值后不支持退款或提现，请谨慎充值</li>
        <li>支付通过微信支付完成，订单信息以平台记录为准</li>
        <li>会员服务按服务期计费，到期后自动停止会员权益</li>
      </ul>

      <h2 style={{ marginTop: 32 }}>五、免责声明</h2>
      <ul>
        <li>平台不对用户间交易纠纷承担责任</li>
        <li>平台不保证服务不中断，因不可抗力导致的服务中断不承担责任</li>
        <li>用户发布的内容代表其个人观点，不代表平台立场</li>
      </ul>

      <h2 style={{ marginTop: 32 }}>六、协议修改</h2>
      <p>平台有权根据业务发展需要修改本协议。修改后的协议将在平台上公布，您继续使用平台服务即视为同意修改后的协议。</p>

      <h2 style={{ marginTop: 32 }}>七、联系方式</h2>
      <p>平台运营方：嵩明杰腾科技有限公司</p>
      <p>联系方式：<a href="/contact">联系我们</a></p>
    </div>
  );
}
