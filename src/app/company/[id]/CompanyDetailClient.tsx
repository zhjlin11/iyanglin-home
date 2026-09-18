"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { parseJobBody } from "@/lib/job-parser";

export type SerializedJob = {
  id: string;
  title: string;
  salary: string | null;
  area: string | null;
  jobType: string | null;
  body: string | null;
  createdAt: string;
  isTop: boolean;
};

export type CompanyDetailData = {
  id: string;
  name: string;
  shortName: string | null;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  shortDescription?: string | null;
  industry: string | null;
  companySize: string | null;
  companyType: string | null;
  foundedYear: number | null;
  registeredCapital: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  isVerified: boolean;
  verificationStatus: string;
  isFeaturedEmployer: boolean;
  jobs: SerializedJob[];
  isCompanyMember: boolean;
};

// 稳定配色方案（根据 Company ID 稳定生成深底高雅渐变）
const LOGO_GRADIENTS = [
  "linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)", // 宝蓝
  "linear-gradient(135deg, #065F46 0%, #10B981 100%)", // 翡翠绿
  "linear-gradient(135deg, #0E7490 0%, #06B6D4 100%)", // 湖青
  "linear-gradient(135deg, #9A3412 0%, #F97316 100%)", // 暖橙
  "linear-gradient(135deg, #6B21A8 0%, #A855F7 100%)", // 雅紫
  "linear-gradient(135deg, #9F1239 0%, #F43F5E 100%)", // 玫瑰
  "linear-gradient(135deg, #115E59 0%, #14B8A6 100%)", // 松绿
  "linear-gradient(135deg, #1E293B 0%, #475569 100%)", // 碳素黑灰
];

function getCompanyLogoProps(companyId: string, name: string) {
  let hash = 0;
  for (let i = 0; i < companyId.length; i++) {
    hash = (hash << 5) - hash + companyId.charCodeAt(i);
    hash |= 0;
  }
  const bg = LOGO_GRADIENTS[Math.abs(hash) % LOGO_GRADIENTS.length];
  const clean = name
    .replace(/(云南省|云南|昆明市|昆明|嵩明县|嵩明|杨林经开区|杨林|有限责任公司|股份有限公司|有限公司|制造厂|加工厂|经营部|商行|总厂|分厂)/g, "")
    .trim();
  const monogram = clean.slice(0, 2) || name.slice(0, 2) || "企";
  return { bg, monogram };
}

function inferJobCategory(title: string): string {
  if (/普工|操作工|包装|生产|车间|组装|质检|检验|品控|机修|电工|焊工|维修|装配|技工|学徒/i.test(title)) return "生产制造";
  if (/销售|商务|业务|导购|客服|顾问|推广|招商/i.test(title)) return "市场销售";
  if (/物流|仓管|仓库|配送|快递|装卸|理货|叉车|司机/i.test(title)) return "仓储物流";
  if (/文员|助理|行政|人事|财务|会计|出纳|前台|内勤/i.test(title)) return "行政文职";
  if (/研发|工程|设计|技术|开发|工艺|CAD|机械设计/i.test(title)) return "技术研发";
  if (/服务员|保洁|保安|厨师|帮厨|面点|店员|洗碗/i.test(title)) return "餐饮服务";
  return "综合岗位";
}

function parseSalaryNumber(salaryStr: string | null | undefined): number {
  if (!salaryStr || salaryStr.includes("面议")) return 0;
  const match = salaryStr.match(/(\d+)/g);
  if (match && match.length > 0) {
    const nums = match.map(Number);
    return Math.max(...nums);
  }
  return 0;
}

function extractBenefits(jobBody?: string | null, title?: string): string[] {
  const benefits: string[] = [];
  const text = `${title || ""} ${jobBody || ""}`;
  if (/包吃住|包吃包住/i.test(text)) benefits.push("包吃住");
  else {
    if (/包吃|工作餐|餐补/i.test(text)) benefits.push("包吃");
    if (/包住|提供住宿|房补/i.test(text)) benefits.push("包住");
  }
  if (/五险一金/i.test(text)) benefits.push("五险一金");
  else if (/社保|五险/i.test(text)) benefits.push("社保");
  if (/长白班/i.test(text)) benefits.push("长白班");
  if (/节日福利/i.test(text)) benefits.push("节日福利");
  if (/班车/i.test(text)) benefits.push("班车接送");
  if (/年终奖|年底双薪/i.test(text)) benefits.push("年终奖");
  if (/带薪年假/i.test(text)) benefits.push("带薪年假");
  if (/双休/i.test(text)) benefits.push("周末双休");
  return Array.from(new Set(benefits)).slice(0, 3);
}

function formatTimeAgo(createdAt: string): string {
  const d = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (d < 1) return "今天更新";
  if (d < 7) return `${d}天前更新`;
  if (d < 30) return `${Math.floor(d / 7)}周前更新`;
  return `${Math.floor(d / 30)}月前更新`;
}

export default function CompanyDetailClient({ company }: { company: CompanyDetailData }) {
  const { bg: logoBg, monogram } = useMemo(
    () => getCompanyLogoProps(company.id, company.name),
    [company.id, company.name]
  );

  const isVerified = company.isVerified && company.verificationStatus === "VERIFIED";

  // States
  const [sortOrder, setSortOrder] = useState<"latest" | "salary">("latest");
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"jobs" | "intro" | "archive">("jobs");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // 1. One-sentence summary
  const summaryText = useMemo(() => {
    if (company.shortDescription) return company.shortDescription;
    if (!company.description) {
      return `位于${company.address || "云南省昆明市嵩明县杨林经济技术开发区"}，主营${company.industry || "实体制造"}，持续招聘本地优质人才。`;
    }
    const cleanDesc = company.description.replace(/[\r\n\t]+/g, " ").trim();
    return cleanDesc.length > 80 ? cleanDesc.slice(0, 80) + "..." : cleanDesc;
  }, [company.shortDescription, company.description, company.address, company.industry]);

  // 2. Aggregate Job Categories & Benefits
  const { categories, aggregatedBenefits, latestUpdateTime } = useMemo(() => {
    const cats = new Set<string>();
    const allBenefits = new Map<string, number>();
    let latestTimestamp = 0;

    company.jobs.forEach((j) => {
      cats.add(inferJobCategory(j.title));
      const bList = extractBenefits(j.body, j.title);
      bList.forEach((b) => allBenefits.set(b, (allBenefits.get(b) || 0) + 1));
      const t = new Date(j.createdAt).getTime();
      if (t > latestTimestamp) latestTimestamp = t;
    });

    const sortedBenefits = Array.from(allBenefits.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0])
      .slice(0, 5);

    const latestText = latestTimestamp > 0 ? formatTimeAgo(new Date(latestTimestamp).toISOString()) : "近期发布";

    return {
      categories: ["全部", ...Array.from(cats)],
      aggregatedBenefits: sortedBenefits,
      latestUpdateTime: latestText,
    };
  }, [company.jobs]);

  // 3. Filtered & Sorted Jobs
  const processedJobs = useMemo(() => {
    let list = [...company.jobs];

    if (selectedCategory !== "全部") {
      list = list.filter((j) => inferJobCategory(j.title) === selectedCategory);
    }

    if (sortOrder === "latest") {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      list.sort((a, b) => {
        const parsedA = parseJobBody(a.body || "");
        const parsedB = parseJobBody(b.body || "");
        const salA = parseSalaryNumber(parsedA.salary || a.salary);
        const salB = parseSalaryNumber(parsedB.salary || b.salary);
        return salB - salA;
      });
    }

    return list;
  }, [company.jobs, selectedCategory, sortOrder]);

  const displayedJobs = showAllJobs ? processedJobs : processedJobs.slice(0, 6);

  // Copy Address
  const handleCopyAddress = () => {
    const textToCopy = company.address || `${company.district || "嵩明县"}杨林经济技术开发区`;
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("✓ 地址已复制到剪贴板");
      }).catch(() => {
        showToast("✓ 地址: " + textToCopy);
      });
    } else {
      showToast("✓ 地址: " + textToCopy);
    }
  };

  // Share
  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: `${company.name}招聘信息 | 杨林生活网`,
          text: `${company.name}在招${company.jobs.length}个优质岗位，快来查看！`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast("✓ 主页链接已复制，可发给好友");
        });
      } else {
        showToast("请复制当前网页链接分享");
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F6F8FB", color: "#0F172A", paddingBottom: "4rem" }}>
      <style>{`
        .company-grid-container {
          display: grid;
          grid-template-columns: 68% calc(32% - 20px);
          gap: 20px;
          align-items: start;
        }
        .company-job-card {
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 16px 20px;
          background: #ffffff;
          transition: all 0.15s ease;
          display: block;
          text-decoration: none;
        }
        .company-job-card:hover {
          border-color: #93C5FD;
          box-shadow: 0 6px 18px rgba(25, 103, 210, 0.08);
          transform: translateY(-1px);
        }
        .company-job-card:hover .job-title-text {
          color: #1967D2 !important;
        }
        @media (max-width: 860px) {
          .company-grid-container {
            grid-template-columns: 100% !important;
          }
          .company-pc-breadcrumb { display: none !important; }
          .company-mob-nav { display: flex !important; }
          .company-hero-box {
            padding: 18px 16px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .company-hero-right {
            width: 100% !important;
            border-top: 1px solid rgba(255,255,255,0.15) !important;
            padding-top: 14px !important;
            margin-top: 12px !important;
            justify-content: space-between !important;
            flex-direction: row !important;
          }
          .company-hero-title {
            font-size: 20px !important;
          }
          .company-seg-tabs { display: flex !important; }
          .hide-on-mobile { display: none !important; }
        }
        @media (min-width: 861px) {
          .company-mob-nav { display: none !important; }
          .company-seg-tabs { display: none !important; }
        }
      `}</style>

      {/* Toast 提示浮层 */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.92)",
            backdropFilter: "blur(8px)",
            color: "#ffffff",
            padding: "8px 18px",
            borderRadius: "30px",
            fontSize: "13px",
            fontWeight: "700",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* ── 顶部面包屑与移动端导航 ── */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #E2E8F0" }}>
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
          }}
        >
          {/* PC 面包屑 */}
          <div className="company-pc-breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748B" }}>
            <Link href="/" style={{ color: "#64748B", textDecoration: "none" }}>首页</Link>
            <span>/</span>
            <Link href="/jobs" style={{ color: "#64748B", textDecoration: "none" }}>招聘大厅</Link>
            <span>/</span>
            <Link href="/jobs/companies" style={{ color: "#64748B", textDecoration: "none" }}>用人单位</Link>
            <span>/</span>
            <span style={{ color: "#0F172A", fontWeight: "700" }}>{company.name}</span>
          </div>

          {/* 移动端返回与分享 */}
          <div className="company-mob-nav" style={{ display: "none", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <Link href="/jobs" style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0F172A", fontWeight: "700", textDecoration: "none" }}>
              <span style={{ fontSize: "16px" }}>←</span>
              <span>返回招聘</span>
            </Link>
            <button
              onClick={handleShare}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: "#1967D2",
                fontWeight: "700",
                background: "#EFF6FF",
                padding: "5px 12px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span>🔗</span>
              <span>分享主页</span>
            </button>
          </div>

          {/* PC 分享按钮 */}
          <button
            onClick={handleShare}
            className="hide-on-mobile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "#64748B",
              background: "transparent",
              border: "none",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <span>🔗</span>
            <span>分享企业</span>
          </button>
        </div>
      </div>

      {/* ── 轻量企业信息 Hero (高度 <= 240px，蓝向轻渐变) ── */}
      <div style={{ maxWidth: "1240px", margin: "16px auto 0 auto", padding: "0 16px" }}>
        <div
          className="company-hero-box"
          style={{
            background: "linear-gradient(135deg, #0F294D 0%, #153E75 55%, #1E5DAA 100%)",
            color: "#ffffff",
            borderRadius: "16px",
            padding: "24px 28px",
            boxShadow: "0 4px 20px rgba(15, 41, 77, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
            gap: "24px",
          }}
        >
          {/* 左侧：Logo、名称、认证、元数据、一句话简介 */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1, minWidth: 0 }}>
            {/* Logo 徽章 (76px) */}
            <div
              style={{
                width: "76px",
                height: "76px",
                borderRadius: "14px",
                background: company.logo ? `#ffffff url(${company.logo}) center/contain no-repeat` : logoBg,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                fontWeight: "900",
                border: "2px solid rgba(255, 255, 255, 0.25)",
                boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                flexShrink: 0,
                userSelect: "none",
              }}
            >
              {!company.logo && monogram}
            </div>

            {/* 核心文本信息 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h1
                  className="company-hero-title"
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: "900",
                    color: "#ffffff",
                    letterSpacing: "-0.3px",
                    lineHeight: 1.3,
                  }}
                >
                  {company.name}
                </h1>

                {/* 认证 Badge */}
                {isVerified ? (
                  <span
                    style={{
                      background: "rgba(16, 185, 129, 0.22)",
                      color: "#6EE7B7",
                      border: "1px solid rgba(110, 231, 183, 0.35)",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      padding: "2px 10px",
                      borderRadius: "20px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <span>✓</span> 已官方认证
                  </span>
                ) : (
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.14)",
                      color: "#CBD5E1",
                      border: "1px solid rgba(255, 255, 255, 0.22)",
                      fontSize: "11.5px",
                      fontWeight: "600",
                      padding: "2px 10px",
                      borderRadius: "20px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <span>ℹ</span> 平台收录
                  </span>
                )}

                {/* 名企推荐 Badge */}
                {company.isFeaturedEmployer && (
                  <span
                    style={{
                      background: "rgba(245, 158, 11, 0.22)",
                      color: "#FDE68A",
                      border: "1px solid rgba(253, 230, 138, 0.35)",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      padding: "2px 10px",
                      borderRadius: "20px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    ★ 推荐名企
                  </span>
                )}
              </div>

              {/* 属性元数据行 */}
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255, 255, 255, 0.8)",
                  marginTop: "6px",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span>🏢 {company.industry || "实体制造"}</span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
                <span>👥 {company.companySize || "1-49人"}</span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
                <span>🏛️ {company.companyType || "民营企业"}</span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
                <span>📍 {company.district || "嵩明县"}杨林</span>
              </div>

              {/* 一句话摘要 */}
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: "13px",
                  color: "rgba(255, 255, 255, 0.9)",
                  lineHeight: "1.6",
                  maxWidth: "720px",
                }}
              >
                {summaryText}
              </p>
            </div>
          </div>

          {/* 右侧：在招职位指标与一键直达 */}
          <div
            className="company-hero-right"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "30px", fontWeight: "900", color: "#FBBF24", fontFamily: "monospace", lineHeight: 1 }}>
                {company.jobs.length}
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.75)", marginTop: "4px" }}>
                在招热门职位
              </div>
            </div>

            <a
              href="#jobs-section"
              style={{
                background: "rgba(255, 255, 255, 0.18)",
                border: "1px solid rgba(255, 255, 255, 0.32)",
                color: "#ffffff",
                padding: "8px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "700",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease",
              }}
            >
              <span>查看全部职位</span>
              <span>↓</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── 移动端锚点切换栏 ── */}
      <div className="company-seg-tabs" style={{ maxWidth: "1240px", margin: "12px auto 0 auto", padding: "0 16px" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "4px",
            border: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            fontSize: "13px",
            fontWeight: "700",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            width: "100%",
          }}
        >
          <button
            onClick={() => setActiveTab("jobs")}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: "8px",
              border: "none",
              background: activeTab === "jobs" ? "#1967D2" : "transparent",
              color: activeTab === "jobs" ? "#ffffff" : "#64748B",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            在招职位 ({company.jobs.length})
          </button>
          <button
            onClick={() => setActiveTab("intro")}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: "8px",
              border: "none",
              background: activeTab === "intro" ? "#1967D2" : "transparent",
              color: activeTab === "intro" ? "#ffffff" : "#64748B",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            企业简介
          </button>
          <button
            onClick={() => setActiveTab("archive")}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: "8px",
              border: "none",
              background: activeTab === "archive" ? "#1967D2" : "transparent",
              color: activeTab === "archive" ? "#ffffff" : "#64748B",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            工商与地址
          </button>
        </div>
      </div>

      {/* ── 主体双栏内容区域 (PC Left 68% + Right 32%) ── */}
      <div style={{ maxWidth: "1240px", margin: "18px auto 0 auto", padding: "0 16px" }}>
        <div className="company-grid-container">

          {/* ════════════════ 左侧主栏 (68%) ════════════════ */}
          <div
            style={{
              display: activeTab === "archive" ? "none" : "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* 1. 企业简介卡片 (可折叠) */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "22px 24px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                display: activeTab === "jobs" ? undefined : "block",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #F1F5F9",
                  marginBottom: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "4px", height: "16px", background: "#1967D2", borderRadius: "2px" }} />
                  <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0F172A" }}>企业介绍</h2>
                </div>
                {isVerified && (
                  <span style={{ fontSize: "12px", color: "#166534", background: "#DCFCE7", border: "1px solid #BBF7D0", fontWeight: "700", padding: "2px 10px", borderRadius: "20px" }}>
                    ✓ 资质已人工实名核验
                  </span>
                )}
              </div>

              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    lineHeight: "1.8",
                    color: "#334155",
                    whiteSpace: "pre-line",
                    display: !isDescExpanded ? "-webkit-box" : "block",
                    WebkitLineClamp: !isDescExpanded ? 4 : undefined,
                    WebkitBoxOrient: "vertical",
                    overflow: !isDescExpanded ? "hidden" : "visible",
                  }}
                >
                  {company.description ||
                    `${company.name}立足云南省昆明市嵩明县杨林经济技术开发区，是本地实体用工单位之一。企业严格遵循国家劳动法规，规范用工，持续为杨林大学城片区及嵩明周边提供多层次就业机会。欢迎广大求职者投递简历或直接联系招聘负责人。`}
                </p>

                {/* 展开/收起按钮 */}
                {(company.description?.length || 0) > 160 && (
                  <div style={{ marginTop: "8px", textAlign: "right" }}>
                    <button
                      onClick={() => setIsDescExpanded(!isDescExpanded)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        color: "#1967D2",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {isDescExpanded ? "收起全文 ↑" : "展开全文 ↓"}
                    </button>
                  </div>
                )}
              </div>

              {/* 轻量可信度标签 */}
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "14px",
                  borderTop: "1px dashed #E2E8F0",
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  fontSize: "12px",
                }}
              >
                {isVerified ? (
                  <span style={{ background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0", padding: "4px 10px", borderRadius: "6px", fontWeight: "700" }}>
                    ✓ 营业执照已核验
                  </span>
                ) : (
                  <span style={{ background: "#F1F5F9", color: "#64748B", padding: "4px 10px", borderRadius: "6px", fontWeight: "600" }}>
                    ℹ 平台收录企业
                  </span>
                )}
                <span style={{ background: "#EFF6FF", color: "#1E40AF", border: "1px solid #DBEAFE", padding: "4px 10px", borderRadius: "6px", fontWeight: "600" }}>
                  ✓ 本地实体企业
                </span>
                <span style={{ background: "#EFF6FF", color: "#1E40AF", border: "1px solid #DBEAFE", padding: "4px 10px", borderRadius: "6px", fontWeight: "600" }}>
                  ✓ 招聘信息持续更新
                </span>
                {company.isFeaturedEmployer && (
                  <span style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A", padding: "4px 10px", borderRadius: "6px", fontWeight: "700" }}>
                    ★ 重点推荐雇主
                  </span>
                )}
              </div>
            </div>

            {/* 2. 在招职位区域 (Boss / 猎聘风格) */}
            <div
              id="jobs-section"
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "22px 24px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                display: activeTab === "intro" ? "none" : "block",
              }}
            >
              {/* 头部：标题 + 排序 + 类别筛选 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "14px", borderBottom: "1px solid #F1F5F9", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "4px", height: "16px", background: "#1967D2", borderRadius: "2px" }} />
                    <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0F172A" }}>
                      在招职位
                    </h2>
                    <span style={{ background: "#EFF6FF", color: "#1967D2", border: "1px solid #DBEAFE", fontSize: "12px", fontWeight: "800", padding: "2px 8px", borderRadius: "20px" }}>
                      {processedJobs.length}
                    </span>
                  </div>

                  {/* 排序切换 */}
                  <div style={{ display: "flex", alignItems: "center", background: "#F1F5F9", padding: "3px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>
                    <button
                      onClick={() => setSortOrder("latest")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "none",
                        background: sortOrder === "latest" ? "#ffffff" : "transparent",
                        color: sortOrder === "latest" ? "#1967D2" : "#64748B",
                        fontWeight: "700",
                        cursor: "pointer",
                        boxShadow: sortOrder === "latest" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      }}
                    >
                      最新发布
                    </button>
                    <button
                      onClick={() => setSortOrder("salary")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "none",
                        background: sortOrder === "salary" ? "#ffffff" : "transparent",
                        color: sortOrder === "salary" ? "#1967D2" : "#64748B",
                        fontWeight: "700",
                        cursor: "pointer",
                        boxShadow: sortOrder === "salary" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      }}
                    >
                      薪资高到低
                    </button>
                  </div>
                </div>

                {/* 岗位类别过滤 Tab */}
                {categories.length > 2 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "20px",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                          fontWeight: "700",
                          border: "none",
                          background: selectedCategory === cat ? "#1967D2" : "#F1F5F9",
                          color: selectedCategory === cat ? "#ffffff" : "#475569",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 职位卡片列表 */}
              {displayedJobs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94A3B8" }}>
                  <div style={{ fontSize: "38px", marginBottom: "8px" }}>📭</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>该分类下暂无在线招聘岗位</div>
                  <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>请尝试切换其他职位类别查看</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {displayedJobs.map((job) => {
                    const parsed = parseJobBody(job.body || "");
                    const title = parsed.jobTitle || job.title;
                    const salary = parsed.salary || job.salary || "面议";
                    const area = parsed.area || job.area || company.district || "杨林经开区";
                    const benefits = extractBenefits(job.body, title);
                    const timeAgo = formatTimeAgo(job.createdAt);

                    return (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="company-job-card"
                      >
                        {/* 首行：职位名称 + 橙色粗体薪资 */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <span className="job-title-text" style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", transition: "color 0.15s ease" }}>
                                {title}
                              </span>
                              {job.isTop && (
                                <span style={{ background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", fontSize: "10.5px", fontWeight: "800", padding: "1px 6px", borderRadius: "4px" }}>
                                  急聘
                                </span>
                              )}
                              {job.jobType === "parttime" && (
                                <span style={{ background: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD", fontSize: "10.5px", fontWeight: "800", padding: "1px 6px", borderRadius: "4px" }}>
                                  兼职
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <span style={{ fontSize: "18px", fontWeight: "900", color: "#EA580C", fontFamily: "monospace" }}>
                              {salary}
                            </span>
                          </div>
                        </div>

                        {/* 第二行：精选福利标签（最多 3 个） */}
                        {benefits.length > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                            {benefits.map((b, idx) => (
                              <span
                                key={idx}
                                style={{
                                  background: "#F1F5F9",
                                  color: "#475569",
                                  fontSize: "11.5px",
                                  fontWeight: "600",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                }}
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 第三行：区域 · 学历经验 + 发布时间与查看详情 */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            color: "#64748B",
                            marginTop: "12px",
                            paddingTop: "10px",
                            borderTop: "1px solid #F8FAFC",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>📍 {area}</span>
                            <span>·</span>
                            <span>经验不限 · 学历不限</span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "#94A3B8" }}>{timeAgo}</span>
                            <span style={{ color: "#1967D2", fontWeight: "800" }}>
                              查看职位 →
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* 展开/收起全部职位 */}
              {processedJobs.length > 6 && (
                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #F1F5F9", textAlign: "center" }}>
                  <button
                    onClick={() => setShowAllJobs(!showAllJobs)}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      fontSize: "13px",
                      fontWeight: "800",
                      color: "#1967D2",
                      background: "#EFF6FF",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {showAllJobs ? "收起部分职位 ↑" : `展开查看全部 ${processedJobs.length} 个在招职位 ↓`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ════════════════ 右侧信息栏 (32%) ════════════════ */}
          <div
            style={{
              display: activeTab === "jobs" ? undefined : "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* 模块 1：企业资质认证说明卡 */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "20px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #F1F5F9", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "16px" }}>🛡️</span>
                  <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: "800", color: "#0F172A" }}>企业资质核验</h3>
                </div>
                {isVerified ? (
                  <span style={{ background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0", fontSize: "11px", fontWeight: "700", padding: "1px 8px", borderRadius: "12px" }}>
                    已认证
                  </span>
                ) : (
                  <span style={{ background: "#F1F5F9", color: "#64748B", fontSize: "11px", fontWeight: "600", padding: "1px 8px", borderRadius: "12px" }}>
                    未核验
                  </span>
                )}
              </div>

              {isVerified ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: "700" }}>
                    <span>✓</span>
                    <span>营业执照实名已核验</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: "700" }}>
                    <span>✓</span>
                    <span>企业统一信用代码已核验</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: "700" }}>
                    <span>✓</span>
                    <span>招聘主体与负责人身份已核实</span>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "11.5px", color: "#64748B", lineHeight: "1.6" }}>
                    该企业已通过杨林生活网人工证照审核，具备合法用工资质。
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155", fontWeight: "600" }}>
                    <span style={{ color: "#3B82F6" }}>ℹ</span>
                    <span>平台收录企业主体</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#B45309", fontWeight: "600" }}>
                    <span style={{ color: "#F59E0B" }}>!</span>
                    <span>营业执照证件待人工实名核验</span>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "11.5px", color: "#64748B", lineHeight: "1.6" }}>
                    用工信息由公开招聘数据收录，建议求职者在沟通时核对用工事项。
                  </p>
                </div>
              )}

              <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #F1F5F9", textAlign: "right" }}>
                <button
                  onClick={() => setShowVerifyModal(true)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#1967D2",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  查看认证说明 &gt;
                </button>
              </div>
            </div>

            {/* 模块 2：招聘概览 (真实数据聚合) */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "20px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingBottom: "10px", borderBottom: "1px solid #F1F5F9", marginBottom: "14px" }}>
                <span style={{ fontSize: "16px" }}>📊</span>
                <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: "800", color: "#0F172A" }}>招聘概览</h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ background: "#F8FAFC", padding: "10px 12px", borderRadius: "10px", border: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>在招职位</div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "#0F172A", fontFamily: "monospace", marginTop: "2px" }}>
                    {company.jobs.length} 个
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", padding: "10px 12px", borderRadius: "10px", border: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>最近更新</div>
                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0F172A", marginTop: "5px" }}>
                    {latestUpdateTime}
                  </div>
                </div>
              </div>

              {/* 主要类别 */}
              <div style={{ marginTop: "12px", fontSize: "12.5px" }}>
                <span style={{ color: "#64748B" }}>主要类别：</span>
                <span style={{ color: "#0F172A", fontWeight: "700", marginLeft: "4px" }}>
                  {categories.filter((c) => c !== "全部").slice(0, 4).join(" / ") || "综合实体用工"}
                </span>
              </div>

              {/* 常见福利标签 */}
              {aggregatedBenefits.length > 0 && (
                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "6px" }}>企业在招高频福利：</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {aggregatedBenefits.map((b, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "#EFF6FF",
                          color: "#1E40AF",
                          border: "1px solid #DBEAFE",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        ✓ {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 模块 3：企业基础信息 (紧凑两列表格) */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "20px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingBottom: "10px", borderBottom: "1px solid #F1F5F9", marginBottom: "14px" }}>
                <span style={{ fontSize: "16px" }}>📋</span>
                <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: "800", color: "#0F172A" }}>企业基础信息</h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "9px", fontSize: "12.5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>所属行业</span>
                  <span style={{ color: "#0F172A", fontWeight: "700" }}>{company.industry || "工业制造"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>企业规模</span>
                  <span style={{ color: "#0F172A", fontWeight: "700" }}>{company.companySize || "1-49人"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>企业性质</span>
                  <span style={{ color: "#0F172A", fontWeight: "700" }}>{company.companyType || "民营企业"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>所在区域</span>
                  <span style={{ color: "#0F172A", fontWeight: "700" }}>
                    {company.district || "嵩明县"} · {company.city || "昆明市"}
                  </span>
                </div>
                {company.foundedYear && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>成立年份</span>
                    <span style={{ color: "#0F172A", fontWeight: "700" }}>{company.foundedYear} 年</span>
                  </div>
                )}
                {company.registeredCapital && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>注册资本</span>
                    <span style={{ color: "#0F172A", fontWeight: "700" }}>{company.registeredCapital}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 模块 4：工作地点与地图卡 */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "20px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingBottom: "10px", borderBottom: "1px solid #F1F5F9", marginBottom: "12px" }}>
                <span style={{ fontSize: "16px" }}>📍</span>
                <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: "800", color: "#0F172A" }}>工作地点</h3>
              </div>

              <p style={{ margin: 0, fontSize: "12.5px", color: "#334155", lineHeight: "1.6", fontWeight: "600" }}>
                {company.address || "云南省昆明市嵩明县杨林经济技术开发区"}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px" }}>
                <button
                  onClick={handleCopyAddress}
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    background: "#F1F5F9",
                    color: "#334155",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  📋 复制地址
                </button>
                <a
                  href={`https://uri.amap.com/search?keyword=${encodeURIComponent(
                    company.name + " " + (company.address || "嵩明县杨林")
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    background: "#EFF6FF",
                    color: "#1967D2",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: "700",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  🗺️ 查看地图
                </a>
              </div>
            </div>

            {/* 模块 5：企业负责人/HR入口 (轻量边框卡片) */}
            <div
              style={{
                background: "#F8FAFC",
                borderRadius: "16px",
                padding: "18px 20px",
                border: "1px solid #E2E8F0",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#0F172A", marginBottom: "4px" }}>
                我是该企业负责人 / HR
              </div>
              <p style={{ margin: "0 0 12px 0", fontSize: "11.5px", color: "#64748B", lineHeight: "1.5" }}>
                认领后可自主管理企业资料、发布最新在招职位并直接处理求职简历。
              </p>

              {company.isCompanyMember ? (
                <Link
                  href="/workspace"
                  style={{
                    display: "block",
                    textAlign: "center",
                    background: "#1967D2",
                    color: "#ffffff",
                    fontSize: "12.5px",
                    fontWeight: "700",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    textDecoration: "none",
                  }}
                >
                  已绑定 · 进入企业工作台 →
                </Link>
              ) : (
                <Link
                  href="/workspace"
                  style={{
                    display: "block",
                    textAlign: "center",
                    background: "#ffffff",
                    color: "#1967D2",
                    border: "1px solid #BFDBFE",
                    fontSize: "12.5px",
                    fontWeight: "700",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    textDecoration: "none",
                  }}
                >
                  申请认领企业 / 登录工作台 &gt;
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── 认证说明模态弹窗 ── */}
      {showVerifyModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "460px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              border: "1px solid #E2E8F0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>🛡️</span>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0F172A" }}>平台用工认证说明</h3>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#94A3B8",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px", color: "#475569", lineHeight: "1.7" }}>
              <p style={{ margin: 0 }}>
                <strong>1. 平台认证企业</strong>：指已向杨林生活网正式提交合法有效的营业执照原件、统一社会信用代码及法定代表人/HR认证信息，并通过平台专员实名核验的企业。
              </p>
              <p style={{ margin: 0 }}>
                <strong>2. 平台收录企业</strong>：指由平台自公开渠道收录或初步登记的企业主体。该类企业尚未提交完整营业执照资质核验，招聘信息仅供参考。
              </p>
              <p style={{ margin: 0 }}>
                <strong>3. 求职安全提示</strong>：任何用工单位以任何名义向求职者收取押金、报名费、服装费等均属违法行为，求职者如发现违规可随时举报。
              </p>
            </div>

            <div style={{ marginTop: "20px" }}>
              <button
                onClick={() => setShowVerifyModal(false)}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  background: "#1967D2",
                  color: "#ffffff",
                  borderRadius: "10px",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
