"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function CategoriesPage() {
  const categorySections = [
    {
      title: "房产楼市",
      color: "#FF8A00",
      items: [
        { label: "租房", href: "/house?type=rent", icon: "🏢" },
        { label: "二手房", href: "/house?type=secondhand", icon: "🏠" },
        { label: "新房", href: "/house?type=new", icon: "🏙️" },
        { label: "商铺门面", href: "/house?type=shop", icon: "🏪" },
        { label: "园区厂房", href: "/industrial?propertyType=FACTORY", icon: "🏭" },
        { label: "求租求购", href: "/house?type=wanted", icon: "🔍" },
      ],
    },
    {
      title: "园区招商 / 工业地产",
      color: "#0284C7",
      items: [
        { label: "标准厂房", href: "/industrial?propertyType=FACTORY", icon: "🏭" },
        { label: "高标仓库", href: "/industrial?propertyType=WAREHOUSE", icon: "📦" },
        { label: "工业土地", href: "/industrial?propertyType=LAND", icon: "🗺️" },
        { label: "研发办公", href: "/industrial?propertyType=OFFICE", icon: "🏢" },
        { label: "产业园区", href: "/industrial?propertyType=PARK", icon: "🏗️" },
        { label: "求租求购", href: "/industrial?wanted=true", icon: "🔍" },
        { label: "发布招商", href: "/industrial/publish", icon: "✍️" },
      ],
    },
    {
      title: "工作",
      color: "#3270FF",
      items: [
        { label: "全职招聘", href: "/jobs?type=fulltime", icon: "💼" },
        { label: "兼职实习", href: "/jobs?type=parttime", icon: "⏱️" },
        { label: "普工技工", href: "/jobs?q=普工", icon: "👷" },
        { label: "技术工程", href: "/jobs?q=技术", icon: "💻" },
        { label: "销售商务", href: "/jobs?q=销售", icon: "📈" },
        { label: "行政文员", href: "/jobs?q=文员", icon: "📋" },
        { label: "求职找工作", href: "/jobs/resumes", icon: "📄" },
      ],
    },
    {
      title: "二手闲置",
      color: "#7C3AED",
      items: [
        { label: "二手手机", href: "/info?cat=phone", icon: "📱" },
        { label: "数码电脑", href: "/info?cat=digital", icon: "💻" },
        { label: "家用电器", href: "/info?cat=appliances", icon: "📺" },
        { label: "家具家纺", href: "/info?cat=furniture", icon: "🛋️" },
        { label: "电动车", href: "/info?cat=ebike", icon: "🛵" },
        { label: "二手汽车", href: "/info?cat=car", icon: "🚗" },
        { label: "其他物品", href: "/info", icon: "📦" },
      ],
    },
    {
      title: "生活服务",
      color: "#16A67A",
      items: [
        { label: "家政保洁", href: "/info?cat=clean", icon: "🧹" },
        { label: "便民维修", href: "/info?cat=repair", icon: "🔧" },
        { label: "网络监控", href: "/haodian?q=监控", icon: "📹" },
        { label: "搬家拉货", href: "/info?cat=move", icon: "🚚" },
        { label: "装修建材", href: "/haodian?q=装修", icon: "🔨" },
        { label: "家电维修", href: "/info?cat=appliancerepair", icon: "🛠️" },
      ],
    },
    {
      title: "更多服务",
      color: "#F24E4E",
      items: [
        { label: "相亲交友", href: "/love", icon: "💖" },
        { label: "宠物天地", href: "/info?cat=pet", icon: "🐱" },
        { label: "餐饮娱乐", href: "/haodian", icon: "🍲" },
        { label: "便民电话", href: "/bianmin", icon: "📞" },
        { label: "同城活动", href: "/active", icon: "🎪" },
        { label: "社区论坛", href: "/community", icon: "💬" },
      ],
    },
  ];

  return (
    <main className="support-page categories-channel" style={{ minHeight: "100vh", background: "#F6F7F9", paddingBottom: "calc(100px + env(safe-area-inset-bottom, 0px))" }}>
      <Navbar />

      {/* 顶部 Header 搜索框 */}
      <div style={{ background: "#ffffff", padding: "12px 16px", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/" style={{ fontSize: "14px", fontWeight: "800", color: "#16A67A", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>‹</span> 返回
          </Link>
          <form action="/search" method="GET" style={{ flex: 1, display: "flex", alignItems: "center", background: "#F3F4F6", borderRadius: "12px", padding: "6px 12px" }}>
            <span style={{ fontSize: "14px", color: "#9CA3AF", marginRight: "6px" }}>🔍</span>
            <input
              type="text"
              name="q"
              placeholder="搜索全部分类、商家、岗位、二手..."
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "13px", color: "#1F2937" }}
            />
          </form>
        </div>
      </div>

      {/* 全部分类卡片流 */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: "900", color: "#1F2937", margin: "0 0 16px", letterSpacing: "-0.3px" }}>
          全部分类导航
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {categorySections.map((sec, idx) => (
            <div
              key={idx}
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ width: "4px", height: "14px", background: sec.color, borderRadius: "2px" }} />
                <h2 style={{ fontSize: "15px", fontWeight: "800", color: "#1F2937", margin: 0 }}>
                  {sec.title}
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px 8px" }}>
                {sec.items.map((item, itemIdx) => (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textDecoration: "none",
                      padding: "8px 4px",
                      borderRadius: "12px",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: "24px", marginBottom: "4px" }}>{item.icon}</span>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#4B5563", textAlign: "center" }}>
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 底部发布引导卡片 (CTA) */}
        <div
          style={{
            marginTop: "24px",
            background: "linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #F0FDF9 100%)",
            borderRadius: "20px",
            padding: "24px 20px",
            border: "1.5px dashed #16A67A",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxShadow: "0 4px 16px rgba(22, 166, 122, 0.08)",
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "#16A67A",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              marginBottom: "12px",
              boxShadow: "0 6px 14px rgba(22, 166, 122, 0.3)",
            }}
          >
            ✍️
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: "900", color: "#065F46" }}>
            没有找到合适的分类？
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#047857", lineHeight: "1.5", maxWidth: "360px" }}>
            直接发布你的便民信息或需求，让杨林全城街坊与专业师傅帮你留意！
          </p>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                if (window.innerWidth < 768) {
                  window.dispatchEvent(new CustomEvent("open-global-publish-sheet"));
                } else {
                  window.location.href = "/publish";
                }
              }
            }}
            style={{
              background: "linear-gradient(135deg, #16A67A 0%, #0B7A75 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "30px",
              padding: "12px 32px",
              fontSize: "14px",
              fontWeight: "800",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(22, 166, 122, 0.35)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "transform 0.15s ease",
            }}
          >
            <span>➕ 免费发布信息</span>
          </button>
        </div>
      </div>
    </main>
  );
}
