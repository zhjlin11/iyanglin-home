"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

/* ══════════════════════════════════════════════
   路由集中配置 —— 所有链接来自项目真实路由
   ══════════════════════════════════════════════ */
const LINKS = {
  jobs: "/jobs",
  house: "/house",
  info: "/info",
  haodian: "/haodian",
  publish: "/publish",
  profile: "/profile",
  contact: "/contact",
  advertising: "/advertising",
  bianmin: "/bianmin",
  active: "/active",
  categories: "/categories",
  love: "/love",
  community: "/community",
  login: "/login",
  jobsNew: "/jobs/new",
  houseNew: "/house/new",
  infoNew: "/info/new",
};

/* ── 6大功能入口 ── */
const QUICK_ENTRIES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    title: "找工作",
    desc: "查看杨林最新招聘",
    href: "/jobs",
    color: "#3270FF",
    bg: "#EFF6FF",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: "找房子",
    desc: "出租房、二手房、商铺",
    href: "/house",
    color: "#FF8A00",
    bg: "#FFF7ED",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    title: "买卖二手",
    desc: "本地闲置交易",
    href: "/info",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v18H3z" /><path d="M21 9H3"/><path d="M21 15H3"/><path d="M12 3v18"/>
      </svg>
    ),
    title: "找本地商家",
    desc: "餐饮、维修、生活服务",
    href: "/haodian",
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
    ),
    title: "发布信息",
    desc: "招聘、房产、二手等",
    href: "/publish",
    color: "#16A67A",
    bg: "#EAF8F3",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    title: "我的信息",
    desc: "管理发布和收藏",
    href: "/profile",
    color: "#0D9488",
    bg: "#F0FDFA",
  },
];

/* ── 新用户4件事 ── */
const FOUR_THINGS = [
  {
    num: "1",
    title: "找工作",
    steps: ["打开首页", "点击「招聘」", "选择岗位", "联系招聘方"],
    desc: "查看杨林镇、大学城、经开区招聘信息。",
    btn: "去找工作",
    href: "/jobs",
    color: "#3270FF",
  },
  {
    num: "2",
    title: "找房子",
    steps: ["打开首页", "点击「房产」", "筛选区域/租金", "联系房东"],
    desc: "出租房、二手房、商铺，一键筛选。",
    btn: "去找房子",
    href: "/house",
    color: "#FF8A00",
  },
  {
    num: "3",
    title: "发布信息",
    steps: ["点击「发布」", "选择分类", "填写信息", "提交审核"],
    desc: "招聘、房产、二手等信息均可免费发布。",
    btn: "立即发布",
    href: "/publish",
    color: "#16A67A",
  },
  {
    num: "4",
    title: "管理信息",
    steps: ["点击「我的」", "查看我的发布", "编辑 / 下架", "删除信息"],
    desc: "在个人中心查看和管理已发布的内容。",
    btn: "查看我的发布",
    href: "/profile",
    color: "#0D9488",
  },
];

/* ── 发布教程可发布类型 ── */
const PUBLISH_TYPES = [
  { label: "招聘", color: "#3270FF" },
  { label: "房产", color: "#FF8A00" },
  { label: "二手", color: "#7C3AED" },
  { label: "商家", color: "#F59E0B" },
  { label: "活动", color: "#EA580C" },
  { label: "其他", color: "#6B7280" },
];

/* ── 微信关键词 ── */
const WECHAT_KEYWORDS = [
  { keyword: "招聘", reply: "查看杨林最新岗位", icon: "💼", href: "/jobs" },
  { keyword: "房产", reply: "查看杨林最新房源", icon: "🏠", href: "/house" },
  { keyword: "发布", reply: "点击进入发布信息", icon: "✍️", href: "/publish" },
];

const ALL_KEYWORDS = [
  { word: "招聘", href: "/jobs" },
  { word: "房产", href: "/house" },
  { word: "二手", href: "/info" },
  { word: "商家", href: "/haodian" },
  { word: "活动", href: "/active" },
  { word: "发布", href: "/publish" },
  { word: "广告", href: "/advertising" },
  { word: "客服", href: "/contact" },
];

/* ── 底部菜单 ── */
const WECHAT_MENUS = [
  {
    title: "找信息",
    items: [
      { label: "求职招聘", href: "/jobs" },
      { label: "房产楼市", href: "/house" },
      { label: "好店推荐", href: "/haodian" },
      { label: "相亲交友", href: "/love" },
      { label: "便民电话", href: "/bianmin" },
    ],
  },
  {
    title: "发布·服务",
    items: [
      { label: "发布信息", href: "/publish" },
      { label: "本地资讯", href: "/info" },
      { label: "同城活动", href: "/active" },
      { label: "广告投放", href: "/advertising" },
    ],
  },
  {
    title: "我的",
    items: [
      { label: "个人中心", href: "/profile" },
      { label: "注册登录", href: "/login" },
      { label: "联系客服", href: "/contact" },
    ],
  },
];

/* ── FAQ ── */
const FAQ_LIST = [
  {
    q: "发布信息收费吗？",
    a: "基础信息发布免费。如需置顶推广或广告展示，可联系客服了解推广方案。",
  },
  {
    q: "为什么发布后没有马上显示？",
    a: "新发布的信息需要审核，通常会在几小时内完成。审核通过后会自动上架显示。",
  },
  {
    q: "发布的信息可以修改吗？",
    a: "可以。进入「我的」→「我的发布」，找到对应信息点击编辑即可修改。",
  },
  {
    q: "如何删除自己的信息？",
    a: "进入「我的」→「我的发布」，找到对应信息点击删除或下架即可。",
  },
  {
    q: "怎么联系客服？",
    a: "可以拨打客服电话 13619694207，或者通过微信添加同号好友咨询。也可以访问联系客服页面获取更多方式。",
  },
  {
    q: "怎么推广自己的店？",
    a: "杨林生活网提供多种推广方式，包括首页广告位、分类置顶、商家推荐等。详情请查看广告合作页面。",
  },
  {
    q: "招聘信息怎么发布？",
    a: "点击底部「发布」按钮，选择「招聘」分类，填写职位名称、薪资待遇、工作地点等信息，提交审核即可。",
  },
  {
    q: "房源怎么发布？",
    a: "点击底部「发布」按钮，选择「房产」分类，填写房屋类型、面积、租金/售价等信息，提交审核即可。",
  },
];

/* ══════════════════════════════════════════════
   样式
   ══════════════════════════════════════════════ */
const styles = `
  .gd-page { background: var(--surface); min-height: 100vh; }

  /* ── Hero ── */
  .gd-hero {
    background: linear-gradient(135deg, #16A67A 0%, #0D9488 100%);
    color: #fff;
    padding: 48px 16px 40px;
    text-align: center;
  }
  .gd-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.2); backdrop-filter: blur(8px);
    padding: 6px 16px; border-radius: 20px;
    font-size: 13px; font-weight: 600; margin-bottom: 16px;
  }
  .gd-hero h1 {
    font-size: 28px; font-weight: 800; margin: 0 0 12px; line-height: 1.3;
  }
  .gd-hero p {
    font-size: 15px; line-height: 1.6; margin: 0 auto;
    max-width: 400px; opacity: 0.92;
  }
  .gd-hero-question {
    margin-top: 28px; font-size: 16px; font-weight: 700; opacity: 0.95;
  }

  /* ── Section 通用 ── */
  .gd-section {
    padding: 40px 16px;
    max-width: 1200px; margin: 0 auto;
  }
  .gd-section-alt { background: #fff; }
  .gd-section-title {
    font-size: 22px; font-weight: 800; color: var(--ink);
    text-align: center; margin: 0 0 8px;
  }
  .gd-section-sub {
    font-size: 14px; color: var(--muted); text-align: center;
    margin: 0 0 28px;
  }

  /* ── 6大功能入口 ── */
  .gd-entries {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 12px; max-width: 600px; margin: 0 auto;
  }
  .gd-entry {
    display: flex; align-items: center; gap: 14px;
    background: var(--surface-card); border: 1px solid var(--line);
    border-radius: var(--radius-md); padding: 16px;
    text-decoration: none; transition: all 0.2s ease;
  }
  .gd-entry:active { transform: scale(0.97); }
  .gd-entry-icon {
    width: 52px; height: 52px; border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .gd-entry-text h3 { font-size: 15px; font-weight: 700; margin: 0 0 2px; color: var(--ink); }
  .gd-entry-text p { font-size: 12px; color: var(--muted); margin: 0; }

  /* ── 4件事 ── */
  .gd-things {
    display: grid; grid-template-columns: 1fr;
    gap: 16px; max-width: 800px; margin: 0 auto;
  }
  .gd-thing-card {
    background: var(--surface-card); border: 1px solid var(--line);
    border-radius: var(--radius-lg); padding: 20px; position: relative;
    overflow: hidden;
  }
  .gd-thing-num {
    position: absolute; top: -8px; right: -4px;
    font-size: 72px; font-weight: 900; opacity: 0.05;
    line-height: 1; pointer-events: none;
  }
  .gd-thing-title {
    font-size: 17px; font-weight: 700; margin: 0 0 10px;
    color: var(--ink);
  }
  .gd-thing-steps {
    display: flex; align-items: center; gap: 4px;
    flex-wrap: wrap; margin-bottom: 10px;
  }
  .gd-thing-step {
    font-size: 13px; color: var(--ink-secondary);
    background: var(--surface); padding: 4px 10px;
    border-radius: 6px; white-space: nowrap;
  }
  .gd-thing-arrow { font-size: 12px; color: var(--muted-light); }
  .gd-thing-desc { font-size: 13px; color: var(--muted); margin: 0 0 14px; }
  .gd-thing-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 20px; border-radius: var(--radius-full);
    font-size: 14px; font-weight: 600; color: #fff;
    text-decoration: none; border: none; cursor: pointer;
    transition: opacity 0.2s;
  }
  .gd-thing-btn:active { opacity: 0.85; }

  /* ── 发布教程 ── */
  .gd-publish-steps {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 12px; max-width: 600px; margin: 0 auto 24px;
  }
  .gd-pub-step {
    text-align: center; position: relative;
  }
  .gd-pub-step-icon {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--brand-light); color: var(--brand);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 8px; font-size: 24px; font-weight: 700;
  }
  .gd-pub-step-label { font-size: 13px; font-weight: 600; color: var(--ink); }
  .gd-pub-step-arrow {
    position: absolute; top: 28px; right: -12px;
    color: var(--muted-light); font-size: 14px;
  }
  .gd-pub-types {
    display: flex; flex-wrap: wrap; gap: 8px;
    justify-content: center; margin-bottom: 24px;
  }
  .gd-pub-tag {
    padding: 6px 16px; border-radius: var(--radius-full);
    font-size: 13px; font-weight: 600; border: none;
  }
  .gd-pub-cta {
    display: flex; justify-content: center;
  }
  .gd-pub-cta a {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--brand); color: #fff;
    padding: 14px 32px; border-radius: var(--radius-full);
    font-size: 16px; font-weight: 700;
    text-decoration: none; transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(22, 166, 122, 0.3);
  }
  .gd-pub-cta a:active { transform: scale(0.97); }

  /* ── 微信关键词 ── */
  .gd-wechat-section {
    max-width: 800px; margin: 0 auto;
  }
  .gd-wechat-chat {
    max-width: 400px; margin: 0 auto 24px;
    background: #EDEDED; border-radius: var(--radius-lg);
    padding: 20px 16px; display: flex; flex-direction: column; gap: 16px;
  }
  .gd-chat-user {
    display: flex; justify-content: flex-end; gap: 8px;
  }
  .gd-chat-user-bubble {
    background: #95EC69; color: #000; padding: 10px 14px;
    border-radius: 14px 4px 14px 14px; font-size: 15px; font-weight: 600;
    max-width: 200px;
  }
  .gd-chat-user-avatar {
    width: 36px; height: 36px; border-radius: 6px;
    background: #ccc; display: flex; align-items: center;
    justify-content: center; font-size: 18px; flex-shrink: 0;
  }
  .gd-chat-bot {
    display: flex; gap: 8px;
  }
  .gd-chat-bot-avatar {
    width: 36px; height: 36px; border-radius: 6px;
    background: var(--brand); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 800; flex-shrink: 0;
  }
  .gd-chat-bot-bubble {
    background: #fff; padding: 10px 14px;
    border-radius: 4px 14px 14px 14px; font-size: 14px;
    max-width: 240px; color: var(--ink);
  }
  .gd-chat-bot-bubble a {
    display: inline-block; margin-top: 6px; color: var(--brand);
    font-weight: 600; text-decoration: none;
  }
  .gd-keywords-list {
    display: flex; flex-wrap: wrap; gap: 8px;
    justify-content: center; margin-top: 8px;
  }
  .gd-keyword-chip {
    padding: 6px 14px; border-radius: var(--radius-full);
    background: var(--surface); border: 1px solid var(--line);
    font-size: 13px; font-weight: 600; color: var(--ink-secondary);
    text-decoration: none; transition: all 0.2s;
  }
  .gd-keyword-chip:active { background: var(--brand-light); color: var(--brand); border-color: var(--brand); }

  /* ── 底部菜单说明 ── */
  .gd-menu-cards {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 12px; max-width: 700px; margin: 0 auto;
  }
  .gd-menu-card {
    background: var(--surface-card); border: 1px solid var(--line);
    border-radius: var(--radius-md); padding: 16px; text-align: center;
  }
  .gd-menu-card h4 {
    font-size: 15px; font-weight: 700; color: var(--brand);
    margin: 0 0 10px; padding-bottom: 8px;
    border-bottom: 2px solid var(--brand-light);
  }
  .gd-menu-card ul {
    list-style: none; margin: 0; padding: 0;
    display: flex; flex-direction: column; gap: 6px;
  }
  .gd-menu-card li a {
    font-size: 13px; color: var(--ink-secondary);
    text-decoration: none; display: block; padding: 4px 0;
    transition: color 0.2s;
  }
  .gd-menu-card li a:active { color: var(--brand); }

  /* ── FAQ ── */
  .gd-faq-list {
    max-width: 700px; margin: 0 auto;
    display: flex; flex-direction: column; gap: 0;
  }
  .gd-faq-item {
    border-bottom: 1px solid var(--line);
  }
  .gd-faq-q {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 0; cursor: pointer; background: none; border: none;
    width: 100%; text-align: left; font-size: 15px; font-weight: 600;
    color: var(--ink); gap: 12px;
  }
  .gd-faq-q:active { color: var(--brand); }
  .gd-faq-arrow {
    font-size: 18px; color: var(--muted-light);
    transition: transform 0.2s; flex-shrink: 0;
  }
  .gd-faq-arrow.open { transform: rotate(180deg); }
  .gd-faq-a {
    font-size: 14px; color: var(--muted); line-height: 1.7;
    padding: 0 0 16px; margin: 0;
  }

  /* ── 广告引导 ── */
  .gd-ad-card {
    max-width: 600px; margin: 0 auto;
    background: linear-gradient(135deg, #FEF3C7 0%, #FFF7ED 100%);
    border: 1px solid #FDE68A; border-radius: var(--radius-lg);
    padding: 24px; text-align: center;
  }
  .gd-ad-card h3 {
    font-size: 17px; font-weight: 700; color: var(--ink);
    margin: 0 0 8px;
  }
  .gd-ad-card p {
    font-size: 14px; color: var(--muted); margin: 0 0 16px;
  }
  .gd-ad-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: #F59E0B; color: #fff;
    padding: 10px 24px; border-radius: var(--radius-full);
    font-size: 14px; font-weight: 600; text-decoration: none;
    transition: opacity 0.2s;
  }
  .gd-ad-btn:active { opacity: 0.85; }

  /* ── 联系客服卡 ── */
  .gd-contact-card {
    max-width: 600px; margin: 0 auto;
    background: var(--surface-card); border: 1px solid var(--line);
    border-radius: var(--radius-lg); padding: 24px; text-align: center;
  }
  .gd-contact-card h3 {
    font-size: 17px; font-weight: 700; color: var(--ink);
    margin: 0 0 8px;
  }
  .gd-contact-card p {
    font-size: 14px; color: var(--muted); margin: 0 0 16px;
  }

  /* ── 最终 CTA ── */
  .gd-final-cta {
    background: linear-gradient(135deg, #16A67A 0%, #087A5B 100%);
    color: #fff; padding: 48px 16px; text-align: center;
  }
  .gd-final-cta h2 {
    font-size: 24px; font-weight: 800; margin: 0 0 24px;
  }
  .gd-final-btns {
    display: flex; flex-wrap: wrap; gap: 12px;
    justify-content: center; margin-bottom: 24px;
  }
  .gd-final-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.3);
    color: #fff; padding: 12px 24px;
    border-radius: var(--radius-full);
    font-size: 15px; font-weight: 600;
    text-decoration: none; transition: all 0.2s;
  }
  .gd-final-btn:active { background: rgba(255,255,255,0.35); }
  .gd-final-sub {
    font-size: 14px; opacity: 0.85; margin-bottom: 8px;
  }
  .gd-final-contact {
    color: #fff; text-decoration: underline;
    text-underline-offset: 3px; font-weight: 600; font-size: 15px;
  }

  /* ══ 响应式 ══ */
  @media (min-width: 768px) {
    .gd-hero { padding: 64px 24px 56px; }
    .gd-hero h1 { font-size: 36px; }
    .gd-hero p { font-size: 17px; }
    .gd-section { padding: 56px 24px; }
    .gd-section-title { font-size: 26px; }
    .gd-entries {
      grid-template-columns: repeat(3, 1fr);
      max-width: 800px; gap: 16px;
    }
    .gd-entry { padding: 20px; }
    .gd-entry-icon { width: 56px; height: 56px; }
    .gd-things {
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .gd-publish-steps { max-width: 500px; }
    .gd-wechat-layout {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 32px; align-items: start;
    }
    .gd-wechat-chat { margin: 0; }
    .gd-final-cta { padding: 64px 24px; }
    .gd-final-cta h2 { font-size: 30px; }
  }

  @media (min-width: 1024px) {
    .gd-entries { grid-template-columns: repeat(3, 1fr); max-width: 900px; }
    .gd-entry { padding: 22px 20px; }
    .gd-entry-text h3 { font-size: 16px; }
  }
`;

/* ══════════════════════════════════════════════
   FAQ Item 组件
   ══════════════════════════════════════════════ */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="gd-faq-item">
      <button className="gd-faq-q" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{q}</span>
        <span className={`gd-faq-arrow ${open ? "open" : ""}`}>▾</span>
      </button>
      {open && <p className="gd-faq-a">{a}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════
   主页面
   ══════════════════════════════════════════════ */
export default function GuidePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <Navbar />
      <main className="gd-page">

        {/* ── 1. Hero ── */}
        <section className="gd-hero">
          <div className="gd-hero-badge">📖 杨林生活网 · 新手指南</div>
          <h1>第一次来杨林生活网？</h1>
          <p>30秒学会找工作、找房子、买二手、找商家和发布信息。</p>
          <div className="gd-hero-question">👇 你想做什么？</div>
        </section>

        {/* ── 2. 6大功能入口 ── */}
        <section className="gd-section">
          <div className="gd-entries">
            {QUICK_ENTRIES.map((e) => (
              <Link key={e.title} href={e.href} className="gd-entry" aria-label={e.title}>
                <div className="gd-entry-icon" style={{ background: e.bg, color: e.color }}>
                  {e.icon}
                </div>
                <div className="gd-entry-text">
                  <h3>{e.title}</h3>
                  <p>{e.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 3. 新用户最常做的4件事 ── */}
        <section className="gd-section gd-section-alt">
          <h2 className="gd-section-title">第一次使用，可以先学这 4 件事</h2>
          <p className="gd-section-sub">简单几步，马上上手</p>
          <div className="gd-things">
            {FOUR_THINGS.map((t) => (
              <div key={t.num} className="gd-thing-card">
                <div className="gd-thing-num" style={{ color: t.color }}>{t.num}</div>
                <div className="gd-thing-title">{t.title}</div>
                <div className="gd-thing-steps">
                  {t.steps.map((s, i) => (
                    <span key={i}>
                      <span className="gd-thing-step">{s}</span>
                      {i < t.steps.length - 1 && <span className="gd-thing-arrow"> → </span>}
                    </span>
                  ))}
                </div>
                <p className="gd-thing-desc">{t.desc}</p>
                <Link href={t.href} className="gd-thing-btn" style={{ background: t.color }}>
                  {t.btn} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. 发布信息教程 ── */}
        <section className="gd-section">
          <h2 className="gd-section-title">怎么免费发布信息？</h2>
          <p className="gd-section-sub">几步就能完成，不需要复杂操作</p>
          <div className="gd-publish-steps">
            {[
              { num: "①", label: "点击发布" },
              { num: "②", label: "选择分类" },
              { num: "③", label: "填写信息" },
              { num: "④", label: "提交成功" },
            ].map((s, i) => (
              <div key={i} className="gd-pub-step">
                <div className="gd-pub-step-icon">{s.num}</div>
                <div className="gd-pub-step-label">{s.label}</div>
                {i < 3 && <span className="gd-pub-step-arrow">→</span>}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 12px" }}>可以发布：</p>
          </div>
          <div className="gd-pub-types">
            {PUBLISH_TYPES.map((t) => (
              <span key={t.label} className="gd-pub-tag" style={{ background: t.color + "14", color: t.color }}>
                {t.label}
              </span>
            ))}
          </div>
          <div className="gd-pub-cta">
            <Link href={LINKS.publish}>＋ 免费发布信息</Link>
          </div>
        </section>

        {/* ── 5. 微信公众号怎么用 ── */}
        <section className="gd-section gd-section-alt">
          <h2 className="gd-section-title">公众号里也可以直接使用</h2>
          <p className="gd-section-sub">关注杨林生活网后，直接回复关键词即可</p>
          <div className="gd-wechat-section">
            <div className="gd-wechat-layout">
              {/* 聊天模拟 */}
              <div className="gd-wechat-chat">
                {WECHAT_KEYWORDS.map((k) => (
                  <div key={k.keyword}>
                    <div className="gd-chat-user">
                      <div className="gd-chat-user-bubble">{k.keyword}</div>
                      <div className="gd-chat-user-avatar">👤</div>
                    </div>
                    <div className="gd-chat-bot">
                      <div className="gd-chat-bot-avatar">杨</div>
                      <div className="gd-chat-bot-bubble">
                        {k.icon} {k.reply}
                        <br />
                        <Link href={k.href}>点击查看 →</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* 关键词列表 */}
              <div>
                <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 14, textAlign: "center" }}>
                  你也可以回复这些关键词：
                </p>
                <div className="gd-keywords-list">
                  {ALL_KEYWORDS.map((k) => (
                    <Link key={k.word} href={k.href} className="gd-keyword-chip">
                      {k.word}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. 底部菜单说明 ── */}
        <section className="gd-section">
          <h2 className="gd-section-title">公众号底部菜单说明</h2>
          <p className="gd-section-sub">三个菜单栏，快速找到你要的功能</p>
          <div className="gd-menu-cards">
            {WECHAT_MENUS.map((m) => (
              <div key={m.title} className="gd-menu-card">
                <h4>{m.title}</h4>
                <ul>
                  {m.items.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href}>{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. 广告合作引导 ── */}
        <section className="gd-section gd-section-alt">
          <div className="gd-ad-card">
            <h3>💡 想让更多杨林人看到你的生意？</h3>
            <p>支持首页广告、招聘置顶、房产推广、商家推荐等。</p>
            <Link href={LINKS.advertising} className="gd-ad-btn">查看广告合作 →</Link>
          </div>
        </section>

        {/* ── 8. FAQ ── */}
        <section className="gd-section">
          <h2 className="gd-section-title">常见问题</h2>
          <p className="gd-section-sub">点击问题查看详细解答</p>
          <div className="gd-faq-list">
            {FAQ_LIST.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </section>

        {/* ── 9. 联系客服 ── */}
        <section className="gd-section gd-section-alt">
          <div className="gd-contact-card">
            <h3>🤝 遇到问题？</h3>
            <p>如果不会操作，可以直接联系我们。</p>
            <Link
              href={LINKS.contact}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "var(--brand)", color: "#fff",
                padding: "12px 28px", borderRadius: "var(--radius-full)",
                fontSize: 15, fontWeight: 600, textDecoration: "none",
              }}
            >
              联系客服 →
            </Link>
          </div>
        </section>

        {/* ── 10. 最终 CTA ── */}
        <section className="gd-final-cta">
          <h2>现在开始使用杨林生活网</h2>
          <div className="gd-final-btns">
            <Link href={LINKS.jobs} className="gd-final-btn">💼 找工作</Link>
            <Link href={LINKS.house} className="gd-final-btn">🏠 找房子</Link>
            <Link href={LINKS.publish} className="gd-final-btn">✏️ 发布信息</Link>
          </div>
          <p className="gd-final-sub">还有问题？</p>
          <Link href={LINKS.contact} className="gd-final-contact">联系客服 →</Link>
        </section>
      </main>
    </>
  );
}
