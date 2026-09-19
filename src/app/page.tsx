import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { stripHtml, cleanText } from "@/lib/strip-html";
import { getImageUrl } from "@/lib/image-url";

import Navbar from "@/components/Navbar";
import MobileHomePage from "@/components/MobileHomePage";
import AdBanner from "@/components/AdBanner";
import HomeMallShowcase from "@/components/mall/HomeMallShowcase";
import Link from "next/link";
import s from "./home.module.css";

export const metadata: Metadata = {
  title: "杨林生活网 - 嵩明杨林本地生活综合服务门户平台",
  description:
    "杨林生活网为您提供昆明嵩明杨林镇、杨林大学城、杨林经开区本地新闻头条、企业招聘、租房买房、同城商城、相亲交友与同城活动。",
  keywords: [
    "杨林",
    "嵩明",
    "杨林生活网",
    "杨林大学城",
    "杨林招聘",
    "杨林租房",
    "杨林自营商城",
    "本地头条",
    "嵩明便民",
  ],
  openGraph: {
    title: "杨林生活网 - 嵩明杨林本地生活综合服务门户平台",
    description:
      "昆明嵩明杨林本地真实便民信息、企业招聘、求职简历、房屋租赁、平台自营商城、相亲交友与同城活动门户。",
    url: "https://iyanglin.com",
    siteName: "杨林生活网",
  },
  alternates: { canonical: "https://iyanglin.com" },
};

export const revalidate = 60;

export default async function HomePage() {
  /* ======== 1. 全频道真实数据查询 ======== */
  const [
    jobs,
    housesWithImg,
    shopsWithImg,
    eventsWithImg,
    posts,
    articles,
    datingWithImg,
    topics,
    mallProducts,
    deliveryZones,
    mallCategories,
  ] = await Promise.all([
    prisma.job.findMany({
      where: { status: "APPROVED" },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.house.findMany({
      where: {
        status: "APPROVED",
        images: { isEmpty: false },
        NOT: [
          { title: { contains: "邹城" } },
          { title: { contains: "济宁" } },
          { title: { contains: "界首" } },
        ],
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.shop.findMany({
      where: {
        status: "APPROVED",
        OR: [{ logo: { not: null } }, { images: { isEmpty: false } }],
      },
      take: 12,
      orderBy: { createdAt: "desc" },
    }),
    prisma.event.findMany({
      where: { status: "APPROVED", images: { isEmpty: false } },
      take: 2,
      orderBy: { createdAt: "desc" },
    }),
    prisma.post.findMany({
      where: { status: "APPROVED" },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.article.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        title: true,
        images: true,
        body: true,
        createdAt: true,
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.datingProfile.findMany({
      where: { status: "APPROVED", photos: { isEmpty: false } },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.post.findMany({
      where: { status: "APPROVED" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { username: true } } },
    }),
    prisma.product.findMany({
      where: { status: "ON_SALE", stock: { gt: 0 } },
      include: { category: { select: { id: true, name: true, icon: true } } },
      orderBy: [{ isFeatured: "desc" }, { isHot: "desc" }, { createdAt: "desc" }],
    }),
    prisma.deliveryZone.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.mallCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, icon: true },
    }),
  ]);

  /* ======== 2. 兜底补齐 ======== */
  const houses =
    housesWithImg.length >= 6
      ? housesWithImg
      : await prisma.house.findMany({
          where: { status: "APPROVED" },
          take: 6,
          orderBy: { createdAt: "desc" },
        });

  const shops =
    shopsWithImg.length >= 12
      ? shopsWithImg
      : await prisma.shop.findMany({
          where: { status: "APPROVED" },
          take: 12,
          orderBy: { createdAt: "desc" },
        });

  const events =
    eventsWithImg.length >= 2
      ? eventsWithImg
      : await prisma.event.findMany({
          where: { status: "APPROVED" },
          take: 2,
          orderBy: { createdAt: "desc" },
        });

  const datingProfiles =
    datingWithImg.length >= 6
      ? datingWithImg
      : await prisma.datingProfile.findMany({
          where: { status: "APPROVED" },
          take: 6,
          orderBy: { createdAt: "desc" },
        });

  /* ======== 3. 数据整理 ======== */
  // NexaPress 博客卡片用的文章（先清洗纯文本并生成摘要，截短正文避免庞大 HTML payload 造成页面体积臃肿）
  const processedArticles = articles.map(art => {
    const fullCleanText = stripHtml(art.body || "");
    return {
      ...art,
      excerpt: fullCleanText.slice(0, 90) + (fullCleanText.length > 90 ? "..." : ""),
      readingMinutes: Math.max(2, Math.ceil(fullCleanText.length / 400)),
      body: fullCleanText.slice(0, 300),
    };
  });
  const heroArticle = processedArticles.length > 0 ? processedArticles[0] : null;
  const blogCardArticles = processedArticles.slice(0, 4);
  // 热帖侧边栏用的文章（往后排）
  const trendingArticles = processedArticles.length > 4 ? processedArticles.slice(4, 7) : processedArticles.slice(0, 3);

  // 博客卡片色调背景映射
  const cardBgClasses = [s.blogCardBg1, s.blogCardBg2, s.blogCardBg3, s.blogCardBg4, s.blogCardBg5, s.blogCardBg6];
  // 热帖缩略图色调
  const trendThumbClasses = [s.trendingThumb1, s.trendingThumb2, s.trendingThumb3];

  // 博客卡片分类标签
  const cardCategories = ["📰 本地头条", "💼 职场动态", "🏠 房产资讯", "🎪 同城热点"];

  const formatDate = (dateStr: any) => {
    try {
      const d = new Date(dateStr);
      return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } catch {
      return "08-31";
    }
  };

  /* ======== 4. 结构化数据 (JSON-LD) ======== */
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://iyanglin.com/#website",
        url: "https://iyanglin.com",
        name: "杨林生活网",
        description: "昆明嵩明杨林本地真实便民信息、企业招聘、求职简历、房屋租赁、平台自营商城、相亲交友与同城活动门户。",
        inLanguage: "zh-CN",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: "https://iyanglin.com/search?q={search_term_string}" },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://iyanglin.com/#organization",
        name: "杨林生活网",
        url: "https://iyanglin.com",
        logo: "https://iyanglin.com/images/logo/yanglin_brand_perfect_v2.png",
        description: "嵩明杨林本地数字化综合生活媒体与便民门户平台",
        address: {
          "@type": "PostalAddress",
          addressLocality: "嵩明县杨林经济技术开发区",
          addressRegion: "云南省昆明市",
          addressCountry: "CN",
        },
        telephone: "13619694207",
        areaServed: { "@type": "City", name: "昆明市嵩明县杨林镇" },
      },
    ],
  };

  /* ======== 5. 渲染 ======== */
  return (
    <div className={s.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      {/* ═══════════════ 首页顶部 Banner 广告位 (按需关闭) ═══════════════ */}
      {/* <AdBanner placementKey="HOME_BANNER" maxItems={2} /> */}

      {/* ═══════════════ 移动端 APP 风格首页 ═══════════════ */}
      <div className={s.mobileSection}>
        <MobileHomePage
          jobs={JSON.parse(JSON.stringify(jobs))}
          houses={JSON.parse(JSON.stringify(houses))}
          shops={JSON.parse(JSON.stringify(shops))}
          events={JSON.parse(JSON.stringify(events))}
          articles={JSON.parse(JSON.stringify(processedArticles))}
          posts={JSON.parse(JSON.stringify(posts))}
          datingProfiles={JSON.parse(JSON.stringify(datingProfiles))}
          mallProducts={JSON.parse(JSON.stringify(mallProducts))}
          deliveryZones={JSON.parse(JSON.stringify(deliveryZones))}
          categories={JSON.parse(JSON.stringify(mallCategories))}
        />
      </div>

      {/* ═══════════════ 桌面端内容（移动端隐藏） ═══════════════ */}
      <div className={s.desktopSection}>

      {/* ═══════════════ NexaPress 焦点故事区 ═══════════════ */}
      <section className={s.storiesSection}>
        <div className={s.npContainer}>
          <h2 className={s.secTitle}>探索杨林 <span>本地资讯</span></h2>
          <p className={s.secSub}>
            汇聚嵩明杨林大学城与经开区最新动态、便民服务与同城活动——真实本地信息一站即达。
          </p>

          {heroArticle && (
            <Link prefetch={false} href={`/articles/${heroArticle.id}`} className={s.storyCard}>
              <img
                className={s.storySliderImg}
                loading="eager"
                decoding="async"
                src={heroArticle.images && heroArticle.images.length > 0 ? getImageUrl(heroArticle.images[0]) || "/UploadFile/image/2020/04-18/20200418190934_42050.jpg" : "/UploadFile/image/2020/04-18/20200418190934_42050.jpg"}
                alt={heroArticle.title}
              />
              <div className={s.storySlideLeft}>
                <div className={s.storySlideContent}>
                  <div className={s.storyCatBadgeMeta}>
                    <span className={s.storyCatBadge}>
                      <span className={s.storyCatBadgeIcon}>📰</span>
                      本地头条
                    </span>
                    <div className={s.storySlideMeta}>
                      <span>🕐 {heroArticle.readingMinutes} 分钟阅读</span>
                      <span>📅 {formatDate(heroArticle.createdAt)}</span>
                    </div>
                  </div>
                  <h3 className={s.storySlideTitle}>{heroArticle.title}</h3>
                  <p className={s.storySlideDesc}>
                    {heroArticle.excerpt}
                  </p>
                  <span className={s.readMore}>阅读更多 →</span>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* ═══════════════ NexaPress 博客卡片 + 侧边栏 ═══════════════ */}
      <section className={s.blogSection}>
        <div className={s.npContainer}>
          <h2 className={s.secTitle}>发现全部 <span>频道</span></h2>
          <p className={s.secSub}>
            本地头条、招聘求职、房产楼市、自营好物……杨林生活网每日为你精选。
          </p>

          <div className={s.blogLayout}>
            {/* 左侧: 博客卡片网格 */}
            <div className={s.blogLeft}>
              <div className={s.blogGrid}>
                {blogCardArticles.map((art, idx) => {
                  const cover = art.images && art.images.length > 0 ? getImageUrl(art.images[0]) : null;
                  return (
                    <Link
                      key={art.id}
                      prefetch={false}
                      href={`/articles/${art.id}`}
                      className={s.blogCard}
                    >
                      <div className={s.blogCardCover}>
                        {cover ? (
                          <img
                            loading="lazy"
                            decoding="async"
                            src={cover}
                            alt={art.title}
                          />
                        ) : (
                          <div className={`${s.blogCardPlaceholder} ${cardBgClasses[idx % cardBgClasses.length]}`}>
                            📰
                          </div>
                        )}
                        <span className={s.blogCardBadge}>
                          {cardCategories[idx % cardCategories.length]}
                        </span>
                      </div>
                      <div className={s.blogCardDetails}>
                        <div className={s.blogCardMeta}>
                          <span className={s.blogCardAuthor}>
                            <img
                              className={s.blogCardAuthorAvatar}
                              src="/uploads/articles/yanglin_gov_avatar.jpg"
                              alt="杨林融媒"
                            />
                            杨林官方融媒
                          </span>
                          <span style={{ fontSize: "11.5px", color: "#94A3B8" }}>
                            🕐 {art.readingMinutes} 分钟
                          </span>
                        </div>
                        <h3 className={s.blogCardTitle}>{art.title}</h3>
                        <p className={s.blogCardDesc}>
                          {art.excerpt}
                        </p>
                        <div className={s.blogCardFooter}>
                          <span className={s.blogCardFooterItem}>
                            📅 {formatDate(art.createdAt)}
                          </span>
                          <span style={{ color: "#367FF7", fontWeight: 700, fontSize: "12px" }}>
                            阅读全文 →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 右侧: NexaPress 侧边栏 */}
            <div className={s.sidebar}>
              {/* 探索频道分类 */}
              <div className={s.sidebarBox}>
                <h4 className={s.sidebarBoxTitle}>探索频道分类</h4>
                <div className={s.categoryPillGrid}>
                  {[
                    { label: "便民信息", href: "/info", icon: "📦", cls: s.catPillInfo },
                    { label: "求职招聘", href: "/jobs", icon: "💼", cls: s.catPillJobs },
                    { label: "房产楼市", href: "/house", icon: "🏠", cls: s.catPillHouse },
                    { label: "本地资讯", href: "/articles", icon: "📰", cls: s.catPillArticles },
                    { label: "自营商城", href: "/haodian", icon: "🛍️", cls: s.catPillShop },
                    { label: "同城相亲", href: "/love", icon: "💖", cls: s.catPillLove },
                    { label: "同城活动", href: "/active", icon: "🎪", cls: s.catPillActive },
                    { label: "社区论坛", href: "/community", icon: "💬", cls: s.catPillCommunity },
                    { label: "便民电话", href: "/bianmin", icon: "📞", cls: s.catPillBianmin },
                  ].map((cat, i) => (
                    <Link prefetch={false} key={i} href={cat.href} className={cat.cls}>
                      <span className={s.catPillIcon}>{cat.icon}</span>
                      {cat.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* 热门趋势帖子 */}
              <div className={s.sidebarBox}>
                <h4 className={s.sidebarBoxTitle}>热门趋势</h4>
                {(trendingArticles.length > 0
                  ? trendingArticles.slice(0, 3)
                  : [
                      { id: "t1", title: "杨林经开区秋季招聘薪酬趋势分析", body: "", createdAt: new Date() },
                      { id: "t2", title: "嵩明至杨林大学城城际公交最新时刻表", body: "", createdAt: new Date() },
                      { id: "t3", title: "嘉丽泽周末露营钓鱼全攻略", body: "", createdAt: new Date() },
                    ]
                ).map((art: any, idx: number) => {
                  const trendCover = art.images && art.images.length > 0 ? getImageUrl(art.images[0]) : null;
                  return (
                    <Link
                      prefetch={false}
                      key={art.id}
                      href={art.id?.startsWith?.("t") ? "/articles" : `/articles/${art.id}`}
                      className={s.trendingRow}
                    >
                      <div className={s.trendingThumb}>
                        {trendCover ? (
                          <img
                            loading="lazy"
                            decoding="async"
                            src={trendCover}
                            alt={art.title}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", background: "#F1F5F9" }}>
                            {idx === 0 ? "📈" : idx === 1 ? "🚌" : "🏕️"}
                          </div>
                        )}
                      </div>
                      <div className={s.trendingInfo}>
                        <h5 className={s.trendingPostTitle}>{art.title}</h5>
                        <div className={s.trendingPostMeta}>
                          <span className={s.trendingPostMetaItem}>
                            🕐 {art.body ? Math.max(2, Math.ceil(stripHtml(art.body).length / 400)) : 3} 分钟
                          </span>
                          <span className={s.trendingPostMetaItem}>
                            📅 {formatDate(art.createdAt)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* 关于杨林生活网 */}
              <div className={s.profileCard}>
                <div className={s.profileCardInner}>
                  <div className={s.profileNameRow}>
                    <span className={s.profileName}>杨林生活网</span>
                    <span className={s.profileBadge}>官方融媒</span>
                  </div>
                  <p className={s.profileDesc}>
                    嵩明杨林本地数字化综合生活媒体与便民门户平台，为您提供真实便民信息、企业招聘、房屋租赁与同城活动。
                  </p>
                  <div className={s.profileSocial}>
                    <span>关注我们</span>
                    <div className={s.profileSocialIcons}>
                      <span className={s.profileSocialLink}>📱</span>
                      <span className={s.profileSocialLink}>💬</span>
                      <span className={s.profileSocialLink}>📧</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 杨林经开区 · 园区招商专区横幅 ═══════════════ */}
      <section style={{ margin: "24px 0" }}>
        <div className={s.npContainer}>
          <div style={{
            background: "linear-gradient(135deg, #0B132B 0%, #1C2541 60%, #1E3A8A 100%)",
            borderRadius: "16px",
            padding: "24px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
            boxShadow: "0 10px 25px rgba(11, 19, 43, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}>
            <div style={{ maxWidth: "680px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(56, 189, 248, 0.15)", color: "#38BDF8", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", marginBottom: "8px" }}>
                <span>🏭</span> 杨林经济技术开发区 · 官方合作专区
              </div>
              <h3 style={{ fontSize: "22px", fontWeight: "900", color: "#FFFFFF", margin: "0 0 8px 0", letterSpacing: "0.5px" }}>
                园区招商 · 工业地产综合服务平台
              </h3>
              <p style={{ fontSize: "13.5px", color: "#CBD5E1", margin: 0, lineHeight: "1.6" }}>
                面向杨林先进制造园、装备制造园、轻工业集中区及职教园区，汇聚标准厂房、高标物流仓库、工业地块租售转让，提供企业选址、大车直达、高配电力与环评对接一站式服务。
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <Link
                prefetch={false}
                href="/industrial"
                style={{
                  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                  color: "#FFFFFF",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: "800",
                  fontSize: "14px",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                进入招商大厅 &rarr;
              </Link>
              <Link
                prefetch={false}
                href="/industrial/publish"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#F8FAFC",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "14px",
                  textDecoration: "none",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>✍️</span> 免费登记招商
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 分类信息 + 自营商城精选 ═══════════════ */}
      <section className={s.portalSection}>
        <div className={`${s.npContainer} ${s.gridMain}`}>
          {/* 置顶精选分类信息 */}
          <div className={s.card}>
            <div className={s.cardBody}>
              <div className={s.sectionHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={s.sectionTitle}>⭐ 置顶精选分类信息</span>
                  <span className={s.sectionMeta}>
                    二手交易 · 顺风车 · 生活服务
                  </span>
                </div>
                <Link prefetch={false} href="/info" className={s.sectionLink}>
                  查看更多 ›
                </Link>
              </div>
              <div className={s.classifiedGrid}>
                {posts.slice(0, 8).map((post) => (
                  <div key={post.id} className={s.classifiedItem}>
                    <div className={s.classifiedLeft}>
                      <span className={s.classifiedTag}>[便民]</span>
                      <Link
                        prefetch={false}
                        href={`/info/${post.id}`}
                        className={s.classifiedLink}
                      >
                        {post.title}
                      </Link>
                    </div>
                    <span className={s.classifiedDate}>
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 本地口碑好店名录 */}
          <div className={s.card}>
            <div className={s.cardBodySm}>
              <div className={s.sectionHeaderGreen}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className={s.sectionTitleSm}>🏪 本地口碑好店</span>
                  <span className={s.badgeCert}>商户名录</span>
                </div>
                <Link
                  prefetch={false}
                  href="/haodian"
                  className={s.sectionLinkGreen}
                >
                  好店名录 ›
                </Link>
              </div>
              <div className={s.shopGrid}>
                {shops.slice(0, 6).map((shop) => {
                  const shopImg = shop.logo
                    ? getImageUrl(shop.logo)
                    : shop.images && shop.images[0]
                      ? getImageUrl(shop.images[0])
                      : null;
                  return (
                    <Link
                      prefetch={false}
                      key={shop.id}
                      href={`/haodian/${shop.id}`}
                      className={s.shopItem}
                    >
                      <div className={s.shopThumb}>
                        {shopImg ? (
                          <img
                            loading="lazy"
                            decoding="async"
                            src={shopImg}
                            alt={shop.name}
                          />
                        ) : (
                          <span style={{ fontSize: 22 }}>🛍️</span>
                        )}
                      </div>
                      <span className={s.shopName}>{shop.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 房产楼市 + 推荐经纪人 ═══════════════ */}
      <section className={s.portalSection}>
        <div className={`${s.npContainer} ${s.gridMain}`}>
          {/* 房产网格 */}
          <div className={s.card}>
            <div className={s.cardBody}>
              <div className={s.sectionHeader}>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span className={s.sectionTitle}>🏠 房产楼市</span>
                  <div className={s.subTabs}>
                    <Link
                      prefetch={false}
                      href="/house?type=new"
                      className={s.subTabActive}
                    >
                      新房楼盘
                    </Link>
                    <Link
                      prefetch={false}
                      href="/house?type=secondhand"
                      className={s.subTab}
                    >
                      二手好房
                    </Link>
                    <Link
                      prefetch={false}
                      href="/house?type=rent"
                      className={s.subTab}
                    >
                      同城租房
                    </Link>
                    <Link
                      prefetch={false}
                      href="/house?type=shop"
                      className={s.subTab}
                    >
                      商铺门面
                    </Link>
                    <Link
                      prefetch={false}
                      href="/industrial"
                      className={s.subTab}
                      style={{ color: "#0284c7", fontWeight: "bold" }}
                    >
                      🏭 园区招商
                    </Link>
                  </div>
                </div>
                <Link prefetch={false} href="/house" className={s.sectionLink}>
                  查看全部房源 ›
                </Link>
              </div>

              <div className={s.houseGrid}>
                {houses.slice(0, 6).map((house) => {
                  const coverImg =
                    house.images && house.images[0]
                      ? getImageUrl(house.images[0])
                      : "/images/legacy/notfindimg_house.png";
                  return (
                    <Link
                      prefetch={false}
                      key={house.id}
                      href={`/house/${house.id}`}
                      className={s.houseCard}
                    >
                      <div className={s.houseThumb}>
                        <img
                          loading="lazy"
                          decoding="async"
                          src={
                            coverImg || "/images/legacy/notfindimg_house.png"
                          }
                          alt={house.title}
                        />
                      </div>
                      <div className={s.houseInfo}>
                        <div className={s.houseTitle}>{house.title}</div>
                        <div className={s.houseMeta}>
                          {house.layout || "2室1厅"} ·{" "}
                          {house.location || "杨林大学城"}
                        </div>
                        <div className={s.housePrice}>
                          {house.price ? `${house.price}` : "面议"}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 推荐经纪人 */}
          <div className={s.card}>
            <div className={s.cardBodySm}>
              <div className={s.sectionHeader}>
                <span className={s.sectionTitleSm}>👤 推荐房产经纪人</span>
                <Link prefetch={false} href="/house" className={s.sectionLink}>
                  更多 ›
                </Link>
              </div>
              <div className={s.flexColSm}>
                {[
                  {
                    name: "范文龙",
                    agency: "府明房地产",
                    desc: "主营杨林大学城与经开区住宅直租",
                  },
                  {
                    name: "于曼丽",
                    agency: "德昌置业房地产",
                    desc: "专注商铺转让与工业厂房挂牌",
                  },
                  {
                    name: "秦乐瑶",
                    agency: "三江源房地产",
                    desc: "精耕领秀知识城二手房买卖",
                  },
                ].map((agent, i) => (
                  <div key={i} className={s.agentItem}>
                    <div className={s.agentLeft}>
                      <div className={s.agentAvatar}>
                        <img
                          loading="lazy"
                          decoding="async"
                          src="/images/legacy/user_small.gif"
                          alt={agent.name}
                        />
                      </div>
                      <div>
                        <div className={s.agentName}>{agent.name}</div>
                        <div className={s.agentAgency}>{agent.agency}</div>
                      </div>
                    </div>
                    <Link
                      prefetch={false}
                      href="/house"
                      className={s.agentBtn}
                    >
                      看房源
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 求职招聘 ═══════════════ */}
      <section className={s.portalSection}>
        <div className={`${s.npContainer} ${s.card}`}>
          <div className={s.cardBody}>
            <div className={s.sectionHeader}>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <span className={s.sectionTitle}>💼 求职招聘大厅</span>
                <div className={s.subTabs}>
                  <Link
                    prefetch={false}
                    href="/jobs"
                    className={s.subTabActive}
                  >
                    置顶推荐
                  </Link>
                  <Link prefetch={false} href="/jobs" className={s.subTab}>
                    急聘高薪
                  </Link>
                  <Link prefetch={false} href="/jobs" className={s.subTab}>
                    经开区名企
                  </Link>
                  <Link
                    prefetch={false}
                    href="/jobs/resumes/new"
                    className={s.subTab}
                  >
                    登记简历
                  </Link>
                </div>
              </div>
              <Link prefetch={false} href="/jobs" className={s.sectionLink}>
                全部岗位 ›
              </Link>
            </div>

            <div className={s.jobGrid}>
              {jobs.slice(0, 8).map((job) => (
                <Link
                  prefetch={false}
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className={s.jobCard}
                >
                  <div>
                    <div className={s.jobHeader}>
                      <h4 className={s.jobTitle}>{job.title}</h4>
                      <span className={s.jobSalary}>
                        {job.salary || "面议"}
                      </span>
                    </div>
                    <div className={s.jobCompany}>
                      {job.company || "杨林经开区重点企业"}
                    </div>
                  </div>
                  <div className={s.jobTags}>
                    <span className={s.jobTagGreen}>包吃住</span>
                    <span className={s.jobTagBlue}>五险一金</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 同城相亲交友 ═══════════════ */}
      <section className={s.portalSection}>
        <div className={`${s.npContainer} ${s.card}`}>
          <div className={s.cardBody}>
            <div className={s.sectionHeaderPink}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  className={s.sectionTitle}
                  style={{ color: "#E11D48" }}
                >
                  💖 杨林相亲交友平台
                </span>
                <span className={s.sectionMeta}>
                  真实实名核验 · 美好姻缘由此开启
                </span>
              </div>
              <Link prefetch={false} href="/love" className={s.sectionLinkPink}>
                探索更多嘉宾 ›
              </Link>
            </div>

            <div className={s.datingGrid}>
              {datingProfiles.slice(0, 6).map((p) => {
                const photo =
                  p.photos && p.photos[0] ? getImageUrl(p.photos[0]) : null;
                return (
                  <Link
                    prefetch={false}
                    key={p.id}
                    href={`/love/${p.id}`}
                    className={s.datingCard}
                  >
                    <img
                      loading="lazy"
                      decoding="async"
                      src="/images/legacy/love_vip.png"
                      alt="VIP"
                      className={s.datingVip}
                    />
                    <div className={s.datingPhoto}>
                      {photo ? (
                        <>
                          <img
                            loading="lazy"
                            decoding="async"
                            src={photo}
                            alt={p.nickname}
                            className={s.datingPhotoBlur}
                          />
                          <span className={s.datingPrivacy}>
                            🔒 隐私写真保护
                          </span>
                        </>
                      ) : (
                        <img
                          loading="lazy"
                          decoding="async"
                          src="/images/legacy/user_small.gif"
                          alt=""
                          style={{ width: 60, height: 60 }}
                        />
                      )}
                    </div>
                    <div className={s.datingInfo}>
                      <div className={s.datingName}>
                        {p.nickname || "单身嘉宾"}
                      </div>
                      <div className={s.datingMeta}>
                        {p.birthYear
                          ? `${new Date().getFullYear() - p.birthYear}岁`
                          : "24岁"}{" "}
                        · {p.heightCm ? `${p.heightCm}cm` : "165cm"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 杨林生活网自营便利店精选商品橱窗 ═══════════════ */}
      <section className={s.portalSection} id="home-mall-showcase">
        <div className={`${s.npContainer} ${s.card}`}>
          <div className={s.cardBody}>
            <HomeMallShowcase
              products={JSON.parse(JSON.stringify(mallProducts))}
              categories={JSON.parse(JSON.stringify(mallCategories))}
              deliveryZones={JSON.parse(JSON.stringify(deliveryZones))}
            />
          </div>
        </div>
      </section>
      </div>{/* end desktopSection */}
    </div>
  );
}
