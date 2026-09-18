"use client";

import { useState } from "react";
import {
  MapPin, Briefcase, Monitor, Headset, Target, Layers, CalendarRange,
  BarChart3, Handshake, Zap, Images, ArrowUpRight, Phone, MessageCircle,
  Mail, ChevronRight, BadgeCheck, Clock, Megaphone, Store, Building2,
  House, UtensilsCrossed, Car, GraduationCap, Wrench, Factory, Stethoscope,
  Scissors, Gamepad2, Smartphone, X, Copy, Check
} from "lucide-react";

/* ──────────────────────── data ──────────────────────── */

const PHONE = "13619694207";
const WECHAT = "13619694207";
const EMAIL = "123035946@qq.com";

const CAPABILITIES = [
  { icon: MapPin, label: "本地生活场景", desc: "招聘 / 房产 / 商家 / 资讯" },
  { icon: Layers, label: "多种广告形式", desc: "Banner / 信息流 / 置顶 / 推荐" },
  { icon: Monitor, label: "PC + 手机覆盖", desc: "适配不同终端访问" },
  { icon: Headset, label: "本地团队服务", desc: "咨询、设计、上线、调整" },
];

const AD_PLACEMENTS = [
  {
    key: "HOME_BANNER",
    name: "首页顶部 Banner",
    position: "首页首屏核心位置",
    size: "1240×300px",
    desc: "进入首页即可看到，适合品牌宣传、新店开业、活动推广。",
    highlight: true,
    tags: ["高曝光", "品牌宣传"],
    icon: Images,
    mockupType: "banner" as const,
  },
  {
    key: "LISTING_TOP",
    name: "列表置顶推荐",
    position: "便民/求职/房产列表顶部",
    size: "列表卡片样式",
    desc: "信息流顶部优先展示，带「推荐」标签，让信息排在同类前列。",
    highlight: false,
    tags: ["商家推广", "信息曝光"],
    icon: ArrowUpRight,
    mockupType: "listing" as const,
  },
  {
    key: "JOB_TOP",
    name: "求职招聘置顶",
    position: "求职频道顶部",
    size: "招聘卡片样式",
    desc: "适合工厂招工、门店招聘、企业批量用工，置顶后简历投递量提升明显。",
    highlight: false,
    tags: ["招聘引流", "急聘"],
    icon: Briefcase,
    mockupType: "job" as const,
  },
  {
    key: "HOUSE_TOP",
    name: "房产租售置顶",
    position: "房产频道顶部",
    size: "房源卡片样式",
    desc: "适合房产中介、楼盘开发商、个人房东快速出租出售。",
    highlight: false,
    tags: ["房源曝光", "精选"],
    icon: House,
    mockupType: "house" as const,
  },
  {
    key: "SHOP_RECOMMEND",
    name: "商家推荐位",
    position: "商家黄页 / 推荐栏",
    size: "商家卡片样式",
    desc: "在商家分类页和首页推荐栏展示，带 Logo、电话、地址一键导航。",
    highlight: false,
    tags: ["商家推广", "推荐"],
    icon: Store,
    mockupType: "shop" as const,
  },
  {
    key: "SIDEBAR",
    name: "侧边栏广告位",
    position: "PC 端页面右侧",
    size: "300×250px",
    desc: "PC 端浏览时始终可见的侧边固定位，适合长期品牌曝光。",
    highlight: false,
    tags: ["PC 端", "品牌曝光"],
    icon: Monitor,
    mockupType: "sidebar" as const,
  },
];

const ADVANTAGES = [
  {
    icon: Target,
    title: "精准本地覆盖",
    desc: "聚焦杨林镇、杨林大学城、杨林经开区及周边用户。",
  },
  {
    icon: Megaphone,
    title: "多场景曝光",
    desc: "广告可出现在首页、招聘、房产、商家、资讯等真实业务场景。",
  },
  {
    icon: CalendarRange,
    title: "灵活投放周期",
    desc: "支持短期测试、月度推广及长期品牌曝光，丰俭由人。",
  },
  {
    icon: BarChart3,
    title: "效果可查看",
    desc: "支持根据现有系统能力提供曝光和咨询数据参考。",
  },
  {
    icon: Handshake,
    title: "本地一对一服务",
    desc: "帮助商家选择合适的广告位置和推广方式，不懂设计我们帮你做。",
  },
  {
    icon: Zap,
    title: "快速上线",
    desc: "素材确认后尽快安排上线，支持随时修改内容、暂停或续投。",
  },
];

const AUDIENCE_GROUPS = [
  { icon: MapPin, label: "杨林本地居民" },
  { icon: GraduationCap, label: "大学城师生" },
  { icon: Factory, label: "园区企业员工" },
  { icon: Store, label: "本地商家经营者" },
  { icon: Briefcase, label: "周边生活消费人群" },
];

const AUDIENCE_SCENES = [
  "找工作", "租房", "找商家", "找维修",
  "看本地资讯", "发布信息", "找生活服务",
];

const INDUSTRIES = [
  { icon: UtensilsCrossed, name: "餐饮美食", examples: "火锅店、小吃店、奶茶店" },
  { icon: Building2, name: "酒店民宿", examples: "宾馆、民宿、短租公寓" },
  { icon: House, name: "房产租售", examples: "中介、楼盘、个人房东" },
  { icon: Briefcase, name: "招聘企业", examples: "工厂、门店、企业用工" },
  { icon: Wrench, name: "装修建材", examples: "装修公司、建材店、五金" },
  { icon: Car, name: "汽车服务", examples: "汽修、洗车、二手车" },
  { icon: GraduationCap, name: "教育培训", examples: "驾校、辅导班、培训" },
  { icon: Scissors, name: "美容美发", examples: "美甲、理发、养生馆" },
  { icon: Wrench, name: "生活服务", examples: "家电维修、搬家、保洁" },
  { icon: Smartphone, name: "数码电脑", examples: "手机维修、电脑配件" },
  { icon: Gamepad2, name: "休闲娱乐", examples: "KTV、网吧、棋牌室" },
  { icon: Megaphone, name: "活动推广", examples: "开业活动、促销推广" },
];

const PROCESS_STEPS = [
  { step: 1, title: "告诉我们需求", desc: "行业、预算、推广目标", icon: MessageCircle },
  { step: 2, title: "推荐投放方案", desc: "选择合适的广告位和周期", icon: Target },
  { step: 3, title: "确认素材与费用", desc: "图片、文案、链接、联系方式", icon: BadgeCheck },
  { step: 4, title: "上线推广", desc: "按约定时间展示，随时可调整", icon: Zap },
];

const PACKAGES = [
  {
    name: "体验套餐",
    tag: "适合初次尝试",
    duration: "7天",
    features: [
      "1 个广告位展示",
      "7 天展示周期",
      "基础素材协助",
      "微信 / 电话服务",
    ],
    price: "¥299",
    unit: "/ 7天起",
    popular: false,
  },
  {
    name: "标准套餐",
    tag: "多数商家选择",
    duration: "30天",
    features: [
      "2 个广告位组合",
      "30 天展示周期",
      "广告素材协助",
      "投放期间可调整",
      "优先展示排序",
    ],
    price: "¥799",
    unit: "/ 30天起",
    popular: true,
  },
  {
    name: "旗舰套餐",
    tag: "品牌长期推广",
    duration: "90天",
    features: [
      "3 个以上广告位",
      "90 天推广周期",
      "首页 + 栏目组合",
      "品牌推荐展示",
      "定期优化调整",
    ],
    price: "¥1,999",
    unit: "/ 90天起",
    popular: false,
  },
];

const EXAMPLE_CASES = [
  {
    industry: "餐饮推广示例",
    desc: "新开火锅店通过首页 Banner + 美食分类置顶，向杨林本地用户展示开业信息和优惠活动。",
    tag: "投放示例",
  },
  {
    industry: "招聘推广示例",
    desc: "工厂招工信息通过求职频道置顶 + 首页推荐，提高招聘信息的曝光和简历投递量。",
    tag: "投放示例",
  },
  {
    industry: "房产推广示例",
    desc: "房产中介通过房产频道置顶 + 侧边栏广告，持续展示优质房源给租房买房用户。",
    tag: "投放示例",
  },
];

const FAQS = [
  {
    q: "广告最低投放多少钱？",
    a: "体验套餐 299 元 / 7 天起，适合初次尝试的商家。具体价格根据广告位和投放时长确定，欢迎来电咨询。",
  },
  {
    q: "没有广告图怎么办？",
    a: "没问题！我们提供免费广告素材设计服务，您只需提供店铺或产品照片和想表达的信息，由我们帮您制作。",
  },
  {
    q: "投放后可以修改内容吗？",
    a: "可以随时修改。更换图片、调整文案、修改链接，联系客服即可完成。",
  },
  {
    q: "支持哪些付款方式？",
    a: "支持微信支付、支付宝转账和银行对公转账。正规公司运营，可开具发票。",
  },
  {
    q: "投放多久可以看到效果？",
    a: "广告上线后即时开始展示。广告效果与行业、素材、投放位置、周期等有关，平台不承诺具体成交数量。",
  },
  {
    q: "可以指定投放时间段吗？",
    a: "可以。支持设定广告展示的起止日期，适合节假日促销、开业活动等短期需求。",
  },
  {
    q: "杨林生活网的用户主要是哪些人？",
    a: "主要覆盖杨林镇居民、大学城师生、经开区及工业区从业者、本地商家等本地人群，使用场景包括找工作、租房、找商家、发布信息等。",
  },
];

/* ──────────────────────── mockup components ──────────────────────── */

function MockupBanner() {
  return (
    <div style={{ background: "#F0F4FF", borderRadius: 8, padding: 10, fontSize: 0 }}>
      <div style={{ background: "#fff", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: 8, background: "#E8EDF5", display: "flex", alignItems: "center", padding: "0 6px", gap: 3 }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#ccc" }} />
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#ccc" }} />
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#ccc" }} />
        </div>
        <div style={{ padding: 6 }}>
          <div style={{ height: 6, background: "#0F6FEA", borderRadius: 2, marginBottom: 4, width: "60%" }} />
          <div style={{ border: "2px solid #FF6A3D", borderRadius: 4, padding: 4, position: "relative" }}>
            <div style={{ height: 20, background: "linear-gradient(135deg, #FFE0D0, #FFD0B8)", borderRadius: 3 }} />
            <span style={{ position: "absolute", top: -6, right: 4, background: "#FF6A3D", color: "#fff", fontSize: 7, padding: "1px 4px", borderRadius: 3, fontWeight: 700 }}>广告位</span>
          </div>
          <div style={{ marginTop: 4, display: "flex", gap: 3 }}>
            <div style={{ flex: 1, height: 4, background: "#E8EDF5", borderRadius: 2 }} />
            <div style={{ flex: 1, height: 4, background: "#E8EDF5", borderRadius: 2 }} />
            <div style={{ flex: 1, height: 4, background: "#E8EDF5", borderRadius: 2 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MockupListing() {
  return (
    <div style={{ background: "#F0F4FF", borderRadius: 8, padding: 10, fontSize: 0 }}>
      <div style={{ background: "#fff", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: 8, background: "#E8EDF5" }} />
        <div style={{ padding: 6 }}>
          <div style={{ height: 4, background: "#E8EDF5", borderRadius: 2, marginBottom: 3, width: "40%" }} />
          <div style={{ border: "2px solid #FF6A3D", borderRadius: 4, padding: 4, marginBottom: 3, position: "relative", background: "#FFFAF7" }}>
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              <span style={{ background: "#FF6A3D", color: "#fff", fontSize: 6, padding: "1px 3px", borderRadius: 2, fontWeight: 700 }}>推荐</span>
              <div style={{ height: 3, background: "#333", borderRadius: 2, flex: 1 }} />
            </div>
            <div style={{ height: 3, background: "#ccc", borderRadius: 2, width: "70%", marginTop: 3 }} />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: 3, marginBottom: 2 }}>
              <div style={{ height: 3, background: "#E8EDF5", borderRadius: 2, width: `${70 - i * 10}%` }} />
              <div style={{ height: 2, background: "#F0F4FF", borderRadius: 2, width: "50%", marginTop: 2 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockupJob() {
  return (
    <div style={{ background: "#F0F4FF", borderRadius: 8, padding: 10, fontSize: 0 }}>
      <div style={{ background: "#fff", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: 8, background: "#E8EDF5" }} />
        <div style={{ padding: 6 }}>
          <div style={{ height: 4, background: "#0F6FEA", borderRadius: 2, marginBottom: 4, width: "30%" }} />
          <div style={{ border: "2px solid #FF6A3D", borderRadius: 4, padding: 4, marginBottom: 3, position: "relative", background: "#FFFAF7" }}>
            <div style={{ display: "flex", gap: 3, alignItems: "center", marginBottom: 2 }}>
              <span style={{ background: "#FF6A3D", color: "#fff", fontSize: 6, padding: "1px 3px", borderRadius: 2, fontWeight: 700 }}>置顶</span>
              <span style={{ background: "#EF4444", color: "#fff", fontSize: 6, padding: "1px 3px", borderRadius: 2, fontWeight: 700 }}>急聘</span>
            </div>
            <div style={{ height: 3, background: "#333", borderRadius: 2, width: "60%" }} />
            <div style={{ height: 2, background: "#22C55E", borderRadius: 2, width: "25%", marginTop: 2 }} />
          </div>
          {[1, 2].map((i) => (
            <div key={i} style={{ padding: 3, marginBottom: 2 }}>
              <div style={{ height: 3, background: "#E8EDF5", borderRadius: 2, width: `${65 - i * 10}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockupHouse() {
  return (
    <div style={{ background: "#F0F4FF", borderRadius: 8, padding: 10, fontSize: 0 }}>
      <div style={{ background: "#fff", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: 8, background: "#E8EDF5" }} />
        <div style={{ padding: 6 }}>
          <div style={{ height: 4, background: "#0F6FEA", borderRadius: 2, marginBottom: 4, width: "30%" }} />
          <div style={{ border: "2px solid #FF6A3D", borderRadius: 4, padding: 4, marginBottom: 3, background: "#FFFAF7" }}>
            <div style={{ display: "flex", gap: 3 }}>
              <div style={{ width: 18, height: 14, background: "#E0E7FF", borderRadius: 3 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                  <span style={{ background: "#FF6A3D", color: "#fff", fontSize: 6, padding: "1px 3px", borderRadius: 2, fontWeight: 700 }}>精选</span>
                </div>
                <div style={{ height: 3, background: "#333", borderRadius: 2, width: "80%" }} />
                <div style={{ height: 2, background: "#F59E0B", borderRadius: 2, width: "40%", marginTop: 2 }} />
              </div>
            </div>
          </div>
          {[1, 2].map((i) => (
            <div key={i} style={{ padding: 3, marginBottom: 2, display: "flex", gap: 3 }}>
              <div style={{ width: 14, height: 10, background: "#F0F4FF", borderRadius: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 3, background: "#E8EDF5", borderRadius: 2, width: "70%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockupShop() {
  return (
    <div style={{ background: "#F0F4FF", borderRadius: 8, padding: 10, fontSize: 0 }}>
      <div style={{ background: "#fff", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: 8, background: "#E8EDF5" }} />
        <div style={{ padding: 6 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            <div style={{ border: "2px solid #FF6A3D", borderRadius: 4, padding: 3, background: "#FFFAF7", position: "relative" }}>
              <div style={{ width: "100%", height: 12, background: "#E0E7FF", borderRadius: 2, marginBottom: 2 }} />
              <div style={{ height: 3, background: "#333", borderRadius: 2, width: "70%" }} />
              <span style={{ position: "absolute", top: 1, right: 1, background: "#FF6A3D", color: "#fff", fontSize: 5, padding: "1px 2px", borderRadius: 2, fontWeight: 700 }}>推荐</span>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ borderRadius: 4, padding: 3, border: "1px solid #E8EDF5" }}>
                <div style={{ width: "100%", height: 12, background: "#F0F4FF", borderRadius: 2, marginBottom: 2 }} />
                <div style={{ height: 3, background: "#E8EDF5", borderRadius: 2, width: "60%" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockupSidebar() {
  return (
    <div style={{ background: "#F0F4FF", borderRadius: 8, padding: 10, fontSize: 0 }}>
      <div style={{ background: "#fff", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: 8, background: "#E8EDF5" }} />
        <div style={{ padding: 6, display: "flex", gap: 4 }}>
          <div style={{ flex: 1 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ height: 3, background: "#E8EDF5", borderRadius: 2, marginBottom: 3, width: `${80 - i * 5}%` }} />
            ))}
          </div>
          <div style={{ width: 22, border: "2px solid #FF6A3D", borderRadius: 4, padding: 2, position: "relative", background: "#FFFAF7" }}>
            <div style={{ height: "100%", background: "linear-gradient(135deg, #FFE0D0, #FFD0B8)", borderRadius: 2, minHeight: 24 }} />
            <span style={{ position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)", background: "#FF6A3D", color: "#fff", fontSize: 5, padding: "1px 3px", borderRadius: 2, fontWeight: 700, whiteSpace: "nowrap" }}>广告位</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const MOCKUP_MAP: Record<string, () => React.JSX.Element> = {
  banner: MockupBanner,
  listing: MockupListing,
  job: MockupJob,
  house: MockupHouse,
  shop: MockupShop,
  sidebar: MockupSidebar,
};

/* ──────────────────────── component ──────────────────────── */

export default function AdvertisingPage() {
  const [showContact, setShowContact] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{`
        /* ── tokens ── */
        :root {
          --ad-brand: #0F6FEA;
          --ad-brand-dark: #0B5CC5;
          --ad-brand-light: #EBF3FF;
          --ad-accent: #FF6A3D;
          --ad-accent-light: #FFF4F0;
          --ad-green: #16A67A;
          --ad-surface: #F6F8FB;
          --ad-card: #fff;
          --ad-text: #172033;
          --ad-text-secondary: #667085;
          --ad-border: #E2E8F0;
          --ad-radius: 12px;
          --ad-shadow: 0 2px 12px rgba(0,0,0,.05);
          --ad-shadow-lg: 0 8px 28px rgba(0,0,0,.08);
          --ad-max-w: 1200px;
          --ad-gradient: linear-gradient(135deg, #0F6FEA 0%, #1597E5 50%, #16B3C4 100%);
        }

        .ad-page { color: var(--ad-text); line-height: 1.7; }
        .ad-page * { box-sizing: border-box; }
        .ad-shell { max-width: var(--ad-max-w); margin: 0 auto; padding: 0 24px; }

        /* ── hero ── */
        .ad-hero {
          background: var(--ad-gradient);
          padding: 72px 24px 64px;
          text-align: center;
          color: #fff;
          position: relative;
          overflow: hidden;
        }
        .ad-hero::before {
          content: '';
          position: absolute;
          top: -50%; right: -15%;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: rgba(255,255,255,.05);
        }
        .ad-hero-inner { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; }
        .ad-hero-badges { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 28px; }
        .ad-hero-badge {
          background: rgba(255,255,255,.15);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.2);
          padding: 5px 16px;
          border-radius: 100px;
          font-size: .85rem;
          font-weight: 500;
          display: flex; align-items: center; gap: 6px;
        }
        .ad-hero h1 {
          font-size: 2.4rem;
          font-weight: 800;
          margin: 0 0 14px;
          letter-spacing: -0.02em;
          text-wrap: balance;
          line-height: 1.3;
        }
        .ad-hero h1 .accent { color: #FFD666; }
        .ad-hero-sub {
          font-size: 1.05rem;
          opacity: .9;
          margin: 0 0 32px;
          line-height: 1.8;
        }
        .ad-hero-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .ad-hero-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--ad-accent);
          color: #fff;
          font-size: 1.05rem; font-weight: 700;
          padding: 13px 36px;
          border-radius: 100px;
          border: none; cursor: pointer;
          transition: transform .2s, box-shadow .2s;
          box-shadow: 0 4px 16px rgba(255,106,61,.3);
        }
        .ad-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(255,106,61,.4); }
        .ad-hero-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,.15);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.3);
          color: #fff;
          font-size: .95rem; font-weight: 600;
          padding: 12px 28px;
          border-radius: 100px;
          text-decoration: none;
          transition: background .2s;
        }
        .ad-hero-secondary:hover { background: rgba(255,255,255,.25); }
        .ad-hero-hint {
          margin-top: 14px;
          font-size: .82rem;
          opacity: .7;
        }

        /* ── capability strip ── */
        .ad-caps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          background: var(--ad-card);
          border-radius: var(--ad-radius);
          box-shadow: var(--ad-shadow-lg);
          margin-top: -36px;
          position: relative;
          z-index: 2;
          overflow: hidden;
        }
        .ad-cap {
          padding: 24px 16px;
          text-align: center;
          border-right: 1px solid var(--ad-border);
        }
        .ad-cap:last-child { border-right: none; }
        .ad-cap-icon { color: var(--ad-brand); margin-bottom: 10px; }
        .ad-cap-label { font-size: .95rem; font-weight: 700; margin-bottom: 4px; }
        .ad-cap-desc { font-size: .82rem; color: var(--ad-text-secondary); }

        /* ── section ── */
        .ad-section { padding: 72px 0; }
        .ad-section-alt { background: var(--ad-surface); }
        .ad-section-title {
          font-size: 1.6rem; font-weight: 700; text-align: center;
          margin: 0 0 8px; color: var(--ad-text);
        }
        .ad-section-desc {
          text-align: center; color: var(--ad-text-secondary);
          font-size: .95rem; margin: 0 auto 40px; max-width: 560px;
        }
        .ad-eyebrow {
          text-align: center; font-size: .7rem; font-weight: 500;
          letter-spacing: .06em; text-transform: uppercase;
          color: var(--ad-border); margin: 0 0 8px;
        }

        /* ── placement cards ── */
        .ad-placements { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .ad-placement-card {
          background: var(--ad-card);
          border: 1px solid var(--ad-border);
          border-radius: var(--ad-radius);
          overflow: hidden;
          transition: transform .2s, box-shadow .2s;
        }
        .ad-placement-card:hover { transform: translateY(-3px); box-shadow: var(--ad-shadow-lg); }
        .ad-placement-card.highlight {
          border-color: var(--ad-brand);
          box-shadow: 0 0 0 1px var(--ad-brand), var(--ad-shadow);
        }
        .ad-placement-mockup { position: relative; }
        .ad-placement-badge {
          position: absolute; top: 8px; right: 8px; z-index: 1;
          background: var(--ad-accent); color: #fff;
          font-size: .7rem; font-weight: 700;
          padding: 2px 8px; border-radius: 4px;
        }
        .ad-placement-body { padding: 18px 20px; }
        .ad-placement-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .ad-placement-head svg { color: var(--ad-brand); flex-shrink: 0; }
        .ad-placement-name { font-size: 1rem; font-weight: 700; margin: 0; }
        .ad-placement-desc { font-size: .85rem; color: var(--ad-text-secondary); margin: 0 0 12px; line-height: 1.6; }
        .ad-placement-tags { display: flex; gap: 6px; flex-wrap: wrap; }
        .ad-placement-tag {
          font-size: .75rem; font-weight: 600;
          padding: 2px 10px; border-radius: 4px;
          background: var(--ad-brand-light); color: var(--ad-brand);
        }

        /* ── advantages ── */
        .ad-advantages { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .ad-advantage {
          background: var(--ad-card);
          border: 1px solid var(--ad-border);
          border-radius: var(--ad-radius);
          padding: 24px 20px;
          transition: transform .2s;
        }
        .ad-advantage:hover { transform: translateY(-2px); }
        .ad-advantage-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: var(--ad-brand-light);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px; color: var(--ad-brand);
        }
        .ad-advantage-title { font-size: .98rem; font-weight: 700; margin: 0 0 6px; }
        .ad-advantage-desc { font-size: .85rem; color: var(--ad-text-secondary); line-height: 1.6; margin: 0; }

        /* ── audience ── */
        .ad-audience-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
        .ad-audience-cards { display: flex; flex-direction: column; gap: 10px; }
        .ad-audience-card {
          display: flex; align-items: center; gap: 12px;
          background: var(--ad-card); border: 1px solid var(--ad-border);
          border-radius: 10px; padding: 14px 16px;
        }
        .ad-audience-card-icon {
          width: 36px; height: 36px; border-radius: 8px;
          background: var(--ad-brand-light);
          display: flex; align-items: center; justify-content: center;
          color: var(--ad-brand); flex-shrink: 0;
        }
        .ad-audience-card-label { font-weight: 600; font-size: .92rem; }
        .ad-audience-right h3 { font-size: 1.15rem; font-weight: 700; margin: 0 0 14px; }
        .ad-audience-right p { color: var(--ad-text-secondary); line-height: 1.7; margin: 0 0 16px; font-size: .9rem; }
        .ad-scene-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .ad-scene-tag {
          background: var(--ad-brand-light); color: var(--ad-brand);
          padding: 5px 14px; border-radius: 100px;
          font-size: .82rem; font-weight: 600;
        }

        /* ── industries ── */
        .ad-industries { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .ad-industry {
          background: var(--ad-card);
          border: 1px solid var(--ad-border);
          border-radius: var(--ad-radius);
          padding: 18px 14px;
          text-align: center;
          transition: border-color .2s;
        }
        .ad-industry:hover { border-color: var(--ad-brand); }
        .ad-industry-icon { color: var(--ad-brand); margin-bottom: 8px; }
        .ad-industry-name { font-weight: 700; margin: 0 0 3px; font-size: .9rem; }
        .ad-industry-ex { font-size: .75rem; color: var(--ad-text-secondary); margin: 0; }

        /* ── process ── */
        .ad-process { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .ad-process-step {
          text-align: center; position: relative;
          padding: 20px 12px;
          background: var(--ad-card); border: 1px solid var(--ad-border);
          border-radius: var(--ad-radius);
        }
        .ad-process-step::after {
          content: '';
          position: absolute; right: -12px; top: 50%;
          transform: translateY(-50%);
          width: 0; height: 0;
          border-left: 6px solid var(--ad-brand);
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
        }
        .ad-process-step:last-child::after { display: none; }
        .ad-process-num {
          width: 36px; height: 36px;
          background: var(--ad-gradient);
          color: #fff; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: .9rem;
          margin-bottom: 10px;
        }
        .ad-process-icon { color: var(--ad-brand); margin-bottom: 6px; }
        .ad-process-title { font-weight: 700; font-size: .9rem; margin: 0 0 4px; }
        .ad-process-desc { font-size: .78rem; color: var(--ad-text-secondary); line-height: 1.5; margin: 0; }

        /* ── packages ── */
        .ad-packages { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: start; }
        .ad-package {
          background: var(--ad-card);
          border: 2px solid var(--ad-border);
          border-radius: var(--ad-radius);
          padding: 28px 22px;
          text-align: center;
          position: relative;
          transition: transform .2s;
        }
        .ad-package:hover { transform: translateY(-3px); }
        .ad-package.popular {
          border-color: var(--ad-brand);
          box-shadow: 0 0 0 1px var(--ad-brand), var(--ad-shadow-lg);
          transform: scale(1.02);
        }
        .ad-package.popular:hover { transform: scale(1.02) translateY(-3px); }
        .ad-package-tag {
          display: inline-block;
          font-size: .72rem; font-weight: 600;
          padding: 3px 12px;
          border-radius: 100px;
          margin-bottom: 14px;
          background: var(--ad-surface);
          color: var(--ad-text-secondary);
        }
        .ad-package.popular .ad-package-tag {
          background: var(--ad-accent);
          color: #fff;
        }
        .ad-package-name { font-size: 1.2rem; font-weight: 800; margin: 0 0 12px; }
        .ad-package-price-row {
          margin: 0 0 18px;
        }
        .ad-package-price {
          font-size: 1.8rem; font-weight: 800;
          color: var(--ad-accent);
        }
        .ad-package-unit {
          font-size: .85rem; color: var(--ad-text-secondary); font-weight: 500;
        }
        .ad-package-features { list-style: none; padding: 0; margin: 0 0 20px; text-align: left; }
        .ad-package-features li {
          padding: 7px 0;
          font-size: .87rem;
          border-bottom: 1px solid var(--ad-surface);
          display: flex; align-items: center; gap: 8px;
        }
        .ad-package-features li svg { color: var(--ad-green); flex-shrink: 0; }
        .ad-package-cta {
          display: inline-block; width: 100%;
          padding: 11px 0;
          border-radius: 8px;
          font-weight: 700; font-size: .92rem;
          text-align: center;
          border: none; cursor: pointer;
          transition: opacity .2s;
          background: var(--ad-surface);
          color: var(--ad-brand-dark);
        }
        .ad-package-cta:hover { opacity: .85; }
        .ad-package.popular .ad-package-cta {
          background: var(--ad-gradient);
          color: #fff;
        }

        /* ── pkg help ── */
        .ad-pkg-help {
          text-align: center; margin-top: 36px;
          padding: 28px 24px;
          background: var(--ad-card);
          border: 1px solid var(--ad-border);
          border-radius: var(--ad-radius);
        }
        .ad-pkg-help h4 { margin: 0 0 6px; font-size: 1rem; }
        .ad-pkg-help p { margin: 0 0 16px; font-size: .88rem; color: var(--ad-text-secondary); }
        .ad-pkg-help-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--ad-accent); color: #fff;
          padding: 10px 28px; border-radius: 100px;
          font-weight: 700; font-size: .9rem;
          border: none; cursor: pointer;
          transition: transform .2s;
        }
        .ad-pkg-help-btn:hover { transform: translateY(-1px); }

        /* ── example cases ── */
        .ad-cases { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .ad-case {
          background: var(--ad-card);
          border: 1px solid var(--ad-border);
          border-radius: var(--ad-radius);
          padding: 22px 20px;
        }
        .ad-case-tag {
          display: inline-block;
          font-size: .72rem; font-weight: 600;
          padding: 2px 10px; border-radius: 4px;
          background: var(--ad-brand-light);
          color: var(--ad-brand);
          margin-bottom: 10px;
        }
        .ad-case-name { font-weight: 700; margin: 0 0 8px; font-size: .95rem; }
        .ad-case-desc { font-size: .85rem; color: var(--ad-text-secondary); line-height: 1.6; margin: 0; }

        /* ── FAQ ── */
        .ad-faqs { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
        .ad-faq {
          background: var(--ad-card);
          border: 1px solid var(--ad-border);
          border-radius: var(--ad-radius);
          overflow: hidden;
        }
        .ad-faq summary {
          padding: 16px 20px;
          font-weight: 600; font-size: .95rem;
          cursor: pointer;
          list-style: none;
          display: flex; justify-content: space-between; align-items: center;
        }
        .ad-faq summary::-webkit-details-marker { display: none; }
        .ad-faq summary::after { content: '+'; font-size: 1.2rem; color: var(--ad-brand); font-weight: 300; }
        .ad-faq[open] summary::after { content: '−'; }
        .ad-faq-answer {
          padding: 0 20px 16px;
          font-size: .88rem; color: var(--ad-text-secondary); line-height: 1.7;
        }

        /* ── CTA bottom ── */
        .ad-cta-bottom {
          background: var(--ad-gradient);
          padding: 56px 24px;
          text-align: center;
          color: #fff;
        }
        .ad-cta-bottom h2 { font-size: 1.7rem; font-weight: 800; margin: 0 0 10px; }
        .ad-cta-bottom p { font-size: .95rem; opacity: .9; margin: 0 0 28px; line-height: 1.7; }
        .ad-cta-contacts {
          display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .ad-cta-contact {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,.12);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.18);
          padding: 10px 20px;
          border-radius: 10px;
          font-size: .92rem; font-weight: 600;
        }
        .ad-cta-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--ad-accent);
          color: #fff;
          font-size: 1.05rem; font-weight: 700;
          padding: 14px 40px;
          border-radius: 100px;
          border: none; cursor: pointer;
          box-shadow: 0 4px 16px rgba(255,106,61,.3);
          transition: transform .2s;
        }
        .ad-cta-btn:hover { transform: translateY(-2px); }

        /* ── trust bar ── */
        .ad-trust {
          background: var(--ad-card);
          border-top: 1px solid var(--ad-border);
          padding: 24px;
          text-align: center;
        }
        .ad-trust-items { display: flex; gap: 28px; justify-content: center; flex-wrap: wrap; }
        .ad-trust-item { font-size: .82rem; color: var(--ad-text-secondary); display: flex; align-items: center; gap: 5px; }
        .ad-trust-item svg { color: var(--ad-green); }

        /* ── contact modal ── */
        .ad-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,.45);
          z-index: 9999; display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .ad-modal {
          background: #fff; border-radius: 16px; padding: 28px 24px;
          max-width: 380px; width: 100%; position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,.2);
        }
        .ad-modal-close {
          position: absolute; top: 12px; right: 12px;
          background: none; border: none; cursor: pointer;
          color: var(--ad-text-secondary); padding: 4px;
        }
        .ad-modal h3 { margin: 0 0 20px; font-size: 1.1rem; text-align: center; }
        .ad-modal-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid var(--ad-border);
        }
        .ad-modal-row:last-of-type { border-bottom: none; }
        .ad-modal-label { font-size: .85rem; color: var(--ad-text-secondary); display: flex; align-items: center; gap: 6px; }
        .ad-modal-val { font-weight: 700; font-size: .95rem; }
        .ad-modal-actions { display: flex; gap: 10px; margin-top: 20px; }
        .ad-modal-actions a, .ad-modal-actions button {
          flex: 1; padding: 11px 0; border-radius: 10px;
          font-weight: 700; font-size: .9rem; text-align: center;
          text-decoration: none; border: none; cursor: pointer;
        }
        .ad-modal-call { background: var(--ad-brand); color: #fff; }
        .ad-modal-copy { background: var(--ad-surface); color: var(--ad-text); display: flex; align-items: center; justify-content: center; gap: 4px; }

        /* ── mobile fixed CTA ── */
        .ad-mobile-cta {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0;
          z-index: 999;
          background: #fff;
          border-top: 1px solid var(--ad-border);
          padding: 10px 16px;
          padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
          align-items: center; justify-content: space-between;
          box-shadow: 0 -2px 12px rgba(0,0,0,.06);
        }
        .ad-mobile-cta-text h4 { margin: 0; font-size: .9rem; }
        .ad-mobile-cta-text p { margin: 0; font-size: .72rem; color: var(--ad-text-secondary); }
        .ad-mobile-cta-btn {
          background: var(--ad-accent); color: #fff;
          padding: 10px 22px; border-radius: 100px;
          font-weight: 700; font-size: .88rem;
          border: none; cursor: pointer;
          white-space: nowrap;
        }

        /* ── mobile ── */
        @media (max-width: 768px) {
          .ad-hero { padding: 52px 16px 48px; }
          .ad-hero h1 { font-size: 1.55rem; }
          .ad-hero-sub { font-size: .9rem; }
          .ad-hero-primary { padding: 11px 28px; font-size: .92rem; }
          .ad-hero-secondary { padding: 10px 20px; font-size: .85rem; }
          .ad-shell { padding: 0 16px; }
          .ad-section { padding: 48px 0; }

          .ad-caps { grid-template-columns: repeat(2, 1fr); margin-top: -24px; }
          .ad-cap { padding: 18px 12px; }
          .ad-cap:nth-child(2) { border-right: none; }
          .ad-cap:nth-child(1), .ad-cap:nth-child(2) { border-bottom: 1px solid var(--ad-border); }

          .ad-placements { grid-template-columns: 1fr; }
          .ad-advantages { grid-template-columns: 1fr; }
          .ad-audience-grid { grid-template-columns: 1fr; gap: 24px; }
          .ad-industries { grid-template-columns: repeat(2, 1fr); }
          .ad-process { grid-template-columns: 1fr; }
          .ad-process-step::after { display: none; }
          .ad-packages { grid-template-columns: 1fr; }
          .ad-package.popular { transform: none; }
          .ad-package.popular:hover { transform: translateY(-3px); }
          .ad-cases { grid-template-columns: 1fr; }
          .ad-cta-contacts { flex-direction: column; align-items: center; }
          .ad-section-title { font-size: 1.3rem; }
          .ad-section-desc { font-size: .88rem; margin-bottom: 28px; }
          .ad-trust-items { gap: 14px; }

          .ad-mobile-cta { display: flex; }
          .ad-page { padding-bottom: 70px; }
        }

        @media (max-width: 480px) {
          .ad-hero h1 { font-size: 1.35rem; }
          .ad-hero-badges { gap: 6px; }
          .ad-hero-badge { font-size: .78rem; padding: 4px 12px; }
          .ad-industries { gap: 8px; }
        }
      `}</style>

      <div className="ad-page">
        {/* ▸ Hero */}
        <section className="ad-hero">
          <div className="ad-hero-inner">
            <div className="ad-hero-badges">
              <span className="ad-hero-badge"><MapPin size={14} /> 专注杨林本地</span>
              <span className="ad-hero-badge"><Briefcase size={14} /> 招聘 · 房产 · 商家多场景</span>
              <span className="ad-hero-badge"><Monitor size={14} /> PC + 手机端覆盖</span>
            </div>
            <h1>
              让更多杨林人<br />
              <span className="accent">看到你的生意</span>
            </h1>
            <p className="ad-hero-sub">
              覆盖杨林镇、杨林大学城、杨林经开区及周边本地用户，<br />
              让招聘、门店、房源和本地服务获得更多曝光。
            </p>
            <div className="ad-hero-btns">
              <button className="ad-hero-primary" onClick={() => setShowContact(true)}>
                <Phone size={18} /> 立即咨询投放
              </button>
              <a href="#placements" className="ad-hero-secondary">
                查看广告位 <ChevronRight size={16} />
              </a>
            </div>
            <p className="ad-hero-hint">电话 / 微信咨询 · 快速给出适合你的投放方案</p>
          </div>
        </section>

        {/* ▸ Capability strip */}
        <section className="ad-shell">
          <div className="ad-caps">
            {CAPABILITIES.map((c) => (
              <div key={c.label} className="ad-cap">
                <div className="ad-cap-icon"><c.icon size={28} /></div>
                <div className="ad-cap-label">{c.label}</div>
                <div className="ad-cap-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ▸ Why choose us */}
        <section className="ad-section">
          <div className="ad-shell">
            <h2 className="ad-section-title">为什么选择杨林生活网投放广告？</h2>
            <p className="ad-section-desc">
              深耕杨林本地市场，让每一分广告预算都花在本地目标人群上
            </p>
            <div className="ad-advantages">
              {ADVANTAGES.map((a) => (
                <div key={a.title} className="ad-advantage">
                  <div className="ad-advantage-icon"><a.icon size={20} /></div>
                  <h3 className="ad-advantage-title">{a.title}</h3>
                  <p className="ad-advantage-desc">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ▸ Ad Placements */}
        <section className="ad-section ad-section-alt" id="placements">
          <div className="ad-shell">
            <h2 className="ad-section-title">广告位一览</h2>
            <p className="ad-section-desc">
              让更多人看到你的店、让招聘信息更靠前、让房源更快被发现
            </p>
            <div className="ad-placements">
              {AD_PLACEMENTS.map((p) => {
                const MockupComp = MOCKUP_MAP[p.mockupType];
                return (
                  <div
                    key={p.key}
                    className={`ad-placement-card${p.highlight ? " highlight" : ""}`}
                  >
                    <div className="ad-placement-mockup">
                      {p.highlight && <span className="ad-placement-badge">热门</span>}
                      {MockupComp && <MockupComp />}
                    </div>
                    <div className="ad-placement-body">
                      <div className="ad-placement-head">
                        <p.icon size={18} />
                        <h3 className="ad-placement-name">{p.name}</h3>
                      </div>
                      <p className="ad-placement-desc">{p.desc}</p>
                      <div className="ad-placement-tags">
                        {p.tags.map((t) => (
                          <span key={t} className="ad-placement-tag">{t}</span>
                        ))}
                        <span className="ad-placement-tag">{p.size}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ▸ Audience */}
        <section className="ad-section">
          <div className="ad-shell">
            <h2 className="ad-section-title">你的广告会被这些人看到</h2>
            <p className="ad-section-desc">
              杨林生活网汇聚杨林镇及周边最活跃的本地用户群体
            </p>
            <div className="ad-audience-grid">
              <div className="ad-audience-cards">
                {AUDIENCE_GROUPS.map((g) => (
                  <div key={g.label} className="ad-audience-card">
                    <div className="ad-audience-card-icon"><g.icon size={18} /></div>
                    <span className="ad-audience-card-label">{g.label}</span>
                  </div>
                ))}
              </div>
              <div className="ad-audience-right">
                <h3>典型使用场景</h3>
                <p>用户来到杨林生活网，主要是为了解决这些本地生活需求：</p>
                <div className="ad-scene-tags">
                  {AUDIENCE_SCENES.map((s) => (
                    <span key={s} className="ad-scene-tag">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ▸ Industries */}
        <section className="ad-section ad-section-alt">
          <div className="ad-shell">
            <h2 className="ad-section-title">适合哪些行业投放？</h2>
            <p className="ad-section-desc">
              无论餐饮、房产还是教育培训，总有适合您的广告方案
            </p>
            <div className="ad-industries">
              {INDUSTRIES.map((ind) => (
                <div key={ind.name} className="ad-industry">
                  <div className="ad-industry-icon"><ind.icon size={26} /></div>
                  <h3 className="ad-industry-name">{ind.name}</h3>
                  <p className="ad-industry-ex">{ind.examples}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ▸ Process */}
        <section className="ad-section">
          <div className="ad-shell">
            <h2 className="ad-section-title">投放流程</h2>
            <p className="ad-section-desc">
              从咨询到上线，简单四步
            </p>
            <div className="ad-process">
              {PROCESS_STEPS.map((s) => (
                <div key={s.step} className="ad-process-step">
                  <div className="ad-process-num">{s.step}</div>
                  <div className="ad-process-icon"><s.icon size={22} /></div>
                  <h3 className="ad-process-title">{s.title}</h3>
                  <p className="ad-process-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ▸ Pricing */}
        <section className="ad-section ad-section-alt">
          <div className="ad-shell">
            <h2 className="ad-section-title">投放套餐</h2>
            <p className="ad-section-desc">
              灵活选择，丰俭由人。所有套餐均含免费素材协助
            </p>
            <div className="ad-packages">
              {PACKAGES.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`ad-package${pkg.popular ? " popular" : ""}`}
                >
                  <span className="ad-package-tag">{pkg.tag}</span>
                  <h3 className="ad-package-name">{pkg.name}</h3>
                  <div className="ad-package-price-row">
                    <span className="ad-package-price">{pkg.price}</span>
                    <span className="ad-package-unit"> {pkg.unit}</span>
                  </div>
                  <ul className="ad-package-features">
                    {pkg.features.map((f) => (
                      <li key={f}><Check size={15} /> {f}</li>
                    ))}
                  </ul>
                  <button className="ad-package-cta" onClick={() => setShowContact(true)}>
                    立即咨询
                  </button>
                </div>
              ))}
            </div>

            <div className="ad-pkg-help">
              <h4>不知道选哪个？</h4>
              <p>告诉我们你的行业、预算和推广目标，我们帮你搭配更合适的广告方案。</p>
              <button className="ad-pkg-help-btn" onClick={() => setShowContact(true)}>
                <MessageCircle size={16} /> 免费咨询方案
              </button>
            </div>
          </div>
        </section>

        {/* ▸ Example Cases */}
        <section className="ad-section">
          <div className="ad-shell">
            <h2 className="ad-section-title">投放示例</h2>
            <p className="ad-section-desc">
              首批合作商家案例将陆续展示，以下为典型投放方案参考
            </p>
            <div className="ad-cases">
              {EXAMPLE_CASES.map((c) => (
                <div key={c.industry} className="ad-case">
                  <span className="ad-case-tag">{c.tag}</span>
                  <h3 className="ad-case-name">{c.industry}</h3>
                  <p className="ad-case-desc">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ▸ FAQ */}
        <section className="ad-section ad-section-alt">
          <div className="ad-shell">
            <h2 className="ad-section-title">常见问题</h2>
            <p className="ad-section-desc">
              关于广告投放，您可能想了解的
            </p>
            <div className="ad-faqs">
              {FAQS.map((faq) => (
                <details key={faq.q} className="ad-faq">
                  <summary>{faq.q}</summary>
                  <div className="ad-faq-answer">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ▸ Bottom CTA */}
        <section className="ad-cta-bottom">
          <div className="ad-shell">
            <h2>准备让更多杨林人看到你的生意了吗？</h2>
            <p>
              告诉我们你的行业和推广需求，<br />
              我们帮你推荐适合的广告位置。
            </p>
            <div className="ad-cta-contacts">
              <div className="ad-cta-contact">
                <Phone size={16} /> 电话：<strong>136****4207</strong>
              </div>
              <div className="ad-cta-contact">
                <MessageCircle size={16} /> 微信：<strong>同手机号</strong>
              </div>
              <div className="ad-cta-contact">
                <Mail size={16} /> 邮箱：<strong>{EMAIL}</strong>
              </div>
            </div>
            <button className="ad-cta-btn" onClick={() => setShowContact(true)}>
              <Phone size={18} /> 立即咨询投放
            </button>
          </div>
        </section>

        {/* ▸ Trust bar */}
        <div className="ad-trust">
          <div className="ad-trust-items">
            <span className="ad-trust-item"><Building2 size={14} /> 杨林生活网信息服务中心</span>
            <span className="ad-trust-item"><BadgeCheck size={14} /> 滇ICP备2022000102号-4</span>
            <span className="ad-trust-item"><BadgeCheck size={14} /> 正规企业 · 可开发票</span>
          </div>
        </div>

        {/* ▸ Mobile fixed CTA */}
        <div className="ad-mobile-cta">
          <div className="ad-mobile-cta-text">
            <h4>广告合作</h4>
            <p>本地商家推广</p>
          </div>
          <button className="ad-mobile-cta-btn" onClick={() => setShowContact(true)}>
            立即咨询
          </button>
        </div>

        {/* ▸ Contact Modal */}
        {showContact && (
          <div className="ad-modal-overlay" onClick={() => setShowContact(false)}>
            <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
              <button className="ad-modal-close" onClick={() => setShowContact(false)}>
                <X size={20} />
              </button>
              <h3>广告投放咨询</h3>
              <div className="ad-modal-row">
                <span className="ad-modal-label"><Phone size={15} /> 电话</span>
                <span className="ad-modal-val">{PHONE}</span>
              </div>
              <div className="ad-modal-row">
                <span className="ad-modal-label"><MessageCircle size={15} /> 微信</span>
                <span className="ad-modal-val">{WECHAT}</span>
              </div>
              <div className="ad-modal-row">
                <span className="ad-modal-label"><Mail size={15} /> 邮箱</span>
                <span className="ad-modal-val">{EMAIL}</span>
              </div>
              <div className="ad-modal-actions">
                <a href={`tel:${PHONE}`} className="ad-modal-call">
                  拨打电话
                </a>
                <button className="ad-modal-copy" onClick={() => handleCopy(WECHAT)}>
                  {copied ? <><Check size={14} /> 已复制</> : <><Copy size={14} /> 复制微信号</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
