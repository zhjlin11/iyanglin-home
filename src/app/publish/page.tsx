"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

type PublishItem = {
  id: string;
  title: string;
  channelName: string;
  desc: string;
  icon: string;
  href: string;
  tag: string;
  color: string;
  bgGradient: string;
  subCategories: string[];
  isPrimary?: boolean;
};

export default function UnifiedPublishHubPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id?: string; username?: string; role?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        setAuthChecked(true);
      });
  }, []);

  const isAdmin = user && (user.role === "ADMIN" || user.role === "EDITOR");

  // 核心第一梯队：主要供求与便民频道 (第一排/重点入口)
  const primaryChannels: PublishItem[] = [
    {
      id: "info",
      title: "发布综合信息",
      channelName: "综合信息频道",
      desc: "二手闲置、拼车出行、维修家政、数码电脑、便民求助等同城分类信息",
      icon: "📋",
      href: "/info/new",
      tag: "便民高频",
      color: "#0B7A75",
      bgGradient: "linear-gradient(135deg, rgba(11, 122, 117, 0.08) 0%, rgba(11, 122, 117, 0.02) 100%)",
      subCategories: ["二手闲置", "同城拼车", "家政维修", "电脑数码", "便民求助"],
      isPrimary: true,
    },
    {
      id: "jobs",
      title: "发布招聘",
      channelName: "求职招聘频道",
      desc: "嵩明杨林经开区企业招工、门店直聘、兼职日结、普工技工与专业人才",
      icon: "💼",
      href: "/jobs/new",
      tag: "企业直聘",
      color: "#2563EB",
      bgGradient: "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.02) 100%)",
      subCategories: ["企业招工", "门店店员", "兼职日结", "高薪急聘", "技工普工"],
      isPrimary: true,
    },
    {
      id: "resumes",
      title: "登记求职",
      channelName: "求职招聘频道",
      desc: "在线登记求职意向与期望薪资，方便杨林本地优质名企与实体商户主动联系",
      icon: "🙋",
      href: "/jobs/resumes/new",
      tag: "人才简历",
      color: "#4F46E5",
      bgGradient: "linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(79, 70, 229, 0.02) 100%)",
      subCategories: ["求职意向", "薪资期望", "名企直联", "快速入职"],
      isPrimary: true,
    },
    {
      id: "house",
      title: "发布房源",
      channelName: "房产楼市频道",
      desc: "房东免佣挂牌、大学城精装公寓、二手商品房出售、商铺门面出租与求租求购",
      icon: "🏠",
      href: "/house/new",
      tag: "房东直发",
      color: "#D97706",
      bgGradient: "linear-gradient(135deg, rgba(217, 119, 6, 0.08) 0%, rgba(217, 119, 6, 0.02) 100%)",
      subCategories: ["我要出租", "我要租房", "我要卖房", "商铺门面", "厂房仓库"],
      isPrimary: true,
    },
    {
      id: "industrial",
      title: "发布园区招商",
      channelName: "园区招商频道",
      desc: "杨林经开区标准厂房租售、高标物流仓库、工业土地挂牌与企业选址入驻",
      icon: "🏭",
      href: "/industrial/publish",
      tag: "工业地产",
      color: "#0284C7",
      bgGradient: "linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(2, 132, 199, 0.02) 100%)",
      subCategories: ["厂房租售", "仓储物流", "工业土地", "办公研发", "求租求购"],
      isPrimary: true,
    },
  ];

  // 第二梯队：商业服务、同城生活与社交互动频道 (第二排)
  const secondaryChannels: PublishItem[] = [
    {
      id: "merchant",
      title: "商家入驻",
      channelName: "好店名录频道",
      desc: "本地实体商户与个人专业服务者实名认证入驻，点亮官方蓝V勋章与专属主页",
      icon: "🏪",
      href: "/provider/apply",
      tag: "商家认证",
      color: "#7C3AED",
      bgGradient: "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(124, 58, 237, 0.02) 100%)",
      subCategories: ["实体门店", "专业服务者", "官方背书", "专属主页"],
    },
    {
      id: "active",
      title: "发布同城活动",
      channelName: "同城活动频道",
      desc: "组织户外露营、周末聚会、电竞开黑、桌游比赛、同城球赛与创业交流沙龙",
      icon: "🎉",
      href: "/active/new",
      tag: "组队聚会",
      color: "#DB2777",
      bgGradient: "linear-gradient(135deg, rgba(219, 39, 119, 0.08) 0%, rgba(219, 39, 119, 0.02) 100%)",
      subCategories: ["户外露营", "电竞赛事", "桌游剧本", "周末聚会"],
    },
    {
      id: "love",
      title: "发布相亲资料",
      channelName: "相亲交友频道",
      desc: "真实身份认证、登记生活期望与择偶标准，寻找杨林本地心仪单身嘉宾",
      icon: "❤️",
      href: "/love/new",
      tag: "脱单交友",
      color: "#DC2626",
      bgGradient: "linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(220, 38, 38, 0.02) 100%)",
      subCategories: ["真实资料", "实名核验", "缘分速配", "同城脱单"],
    },
    {
      id: "community",
      title: "发布社区帖子",
      channelName: "社区论坛频道",
      desc: "杨林街坊生活杂谈、高校专区、曝光求助与经验交流，与同城街坊随时互动",
      icon: "💬",
      href: "/community/new",
      tag: "街坊贴吧",
      color: "#8B5CF6",
      bgGradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)",
      subCategories: ["新鲜事", "生活杂谈", "打听求助", "大学城专区"],
    },
    {
      id: "articles",
      title: "资讯投稿",
      channelName: "本地资讯频道",
      desc: "本地新闻线索、校园动态、园区产业快讯与活动纪实，提交审核后全站展示",
      icon: "📰",
      href: "/articles/new",
      tag: "线索投稿",
      color: "#475569",
      bgGradient: "linear-gradient(135deg, rgba(71, 85, 105, 0.08) 0%, rgba(71, 85, 105, 0.02) 100%)",
      subCategories: ["新闻线索", "校园动态", "园区快讯", "人工审核"],
    },
  ];

  // 点击卡片时的登录校验与定向保护
  const handleItemClick = (e: React.MouseEvent, targetHref: string) => {
    // 若尚未登录，阻止默认直达，安全引导至登录页并携带 redirect 目标
    if (authChecked && !user) {
      e.preventDefault();
      router.push(`/login?redirect=${encodeURIComponent(targetHref)}`);
    }
  };

  const getCardHref = (targetHref: string) => {
    if (authChecked && !user) {
      return `/login?redirect=${encodeURIComponent(targetHref)}`;
    }
    return targetHref;
  };

  return (
    <main className="page-layout" style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <Navbar />

      {/* 紧凑任务型 Header (非巨幅 Hero，首屏直接呈现关键发布选项) */}
      <section
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)",
          borderBottom: "1px solid #E2E8F0",
          padding: "1.5rem 1rem 1.25rem 1rem",
        }}
      >
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.4rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "#0B7A7515",
                color: "#0B7A75",
                fontSize: "12px",
                fontWeight: "700",
                padding: "2px 10px",
                borderRadius: "20px",
              }}
            >
              ✍️ 统一发布中枢
            </span>
            <span style={{ fontSize: "12px", color: "#64748B" }}>覆盖杨林全域 10 大核心主频道</span>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "0.75rem",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(20px, 3vw, 26px)",
                  fontWeight: "900",
                  color: "#0F172A",
                  letterSpacing: "-0.5px",
                }}
              >
                杨林生活网 · 统一发布中心
              </h1>
              <p style={{ margin: "4px 0 0 0", fontSize: "13.5px", color: "#475569" }}>
                选择你要发布的内容类型，发布后可在个人中心随时查看审核状态与管理已有内容
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <Link
                href="/profile"
                style={{
                  fontSize: "12.5px",
                  color: "#0B7A75",
                  fontWeight: "700",
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                👤 查看我的发布
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 主体卡片容器 */}
      <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "1.25rem 1rem 4rem 1rem" }}>
        {/* 计费与审核规则权威公告条 (杜绝“全部免费”不实承诺，与 ChargeConfig 真实规则一致) */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderLeft: "4px solid #0B7A75",
            borderRadius: "10px",
            padding: "0.85rem 1.15rem",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.6rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
              <span style={{ fontSize: "15px", flexShrink: 0 }}>💡</span>
              <div>
                <strong style={{ color: "#0F172A" }}>计费规则说明：</strong>
                部分频道提供免费发布额度，超出额度后按平台当前规则结算，具体以提交时提示为准。
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
              <span style={{ fontSize: "15px", flexShrink: 0 }}>🛡️</span>
              <div>
                <strong style={{ color: "#0F172A" }}>审核提示：</strong>
                发布内容将根据频道规则进入审核，审核状态可在个人中心查看，合规内容将尽快生效上线。
              </div>
            </div>
          </div>
        </div>

        {/* 核心第一梯队：主要供求与便民通道 (重点入口，手机端全宽横幅呈现) */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "4px", height: "16px", background: "#0B7A75", borderRadius: "2px" }} />
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0F172A" }}>
                核心供求与便民通道
              </h2>
              <span style={{ fontSize: "12px", color: "#64748B" }}>本地高频需求 · 重点通道</span>
            </div>
          </div>

          <div className="primary-grid">
            {primaryChannels.map((item) => (
              <a
                key={item.id}
                href={getCardHref(item.href)}
                onClick={(e) => handleItemClick(e, item.href)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "1.25rem",
                  borderRadius: "14px",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                  textDecoration: "none",
                  color: "inherit",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                }}
                className="publish-card-hover primary-card"
              >
                {/* 顶部轻度渐变背景条 */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background: item.color,
                  }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "12px",
                      background: `${item.color}14`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                    }}
                  >
                    {item.icon}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      background: `${item.color}15`,
                      color: item.color,
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {item.tag}
                  </span>
                </div>

                <div style={{ marginBottom: "0.35rem" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0F172A" }}>
                    {item.title}
                  </h3>
                  <span style={{ fontSize: "11.5px", color: "#94A3B8" }}>{item.channelName}</span>
                </div>

                <p
                  style={{
                    margin: "0 0 0.75rem 0",
                    fontSize: "12.5px",
                    color: "#475569",
                    lineHeight: "1.55",
                    flex: 1,
                  }}
                >
                  {item.desc}
                </p>

                {/* 典型二级标签分类引导 */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px",
                    marginBottom: "0.85rem",
                  }}
                >
                  {item.subCategories.map((sub, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "11px",
                        background: "#F1F5F9",
                        color: "#475569",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {sub}
                    </span>
                  ))}
                </div>

                {/* 底部去发布直达栏 */}
                <div
                  style={{
                    paddingTop: "0.65rem",
                    borderTop: "1px dashed #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                    {authChecked && !user ? "登录后发布" : "立即发布"}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: item.color }}>
                    去发布 →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* 第二梯队：商业服务、同城生活与社交互动 (手机端精细化双列呈现) */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "4px", height: "16px", background: "#7C3AED", borderRadius: "2px" }} />
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0F172A" }}>
                商业服务、生活与社交互动
              </h2>
              <span style={{ fontSize: "12px", color: "#64748B" }}>商家认证 · 组队活动 · 本地相亲 · 社区帖吧</span>
            </div>
          </div>

          <div className="secondary-grid">
            {secondaryChannels.map((item) => (
              <a
                key={item.id}
                href={getCardHref(item.href)}
                onClick={(e) => handleItemClick(e, item.href)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "1.25rem",
                  borderRadius: "14px",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                  textDecoration: "none",
                  color: "inherit",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                }}
                className="publish-card-hover secondary-card"
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background: item.color,
                  }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "12px",
                      background: `${item.color}14`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                    }}
                    className="card-icon-box"
                  >
                    {item.icon}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      background: `${item.color}15`,
                      color: item.color,
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                    className="card-tag-badge"
                  >
                    {item.tag}
                  </span>
                </div>

                <div style={{ marginBottom: "0.35rem" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0F172A" }} className="card-title">
                    {item.title}
                  </h3>
                  <span style={{ fontSize: "11.5px", color: "#94A3B8" }} className="card-channel">
                    {item.channelName}
                  </span>
                </div>

                <p
                  style={{
                    margin: "0 0 0.75rem 0",
                    fontSize: "12.5px",
                    color: "#475569",
                    lineHeight: "1.55",
                    flex: 1,
                  }}
                  className="card-desc"
                >
                  {item.desc}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px",
                    marginBottom: "0.85rem",
                  }}
                  className="card-subcats"
                >
                  {item.subCategories.map((sub, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "11px",
                        background: "#F1F5F9",
                        color: "#475569",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {sub}
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    paddingTop: "0.65rem",
                    borderTop: "1px dashed #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  className="card-footer"
                >
                  <span style={{ fontSize: "11px", color: "#94A3B8" }} className="card-action-hint">
                    {authChecked && !user ? "登录后进入" : "立即进入"}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: item.color }}>
                    去发布 →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* 第三梯队：平台自营商城（严格隔离：普通用户绝不展示“发布商品”，仅管理员展示管理后台通道） */}
        {isAdmin && (
          <div
            style={{
              marginTop: "2rem",
              background: "#0F172A",
              borderRadius: "14px",
              padding: "1.25rem 1.5rem",
              color: "#FFFFFF",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              border: "1px solid #334155",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                }}
              >
                🛒
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#FFFFFF" }}>
                    杨林生活网 · 自营商城后台管理
                  </h3>
                  <span
                    style={{
                      fontSize: "11px",
                      background: "#DC2626",
                      color: "#FFFFFF",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      fontWeight: "700",
                    }}
                  >
                    管理权限已激活
                  </span>
                </div>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#94A3B8" }}>
                  自营商品仅对平台官方专员开放上架与订单核销，普通会员无权发布。您可直接进入后台进行运营管理。
                </p>
              </div>
            </div>

            <Link
              href="/admin/mall"
              style={{
                background: "#0B7A75",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: "700",
                padding: "8px 18px",
                borderRadius: "8px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ⚙️ 进入商城管理后台 →
            </Link>
          </div>
        )}

        {/* 底部便民指引 */}
        <div
          style={{
            marginTop: "2.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            fontSize: "12.5px",
            color: "#64748B",
          }}
        >
          <div>
            遇到了发布问题？可随时联系
            <Link href="/contact" style={{ color: "#0B7A75", fontWeight: "700", marginLeft: "4px" }}>
              平台在线客服
            </Link>
            ，或查看
            <Link href="/bianmin" style={{ color: "#0B7A75", fontWeight: "700", margin: "0 4px" }}>
              便民服务电话
            </Link>
          </div>
          <div style={{ display: "flex", gap: "14px" }}>
            <Link href="/" style={{ color: "#475569" }}>返回首页</Link>
            <Link href="/info" style={{ color: "#475569" }}>便民大厅</Link>
            <Link href="/jobs" style={{ color: "#475569" }}>求职招聘</Link>
            <Link href="/house" style={{ color: "#475569" }}>房产楼市</Link>
            <Link href="/profile" style={{ color: "#0B7A75", fontWeight: "700" }}>个人中心</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .primary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 1rem;
        }
        .secondary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 1rem;
        }
        .publish-card-hover:hover {
          transform: translateY(-3px);
          border-color: #cbd5e1 !important;
          box-shadow: 0 10px 24px -4px rgba(15, 23, 42, 0.08) !important;
        }
        @media (max-width: 640px) {
          .primary-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          .secondary-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }
          .primary-card {
            padding: 1rem !important;
          }
          .secondary-card {
            padding: 0.75rem !important;
            border-radius: 12px !important;
          }
          .secondary-card .card-icon-box {
            width: 36px !important;
            height: 36px !important;
            font-size: 18px !important;
            border-radius: 8px !important;
          }
          .secondary-card .card-tag-badge {
            font-size: 10px !important;
            padding: 2px 5px !important;
          }
          .secondary-card .card-title {
            font-size: 13.5px !important;
            line-height: 1.3 !important;
          }
          .secondary-card .card-channel {
            font-size: 10.5px !important;
          }
          .secondary-card .card-desc {
            font-size: 11px !important;
            line-height: 1.4 !important;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin-bottom: 0.5rem !important;
          }
          .secondary-card .card-subcats span:nth-child(n+3) {
            display: none;
          }
          .secondary-card .card-subcats span {
            font-size: 10px !important;
            padding: 1px 4px !important;
          }
          .secondary-card .card-footer {
            padding-top: 0.5rem !important;
          }
          .secondary-card .card-action-hint {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
