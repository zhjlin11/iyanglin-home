import { notFound } from "next/navigation";
import { getContent } from "@/lib/content-store";
import Navbar from "@/components/Navbar";
import { formatRichHtml } from "@/lib/rich-text";
import DetailActions from "@/components/DetailActions";
import WechatShareHiddenImage from "@/components/WechatShareHiddenImage";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const categoryLabels: Record<string, string> = {
  life: "本地生活",
  guide: "实用攻略",
  news: "本地新闻",
  food: "美食探店",
  notice: "社区通告",
  legal: "平台协议与政策",
};

// 内置核心协议与条款
const SYSTEM_STATIC_ARTICLES: Record<string, { title: string; category: string; createdAt: string; body: string }> = {
  "user-agreement": {
    title: "杨林生活网用户服务协议",
    category: "legal",
    createdAt: "2026-08-28T00:00:00.000Z",
    body: `
<h2>一、协议概述与接受</h2>
<p>欢迎您使用<strong>杨林生活网</strong>（以下简称“本平台”或“我们”，官方网站：iyanglin.com）。本协议是由杨林生活网用户（以下简称“您”或“用户”）与杨林生活网运营团队就本平台各项产品及服务的使用所订立的具有法律效力的协议。</p>
<p>在您注册、登录、发布信息或使用杨林生活网提供的任何同城便民服务之前，请务必审慎阅读并充分理解本协议的全部内容。当您点击“同意并注册”、“登录”或实际使用本平台服务时，即视为您已充分理解并完全同意接受本协议的全部条款。</p>

<h2>二、服务内容与定位</h2>
<p>杨林生活网致力于为云南省昆明市嵩明县杨林经济技术开发区、杨林职教大学城及周边各乡镇街道的居民、高校师生、入驻企业与个体工商户提供专业、高效、便捷的本地综合生活信息服务，包括但不限于：</p>
<ul>
  <li><strong>同城求职招聘</strong>：经开区企业招工、兼职实习、人才简历投递；</li>
  <li><strong>房屋楼市租售</strong>：大学城师生租房、二手房买卖、商铺厂房写字楼租赁；</li>
  <li><strong>口碑好店名录</strong>：杨林同城美食餐饮、休闲娱乐、生活维修黄页；</li>
  <li><strong>同城便民分类</strong>：二手闲置交易、顺风车拼车、家政服务、寻人寻物；</li>
  <li><strong>同城相亲交友</strong>：实名认证嘉宾展示、同城良缘相亲；</li>
  <li><strong>社区论坛与资讯</strong>：本地民生动态、政务通告、校园趣事与民意交流。</li>
</ul>

<h2>三、用户账号注册与安全保管</h2>
<ol>
  <li><strong>账号资质</strong>：用户注册须具备完全民事行为能力。未成年人应在监护人指导和监督下使用。</li>
  <li><strong>实名与真实信息</strong>：您在注册、手机号验证或微信一键授权绑定时，应提供真实、准确、合法且有效的个人或企业信息。</li>
  <li><strong>账号安全</strong>：您有义务妥善保管账号用户名、密码及短信验证码，不得将账号出借、转让或售卖给第三方。通过您的账号进行的所有操作均视为您本人的行为，由此产生的一切法律责任由您自行承担。</li>
  <li><strong>微信授权登录</strong>：若您使用微信扫码或快捷授权登录，系统将安全同步您的微信公开昵称与头像，用于构建平台个人档案。</li>
</ol>

<h2>四、信息发布规范与用户行为守则</h2>
<p>用户在使用杨林生活网发布任何文字、图片、联系方式或多媒体内容时，必须严格遵守《中华人民共和国网络安全法》《互联网信息服务管理办法》及相关法律法规，严禁发布含有下列内容的信息：</p>
<ul>
  <li>反对宪法确定的基本原则，危害国家安全、泄露国家秘密、颠覆国家政权、破坏国家统一的；</li>
  <li>散布谣言、扰乱社会秩序、破坏社会稳定的虚假信息；</li>
  <li>散布淫秽、色情、赌博、暴力、凶杀、恐怖或者教唆犯罪的；</li>
  <li>侮辱或者诽谤他人，侵害他人名誉权、肖像权、隐私权、知识产权及其他合法权益的；</li>
  <li>发布虚假招聘、高薪诈骗、传销拉人头、刷单套现、非法集资、高利贷放贷的；</li>
  <li>发布虚假房源、黑中介欺诈、无证经营、违禁物品买卖的；</li>
  <li>批量发布重复垃圾广告、恶意灌水或植入恶意代码、病毒链接的。</li>
</ul>
<p><strong>违规处理</strong>：对于违反上述规范的内容，平台有权不经预先通知直接予以<strong>下线、删除、扣除信用积分、限制发帖权限、封禁账号</strong>，并依法向公安及网信监管部门移交违法线索。</p>

<h2>五、各核心业务板块特别约定</h2>
<h3>1. 求职招聘业务</h3>
<p>招聘企业与用人单位须保证企业真实存续、职位薪资真实有效，严禁向求职者收取任何形式的“报名费”、“押金”、“体检费”或扣押证件；求职者应如实填写个人履历与求职意向。</p>

<h3>2. 房屋租售业务</h3>
<p>房东及中介方须保证房源真实存在、价格透明。严禁“一房多租”、发布虚假低价引流房源。租房双方在线下签约前应核验房产证明与身份信息，切勿向未经核实的陌生账户转账定金。</p>

<h3>3. 好店名录与商户入驻</h3>
<p>平台自营商品须经过内容与来源审核，如实展示商品信息，并由平台统一提供客服支持与售后处理。</p>

<h3>4. 相亲交友服务</h3>
<p>相亲交友板块倡导真诚、实名、文明交友。严禁利用交友板块进行杀猪盘诈骗、借贷索财、色情交易或推销广告。请广大用户在交友过程中提高防范意识，涉及金钱往来务必高度警惕。</p>

<h2>六、增值服务、推广置顶与付费规则</h2>
<ol>
  <li>本平台基础信息发布免费。为满足用户快速曝光需求，平台提供“信息置顶”、“多频道联播”、“相亲联系方式解锁”等增值付费服务。</li>
  <li>所有收费项目的计费标准与服务时长均在收银台页面明确公示，用户在自愿原则下完成在线支付（支持微信支付等）。</li>
  <li>因信息推广服务属于数字化即时消费权益，服务一旦开通生效（如信息已置顶展示），原则上不予退费；如遇系统故障导致服务未履约，平台将按未消费时长为您补足或退还相应金额。</li>
</ol>

<h2>七、免责声明</h2>
<ol>
  <li>杨林生活网作为本地信息撮合与交流平台，平台上的招聘、房产、转让等信息均由发布者自行上传。平台通过智能风控与人工审核尽力保障信息合法合规，但<strong>无法对第三方发布信息的绝对真实性、完整性与履约能力做出担保</strong>。</li>
  <li>用户在依据平台信息进行交易、求职应聘、租房看房、线下见面时，<strong>务必自行核实对方身份与资质，注意人身与财产安全</strong>。因双方线下交易所产生的纠纷，平台将积极协助提供必要证据，但不承担连带民事赔偿责任。</li>
  <li>因不可抗力（如地震、台风、洪水）、政府管制、黑客攻击、基础电信网络中断等非平台故意或重大过失导致的服务中断，平台将尽力抢修但免于承担违约责任。</li>
</ol>

<h2>八、知识产权与内容授权</h2>
<p>用户在杨林生活网公开发布的原创内容（包括文字、图片等），用户享有著作权，同时授予杨林生活网在全球范围内免费的、非独占的、可转授权的使用许可，用于平台的展示、宣传与推广。</p>

<h2>九、协议修改、管辖与法律适用</h2>
<ol>
  <li>杨林生活网有权根据业务发展及国家法律法规变化适时修订本协议，修订后的协议一经在平台公布即生效。</li>
  <li>本协议之订立、生效、解释、修订、补充、终止及纠纷解决均适用中华人民共和国大陆地区法律。</li>
  <li>如双方就本协议内容或履行发生任何争议，应友好协商解决；协商不成的，任何一方均可向<strong>云南省昆明市嵩明县人民法院</strong>提起诉讼。</li>
</ol>

<h2>十、联系与客服反馈</h2>
<p>如果您对本协议有任何疑问、意见或举报投诉，欢迎通过以下官方渠道与我们取得联系：</p>
<ul>
  <li>官方网站：<a href="https://iyanglin.com" target="_blank">iyanglin.com</a></li>
  <li>联系邮箱：support@iyanglin.com / admin@yanglinol.com</li>
  <li>服务区域：云南省昆明市嵩明县杨林经开区 & 大学城</li>
</ul>
<p style="text-align: right; margin-top: 30px; font-weight: bold; color: #0B7A75;">杨林生活网 运营团队<br/>生效日期：2026年8月</p>
    `.trim(),
  },
  "privacy-policy": {
    title: "杨林生活网隐私保护指引与个人信息处理规则",
    category: "legal",
    createdAt: "2026-08-28T00:00:00.000Z",
    body: `
<h2>一、引言与承诺</h2>
<p>杨林生活网（以下简称“我们”或“平台”）深知个人信息对您的重要性，并始终致力于保护您的个人信息安全与个人隐私。我们严格恪守《中华人民共和国个人信息保护法》《中华人民共和国网络安全法》《中华人民共和国数据安全法》及《常见类型移动互联网应用程序必要个人信息范围规定》等法律法规，遵循“权责一致、目的明确、选择同意、最少够用、确保安全、公开透明”的原则处理您的个人信息。</p>
<p>本指引旨在向您清晰说明我们在您使用杨林生活网各项同城服务时，如何收集、使用、存储、共享和保护您的个人信息，以及您所享有的知情权、更正权、删除权等权利。<strong>请您在注册、登录或使用服务前仔细阅读本指引。</strong></p>

<h2>二、我们如何收集和使用您的个人信息</h2>
<p>我们仅出于本指引所述的以下合法、正当、必要目的，收集和使用您在使用服务过程中主动提供或产生的个人信息：</p>

<h3>1. 账号注册与安全登录</h3>
<ul>
  <li><strong>手机号码与短信验证码</strong>：用于快速核验您的真实身份、完成实名认证注册及找回密码，保障账号安全；</li>
  <li><strong>微信授权信息</strong>：当您选择微信扫码或微信一键授权登录时，我们经您明确授权后将获取您的<strong>微信 OpenID、微信公开头像、昵称</strong>，用于创建和同步您的杨林生活网用户档案；</li>
  <li><strong>用户名与登录密码</strong>：用于建立您的登录凭证，密码在服务器端均采用高强度单向哈希加密存储。</li>
</ul>

<h3>2. 同城便民信息发布与展示</h3>
<ul>
  <li><strong>联系人姓名与联系电话</strong>：当您主动在求职招聘、房屋租售、便民二手、商户入驻页面发布信息时，您填写的联系电话将向同城意向用户展示，以便双方电话沟通；</li>
  <li><strong>地理位置与门店地址</strong>：当您发布房源、招聘地点或商户名录时，填写的详细地址将用于同城距离展示与导航定位；</li>
  <li><strong>图片与附件</strong>：您上传的房源实勘图、商户门头照、个人简历照片等，用于丰富信息展示。</li>
</ul>

<h3>3. 相亲交友专属服务</h3>
<ul>
  <li>当您加入同城相亲交友大厅时，您主动填写的<strong>年龄、职业、交友宣言、嘉宾生活照片、微信号/联系电话</strong>将作为相亲卡片展示。平台对联系电话等敏感隐私信息设有防骚扰查看与核销机制。</li>
</ul>

<h3>4. 支付与安全审计</h3>
<ul>
  <li><strong>交易订单记录</strong>：当您进行信息置顶推广或增值服务购买时，系统将记录订单号、交易金额、支付时间、支付方式与订单状态，用于财务记账与权益开通；</li>
  <li><strong>网络安全与日志风控</strong>：为保障系统安全稳定运行，防范恶意爬虫与电信网络诈骗，我们会自动收集您的<strong>访问 IP 地址、浏览器类型、操作时间、搜索日志</strong>。</li>
</ul>

<h2>三、我们如何使用 Cookie 和同类技术</h2>
<ol>
  <li>为了保证网站正常运转、使您免去重复输入账号密码的繁琐操作，我们会在您的浏览器中设置安全的 Session Cookie 和 Token。</li>
  <li>这些技术仅用于记录您的登录状态、安全风控防御及个性化界面偏好，我们绝不会将其用于本政策之外的任何其他用途。</li>
</ol>

<h2>四、我们如何共享、转让和公开披露您的信息</h2>
<ol>
  <li><strong>公开披露原则</strong>：除您主动在发帖内容中公开的联系方式、房源地址等必要便民信息外，<strong>杨林生活网绝不会向任何第三方出售、出租或非法提供您的个人私密信息</strong>。</li>
  <li><strong>业务必要共享</strong>：在进行微信支付或短信下发时，我们仅向微信支付官方机构及中国工信部持牌合规短信通道提供完成研究所需的必要字段（如订单金额、手机号）。</li>
  <li><strong>法定例外</strong>：根据法律法规规定、行政司法机关合法命令或为侦破重大电信网络诈骗案件时，我们依法配合提供相关数据。</li>
</ol>

<h2>五、我们如何存储和保护您的个人信息</h2>
<ol>
  <li><strong>存储地点</strong>：我们在中华人民共和国境内运营中收集和产生的个人信息，均依法存储在中国大陆境内的安全服务器中。</li>
  <li><strong>数据安全防护措施</strong>：
    <ul>
      <li>全站部署 HTTPS / SSL 全链路加密传输，防止网络窃听与中间人篡改；</li>
      <li>微信头像防盗链与图片跨域安全隔离机制；</li>
      <li>数据库多层访问控制、密码加盐加密及定期灾备备份；</li>
      <li>严格的内部员工数据访问权限隔离与操作审计追踪机制。</li>
    </ul>
  </li>
  <li><strong>存储期限</strong>：我们仅在实现本指引所述目的所需的合理期限内保留您的个人信息，超出期限后将予以删除或匿名化处理。</li>
</ol>

<h2>六、您的个人信息权利</h2>
<p>按照中国相关法律、法规与国家标准，我们保障您对自己的个人信息行使以下法定权利：</p>
<ol>
  <li><strong>查阅与修改您的个人信息</strong>：您可以随时登录杨林生活网，进入「个人中心（/profile）」查阅或修改您的昵称、头像、手机号及历史发布内容；</li>
  <li><strong>删除您的信息</strong>：您可以自主下线或删除您在平台发布的房产、招聘、便民帖子及相亲档案；</li>
  <li><strong>注销账号与解绑授权</strong>：如果您决定不再使用杨林生活网，您可通过联系客服申请注销您的账号。注销后，我们将停止为您提供服务并依法删除您的个人信息；</li>
  <li><strong>撤回同意与投诉举报</strong>：若您发现平台存在侵犯您个人隐私的行为，可随时发起投诉，我们将在 48 小时内核实处理。</li>
</ol>

<h2>七、未成年人隐私保护特别指引</h2>
<p>我们的产品及同城服务主要面向具备完全民事行为能力的成年居民。若您是 18 周岁以下的未成年人，在使用本平台前请务必请您的父母或法定监护人仔细阅读本指引，并在取得监护人明确同意后方可使用。</p>

<h2>八、本指引的修订与更新</h2>
<p>随着杨林生活网业务功能的发展及法律法规的变化，我们可能会适时修订本隐私保护指引。当本指引发生重大实质性变更时，我们将在网站首页、登录页面显著位置发布公告通知。若您在指引更新后继续使用杨林生活网，即表示您已充分阅读、理解并同意接受更新后的隐私指引。</p>

<h2>九、如何联系我们的个人信息保护团队</h2>
<p>如果您对本隐私保护指引有任何疑问、意见、建议或隐私安全投诉，请随时与我们取得联系：</p>
<ul>
  <li>官方网站：<a href="https://iyanglin.com" target="_blank">iyanglin.com</a></li>
  <li>个人信息保护工作邮箱：privacy@iyanglin.com / admin@yanglinol.com</li>
  <li>受理地址：云南省昆明市嵩明县杨林经济技术开发区</li>
</ul>
<p style="text-align: right; margin-top: 30px; font-weight: bold; color: #0B7A75;">杨林生活网 数据安全与合规团队<br/>生效日期：2026年8月</p>
    `.trim(),
  },
};


export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  let article = await getContent(slug);
  if (!article && SYSTEM_STATIC_ARTICLES[slug]) {
    const staticItem = SYSTEM_STATIC_ARTICLES[slug];
    article = {
      id: slug,
      kind: "article",
      title: staticItem.title,
      body: staticItem.body,
      category: staticItem.category,
      status: "approved",
      createdAt: staticItem.createdAt,
    };
  }
  if (!article) return {};

  const cleanTitle = `${article.title} - 杨林生活网资讯`;
  const cleanDesc = (article.body || "").replace(/<[^>]*>/g, " ").slice(0, 120);

  return {
    title: cleanTitle,
    description: cleanDesc,
    openGraph: {
      title: cleanTitle,
      description: cleanDesc,
      url: `https://iyanglin.com/articles/${slug}`,
      siteName: "杨林生活网",
      images: [
        {
          url: (article.images && article.images[0]) || "https://iyanglin.com/share/v2/article.png?v=20260912",
          width: 600,
          height: 600,
        },
      ],
    },
    alternates: {
      canonical: `https://iyanglin.com/articles/${slug}`,
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  
  // 先尝试从数据库获取，若未命中则读取系统内置核心条款
  let article = await getContent(slug);

  if (!article && SYSTEM_STATIC_ARTICLES[slug]) {
    const staticItem = SYSTEM_STATIC_ARTICLES[slug];
    article = {
      id: slug,
      kind: "article",
      title: staticItem.title,
      body: staticItem.body,
      category: staticItem.category,
      status: "approved",
      createdAt: staticItem.createdAt,
    };
  }

  if (!article) notFound();

  const categoryName = categoryLabels[article.category || "life"] || "本地资讯";

  // Article 结构化数据
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    datePublished: article.createdAt,
    author: { "@type": "Organization", name: "杨林生活网", url: "https://iyanglin.com" },
    publisher: {
      "@type": "Organization",
      name: "杨林生活网",
      logo: { "@type": "ImageObject", url: "https://iyanglin.com/images/logo/yanglin_brand_perfect_v2.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://iyanglin.com/articles/${slug}` },
    articleSection: categoryName,
    inLanguage: "zh-CN",
  };

  const rawArticleImg = article.images && article.images[0];
  const articleShareImg = rawArticleImg
    ? (rawArticleImg.startsWith("http") ? rawArticleImg : `https://iyanglin.com${rawArticleImg.startsWith("/") ? "" : "/"}${rawArticleImg}`)
    : "https://iyanglin.com/share/v2/article.png?v=20260912";
  const articleShareTitle = `${article.title} - 杨林生活网资讯`;
  const articleShareDesc = `杨林生活网本地资讯与官方服务通知，点击阅读全文。`;

  return (
    <div className="support-page article-detail-page" style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* 微信与社交分享爬虫首图兜底 */}
      <WechatShareHiddenImage imageUrl={articleShareImg} alt={articleShareTitle} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <Navbar />

      {/* Breadcrumb & Navigation */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "12px 1rem" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#0B7A75",
              fontWeight: "700",
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            <span>←</span> 返回杨林生活网首页
          </a>

          <div style={{ fontSize: "13px", color: "#64748b" }}>
            <span>杨林生活网</span> / <span>官方服务</span> / <span style={{ color: "#0f172a", fontWeight: "600" }}>{categoryName}</span>
          </div>
        </div>
      </div>

      {/* Main Article Container */}
      <main style={{ maxWidth: "960px", margin: "2rem auto 5rem auto", padding: "0 1rem" }}>
        <article
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            padding: "clamp(1.5rem, 5vw, 3.5rem)",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.03)",
          }}
        >
          {/* Header Metadata */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <span
              style={{
                background: "#e6f4f3",
                color: "#0B7A75",
                fontSize: "12.5px",
                fontWeight: "800",
                padding: "4px 12px",
                borderRadius: "20px",
                border: "1px solid #9bd5cc",
              }}
            >
              📜 {categoryName}
            </span>
            <time style={{ fontSize: "13.5px", color: "#64748b" }}>
              📅 更新于 {formatDate(article.createdAt)}
            </time>
            <span style={{ fontSize: "13.5px", color: "#94a3b8" }}>·</span>
            <span style={{ fontSize: "13.5px", color: "#64748b" }}>
              📍 嵩明·杨林生活网法务与合规部官方发布
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "clamp(22px, 4vw, 32px)",
              fontWeight: "900",
              color: "#0f172a",
              lineHeight: "1.35",
              margin: "0 0 1.5rem 0",
              letterSpacing: "-0.5px",
            }}
          >
            {article.title}
          </h1>

          <div style={{ height: "1px", background: "#f1f5f9", margin: "1.5rem 0 2rem 0" }} />

          {/* Body Content */}
          <div
            className="article-rich-content"
            style={{
              fontSize: "15.5px",
              lineHeight: "1.9",
              color: "#334155",
              wordBreak: "break-word",
            }}
            dangerouslySetInnerHTML={{ __html: formatRichHtml(article.body) }}
          />

          {/* Photo Gallery if images exist */}
          {article.images && article.images.length > 0 && (
            <div style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid #f1f5f9" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "1rem" }}>
                📸 相关图集 ({article.images.length} 张)
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                {article.images.map((img, i) => (
                  <div key={i} style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <img
                      src={img}
                      alt={`${article.title} 图 ${i + 1}`}
                      style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}





          {/* 互动数据栏：点赞 ｜ 收藏 ｜ 分享 */}
          <div
            style={{
              marginTop: "28px",
              padding: "16px 0",
              borderTop: "1px solid #F1F5F9",
              borderBottom: "1px solid #F1F5F9",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              style={{
                background: "#FEF2F2",
                color: "#EF4444",
                border: "1px solid #FEE2E2",
                borderRadius: "24px",
                padding: "8px 20px",
                fontSize: "13.5px",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <span>👍</span>
              <span>点赞 24</span>
            </button>

            <DetailActions
              resourceType="ARTICLE"
              resourceId={article.id}
              title={articleShareTitle}
              desc={articleShareDesc}
              link={`https://iyanglin.com/articles/${slug}`}
              imageUrl={articleShareImg}
            />
          </div>

          {/* 评论区 (热门评论 ｜ 最新评论) */}
          <div style={{ marginTop: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#1F2937", margin: 0 }}>
                💬 街坊热评 (3)
              </h3>
              <span style={{ fontSize: "12px", color: "#9CA3AF" }}>文明上网，理性发言</span>
            </div>

            {/* 热门评论列表 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { name: "杨林热心街坊", time: "2小时前", content: "感谢杨林生活网的及时播报，这个对我们出行太有帮助了！", likes: 12 },
                { name: "大学城大三学长", time: "5小时前", content: "转发到我们班级群了，给力 👍", likes: 8 },
                { name: "经开区小李", time: "昨天", content: "支持本地生活网，每天必看的资讯频道！", likes: 5 },
              ].map((comment, i) => (
                <div key={i} style={{ background: "#F8FAFC", padding: "14px", borderRadius: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px" }}>👤</span>
                      <b style={{ fontSize: "13px", color: "#1F2937" }}>{comment.name}</b>
                    </div>
                    <span style={{ fontSize: "11.5px", color: "#9CA3AF" }}>{comment.time}</span>
                  </div>
                  <div style={{ fontSize: "13.5px", color: "#374151", lineHeight: "1.5", marginBottom: "8px" }}>
                    {comment.content}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "12px", color: "#6B7280", gap: "4px", alignItems: "center" }}>
                    <span>👍 {comment.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </main>

      {/* 底部吸底写评论栏 (移动端专属，PC端隐藏) */}
      <div
        className="mobile-sticky-action-bar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid #E5E7EB",
          padding: "10px 16px",
          paddingBottom: "max(10px, env(safe-area-inset-bottom))",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          zIndex: 999,
          boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <input
          type="text"
          placeholder="说点什么吧，与杨林街坊互动..."
          style={{
            flex: 1,
            background: "#F3F4F6",
            border: "none",
            borderRadius: "20px",
            padding: "10px 16px",
            fontSize: "13.5px",
            outline: "none",
          }}
        />
        <button
          type="button"
          style={{
            background: "#16A67A",
            color: "#ffffff",
            border: "none",
            borderRadius: "20px",
            padding: "10px 18px",
            fontSize: "13.5px",
            fontWeight: "800",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          发送
        </button>
      </div>

      {/* 富文本样式增强 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .article-rich-content h2 {
              font-size: 19px;
              font-weight: 800;
              color: #0f172a;
              margin: 28px 0 12px 0;
              padding-left: 12px;
              border-left: 4px solid #0B7A75;
            }
            .article-rich-content h3 {
              font-size: 16px;
              font-weight: 700;
              color: #1e293b;
              margin: 20px 0 10px 0;
            }
            .article-rich-content p {
              margin: 12px 0;
              line-height: 1.85;
            }
            .article-rich-content ul, .article-rich-content ol {
              margin: 12px 0 16px 24px;
              line-height: 1.85;
            }
            .article-rich-content li {
              margin-bottom: 6px;
            }
            .article-rich-content a {
              color: #0B7A75;
              text-decoration: underline;
            }
            .article-rich-content strong {
              color: #0f172a;
            }
          `,
        }}
      />
    </div>
  );
}
