import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { listApprovedJobsPage, listContent } from "@/lib/content-store";
import Navbar from "@/components/Navbar";
import { parseJobBody } from "@/lib/job-parser";
import Pagination from "@/components/Pagination";
import AdBanner from "@/components/AdBanner";
import Link from "next/link";

export const metadata: Metadata = {
  title: "杨林人才招聘 - 嵩明杨林经开区招聘 | 大学城名企优岗直聘 | 找工作求职",
  description: "杨林生活网招聘频道全面升级，为您提供杨林经开区先进制造工厂招聘、大学城兼职、餐饮服务员、行政文员、司机与本地求职人才简历，企业直聊，无中介费。",
  keywords: ["杨林招聘", "杨林找工作", "杨林经开区招聘", "嵩明兼职", "大学城兼职", "杨林人才网"],
  openGraph: {
    title: "杨林人才招聘 - 嵩明杨林本地名企直聊大厅 | 杨林生活网",
    description: "企业直招、兼职实习与个人求职简历大厅，与企业负责人直接沟通。",
    url: "https://iyanglin.com/jobs",
    siteName: "杨林生活网",
  },
  alternates: {
    canonical: "https://iyanglin.com/jobs",
  },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ q?: string; type?: string; salary?: string; area?: string; edu?: string; exp?: string; page?: string }>;
};

export default async function JobsPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const query = (params.q || "").trim().toLowerCase();
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const pageSize = 12;

  const typeFilter = params.type || "all";
  const salaryFilter = params.salary || "all";
  const areaFilter = params.area || "all";
  const eduFilter = params.edu || "all";
  const expFilter = params.exp || "all";

  // 8 大规范职位分类
  const jobCategories: Record<string, string> = {
    all: "全部职位",
    network: "网络科技",
    sales: "市场销售",
    factory: "工厂普工",
    admin: "文职行政",
    driver: "司机配送",
    tech: "技术研发",
    service: "餐饮生活",
  };

  // 薪资区间字典
  const salaryRanges: Record<string, string> = {
    all: "不限薪资",
    u3000: "3000元以下/月",
    "3000-5000": "3000-5000元/月",
    "5000-8000": "5000-8000元/月",
    "8000-12000": "8000-12000元/月",
    "12000+": "12000元以上/月",
    negotiable: "面议",
  };

  // 区域商圈字典
  const areasList = ["全部区域", "杨林经开区", "大学城商业街", "杨林镇区", "嵩明县城", "周边园区"];

  // 学历要求字典
  const eduList = ["不限学历", "初中及以下", "中专/高中", "大专", "本科及以上"];

  // 经验要求字典
  const expList = ["不限经验", "应届生/实习", "1年以内", "1-3年", "3-5年", "5年以上"];

  const hasActiveFilters = Boolean(query) || [typeFilter, salaryFilter, areaFilter, eduFilter, expFilter].some((value) => value !== "all");
  const defaultPage = hasActiveFilters ? null : await listApprovedJobsPage(currentPage, pageSize);

  /* ======== 分区数据: 名企·置顶·急聘·兼职 ======== */
  const [topJobs, urgentJobs, parttimeJobs, featuredCompaniesRaw] = hasActiveFilters
    ? [[], [], [], []]
    : await Promise.all([
        prisma.job.findMany({
          where: { status: "APPROVED", isTop: true },
          orderBy: { createdAt: "desc" },
          take: 12,
        }),
        prisma.job.findMany({
          where: {
            status: "APPROVED",
            OR: [{ title: { contains: "急聘" } }, { title: { contains: "急招" } }, { title: { contains: "急需" } }],
          },
          orderBy: { createdAt: "desc" },
          take: 9,
        }),
        prisma.job.findMany({
          where: {
            status: "APPROVED",
            OR: [{ jobType: "parttime" }, { title: { contains: "兼职" } }],
          },
          orderBy: { createdAt: "desc" },
          take: 9,
        }),
        // 名企：真实 Company 实体（认证或推荐雇主优先）
        prisma.company.findMany({
          where: {
            status: "ACTIVE",
            OR: [{ isFeaturedEmployer: true }, { isVerified: true }, { verificationStatus: "VERIFIED" }],
          },
          include: {
            jobs: {
              where: { status: "APPROVED" },
              orderBy: { createdAt: "desc" },
              take: 4,
              select: { id: true, title: true, body: true, area: true },
            },
            _count: {
              select: { jobs: { where: { status: "APPROVED" } } },
            },
          },
          orderBy: [
            { isVerified: "desc" },
            { isFeaturedEmployer: "desc" },
            { updatedAt: "desc" },
          ],
          take: 8,
        }),
      ]);

  // 名企招聘：转换为结构化展示数据
  const topCompanies = (!hasActiveFilters && featuredCompaniesRaw.length > 0)
    ? featuredCompaniesRaw.map((fc: any) => ({
        id: fc.id,
        name: fc.name,
        logo: fc.logo,
        area: fc.address || "杨林经开区",
        jobCount: fc._count.jobs,
        isVerified: fc.isVerified && fc.verificationStatus === "VERIFIED",
        isFeaturedEmployer: fc.isFeaturedEmployer,
        positions: fc.jobs.map((j: any) => {
          const parsed = parseJobBody(j.body);
          return { id: j.id, title: parsed.jobTitle || j.title };
        }),
      }))
    : [];
  let items = defaultPage?.items || await listContent("job", undefined, { limit: 2500 });

  if (query) {
    const terms = query.split(/\s+/).filter(Boolean);
    items = items.filter((item) => {
      const fullText = `${item.title} ${item.company || ""} ${item.body} ${item.area || ""} ${item.category || ""}`.toLowerCase();
      return terms.every((t) => fullText.includes(t));
    });
  }

  if (typeFilter !== "all") {
    if (typeFilter === "hire") {
      items = items.filter((item) => item.jobType === "fulltime" || item.jobType === "hire" || !item.jobType);
    } else if (typeFilter === "resume") {
      items = items.filter((item) => item.jobType === "resume");
    } else if (typeFilter === "parttime") {
      items = items.filter((item) => item.jobType === "parttime" || item.jobType === "intern" || item.title.includes("兼职"));
    } else {
      items = items.filter((item) => `${item.title} ${item.body}`.includes(jobCategories[typeFilter] || typeFilter));
    }
  }

  const parsedItems = items.map((item) => ({ item, parsed: parseJobBody(item.body) }));

  let finalItems = parsedItems;
  if (areaFilter !== "all" && areaFilter !== "全部区域") {
    finalItems = finalItems.filter(({ parsed, item }) => (parsed.area || item.area || item.body || "").includes(areaFilter));
  }

  if (salaryFilter !== "all") {
    finalItems = finalItems.filter(({ parsed, item }) => {
      const sal = (parsed.salary || item.salary || item.body || "").toLowerCase();
      if (salaryFilter === "u3000") return sal.includes("3000") || sal.includes("2000") || sal.includes("2500");
      if (salaryFilter === "3000-5000") return sal.includes("3000") || sal.includes("4000") || sal.includes("5000");
      if (salaryFilter === "5000-8000") return sal.includes("5000") || sal.includes("6000") || sal.includes("7000") || sal.includes("8000");
      if (salaryFilter === "8000-12000") return sal.includes("8000") || sal.includes("10000") || sal.includes("12000") || sal.includes("1万");
      if (salaryFilter === "12000+") return sal.includes("12000") || sal.includes("15000") || sal.includes("2万") || sal.includes("以上");
      if (salaryFilter === "negotiable") return sal.includes("面议");
      return true;
    });
  }

  if (eduFilter !== "all" && eduFilter !== "不限学历") {
    finalItems = finalItems.filter(({ parsed, item }) => (parsed.education || item.body || "").includes(eduFilter.slice(0, 2)));
  }

  if (expFilter !== "all" && expFilter !== "不限经验") {
    finalItems = finalItems.filter(({ parsed, item }) => (parsed.experience || item.body || "").includes(expFilter.slice(0, 2)));
  }

  const totalItems = defaultPage?.total ?? finalItems.length;
  const paginatedItems = defaultPage ? finalItems : finalItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const buildQuery = (override: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    p.set("type", override.type !== undefined ? override.type : typeFilter);
    p.set("salary", override.salary !== undefined ? override.salary : salaryFilter);
    p.set("area", override.area !== undefined ? override.area : areaFilter);
    p.set("edu", override.edu !== undefined ? override.edu : eduFilter);
    p.set("exp", override.exp !== undefined ? override.exp : expFilter);
    const targetPage = override.page !== undefined ? Number(override.page) : (override.type || override.salary || override.area || override.edu || override.exp ? 1 : currentPage);
    if (targetPage > 1) p.set("page", String(targetPage));
    return `/jobs?${p.toString()}`;
  };

  return (
    <div className="template-page jobzilla-page" style={{ minHeight: "100vh", background: "#F9FAFB", color: "#17171D" }}>
      <style>{`
        @media (max-width: 768px) {
          .jobzilla-three-col { display: none !important; }
          .jobzilla-filter-panel { padding: 16px 12px !important; }
          .jobzilla-grid-cards { grid-template-columns: minmax(0, 1fr) !important; overflow: hidden !important; }
          .jobzilla-grid-cards > * { min-width: 0 !important; max-width: 100% !important; overflow: hidden !important; box-sizing: border-box !important; }
          .jobzilla-hero h1 { font-size: 22px !important; }
          .jobzilla-hero p { font-size: 13px !important; }
          .jobzilla-section-box { padding: 16px 12px 12px !important; }
          .jobzilla-search { flex-direction: column !important; }
          .jobzilla-search button { width: 100% !important; }
          .jobzilla-shell { padding: 0 12px !important; }
          .jobzilla-page section { padding-left: 10px !important; padding-right: 10px !important; }
        }
      `}</style>
      <Navbar />

      {/* =========================================================================
          1. Jobzilla 经典 Hero 大横幅 (领英蓝高雅渐变 + 浮动搜索条)
          ========================================================================= */}
      <section
        className="jobzilla-hero"
        style={{
          background: "linear-gradient(135deg, #0B2240 0%, #1967D2 55%, #124DA0 100%)",
          color: "#ffffff",
          padding: "2.5rem 0 3rem 0",
          position: "relative",
          overflow: "hidden",
          borderBottom: "3px solid #FD7E14",
        }}
      >
        {/* 背景轻微光晕装饰 */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "480px",
            height: "480px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(253,126,20,0.15) 0%, rgba(25,103,210,0) 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="jobzilla-shell" style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.25rem", position: "relative", zIndex: 2 }}>
          {/* 面包屑导航 (纯中文) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.75)", marginBottom: "1.25rem" }}>
            <Link prefetch={false} href="/" style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>网站首页</Link>
            <span>/</span>
            <span style={{ color: "#FD7E14", fontWeight: "700" }}>求职招聘</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "24px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(253,126,20,0.2)", border: "1px solid rgba(253,126,20,0.4)", borderRadius: "20px", padding: "4px 14px", fontSize: "12px", color: "#FFD0A8", fontWeight: "700", marginBottom: "10px" }}>
                <span>✦</span> 嵩明杨林 · 本地名企优岗直聘平台
              </div>
              <h1 style={{ margin: "0 0 10px 0", fontSize: "32px", fontWeight: "900", letterSpacing: "-0.01em", lineHeight: "1.2" }}>
                杨林人才直聘 · 汇聚本地名企优岗
              </h1>
              <p style={{ margin: 0, fontSize: "14.5px", color: "rgba(255,255,255,0.85)", maxWidth: "620px", lineHeight: "1.6" }}>
                聚合杨林经开区先进制造、大学城商圈、现代物流与优质民企。真实岗位、直通薪资，与企业负责人直接沟通。
              </p>
            </div>

            {/* 右侧行动呼吁 (CTA 按钮群) */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <Link
                prefetch={false}
                href="/jobs/new"
                style={{
                  background: "linear-gradient(135deg, #FD7E14 0%, #E86A00 100%)",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "14.5px",
                  fontWeight: "800",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  textDecoration: "none",
                  boxShadow: "0 8px 20px rgba(253,126,20,0.35)",
                }}
              >
                <span>➕</span> 我要免费发布职位
              </Link>
              <Link
                prefetch={false}
                href="/publish"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  fontSize: "14.5px",
                  fontWeight: "700",
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.3)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <span>📝</span> 登记求职意向
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          1.5 + 2. 三栏导航 + 筛选面板（合并为一个容器）
          ========================================================================= */}
      <section style={{ maxWidth: "1240px", margin: "20px auto 0 auto", padding: "0 1.25rem", position: "relative", zIndex: 10 }}>
        <div style={{ background: "#ffffff", borderRadius: "14px", boxShadow: "0 10px 30px rgba(25,103,210,0.08)", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          {/* 三栏导航区 */}
          <div className="jobzilla-three-col" style={{ display: "grid", gridTemplateColumns: "200px 1fr 280px", gap: "0" }}>
            {/* 左栏：行业分类 */}
            <div style={{ borderRight: "1px solid #F3F4F6" }}>
              {[
                { label: "生活服务", icon: "🏠", type: "service" },
                { label: "业务销售", icon: "📊", type: "sales" },
                { label: "技术工人", icon: "🔧", type: "factory" },
                { label: "文职行政", icon: "📋", type: "admin" },
                { label: "司机配送", icon: "🚚", type: "driver" },
                { label: "技术研发", icon: "💻", type: "tech" },
                { label: "网络科技", icon: "🌐", type: "network" },
                { label: "教育培训", icon: "🎓", type: "service" },
                { label: "餐饮美食", icon: "🍜", type: "service" },
              ].map((cat) => (
                <Link
                  key={cat.label}
                  prefetch={false}
                  href={`/jobs?type=${cat.type}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", fontSize: "13.5px", color: "#374151", textDecoration: "none", borderBottom: "1px solid #F9FAFB", transition: "background 0.1s" }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px" }}>{cat.icon}</span>
                    {cat.label}
                  </span>
                  <span style={{ color: "#D1D5DB", fontSize: "12px" }}>›</span>
                </Link>
              ))}
            </div>

            {/* 中栏：招聘横幅 */}
            <div style={{ position: "relative", background: "linear-gradient(135deg, #0B2240 0%, #1967D2 60%, #2B7DE9 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(253,126,20,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "8px", letterSpacing: "2px" }}>嵩明杨林 · 本地招聘平台</div>
                <div style={{ fontSize: "24px", fontWeight: "900", color: "#ffffff", lineHeight: 1.3, marginBottom: "10px" }}>企业直招<br />好工作 · 在身边</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", marginBottom: "14px" }}>4000+ 真实岗位 · 覆盖杨林全区域</div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <Link prefetch={false} href="/jobs/new" style={{ background: "#FD7E14", color: "#fff", padding: "8px 20px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", textDecoration: "none" }}>免费发布职位</Link>
                  <Link prefetch={false} href="/jobs/resumes" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "8px 20px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", textDecoration: "none", border: "1px solid rgba(255,255,255,0.3)" }}>人才简历库</Link>
                </div>
              </div>
            </div>

            {/* 右栏：职场资讯 */}
            <div style={{ borderLeft: "1px solid #F3F4F6", padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: "16px", fontWeight: "900", color: "#17171D" }}>职场</span>
                <span style={{ fontSize: "16px", fontWeight: "900", color: "#FD7E14" }}>资讯</span>
              </div>
              {[
                { title: "面试技巧：如何在30秒内打动面试官", date: "09-03" },
                { title: "简历优化：5个关键要素提升通过率", date: "09-02" },
                { title: "职场新人必知的薪资谈判策略", date: "09-01" },
                { title: "杨林经开区企业用工趋势分析", date: "08-30" },
                { title: "制造业转型：新技能需求解读", date: "08-28" },
                { title: "劳动法常识：试用期权益保障", date: "08-25" },
              ].map((article, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "7px 0", borderBottom: i < 5 ? "1px dashed #F3F4F6" : "none" }}>
                  <span style={{ color: "#FD7E14", fontSize: "8px", marginTop: "6px", flexShrink: 0 }}>●</span>
                  <span style={{ fontSize: "13px", color: "#374151", lineHeight: "1.5", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{article.title}</span>
                  <span style={{ fontSize: "12px", color: "#9CA3AF", whiteSpace: "nowrap", flexShrink: 0 }}>{article.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 筛选面板 */}
          <div className="jobzilla-filter-panel" style={{ borderTop: "1px solid #E5E7EB", padding: "22px 26px" }}>
          {/* 顶栏：综合搜索栏 */}
          <form className="jobzilla-search" action="/jobs" method="GET" style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="请输入职位关键词、企业名称或专业技能（如：普工、会计、销售、仓管）"
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 16px 0 42px",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  fontSize: "14px",
                  outline: "none",
                  background: "#F9FAFB",
                }}
              />
              <span style={{ position: "absolute", left: "14px", top: "14px", fontSize: "16px", color: "#9CA3AF" }}>🔍</span>
            </div>
            <button
              type="submit"
              style={{
                height: "46px",
                padding: "0 28px",
                background: "#1967D2",
                color: "#ffffff",
                borderRadius: "8px",
                border: "none",
                fontSize: "14.5px",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(25,103,210,0.25)",
              }}
            >
              搜索职位
            </button>
          </form>

          {/* 维度 1: 职位类别大标签 (Jobzilla 分类条) */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", borderTop: "1px solid #F3F4F6", paddingTop: "16px", marginBottom: "14px" }}>
            {Object.entries(jobCategories).map(([key, label]) => {
              const active = typeFilter === key;
              return (
                <Link
                  prefetch={false}
                  key={key}
                  href={buildQuery({ type: key })}
                  style={{
                    padding: "6px 18px",
                    borderRadius: "6px",
                    background: active ? "#1967D2" : "#F0F6FE",
                    color: active ? "#ffffff" : "#1967D2",
                    fontWeight: active ? "800" : "600",
                    fontSize: "13.5px",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* 维度 2: 薪资区间 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", fontSize: "13.5px", marginBottom: "12px", borderTop: "1px dashed #E5E7EB", paddingTop: "12px" }}>
            <span style={{ color: "#17171D", fontWeight: "800", whiteSpace: "nowrap", flexShrink: 0, paddingTop: "4px" }}>
              薪资范围：
            </span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: 1 }}>
              {Object.entries(salaryRanges).map(([key, label]) => {
                const active = salaryFilter === key;
                return (
                  <Link
                    prefetch={false}
                    key={key}
                    href={buildQuery({ salary: key })}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      background: active ? "#FD7E14" : "#F9FAFB",
                      color: active ? "#ffffff" : "#4B5563",
                      fontWeight: active ? "800" : "500",
                      textDecoration: "none",
                      border: active ? "1px solid #FD7E14" : "1px solid #E5E7EB",
                    }}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 维度 3: 工作区域 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", fontSize: "13.5px", borderTop: "1px dashed #E5E7EB", paddingTop: "12px" }}>
            <span style={{ color: "#17171D", fontWeight: "800", whiteSpace: "nowrap", flexShrink: 0, paddingTop: "4px" }}>
              工作区域：
            </span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: 1 }}>
              {areasList.map((area) => {
                const active = areaFilter === area;
                return (
                  <Link
                    prefetch={false}
                    key={area}
                    href={buildQuery({ area: area === "全部区域" ? "all" : area })}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      background: active ? "#1967D2" : "#F9FAFB",
                      color: active ? "#ffffff" : "#4B5563",
                      fontWeight: active ? "800" : "500",
                      textDecoration: "none",
                      border: active ? "1px solid #1967D2" : "1px solid #E5E7EB",
                    }}
                  >
                    {area}
                  </Link>
                );
              })}
            </div>
          </div>
          {/* 筛选面板结束 */}
        </div>
        {/* 合并容器结束 */}
      </div>
      </section>

      {/* =========================================================================
          3. 分区板块 (默认视图) 或 筛选结果
          ========================================================================= */}

      {/* 招聘频道顶部广告位 */}
      <AdBanner placementKey="JOB_TOP" maxItems={2} hidePlaceholder />

      {!hasActiveFilters && topCompanies.length > 0 && (
        /* ── 🏢 名企招聘 ── */
        <section style={{ maxWidth: "1240px", margin: "2rem auto 0 auto", padding: "0 1.25rem" }}>
          <div className="jobzilla-section-box" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #E5E7EB", padding: "28px 28px 20px", boxShadow: "0 4px 16px rgba(25,103,210,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid #F3F4F6", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "4px", height: "22px", background: "#1967D2", borderRadius: "2px" }} />
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#17171D" }}>名企招聘</h2>
                <span style={{ fontSize: "13px", color: "#64748B" }}>汇聚嵩明杨林经开区与大学城重点用工单位</span>
              </div>
              <Link href="/jobs/companies" style={{ fontSize: "13px", fontWeight: "700", color: "#1967D2", textDecoration: "none" }}>
                查看全部用人单位 &gt;
              </Link>
            </div>
            <div className="jobzilla-grid-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "14px" }}>
              {topCompanies.map((company) => (
                <div key={company.id || company.name} style={{ border: "1px solid #E5E7EB", borderRadius: "10px", padding: "16px 18px", background: "#ffffff", display: "flex", gap: "14px", alignItems: "flex-start", transition: "box-shadow 0.15s, transform 0.15s" }}>
                  <Link
                    href={`/company/${company.id}`}
                    style={{ textDecoration: "none", flexShrink: 0 }}
                    title={`进入 ${company.name} 企业主页`}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "8px",
                        background: company.logo ? `#ffffff url(${company.logo}) center/contain no-repeat` : "linear-gradient(135deg, #1967D2 0%, #0F4FA8 100%)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: "900",
                        boxShadow: "0 2px 8px rgba(25,103,210,0.15)",
                      }}
                    >
                      {!company.logo && company.name.slice(0, 1)}
                    </div>
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <Link
                        href={`/company/${company.id}`}
                        style={{ fontSize: "14.5px", fontWeight: "800", color: "#17171D", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}
                        title={company.name}
                      >
                        {company.name}
                      </Link>
                      {company.isVerified ? (
                        <span style={{ background: "#DCFCE7", color: "#166534", fontSize: "10px", fontWeight: "700", padding: "1px 8px", borderRadius: "3px", border: "1px solid #BBF7D0", whiteSpace: "nowrap" }}>
                          已认证
                        </span>
                      ) : (
                        <span style={{ background: "#F1F5F9", color: "#64748B", fontSize: "10px", fontWeight: "600", padding: "1px 6px", borderRadius: "3px", whiteSpace: "nowrap" }}>
                          平台收录
                        </span>
                      )}
                      {company.isFeaturedEmployer && (
                        <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: "10px", fontWeight: "700", padding: "1px 6px", borderRadius: "3px", whiteSpace: "nowrap" }}>
                          推荐
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "8px" }}>
                      📍 {company.area} · <span style={{ color: "#1967D2", fontWeight: "700" }}>{company.jobCount}</span> 个在招职位
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {company.positions.map((pos: any, i: number) => (
                        <Link
                          key={i}
                          href={`/jobs/${pos.id}`}
                          style={{ fontSize: "11.5px", color: "#1967D2", fontWeight: "600", background: "#F0F6FE", padding: "1px 8px", borderRadius: "3px", textDecoration: "none" }}
                        >
                          {pos.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!hasActiveFilters && topJobs.length > 0 && (
        /* ── 📌 置顶推荐（付费） ── */
        <section style={{ maxWidth: "1240px", margin: "1.25rem auto 0 auto", padding: "0 1.25rem" }}>
          <div className="jobzilla-section-box" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #E5E7EB", padding: "28px 28px 20px", boxShadow: "0 4px 16px rgba(25,103,210,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ width: "4px", height: "22px", background: "#FD7E14", borderRadius: "2px" }} />
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#17171D" }}>置顶推荐</h2>
              <span style={{ background: "#FD7E14", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "2px 10px", borderRadius: "3px" }}>收费</span>
              <span style={{ fontSize: "13px", color: "#9CA3AF" }}>优质雇主精选推荐，优先展示</span>
            </div>
            <div className="jobzilla-grid-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "14px" }}>
              {topJobs.map((job) => {
                const p = parseJobBody(job.body);
                const title = p.jobTitle || job.title;
                const sal = p.salary || job.salary || "面议";
                const benefits = (p.benefits || "").split(/[,，、\s]+/).filter(Boolean).slice(0, 4);
                if (benefits.length === 0) benefits.push("包吃住", "五险一金");
                const timeAgo = (() => { const d = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000); return d < 1 ? "今天" : d < 7 ? `${d}天前` : d < 30 ? `${Math.floor(d / 7)}周前` : `${Math.floor(d / 30)}月前`; })();
                return (
                  <div key={job.id} style={{ border: "1px solid #E5E7EB", borderLeft: "3px solid #FD7E14", borderRadius: "10px", padding: "16px 18px", background: "#ffffff", position: "relative" }}>
                    <span style={{ position: "absolute", top: "10px", right: "12px", background: "#FD7E14", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "3px" }}>置顶</span>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", paddingRight: "50px" }}>
                      <Link prefetch={false} href={`/jobs/${job.id}`} style={{ fontSize: "15px", fontWeight: "800", color: "#17171D", textDecoration: "none" }}>{title}</Link>
                      <span style={{ fontSize: "12px", color: "#9CA3AF", whiteSpace: "nowrap" }}>{timeAgo}</span>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "#FD7E14", marginBottom: "6px" }}>{sal}</div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                      {benefits.map((tag, i) => (
                        <span key={i} style={{ fontSize: "11px", color: "#1967D2", background: "#F0F6FE", padding: "1px 8px", borderRadius: "3px", fontWeight: "600" }}>{tag}</span>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12.5px", color: "#6B7280" }}>{job.company}</span>
                      <Link prefetch={false} href={`/jobs/${job.id}`} style={{ background: "#1967D2", color: "#fff", padding: "5px 16px", borderRadius: "5px", fontSize: "12.5px", fontWeight: "700", textDecoration: "none" }}>申请</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 🆕 最新工作 ── */}
      <section style={{ maxWidth: "1240px", margin: "1.25rem auto 0 auto", padding: "0 1.25rem" }}>
        <div className="jobzilla-section-box" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #E5E7EB", padding: "28px 28px 20px", boxShadow: "0 4px 16px rgba(25,103,210,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ width: "4px", height: "22px", background: "#1967D2", borderRadius: "2px" }} />
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#17171D" }}>
              {hasActiveFilters ? "搜索结果" : "最新工作"}
            </h2>
            <span style={{ fontSize: "13px", color: "#9CA3AF" }}>
              共 <b style={{ color: "#1967D2" }}>{totalItems}</b> 个岗位 · 最新发布优先
            </span>
          </div>

          {paginatedItems.length === 0 ? (
            <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>💼</div>
              <h3 style={{ margin: "0 0 8px 0", color: "#17171D", fontSize: "20px", fontWeight: "800" }}>暂无符合条件的招聘岗位</h3>
              <p style={{ color: "#6B7280", fontSize: "14px", margin: "0 0 1.5rem 0" }}>您可以尝试重置筛选条件，或在上方搜索其他职位关键词。</p>
              <Link prefetch={false} href="/jobs" style={{ background: "#1967D2", color: "#ffffff", padding: "10px 28px", borderRadius: "6px", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>查看全部职位</Link>
            </div>
          ) : (
            <div className="jobzilla-grid-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "14px" }}>
              {paginatedItems.map(({ item, parsed }) => {
                const jobTitle = parsed.jobTitle || item.title;
                const companyName = item.company || "嵩明本地优质企业";
                const salaryStr = parsed.salary || item.salary || "面议";
                const areaStr = parsed.area || item.area || "杨林经开区";
                const benefits = (parsed.benefits || "").split(/[,，、\s]+/).filter(Boolean).slice(0, 3);
                if (benefits.length === 0) benefits.push("包吃住", "五险一金");
                const timeAgo = (() => { const d = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 86400000); return d < 1 ? "今天" : d < 7 ? `${d}天前` : d < 30 ? `${Math.floor(d / 7)}周前` : `${Math.floor(d / 30)}月前`; })();

                return (
                  <div key={item.id} style={{ border: "1px solid #E5E7EB", borderRadius: "10px", padding: "16px 18px", background: "#ffffff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <Link prefetch={false} href={`/jobs/${item.id}`} style={{ fontSize: "15px", fontWeight: "800", color: "#17171D", textDecoration: "none", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{jobTitle}</Link>
                      <span style={{ fontSize: "12px", color: "#9CA3AF", whiteSpace: "nowrap", marginLeft: "8px" }}>{timeAgo}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "15px", fontWeight: "800", color: "#FD7E14" }}>{salaryStr}</span>
                      <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{areaStr}</span>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                      {benefits.map((tag, i) => (
                        <span key={i} style={{ fontSize: "11px", color: "#1967D2", background: "#F0F6FE", padding: "1px 8px", borderRadius: "3px", fontWeight: "600" }}>{tag}</span>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12.5px", color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{companyName}</span>
                      <Link prefetch={false} href={`/jobs/${item.id}`} style={{ background: "#1967D2", color: "#fff", padding: "5px 16px", borderRadius: "5px", fontSize: "12.5px", fontWeight: "700", textDecoration: "none", whiteSpace: "nowrap" }}>申请</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 分页 */}
          {totalItems > pageSize && (
            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center" }}>
              <Pagination currentPage={currentPage} totalItems={totalItems} pageSize={pageSize} buildUrl={(p) => buildQuery({ page: String(p) })} />
            </div>
          )}
        </div>
      </section>

      {!hasActiveFilters && urgentJobs.length > 0 && (
        /* ── 🔥 急聘工作 ── */
        <section style={{ maxWidth: "1240px", margin: "1.25rem auto 0 auto", padding: "0 1.25rem" }}>
          <div className="jobzilla-section-box" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #E5E7EB", padding: "28px 28px 20px", boxShadow: "0 4px 16px rgba(25,103,210,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ width: "4px", height: "22px", background: "#EF4444", borderRadius: "2px" }} />
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#17171D" }}>急聘工作</h2>
              <span style={{ fontSize: "13px", color: "#9CA3AF" }}>企业急招岗位，即刻上岗</span>
            </div>
            <div className="jobzilla-grid-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "14px" }}>
              {urgentJobs.map((job) => {
                const p = parseJobBody(job.body);
                const title = p.jobTitle || job.title;
                const sal = p.salary || job.salary || "面议";
                const benefits = (p.benefits || "").split(/[,，、\s]+/).filter(Boolean).slice(0, 3);
                if (benefits.length === 0) benefits.push("包吃住", "五险一金");
                const timeAgo = (() => { const d = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000); return d < 1 ? "今天" : d < 7 ? `${d}天前` : d < 30 ? `${Math.floor(d / 7)}周前` : `${Math.floor(d / 30)}月前`; })();
                return (
                  <div key={job.id} style={{ border: "1px solid #E5E7EB", borderLeft: "3px solid #EF4444", borderRadius: "10px", padding: "16px 18px", background: "#ffffff", position: "relative" }}>
                    <span style={{ position: "absolute", top: "10px", right: "12px", background: "#EF4444", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "3px" }}>急</span>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", paddingRight: "40px" }}>
                      <Link prefetch={false} href={`/jobs/${job.id}`} style={{ fontSize: "15px", fontWeight: "800", color: "#17171D", textDecoration: "none" }}>{title}</Link>
                      <span style={{ fontSize: "12px", color: "#9CA3AF", whiteSpace: "nowrap" }}>{timeAgo}</span>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "#FD7E14", marginBottom: "6px" }}>{sal}</div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                      {benefits.map((tag, i) => (
                        <span key={i} style={{ fontSize: "11px", color: "#1967D2", background: "#F0F6FE", padding: "1px 8px", borderRadius: "3px", fontWeight: "600" }}>{tag}</span>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12.5px", color: "#6B7280" }}>{job.company}</span>
                      <Link prefetch={false} href={`/jobs/${job.id}`} style={{ background: "#1967D2", color: "#fff", padding: "5px 16px", borderRadius: "5px", fontSize: "12.5px", fontWeight: "700", textDecoration: "none" }}>申请</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {!hasActiveFilters && parttimeJobs.length > 0 && (
        /* ── 💼 靠谱兼职 ── */
        <section style={{ maxWidth: "1240px", margin: "1.25rem auto 0 auto", padding: "0 1.25rem" }}>
          <div className="jobzilla-section-box" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #E5E7EB", padding: "28px 28px 20px", boxShadow: "0 4px 16px rgba(25,103,210,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ width: "4px", height: "22px", background: "#10B981", borderRadius: "2px" }} />
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#17171D" }}>靠谱兼职</h2>
              <span style={{ fontSize: "13px", color: "#9CA3AF" }}>灵活时间、日结周结，适合学生与上班族</span>
            </div>
            <div className="jobzilla-grid-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "14px" }}>
              {parttimeJobs.map((job) => {
                const p = parseJobBody(job.body);
                const title = p.jobTitle || job.title;
                const sal = p.salary || job.salary || "面议";
                const benefits = (p.benefits || "").split(/[,，、\s]+/).filter(Boolean).slice(0, 3);
                if (benefits.length === 0) benefits.push("时间灵活", "日结周结");
                const timeAgo = (() => { const d = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000); return d < 1 ? "今天" : d < 7 ? `${d}天前` : d < 30 ? `${Math.floor(d / 7)}周前` : `${Math.floor(d / 30)}月前`; })();
                return (
                  <div key={job.id} style={{ border: "1px solid #E5E7EB", borderLeft: "3px solid #10B981", borderRadius: "10px", padding: "16px 18px", background: "#ffffff", position: "relative" }}>
                    <span style={{ position: "absolute", top: "10px", right: "12px", background: "#10B981", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "3px" }}>兼职</span>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", paddingRight: "50px" }}>
                      <Link prefetch={false} href={`/jobs/${job.id}`} style={{ fontSize: "15px", fontWeight: "800", color: "#17171D", textDecoration: "none" }}>{title}</Link>
                      <span style={{ fontSize: "12px", color: "#9CA3AF", whiteSpace: "nowrap" }}>{timeAgo}</span>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "#10B981", marginBottom: "6px" }}>{sal}</div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                      {benefits.map((tag, i) => (
                        <span key={i} style={{ fontSize: "11px", color: "#059669", background: "#ECFDF5", padding: "1px 8px", borderRadius: "3px", fontWeight: "600" }}>{tag}</span>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12.5px", color: "#6B7280" }}>{job.company}</span>
                      <Link prefetch={false} href={`/jobs/${job.id}`} style={{ background: "#10B981", color: "#fff", padding: "5px 16px", borderRadius: "5px", fontSize: "12.5px", fontWeight: "700", textDecoration: "none" }}>申请</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          4.5 广告横幅
          ========================================================================= */}
      <AdBanner placementKey="JOBS_BOTTOM" maxItems={2} />

      {/* =========================================================================
          5. 底部 Jobzilla 服务承诺与求职安全提示
          ========================================================================= */}
      <section className="jobzilla-shell" style={{ maxWidth: "1240px", margin: "3.5rem auto 0 auto", padding: "0 1.25rem" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #17171D 0%, #1967D2 100%)",
            borderRadius: "16px",
            padding: "2.5rem 2rem",
            color: "#ffffff",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
            border: "1px solid rgba(25,103,210,0.3)",
          }}
        >
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(255,255,255,0.15)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
              🛡️
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>企业真实核验</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "1.5" }}>
                严格审核企业营业执照与招聘资质，杜绝虚构职位。
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(255,255,255,0.15)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
              ⚡
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>极速直面沟通</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "1.5" }}>
                直通企业人事与部门主管电话，省去繁琐中间等待。
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(255,255,255,0.15)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
              🔒
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>个人隐私守护</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "1.5" }}>
                联系方式严格脱敏保护，求职过程安全无骚扰。
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
