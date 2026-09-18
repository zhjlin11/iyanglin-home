import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default function PublishHubPage() {
  const publishCategories = [
    {
      title: "发布招聘 / 简历",
      desc: "企业招聘全职/兼职员工，或个人登记求职意向简历",
      icon: "💼",
      href: "/jobs/new",
      tag: "热门需求",
      color: "#0B7A75",
    },
    {
      title: "发布便民分类信息",
      desc: "闲置二手物品转让、家电保洁搬家、官方与失物通知",
      icon: "📢",
      href: "/info/new",
      tag: "免费发布",
      color: "#3b82f6",
    },
    {
      title: "挂牌房源 (出租/出售)",
      desc: "房东免佣挂牌大学城精装公寓、出租房、二手套房与商铺",
      icon: "🏠",
      href: "/house/new",
      tag: "业主直发",
      color: "#10b981",
    },
    {
      title: "园区招商 / 工业地产",
      desc: "杨林经开区标准厂房出租出售、高标仓库、工业土地与求租求购",
      icon: "🏭",
      href: "/industrial/publish",
      tag: "专业招商",
      color: "#0284c7",
    },
    {
      title: "发布同城活动",
      desc: "组队精致露营、电竞交流、桌游比赛与周末线下聚会",
      icon: "🎉",
      href: "/active/new",
      tag: "组队聚会",
      color: "#ec4899",
    },
    {
      title: "登记相亲交友资料",
      desc: "真实身份认证、寻找杨林本地心仪单身嘉宾",
      icon: "❤️",
      href: "/love/new",
      tag: "脱单交友",
      color: "#ef4444",
    },
    {
      title: "社区帖文与求助",
      desc: "杨林街坊贴吧，分享生活琐事、曝光求助与经验交流",
      icon: "💬",
      href: "/community/new",
      tag: "街坊贴吧",
      color: "#8b5cf6",
    },
  ];

  return (
    <main className="page-layout">
      <Navbar />

      <section className="page-header-compact">
        <div className="shell">
          <span className="eyebrow-tag">发布中心</span>
          <div className="hero-header">
            <div className="hero-title-group">
              <h1 style={{ fontSize: "clamp(22px, 4vw, 28px)", wordBreak: "break-word" }}>杨林生活网 · 快捷发布中心</h1>
              <p>免费发布便民信息、企业招聘、免佣房源与好店入驻，覆盖杨林全区域</p>
            </div>
          </div>
        </div>
      </section>

      <section className="shell" style={{ marginTop: "1.5rem", paddingBottom: "4rem", maxWidth: "1000px" }}>
        
        {/* User Permission Info Banner */}
        <div style={{ background: "#f0f9f8", border: "1px solid #b7ddd7", padding: "1rem 1.25rem", borderRadius: "12px", marginBottom: "1.5rem", fontSize: "13px", color: "#075e5a", lineHeight: "1.5" }}>
          💡 <b>发布规则提示：</b> 所有注册用户均可免费发布信息。发布后将进入审核队列，由管理员在后台统一审核后正式对外上线。如需修改或删减已有内容，可前往 <a href="/profile" style={{ fontWeight: "bold", textDecoration: "underline", color: "#0B7A75" }}>个人中心</a> 管理。
        </div>

        {/* Publish Tiles Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {publishCategories.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "1.25rem",
                borderRadius: "14px",
                background: "white",
                border: "1px solid var(--line)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                textDecoration: "none",
                color: "inherit",
                transition: "transform 0.15s ease, border-color 0.15s ease",
              }}
              className="hover-card"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${item.color}15`, color: item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: "11px", fontWeight: "bold", background: `${item.color}15`, color: item.color, padding: "2px 8px", borderRadius: "12px" }}>
                  {item.tag}
                </span>
              </div>

              <h3 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", fontWeight: "bold", color: "var(--ink)" }}>
                {item.title}
              </h3>

              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: "1.5", flex: 1 }}>
                {item.desc}
              </p>

              <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--line)", display: "flex", justifyContent: "flex-end", alignItems: "center", fontSize: "13px", fontWeight: "bold", color: item.color }}>
                去发布 →
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
