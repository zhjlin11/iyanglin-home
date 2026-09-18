import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import MobileFloatingDock from "@/components/MobileFloatingDock";
import SiteMaintenanceGuard from "@/components/SiteMaintenanceGuard";
import Footer from "@/components/Footer";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import WechatShareHiddenImage from "@/components/WechatShareHiddenImage";

/** 百度统计跟踪 ID — 在 tongji.baidu.com 注册后替换 */
const BAIDU_TONGJI_ID = process.env.BAIDU_TONGJI_ID || "";

export const metadata: Metadata = {
  metadataBase: new URL("https://iyanglin.com"),
  title: {
    default: "杨林生活网 - 嵩明杨林本地生活综合服务门户平台",
    template: "%s | 杨林生活网",
  },
  description: "杨林生活网为您提供昆明嵩明杨林镇、杨林大学城、杨林经开区真实便民分类信息、企业求职招聘、租房买房、平台自营商品与同城精彩活动。",
  referrer: "origin-when-cross-origin",
  keywords: ["杨林", "嵩明", "杨林生活网", "杨林大学城", "杨林招聘", "杨林租房", "杨林自营商城", "本地生活"],
  verification: {
    other: {
      "baidu-site-verification": ["codeva-uhYnOpsMh4"],
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://iyanglin.com",
    siteName: "杨林生活网",
    title: "杨林生活网 - 嵩明杨林本地生活综合服务门户平台",
    description: "昆明嵩明杨林本地真实便民信息、企业招聘、求职简历、房屋租赁与同城活动门户。",
    images: [
      {
        url: "https://iyanglin.com/share/v2/default.png?v=20260912",
        width: 600,
        height: 600,
        alt: "杨林生活网",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/logo/favicon_32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/logo/favicon_48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/images/logo/favicon_64x64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [
      { url: "/images/logo/favicon_128x128.png", sizes: "128x128", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

const inlineCss = `:root {
  color-scheme: light;
  /* 品牌核心色彩 - 杨林生活绿 */
  --brand: #16A67A;
  --brand-dark: #087A5B;
  --brand-light: #EAF8F3;
  --brand-tint: #F0FBF7;
  --brand-accent: #D1F2E6;

  /* 辅助状态与强调色 */
  --accent: #FF8A00;       /* 房产/置顶橙 */
  --accent-light: #FFF7ED;
  --accent-dark: #C2410C;
  --success: #16A67A;      /* 成功/通过 */
  --success-light: #EAF8F3;
  --danger: #F24E4E;       /* 资讯/头条/删除红 */
  --danger-light: #FEE2E2;
  --warning: #F59E0B;      /* 好店/待办 */
  --warning-light: #FEF3C7;
  --info: #3270FF;         /* 招聘/直聊蓝 */
  --info-light: #EFF6FF;
  --purple: #7C3AED;       /* 二手紫 */
  --purple-light: #F5F3FF;

  /* 中性色系统 */
  --ink: #1F2937;          /* 主文字 */
  --ink-secondary: #4B5563;
  --muted: #6B7280;        /* 次要文字 */
  --muted-light: #9CA3AF;  /* 辅助文字 */
  --surface: #F6F7F9;      /* 基础页面背景 */
  --surface-card: #FFFFFF; /* 卡片白底 */
  --line: #E5E7EB;         /* 边框分割线 */
  --line-strong: #D1D5DB;

  /* 8-Point Grid 间距规范 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;

  /* 圆角规范 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* 极轻阴影规范 */
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.03);
  --shadow-md: 0 4px 12px 0 rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 25px -4px rgba(0, 0, 0, 0.06);
}

* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body { 
  color: var(--ink); 
  background: var(--surface); 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }
img { max-width: 100%; height: auto; }

.shell, .layout-container, .container { max-width: 1240px; margin: 0 auto; padding: 0 24px; width: 100%; }
.shell-compact { max-width: 800px; margin: 0 auto; padding: 0 20px; width: 100%; }

@media (max-width: 767px) {
  .shell, .content-shell { padding-left: 14px !important; padding-right: 14px !important; }
}
`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  const isAdminOrAuthRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/workspace") ||
    pathname.startsWith("/mp") ||
    pathname.startsWith("/assistant") ||
    pathname.startsWith("/api");

  let isClosed = false;
  let closeReason = "网站正在进行系统架构与服务器例行升级维护中，请稍后再试...";
  let customerPhone = "18006778483";
  let siteName = "杨林生活网";
  let siteIcon = "/favicon.ico";

  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ["site_status", "site_close_reason", "customer_phone", "site_name", "site_icon", "site_logo"] } }
    });
    settings.forEach(s => {
      if (!isAdminOrAuthRoute && s.key === "site_status" && s.value !== "ONLINE") isClosed = true;
      if (s.key === "site_close_reason") closeReason = s.value;
      if (s.key === "customer_phone") customerPhone = s.value;
      if (s.key === "site_name") siteName = s.value;
      if (s.key === "site_icon" && s.value) siteIcon = s.value;
    });
  } catch {}

  if (isClosed) {
    return (
      <html lang="zh-CN">
        <head>
          <title>{"网站例行关站维护中 - " + siteName}</title>
          <link rel="icon" href="/favicon.ico" />
          <style dangerouslySetInnerHTML={{ __html: inlineCss }} />
        </head>
        <body style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", fontFamily: "sans-serif" }}>
          <div style={{ background: "rgba(30, 41, 59, 0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "20px", padding: "3rem 2rem", maxWidth: "600px", width: "100%", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: "36px", boxShadow: "0 10px 25px rgba(245, 158, 11, 0.3)" }}>
              🛠️
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "1rem", color: "#ffffff" }}>
              {siteName + " · 例行关站维护中"}
            </h1>
            <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.3)", marginBottom: "2rem", textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.6", color: "#cbd5e1" }}>
                {closeReason}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
              <div style={{ fontSize: "14px", color: "#94a3b8" }}>
                📞 紧急联系客服电话：<a href={"tel:" + customerPhone} style={{ color: "#f59e0b", fontWeight: "bold", textDecoration: "none" }}>{customerPhone}</a>
              </div>
              <a href="/admin/login" style={{ marginTop: "1rem", fontSize: "13px", color: "#64748b", textDecoration: "underline" }}>
                🔑 站长与管理员后台登录通道
              </a>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="zh-CN">
      <head>
        <style dangerouslySetInnerHTML={{ __html: inlineCss }} />
      </head>
      <body className="pb-[calc(96px+env(safe-area-inset-bottom,0px))] md:pb-0">
        {/* 微信与社交分享爬虫全站默认首图兜底 */}
        <WechatShareHiddenImage imageUrl="https://iyanglin.com/share/v2/default.png?v=20260912" alt="杨林生活网" />

        {/* 微信 JS-SDK 预加载与 iOS SPA 路由 Entry URL 锁定脚本 */}
        <Script
          id="wx-entry-tracker"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{if(!window.__WX_ENTRY_URL__){window.__WX_ENTRY_URL__=window.location.href.split('#')[0];}}catch(e){}`,
          }}
        />
        <Script
          id="wx-jssdk-preloader"
          src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"
          strategy="afterInteractive"
        />

        <SiteMaintenanceGuard>
          {children}
          {!isAdminOrAuthRoute && <Footer />}
          <MobileFloatingDock />
        </SiteMaintenanceGuard>
        {/* 百度统计 */}
        {BAIDU_TONGJI_ID && (
          <Script
            id="baidu-tongji"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                var _hmt = _hmt || [];
                (function() {
                  var hm = document.createElement("script");
                  hm.src = "https://hm.baidu.com/hm.js?${BAIDU_TONGJI_ID}";
                  var s = document.getElementsByTagName("script")[0];
                  s.parentNode.insertBefore(hm, s);
                })();
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
