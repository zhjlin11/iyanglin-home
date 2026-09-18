import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import JobSubNav from "@/components/JobSubNav";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "杨林用人单位 - 找公司 | 杨林招聘",
  description: "浏览杨林地区用人单位，查看企业招聘信息，找到适合你的好公司。",
  keywords: ["杨林企业", "杨林用人单位", "杨林公司招聘", "嵩明企业", "杨林工业园区企业"],
  alternates: { canonical: "https://iyanglin.com/jobs/companies" },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ q?: string; area?: string }>;
};

type CompanyInfo = {
  name: string;
  jobCount: number;
  area: string;
  titles: string[];
  latestDate: Date;
};

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const query = (params.q || "").trim().toLowerCase();
  const areaFilter = params.area || "all";

  const dbCompanies = await prisma.company.findMany({
    where: {
      status: "ACTIVE",
      ...(query ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as any } },
          { shortName: { contains: query, mode: "insensitive" as any } },
          { industry: { contains: query, mode: "insensitive" as any } },
          { jobs: { some: { title: { contains: query, mode: "insensitive" as any }, status: "APPROVED" } } },
        ],
      } : {}),
      ...(areaFilter !== "all" ? {
        address: { contains: areaFilter },
      } : {}),
    },
    include: {
      jobs: {
        where: { status: "APPROVED" },
        select: { title: true },
        take: 5,
        orderBy: { createdAt: "desc" },
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
    take: 120,
  });

  const companies = dbCompanies.map((c) => ({
    id: c.id,
    name: c.name,
    jobCount: c._count.jobs,
    area: c.address || "杨林经开区",
    industry: c.industry || "综合产业",
    isVerified: c.isVerified && c.verificationStatus === "VERIFIED",
    isFeatured: c.isFeaturedEmployer,
    titles: c.jobs.map((j) => j.title),
  }));

  const areas = ["杨林地区", "杨林工业园区", "杨林大学城", "杨林镇", "嵩明"];

  return (
    <main className="page-layout">
      <Navbar />

      <section className="page-header-compact">
        <div className="shell">
          <span className="eyebrow-tag">用人单位</span>
          <div className="hero-header" style={{ flexWrap: "wrap", gap: "12px" }}>
            <div className="hero-title-group">
              <h1 style={{ fontSize: "clamp(20px, 4vw, 24px)" }}>杨林用人单位</h1>
              <p>为您优选 {companies.length} 个靠谱单位，覆盖杨林工业园区及大学城</p>
            </div>
            <a href="/jobs/new" className="button button-primary" style={{ whiteSpace: "nowrap" }}>
              + 免费发布招聘
            </a>
          </div>

          <form className="search-box-compact" action="/jobs/companies" style={{ marginTop: "12px" }}>
            <input aria-label="搜索公司" name="q" defaultValue={params.q || ""} placeholder="搜索公司名称或职位..." style={{ minWidth: 0 }} />
            {areaFilter !== "all" && <input type="hidden" name="area" value={areaFilter} />}
            <button className="button button-primary" type="submit" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
              搜索
            </button>
          </form>
        </div>
      </section>

      <section className="shell" style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
        <JobSubNav active="companies" />

        <div style={{ display: "flex", gap: "10px", marginBottom: "1rem", overflowX: "auto", paddingBottom: "4px" }}>
          <a
            href="/jobs/companies"
            style={{
              padding: "6px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: areaFilter === "all" ? "bold" : "normal",
              background: areaFilter === "all" ? "var(--brand)" : "#f1f5f9",
              color: areaFilter === "all" ? "#fff" : "var(--ink-secondary)",
              textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            全部区域
          </a>
          {areas.map((a) => (
            <a
              key={a}
              href={`/jobs/companies?area=${encodeURIComponent(a)}${query ? `&q=${encodeURIComponent(params.q || "")}` : ""}`}
              style={{
                padding: "6px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: areaFilter === a ? "bold" : "normal",
                background: areaFilter === a ? "var(--brand)" : "#f1f5f9",
                color: areaFilter === a ? "#fff" : "var(--ink-secondary)",
                textDecoration: "none", whiteSpace: "nowrap",
              }}
            >
              {a}
            </a>
          ))}
        </div>

        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "1rem" }}>
          共 <b>{companies.length}</b> 家企业
          {areaFilter !== "all" ? ` · 区域：${areaFilter}` : ""}
          {query ? ` · 搜索：${params.q}` : ""}
        </p>

        {companies.length === 0 ? (
          <div className="op-empty-card">
            <h4>暂无匹配企业</h4>
            <p>试试更换关键词或清除筛选条件。</p>
            <a href="/jobs/companies" className="button button-secondary">清除筛选</a>
          </div>
        ) : (
          <div className="company-grid">
            {companies.map((c) => (
              <a
                key={c.id || c.name}
                href={`/company/${c.id}`}
                className="company-card"
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
                  <h3 className="company-card-name" style={{ margin: 0 }}>{c.name}</h3>
                  {c.isVerified && (
                    <span style={{ fontSize: "10.5px", background: "#DCFCE7", color: "#166534", padding: "1px 6px", borderRadius: "3px", fontWeight: "700", whiteSpace: "nowrap" }}>
                      已认证
                    </span>
                  )}
                  {!c.isVerified && c.isFeatured && (
                    <span style={{ fontSize: "10.5px", background: "#FEF3C7", color: "#92400E", padding: "1px 6px", borderRadius: "3px", fontWeight: "700", whiteSpace: "nowrap" }}>
                      名企
                    </span>
                  )}
                </div>
                <div className="company-card-meta">
                  <span>📍 {c.area}</span>
                  <span>·</span>
                  <span>🏢 {c.industry}</span>
                  <span>·</span>
                  <span style={{ color: "var(--brand-dark)", fontWeight: 600 }}>
                    {c.jobCount} 个在招职位
                  </span>
                </div>
                {c.titles.length > 0 && (
                  <div className="company-card-jobs">
                    {c.titles.slice(0, 4).map((t, i) => (
                      <span key={i} className="company-card-job-tag">{t}</span>
                    ))}
                    {c.titles.length > 4 && (
                      <span className="company-card-job-tag" style={{ color: "var(--brand)" }}>
                        +{c.jobCount - 4}
                      </span>
                    )}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
