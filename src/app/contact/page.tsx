"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

/* ── 联系信息集中配置 ── */
const CONTACT = {
  phone: "13619694207",
  wechat: "13619694207",
  email: "123035946@qq.com",
  hours: "周一至周日 9:00 - 21:00",
};

/* ── 可咨询事项 ── */
const SERVICE_ITEMS = [
  { icon: "💼", title: "招聘发布问题", desc: "岗位发布、简历管理、招聘置顶" },
  { icon: "🏠", title: "房源发布问题", desc: "租房售房发布、房源审核、信息修改" },
  { icon: "🏪", title: "商家入驻咨询", desc: "店铺入驻流程、资质要求、费用" },
  { icon: "📢", title: "广告合作咨询", desc: "Banner投放、置顶推广、品牌合作" },
  { icon: "✏️", title: "信息修改 / 删除", desc: "修改已发布内容、下架过期信息" },
  { icon: "💬", title: "意见反馈与建议", desc: "产品建议、Bug反馈、功能需求" },
];

/* ── 快速入口 ── */
const QUICK_LINKS = [
  { icon: "💼", title: "发布招聘", desc: "免费发布招聘岗位", href: "/jobs/new" },
  { icon: "🏠", title: "发布房源", desc: "出租出售房源发布", href: "/house/new" },
  { icon: "🏪", title: "商家入驻", desc: "好店推荐商家入驻", href: "/haodian" },
  { icon: "📢", title: "广告合作", desc: "多种广告位可选", href: "/advertising" },
  { icon: "👤", title: "修改我的信息", desc: "个人中心管理", href: "/profile" },
  { icon: "📱", title: "便民电话", desc: "杨林本地电话簿", href: "/bianmin" },
];

/* ── FAQ ── */
const FAQ_LIST = [
  { q: "如何发布招聘/房源/商家信息？", a: `在网站首页或对应频道页点击「发布」按钮，按提示填写信息并提交即可。也可以在微信公众号底部菜单点击「发布·服务」。` },
  { q: "发布后多久审核？", a: `工作时间内提交的信息，通常 10 分钟内完成审核。非工作时间提交的，会在次日 9:00 后处理。` },
  { q: "信息发布后可以修改吗？", a: `可以。登录后进入「个人中心」，找到对应的发布记录，点击「编辑」即可修改。如需人工协助，请联系客服。` },
  { q: "广告合作怎么咨询？", a: `可以拨打客服电话或添加微信直接咨询。我们提供首页Banner、分类置顶、品牌专区等多种广告形式，详情可查看广告投放页面。` },
  { q: "如何删除自己发布的信息？", a: `登录后在个人中心找到对应发布，点击「删除」即可。如果无法自助操作，请联系客服协助处理。` },
  { q: "客服一般什么时候回复？", a: `工作时间（9:00-21:00）内通常 5 分钟内回复。电话咨询最快，微信次之。非工作时间可留言，次日优先处理。` },
  { q: "没有微信可以怎么联系？", a: `可以直接拨打客服电话 ${CONTACT.phone}，或发送邮件至 ${CONTACT.email}。` },
  { q: "商家入驻需要准备什么？", a: `需要提供店铺名称、地址、联系方式、经营类别和店铺照片。有营业执照的商家可获得「认证商家」标识。` },
];

export default function ContactPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<{ answer: string; relatedTopics?: string[]; contactHuman?: boolean } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiAsk = async (q?: string) => {
    const questionText = (q || aiQuestion).trim();
    if (!questionText || aiLoading) return;
    setAiLoading(true);
    setAiAnswer(null);

    try {
      const res = await fetch("/api/ai/help-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText }),
      });
      const data = await res.json();
      if (data.success) {
        setAiAnswer({
          answer: data.answer,
          relatedTopics: data.relatedTopics || [],
          contactHuman: data.contactHuman,
        });
      } else {
        setAiAnswer({
          answer: data.error || "抱歉，暂时未能解析该问题，您可以直接拨打人工客服电话咨询。",
          contactHuman: true,
        });
      }
    } catch {
      setAiAnswer({
        answer: "网络繁忙，请直接拨打客服电话 13619694207 咨询。",
        contactHuman: true,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
      }).catch(() => fallbackCopy(text, label));
    } else {
      fallbackCopy(text, label);
    }
  };

  const fallbackCopy = (text: string, label: string) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-9999px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyFeedback = ({ id }: { id: string }) =>
    copied === id ? (
      <span className="cp-toast">✓ 已复制</span>
    ) : null;

  return (
    <>
      <Navbar />
      <style>{contactStyles}</style>

      <main className="cp">
        {/* ====== Hero ====== */}
        <section className="cp-hero">
          <div className="cp-shell cp-hero-inner">
            <div className="cp-hero-text">
              <div className="cp-hero-badge">
                <span className="cp-dot" />
                在线服务中 · {CONTACT.hours}
              </div>
              <h1 className="cp-hero-title">联系客服</h1>
              <p className="cp-hero-desc">
                有问题随时联系我们，帮助你更快解决招聘、房产、商家、发布和广告合作相关问题。
              </p>
              <p className="cp-hero-hint">💡 优先推荐使用微信或电话联系，处理更快</p>
            </div>
            <div className="cp-hero-visual" aria-hidden="true">
              <div className="cp-hero-icon-grid">
                <div className="cp-hi cp-hi-1">💬</div>
                <div className="cp-hi cp-hi-2">📞</div>
                <div className="cp-hi cp-hi-3">✉️</div>
                <div className="cp-hi cp-hi-4">🤝</div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== 联系方式三列 ====== */}
        <section className="cp-section">
          <div className="cp-shell">
            <div className="cp-contact-grid">
              {/* 电话 */}
              <div className="cp-card cp-card-phone">
                <div className="cp-card-top">
                  <div className="cp-card-icon" style={{ background: "var(--brand-light)", color: "var(--brand)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <div>
                    <h3 className="cp-card-label">客服电话</h3>
                    <p className="cp-card-value">{CONTACT.phone}</p>
                  </div>
                </div>
                <p className="cp-card-desc">适合紧急咨询、广告合作、商家入驻、问题反馈</p>
                <div className="cp-card-actions">
                  <a href={`tel:${CONTACT.phone}`} className="cp-btn cp-btn-brand">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    立即拨打
                  </a>
                  <button className="cp-btn cp-btn-ghost" onClick={() => handleCopy(CONTACT.phone, "phone")}>
                    {copied === "phone" ? "✓ 已复制" : "复制号码"}
                  </button>
                </div>
              </div>

              {/* 微信 */}
              <div className="cp-card cp-card-wechat">
                <div className="cp-card-top">
                  <div className="cp-card-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.133 0 .241-.108.241-.245 0-.06-.024-.12-.04-.177l-.325-1.233a.49.49 0 0 1 .178-.554C23.206 18.508 24 16.907 24 15.142c0-3.372-3.163-6.188-7.062-6.284zm-2.56 3.166c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.544.434-.983.97-.983zm4.844 0c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.544.434-.983.97-.983z"/></svg>
                  </div>
                  <div>
                    <h3 className="cp-card-label">微信咨询</h3>
                    <p className="cp-card-value">{CONTACT.wechat}</p>
                  </div>
                </div>
                <p className="cp-card-desc">适合日常咨询、持续沟通、发送资料和截图</p>
                <div className="cp-card-actions">
                  <button className="cp-btn cp-btn-wechat" onClick={() => handleCopy(CONTACT.wechat, "wechat")}>
                    {copied === "wechat" ? "✓ 已复制微信号" : "📋 复制微信号添加好友"}
                  </button>
                </div>
              </div>

              {/* 邮箱 */}
              <div className="cp-card cp-card-email">
                <div className="cp-card-top">
                  <div className="cp-card-icon" style={{ background: "var(--info-light)", color: "var(--info)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <div>
                    <h3 className="cp-card-label">电子邮箱</h3>
                    <p className="cp-card-value cp-card-value-sm">{CONTACT.email}</p>
                  </div>
                </div>
                <p className="cp-card-desc">适合发送截图、合作资料、正式合作沟通</p>
                <div className="cp-card-actions">
                  <a href={`mailto:${CONTACT.email}`} className="cp-btn cp-btn-info">发送邮件</a>
                  <button className="cp-btn cp-btn-ghost" onClick={() => handleCopy(CONTACT.email, "email")}>
                    {copied === "email" ? "✓ 已复制" : "复制邮箱"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== 可咨询问题 ====== */}
        <section className="cp-section cp-section-alt">
          <div className="cp-shell">
            <h2 className="cp-sec-title">你可以联系我们处理</h2>
            <p className="cp-sec-desc">以下问题都可以通过电话或微信联系客服快速解决</p>
            <div className="cp-service-grid">
              {SERVICE_ITEMS.map((item) => (
                <div key={item.title} className="cp-svc-card">
                  <span className="cp-svc-icon">{item.icon}</span>
                  <div>
                    <h4 className="cp-svc-title">{item.title}</h4>
                    <p className="cp-svc-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== 快速入口 ====== */}
        <section className="cp-section">
          <div className="cp-shell">
            <h2 className="cp-sec-title">常见问题 · 快速入口</h2>
            <p className="cp-sec-desc">很多问题可以先自助查看，更快解决</p>
            <div className="cp-quick-grid">
              {QUICK_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="cp-quick-card">
                  <span className="cp-quick-icon">{item.icon}</span>
                  <div className="cp-quick-body">
                    <h4 className="cp-quick-title">{item.title}</h4>
                    <p className="cp-quick-desc">{item.desc}</p>
                  </div>
                  <svg className="cp-quick-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ====== 24小时平台智能问答助手 ====== */}
        <section className="cp-section" style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
          <div className="cp-shell">
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <span style={{ fontSize: "24px" }}>🤖</span>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1E293B", margin: 0 }}>
                    24小时平台智能问答助手
                  </h3>
                  <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0 0" }}>
                    关于发帖规则、收费标准、VIP权益、实名认证或纠纷处理，随时为您解答
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAiAsk()}
                  placeholder="例如：“发帖置顶怎么收费？”、“找工作需要交押金吗？”..."
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAiAsk()}
                  disabled={aiLoading || !aiQuestion.trim()}
                  style={{
                    background: "#0B7A75",
                    color: "#FFFFFF",
                    fontWeight: "700",
                    fontSize: "13px",
                    padding: "0 20px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    opacity: aiLoading || !aiQuestion.trim() ? 0.6 : 1,
                  }}
                >
                  {aiLoading ? "查询中..." : "问问智能客服"}
                </button>
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                <span style={{ fontSize: "11.5px", color: "#94A3B8" }}>热门咨询：</span>
                {["信息发布收费吗？", "VIP会员有什么特权？", "被骗或虚假信息怎么维权？", "如何申请商家认证？"].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAiQuestion(chip);
                      handleAiAsk(chip);
                    }}
                    style={{
                      background: "#F1F5F9",
                      border: "none",
                      borderRadius: "14px",
                      padding: "2px 10px",
                      fontSize: "11.5px",
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {aiAnswer && (
                <div style={{ marginTop: "16px", background: "#F8FAFC", borderRadius: "12px", padding: "14px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "13px", color: "#1E293B", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {aiAnswer.answer}
                  </div>
                  {aiAnswer.contactHuman && (
                    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed #CBD5E1", fontSize: "12px", color: "#0B7A75", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>如仍有疑问，欢迎直接致电人工客服：</span>
                      <a href={`tel:${CONTACT.phone}`} style={{ fontWeight: "700", color: "#0B7A75", textDecoration: "underline" }}>
                        📞 13619694207
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ====== FAQ ====== */}
        <section className="cp-section cp-section-alt">
          <div className="cp-shell">
            <h2 className="cp-sec-title">常见问题</h2>
            <p className="cp-sec-desc">点击问题查看详细解答</p>
            <div className="cp-faq-list">
              {FAQ_LIST.map((item, i) => (
                <div key={i} className={`cp-faq-item ${openFaq === i ? "cp-faq-open" : ""}`}>
                  <button
                    className="cp-faq-q"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span className="cp-faq-q-text">{item.q}</span>
                    <svg className="cp-faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  {openFaq === i && (
                    <div className="cp-faq-a">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== 底部 CTA ====== */}
        <section className="cp-cta">
          <div className="cp-shell cp-cta-inner">
            <h2 className="cp-cta-title">还没找到你需要的帮助？</h2>
            <p className="cp-cta-desc">直接联系我们，我们会尽快协助你处理</p>
            <div className="cp-cta-actions">
              <a href={`tel:${CONTACT.phone}`} className="cp-btn cp-btn-brand cp-btn-lg">
                📞 立即拨打电话
              </a>
              <button className="cp-btn cp-btn-white cp-btn-lg" onClick={() => handleCopy(CONTACT.wechat, "wechat-cta")}>
                {copied === "wechat-cta" ? "✓ 已复制微信号" : "💬 复制微信号"}
              </button>
            </div>
            <div className="cp-cta-links">
              <Link href="/advertising">去广告合作 →</Link>
              <Link href="/publish">去发布信息 →</Link>
            </div>
          </div>
        </section>

        {/* ====== 移动端底部固定联系栏 ====== */}
        <div className="cp-mobile-bar">
          <a href={`tel:${CONTACT.phone}`} className="cp-mbar-btn cp-mbar-phone">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            电话咨询
          </a>
          <button className="cp-mbar-btn cp-mbar-wechat" onClick={() => handleCopy(CONTACT.wechat, "mbar")}>
            {copied === "mbar" ? "✓ 已复制" : "💬 复制微信号"}
          </button>
        </div>
      </main>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   CSS — 使用项目 CSS 变量 (--brand, --ink, --surface, etc.)
   ══════════════════════════════════════════════════════════ */
const contactStyles = `
/* ── Reset & Shell ── */
.cp { padding-bottom: 0; }
.cp-shell { max-width: 1140px; margin: 0 auto; padding: 0 24px; width: 100%; }

/* ── Section rhythm ── */
.cp-section { padding: 48px 0; }
.cp-section-alt { background: var(--surface); }
.cp-sec-title {
  font-size: 22px; font-weight: 700; color: var(--ink);
  margin: 0 0 6px; text-align: center;
}
.cp-sec-desc {
  font-size: 14px; color: var(--muted); text-align: center;
  margin: 0 0 28px;
}

/* ═══════════ Hero ═══════════ */
.cp-hero {
  background: linear-gradient(135deg, var(--brand-light) 0%, #f0fdf4 60%, var(--surface) 100%);
  padding: 40px 0 44px;
  border-bottom: 1px solid var(--line);
}
.cp-hero-inner {
  display: flex; align-items: center; gap: 48px;
}
.cp-hero-text { flex: 1; }
.cp-hero-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 14px; border-radius: var(--radius-full);
  background: rgba(22,166,122,0.1); color: var(--brand);
  font-size: 13px; font-weight: 600; margin-bottom: 16px;
}
.cp-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--brand);
  animation: cp-blink 2s ease-in-out infinite;
}
@keyframes cp-blink {
  0%,100% { opacity:1; } 50% { opacity:.3; }
}
.cp-hero-title {
  font-size: 32px; font-weight: 800; color: var(--ink);
  margin: 0 0 12px; line-height: 1.2;
}
.cp-hero-desc {
  font-size: 15px; color: var(--ink-secondary); line-height: 1.7;
  margin: 0 0 14px; max-width: 480px;
}
.cp-hero-hint {
  font-size: 13px; color: var(--muted); margin: 0;
  padding: 8px 14px; background: white; border-radius: var(--radius-md);
  border: 1px solid var(--line); display: inline-block;
}
.cp-hero-visual {
  flex-shrink: 0; width: 220px; height: 180px;
  display: flex; align-items: center; justify-content: center;
}
.cp-hero-icon-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.cp-hi {
  width: 80px; height: 80px; border-radius: var(--radius-lg);
  display: flex; align-items: center; justify-content: center;
  font-size: 32px; background: white;
  box-shadow: var(--shadow-md); transition: transform .2s;
}
.cp-hi:hover { transform: translateY(-2px); }
.cp-hi-1 { background: var(--brand-light); }
.cp-hi-2 { background: #ecfdf5; }
.cp-hi-3 { background: var(--info-light); }
.cp-hi-4 { background: #fff7ed; }

/* ═══════════ Contact Cards 三列 ═══════════ */
.cp-contact-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
}
.cp-card {
  background: var(--surface-card); border-radius: var(--radius-lg);
  padding: 24px; border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
  display: flex; flex-direction: column;
  transition: box-shadow .2s, transform .2s;
}
.cp-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.cp-card-top { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
.cp-card-icon {
  width: 48px; height: 48px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cp-card-label {
  font-size: 13px; color: var(--muted); margin: 0 0 2px; font-weight: 500;
}
.cp-card-value {
  font-size: 20px; font-weight: 700; color: var(--ink); margin: 0;
  letter-spacing: .5px; font-variant-numeric: tabular-nums;
}
.cp-card-value-sm { font-size: 16px; }
.cp-card-desc {
  font-size: 13px; color: var(--muted); line-height: 1.5;
  margin: 0 0 16px; flex: 1;
}
.cp-card-actions { display: flex; gap: 8px; }

/* ── Buttons ── */
.cp-btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 6px; padding: 10px 18px; border-radius: var(--radius-md);
  font-size: 14px; font-weight: 600; border: none; cursor: pointer;
  text-decoration: none; transition: opacity .15s, transform .1s;
  line-height: 1; flex: 1; min-height: 44px;
}
.cp-btn:active { transform: scale(.97); }
.cp-btn-brand {
  background: var(--brand); color: white;
}
.cp-btn-brand:hover { background: var(--brand-dark); }
.cp-btn-wechat {
  background: #22c55e; color: white; flex: 1;
}
.cp-btn-wechat:hover { background: #16a34a; }
.cp-btn-info {
  background: var(--info); color: white;
}
.cp-btn-info:hover { opacity: .9; }
.cp-btn-ghost {
  background: var(--surface); color: var(--ink-secondary);
  border: 1px solid var(--line);
}
.cp-btn-ghost:hover { background: var(--line); }
.cp-btn-white {
  background: white; color: var(--ink); border: 1px solid rgba(255,255,255,.3);
}
.cp-btn-lg { padding: 14px 28px; font-size: 15px; min-height: 48px; flex: unset; }

/* ═══════════ 可咨询事项 ═══════════ */
.cp-service-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
}
.cp-svc-card {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 20px; background: var(--surface-card);
  border-radius: var(--radius-lg); border: 1px solid var(--line);
  box-shadow: var(--shadow-sm); transition: box-shadow .2s;
}
.cp-svc-card:hover { box-shadow: var(--shadow-md); }
.cp-svc-icon { font-size: 28px; flex-shrink: 0; line-height: 1; }
.cp-svc-title {
  font-size: 15px; font-weight: 600; color: var(--ink);
  margin: 0 0 4px;
}
.cp-svc-desc { font-size: 13px; color: var(--muted); margin: 0; line-height: 1.5; }

/* ═══════════ 快速入口 ═══════════ */
.cp-quick-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
}
.cp-quick-card {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px; background: var(--surface-card);
  border-radius: var(--radius-lg); border: 1px solid var(--line);
  box-shadow: var(--shadow-sm); text-decoration: none; color: inherit;
  transition: box-shadow .2s, transform .15s;
}
.cp-quick-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.cp-quick-card:active { transform: scale(.98); }
.cp-quick-icon { font-size: 24px; flex-shrink: 0; }
.cp-quick-body { flex: 1; min-width: 0; }
.cp-quick-title { font-size: 14px; font-weight: 600; color: var(--ink); margin: 0 0 2px; }
.cp-quick-desc { font-size: 12px; color: var(--muted); margin: 0; }
.cp-quick-arrow { color: var(--muted-light); flex-shrink: 0; }

/* ═══════════ FAQ ═══════════ */
.cp-faq-list {
  max-width: 760px; margin: 0 auto;
  background: var(--surface-card); border-radius: var(--radius-lg);
  border: 1px solid var(--line); overflow: hidden;
}
.cp-faq-item { border-bottom: 1px solid var(--line); }
.cp-faq-item:last-child { border-bottom: none; }
.cp-faq-q {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 16px 20px; background: none; border: none;
  font-size: 15px; font-weight: 600; color: var(--ink);
  text-align: left; cursor: pointer; transition: background .15s;
}
.cp-faq-q:hover { background: var(--surface); }
.cp-faq-q-text { flex: 1; }
.cp-faq-chevron {
  flex-shrink: 0; transition: transform .2s; color: var(--muted-light);
}
.cp-faq-open .cp-faq-chevron { transform: rotate(180deg); }
.cp-faq-a {
  padding: 0 20px 16px 20px;
  font-size: 14px; color: var(--ink-secondary); line-height: 1.7;
}

/* ═══════════ Bottom CTA ═══════════ */
.cp-cta {
  background: linear-gradient(135deg, var(--brand-dark) 0%, var(--brand) 100%);
  padding: 48px 0; text-align: center;
}
.cp-cta-title { font-size: 22px; font-weight: 700; color: white; margin: 0 0 8px; }
.cp-cta-desc { font-size: 14px; color: rgba(255,255,255,.8); margin: 0 0 24px; }
.cp-cta-actions {
  display: flex; gap: 12px; justify-content: center;
  flex-wrap: wrap;
}
.cp-cta .cp-btn-brand { background: white; color: var(--brand); }
.cp-cta .cp-btn-brand:hover { background: rgba(255,255,255,.9); }
.cp-cta-links {
  margin-top: 20px; display: flex; gap: 24px; justify-content: center;
}
.cp-cta-links a {
  font-size: 13px; color: rgba(255,255,255,.7); text-decoration: none;
  transition: color .15s;
}
.cp-cta-links a:hover { color: white; }

/* ═══════════ 手机端底部固定栏 ═══════════ */
.cp-mobile-bar { display: none; }

/* ═══════════ 响应式 ═══════════ */
@media (max-width: 900px) {
  .cp-contact-grid { grid-template-columns: 1fr; gap: 14px; }
  .cp-service-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .cp-quick-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}

@media (max-width: 767px) {
  .cp-shell { padding: 0 16px; }
  .cp-section { padding: 32px 0; }

  /* Hero 移动端 */
  .cp-hero { padding: 20px 0 28px; }
  .cp-hero-inner { flex-direction: column; gap: 0; text-align: center; }
  .cp-hero-visual { display: none; }
  .cp-hero-title { font-size: 24px; }
  .cp-hero-desc { font-size: 14px; max-width: none; }
  .cp-hero-hint { font-size: 12px; padding: 6px 12px; }
  .cp-hero-badge { font-size: 12px; padding: 4px 12px; }

  .cp-sec-title { font-size: 18px; }

  /* 联系卡 */
  .cp-contact-grid { grid-template-columns: 1fr; gap: 12px; }
  .cp-card { padding: 18px; }
  .cp-card-value { font-size: 18px; }
  .cp-card-actions { flex-direction: row; }
  .cp-btn { min-height: 44px; font-size: 13px; padding: 10px 14px; }
  .cp-btn-lg { padding: 12px 20px; }

  /* 服务 */
  .cp-service-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .cp-svc-card { padding: 14px; flex-direction: column; gap: 8px; text-align: center; align-items: center; }
  .cp-svc-icon { font-size: 24px; }
  .cp-svc-title { font-size: 13px; }
  .cp-svc-desc { font-size: 11px; }

  /* 快速入口 */
  .cp-quick-grid { grid-template-columns: 1fr; gap: 8px; }
  .cp-quick-card { padding: 14px 16px; }

  /* FAQ */
  .cp-faq-q { padding: 14px 16px; font-size: 14px; }
  .cp-faq-a { padding: 0 16px 14px; font-size: 13px; }

  /* CTA */
  .cp-cta { padding: 36px 0; }
  .cp-cta-title { font-size: 18px; }
  .cp-cta-actions { flex-direction: column; align-items: center; }

  /* 底部固定栏 */
  .cp-mobile-bar {
    display: flex; gap: 10px;
    position: fixed; bottom: 68px; left: 0; right: 0;
    padding: 10px 16px calc(6px + env(safe-area-inset-bottom, 0px));
    background: rgba(255,255,255,.96); backdrop-filter: blur(12px);
    border-top: 1px solid var(--line);
    z-index: 90;
  }
  .cp-mbar-btn {
    flex: 1; display: flex; align-items: center; justify-content: center;
    gap: 6px; padding: 12px 0; border-radius: var(--radius-md);
    font-size: 14px; font-weight: 600; border: none; cursor: pointer;
    text-decoration: none; min-height: 46px;
  }
  .cp-mbar-phone { background: var(--brand); color: white; }
  .cp-mbar-wechat { background: #22c55e; color: white; }
  .cp-mbar-btn:active { opacity: .85; }

  /* 页面底部留出空间给固定栏+TabBar */
  .cp { padding-bottom: calc(130px + env(safe-area-inset-bottom, 0px)); }
}

/* ── 复制反馈 ── */
.cp-toast {
  display: inline-flex; align-items: center; gap: 4px;
  color: var(--brand); font-weight: 600; font-size: 13px;
}
`;
