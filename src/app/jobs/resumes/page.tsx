import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import JobSubNav from "@/components/JobSubNav";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "杨林本地人才库 - 找人才 | 杨林招聘",
  description: "浏览杨林职教园区与全县本地求职者简历，覆盖行政文员、数控技工、财务会计、厨师、销售等各行各业人才。",
  keywords: ["杨林人才", "杨林求职", "杨林简历", "嵩明找人才", "杨林本地人才库", "职教园区毕业生"],
  alternates: { canonical: "https://iyanglin.com/jobs/resumes" },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ q?: string; edu?: string }>;
};

export default async function ResumesPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const query = (params.q || "").trim();
  const edu = (params.edu || "").trim();

  const where: Record<string, any> = {
    status: "APPROVED",
  };

  if (edu && edu !== "ALL") {
    where.education = edu;
  }

  if (query) {
    where.OR = [
      { name: { contains: query } },
      { targetJob: { contains: query } },
      { skills: { contains: query } },
      { intro: { contains: query } },
    ];
  }

  const resumes = await prisma.resume.findMany({
    where,
    orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  const currentYear = new Date().getFullYear();

  return (
    <main className="page-layout">
      <Navbar />

      <section className="page-header-compact">
        <div className="shell">
          <span className="eyebrow-tag">本地人才大厅</span>
          <div className="hero-header" style={{ flexWrap: "wrap", gap: "12px" }}>
            <div className="hero-title-group">
              <h1 style={{ fontSize: "clamp(20px, 4vw, 24px)" }}>杨林本地人才库</h1>
              <p>汇聚职教园区优质毕业生与各行各业本地精英人才，直联候选人</p>
            </div>
            <a href="/publish" className="button button-primary" style={{ whiteSpace: "nowrap" }}>
              + 免费登记求职简历
            </a>
          </div>

          <form className="search-box-compact" action="/jobs/resumes" style={{ marginTop: "12px" }}>
            <input
              aria-label="搜索人才"
              name="q"
              defaultValue={params.q || ""}
              placeholder="搜索职位意向、姓名、专业技能..."
              style={{ minWidth: 0 }}
            />
            <button className="button button-primary" type="submit" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
              搜索人才
            </button>
          </form>
        </div>
      </section>

      <section className="shell" style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
        <JobSubNav active="resumes" />

        {/* 学历快捷筛选 */}
        <div style={{ display: "flex", gap: "8px", margin: "1rem 0", flexWrap: "wrap" }}>
          {[
            { label: "全部学历", value: "" },
            { label: "本科", value: "本科" },
            { label: "大专", value: "大专" },
            { label: "中专/高中", value: "高中/中专" },
          ].map((item) => (
            <a
              key={item.label}
              href={`/jobs/resumes?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(item.value ? { edu: item.value } : {}) }).toString()}`}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                textDecoration: "none",
                fontWeight: (params.edu || "") === item.value ? "bold" : "normal",
                background: (params.edu || "") === item.value ? "#0B7A75" : "#f1f5f9",
                color: (params.edu || "") === item.value ? "white" : "#475569",
              }}
            >
              {item.label}
            </a>
          ))}
        </div>

        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "1rem" }}>
          共 <b>{resumes.length}</b> 位本地求职者
          {query ? ` · 关键词：${query}` : ""}
        </p>

        {resumes.length === 0 ? (
          <div className="op-empty-card">
            <h4>暂无匹配的求职者简历</h4>
            <p>
              本地人才库正在持续吸纳中，欢迎杨林高校学子与求职人才免费入驻！
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/publish" className="button button-primary">
                + 免费录入求职简历
              </a>
              {query && (
                <a href="/jobs/resumes" className="button button-secondary">
                  清除筛选
                </a>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1rem" }}>
            {resumes.map((r) => {
              const initial = r.name.charAt(0);
              const age = currentYear - r.birthYear;

              return (
                <div
                  key={r.id}
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            background: r.gender === "female" ? "#fce7f3" : "#dbeafe",
                            color: r.gender === "female" ? "#be185d" : "#1d4ed8",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: "16px",
                          }}
                        >
                          {initial}
                        </span>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <strong style={{ fontSize: "16px", color: "var(--foreground)" }}>{r.name}</strong>
                            {r.isTop && (
                              <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", background: "#fef3c7", color: "#92400e", fontWeight: "bold" }}>
                                推荐
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                            {r.gender === "female" ? "女" : "男"} · {age}岁 · {r.education} · {r.experience}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: "15px", fontWeight: "bold", color: "#b45309" }}>
                        {r.targetSalary}
                      </div>
                    </div>

                    {/* Target Job */}
                    <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", marginBottom: "10px", fontSize: "13px" }}>
                      <span style={{ color: "var(--muted)" }}>期望职位：</span>
                      <strong style={{ color: "#0B7A75" }}>{r.targetJob}</strong>
                      <span style={{ margin: "0 6px", color: "#cbd5e1" }}>|</span>
                      <span style={{ color: "#64748b" }}>{r.targetArea}</span>
                    </div>

                    {/* Skills */}
                    {r.skills && (
                      <div style={{ fontSize: "12px", color: "#475569", marginBottom: "8px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        <strong>✨ 技能：</strong>{r.skills}
                      </div>
                    )}

                    {/* Intro */}
                    <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 12px 0", lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {r.intro}
                    </p>
                  </div>

                  {/* Bottom Contact & Upload Time */}
                  <div style={{ paddingTop: "10px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "#15803d", fontWeight: "bold" }}>
                        {r.jobStatus === "LOOKING" ? "🟢 随时到岗" : "🔵 在职看机会"}
                      </span>
                      <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>
                        · {new Date(r.createdAt).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })} 登记
                      </span>
                    </div>
                    <a
                      href={`tel:${r.phone}`}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        background: "#0B7A75",
                        color: "white",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textDecoration: "none",
                      }}
                    >
                      📞 拨打电话沟通
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
