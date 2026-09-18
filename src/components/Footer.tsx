import Link from "next/link";
import { prisma } from "@/lib/prisma";
import FooterContactButtons from "@/components/FooterContactButtons";

export default async function Footer() {
  const year = new Date().getFullYear();

  // 从数据库读取站点配置
  let siteName = "杨林生活网";
  let icpBeian = "";
  let gonganBeian = "";
  let footerText = "";
  let customerPhone = "";
  let contactEmail = "";

  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ["site_name", "icp_beian", "gongan_beian", "footer_text", "customer_phone", "contact_email"] } },
    });
    settings.forEach((s) => {
      if (s.key === "site_name") siteName = s.value;
      if (s.key === "icp_beian") icpBeian = s.value;
      if (s.key === "gongan_beian") gonganBeian = s.value;
      if (s.key === "footer_text") footerText = s.value;
      if (s.key === "customer_phone") customerPhone = s.value;
      if (s.key === "contact_email") contactEmail = s.value;
    });
  } catch {}

  const columns = [
    {
      title: "便民服务",
      links: [
        { label: "便民信息", href: "/info" },
        { label: "便民电话", href: "/bianmin" },
        { label: "发布信息", href: "/publish" },
        { label: "本地资讯", href: "/articles" },
      ],
    },
    {
      title: "求职招聘",
      links: [
        { label: "找工作", href: "/jobs" },
        { label: "人才简历库", href: "/jobs/resumes" },
        { label: "发布招聘", href: "/jobs/new" },
        { label: "用人单位", href: "/jobs/companies" },
      ],
    },
    {
      title: "房产楼市",
      links: [
        { label: "租房买房", href: "/house" },
        { label: "发布房源", href: "/house/new" },
        { label: "新楼盘", href: "/house?type=new" },
        { label: "二手房", href: "/house?type=used" },
      ],
    },
    {
      title: "生活娱乐",
      links: [
        { label: "相亲交友", href: "/love" },
        { label: "同城活动", href: "/active" },
        { label: "社区论坛", href: "/community" },
        { label: "口碑好店", href: "/haodian" },
      ],
    },
  ];

  return (
    <>
      {/* ====== 桌面端完整 Footer (>768px) ====== */}
      <footer
        className="desktop-footer"
        style={{
          background: "linear-gradient(180deg, #E8EAF0 0%, #D5D8E2 100%)",
          color: "#374151",
          marginTop: "3rem",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* 订阅栏 */}
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "0 1.25rem",
            transform: "translateY(-28px)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1a237e 0%, #283593 40%, #3949ab 100%)",
              borderRadius: "16px",
              padding: "2rem 2.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "2rem",
              flexWrap: "wrap",
              boxShadow: "0 8px 32px rgba(26,35,126,0.25)",
            }}
          >
            <div style={{ flex: "1 1 300px", minWidth: 0 }}>
              <h3
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "#ffffff",
                  lineHeight: 1.4,
                }}
              >
                获取杨林本地最新资讯、招聘与优惠 — 直达您的微信
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                关注杨林生活网公众号，本地热点一手掌握
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
              <Link
                prefetch={false}
                href="/bianmin"
                style={{
                  background: "#2979ff",
                  color: "#ffffff",
                  padding: "12px 28px",
                  borderRadius: "50px",
                  fontSize: "14px",
                  fontWeight: "700",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 14px rgba(41,121,255,0.4)",
                  transition: "transform 0.15s",
                }}
              >
                查看便民电话
              </Link>
            </div>
          </div>
        </div>

        {/* 主体 */}
        <div
          className="footer-main"
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "0 1.25rem 2rem",
            display: "grid",
            gridTemplateColumns: "1.6fr repeat(4, 1fr)",
            gap: "2rem",
          }}
        >
          {/* Logo + 简介 */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #16A67A 0%, #087A5B 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "18px",
                  fontWeight: "900",
                  flexShrink: 0,
                }}
              >
                杨
              </div>
              <div>
                <div style={{ fontSize: "18px", fontWeight: "900", color: "#1F2937", lineHeight: 1.2 }}>
                  {siteName}
                </div>
                <div style={{ fontSize: "11px", color: "#6B7280", letterSpacing: "0.5px" }}>
                  杨林 · 嵩明本地服务
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: "13px",
                color: "#6B7280",
                lineHeight: "1.7",
                margin: "0 0 18px 0",
                maxWidth: "300px",
              }}
            >
              杨林生活网是嵩明杨林地区领先的本地生活门户，提供招聘求职、房屋租售、便民信息、相亲交友与社区论坛等综合服务。
            </p>

            {/* 真实联系方式与交互组件 */}
            <FooterContactButtons
              customerPhone={customerPhone || "13619694207"}
              customerWechat={customerPhone || "13619694207"}
              officialAccountName="杨林生活圈"
              qrCodeUrl="/images/wechat_official_qr.jpg"
              email={contactEmail || "123035946@qq.com"}
              serviceHours="09:00 - 21:00"
            />
          </div>

          {/* 分类链接列 */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "15px",
                  fontWeight: "800",
                  color: "#1967D2",
                }}
              >
                {col.title}
              </h4>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {col.links.map((link) => (
                  <li key={link.href} style={{ marginBottom: "10px" }}>
                    <Link
                      prefetch={false}
                      href={link.href}
                      style={{
                        fontSize: "13.5px",
                        color: "#4B5563",
                        textDecoration: "none",
                        transition: "color 0.15s",
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 底部版权 */}
        <div
          style={{
            borderTop: "1px solid rgba(31,41,55,0.1)",
            padding: "1.25rem 1.25rem",
            maxWidth: "1240px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#9CA3AF" }}>
            {footerText || `Copyright © 2011-${year} iyanglin.com All Rights Reserved · ${siteName}`}
          </p>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", flexWrap: "wrap" }}>
            {icpBeian && (
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#9CA3AF", textDecoration: "none" }}
              >
                {icpBeian}
              </a>
            )}
            {gonganBeian && (
              <a
                href="https://www.beian.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#9CA3AF", textDecoration: "none" }}
              >
                {gonganBeian}
              </a>
            )}
            <Link prefetch={false} href="/about" style={{ color: "#9CA3AF", textDecoration: "none" }}>
              关于我们
            </Link>
            <Link prefetch={false} href="/contact" style={{ color: "#9CA3AF", textDecoration: "none" }}>
              联系我们
            </Link>
          </div>
        </div>
      </footer>

      {/* ====== 移动端极简 Footer (<=768px) ====== */}
      <footer
        className="mobile-footer"
        style={{
          background: "#F9FAFB",
          borderTop: "1px solid #F0F0F0",
          padding: "20px 16px",
          paddingBottom: "calc(104px + env(safe-area-inset-bottom, 0px))",
          textAlign: "center",
          marginTop: "2rem",
        }}
      >
        <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: "600", marginBottom: "6px" }}>
          {siteName} · 杨林/嵩明本地生活服务
        </div>
        <div style={{ fontSize: "12px", color: "#4B5563", marginBottom: "10px" }}>
          📞 客服电话/微信：
          <a
            href={`tel:${customerPhone || "13619694207"}`}
            style={{ color: "#2563EB", fontWeight: "700", textDecoration: "none" }}
          >
            {customerPhone || "13619694207"}
          </a>
          <span style={{ color: "#9CA3AF", fontSize: "11px", marginLeft: "4px" }}>（09:00-21:00）</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", fontSize: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
          <Link prefetch={false} href="/terms" style={{ color: "#9CA3AF", textDecoration: "none" }}>
            用户协议
          </Link>
          <span style={{ color: "#D1D5DB" }}>·</span>
          <Link prefetch={false} href="/privacy" style={{ color: "#9CA3AF", textDecoration: "none" }}>
            隐私政策
          </Link>
          <span style={{ color: "#D1D5DB" }}>·</span>
          <Link prefetch={false} href="/contact" style={{ color: "#9CA3AF", textDecoration: "none" }}>
            联系我们
          </Link>
        </div>
        <div style={{ fontSize: "11px", color: "#D1D5DB" }}>
          © {year} {siteName}
          {icpBeian && (
            <>
              {" · "}
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" style={{ color: "#D1D5DB", textDecoration: "none" }}>
                {icpBeian}
              </a>
            </>
          )}
        </div>
      </footer>

      {/* 响应式显示控制 */}
      <style>{`
        /* 默认桌面端：显示完整 Footer，隐藏极简 Footer */
        .desktop-footer { display: block; }
        .mobile-footer { display: none; }

        @media (max-width: 768px) {
          .desktop-footer { display: none !important; }
          .mobile-footer { display: block !important; }
        }
      `}</style>
    </>
  );
}
